pub mod types;

use self::types::SkillToml;
use crate::services::SkillExecutor;
use crate::services::third_party_skill_registry::{InstalledThirdPartySkill, ThirdPartySkillRegistry};
use crate::services::wasm_sandbox::WasmSandboxService;
use hmac::{Hmac, Mac};
use serde_json::json;
use sha2::Sha256;
use std::fs;
use std::path::{Path, PathBuf};

type HmacSha256 = Hmac<Sha256>;

pub struct SkillInstaller {
    registry: ThirdPartySkillRegistry,
    sandbox: WasmSandboxService,
}

impl SkillInstaller {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            registry: ThirdPartySkillRegistry::new()?,
            sandbox: WasmSandboxService::new(),
        })
    }

    pub fn install_from_directory(
        &self,
        source_dir: &Path,
        platform_key: Option<&str>,
        allow_unsigned_dev: bool,
    ) -> Result<InstalledThirdPartySkill, String> {
        if !source_dir.is_dir() {
            return Err("Source path must be a directory containing skill.toml".to_string());
        }

        let manifest_path = source_dir.join("skill.toml");
        let manifest_raw = fs::read_to_string(&manifest_path)
            .map_err(|e| format!("Failed to read skill.toml: {}", e))?;
        let manifest: SkillToml = toml::from_str(&manifest_raw)
            .map_err(|e| format!("Invalid skill.toml: {}", e))?;
        manifest.validate()?;

        if manifest.id == "filesystem"
            || manifest.id == "shell"
            || manifest.id == "web"
            || manifest.id == "browser"
            || manifest.id == "memory"
        {
            return Err("Third-party skill id conflicts with built-in skill domain".to_string());
        }
        let built_in_methods = SkillExecutor::get_registered_tool_definitions()
            .into_iter()
            .map(|tool| tool.function.name)
            .collect::<std::collections::HashSet<_>>();
        if let Some(conflict) = manifest
            .methods
            .iter()
            .find(|m| built_in_methods.contains(&m.name))
            .map(|m| m.name.clone())
        {
            return Err(format!(
                "Third-party skill method '{}' conflicts with a built-in tool method",
                conflict
            ));
        }

        if let Some(sig) = &manifest.signature {
            if sig.algorithm != "hmac-sha256" {
                return Err("Unsupported signature algorithm".to_string());
            }
            let secret = platform_key.ok_or_else(|| {
                "This skill requires signature verification but no platform key was provided"
                    .to_string()
            })?;
            let expected = compute_manifest_hmac(&manifest, secret)?;
            if !safe_equal_hex(&expected, &sig.digest) {
                return Err("Skill manifest signature mismatch".to_string());
            }
        } else if !allow_unsigned_dev {
            return Err("Unsigned skill rejected (enable local dev install to allow)".to_string());
        }

        let binary_path = source_dir.join(&manifest.binary.path);
        let bytes = self.sandbox.validate_wasm_file(&binary_path)?;
        let actual_sha = WasmSandboxService::sha256_hex(&bytes);
        if actual_sha != manifest.binary.sha256.to_ascii_lowercase() {
            return Err(format!(
                "Wasm binary sha256 mismatch (expected {}, got {})",
                manifest.binary.sha256, actual_sha
            ));
        }

        let install_dir = self
            .registry
            .root_dir()
            .join(&manifest.id)
            .join(&manifest.version);
        fs::create_dir_all(&install_dir)
            .map_err(|e| format!("Failed to create install dir: {}", e))?;
        let target_manifest = install_dir.join("skill.toml");
        let target_binary = install_dir.join("module.wasm");
        fs::write(&target_manifest, manifest_raw)
            .map_err(|e| format!("Failed to persist skill manifest: {}", e))?;
        fs::write(&target_binary, bytes)
            .map_err(|e| format!("Failed to persist wasm binary: {}", e))?;

        let trust_state = if manifest.signature.is_some() {
            "verified"
        } else {
            "unsigned_dev"
        };
        let install_source = if manifest.signature.is_some() {
            "atm"
        } else {
            "local_dev"
        };
        let installed = manifest.into_installed(
            target_binary.to_string_lossy().to_string(),
            install_source,
            trust_state,
        );
        self.registry.upsert_skill(installed.clone())?;
        Ok(installed)
    }

    pub fn install_from_downloaded_bundle(
        &self,
        temp_dir: &Path,
        platform_key: Option<&str>,
    ) -> Result<InstalledThirdPartySkill, String> {
        self.install_from_directory(temp_dir, platform_key, false)
    }

}

fn safe_equal_hex(expected_hex: &str, provided_hex: &str) -> bool {
    let expected = match hex::decode(expected_hex) {
        Ok(v) => v,
        Err(_) => return false,
    };
    let provided = match hex::decode(provided_hex) {
        Ok(v) => v,
        Err(_) => return false,
    };
    if expected.len() != provided.len() || expected.is_empty() {
        return false;
    }
    let mut diff = 0u8;
    for (a, b) in expected.iter().zip(provided.iter()) {
        diff |= a ^ b;
    }
    diff == 0
}

fn stable_sort_value(value: &serde_json::Value) -> serde_json::Value {
    match value {
        serde_json::Value::Object(map) => {
            let mut sorted = serde_json::Map::new();
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            for key in keys {
                sorted.insert(key.clone(), stable_sort_value(&map[key]));
            }
            serde_json::Value::Object(sorted)
        }
        serde_json::Value::Array(items) => {
            serde_json::Value::Array(items.iter().map(stable_sort_value).collect())
        }
        _ => value.clone(),
    }
}

fn compute_manifest_hmac(manifest: &SkillToml, secret: &str) -> Result<String, String> {
    let payload = json!({
        "id": manifest.id,
        "name": manifest.name,
        "version": manifest.version,
        "author": manifest.author,
        "description": manifest.description,
        "runtime": manifest.runtime,
        "entry": manifest.entry,
        "binary": { "path": manifest.binary.path, "sha256": manifest.binary.sha256 },
        "permissions": {
            "filesystem": manifest.permissions.filesystem.iter().map(|p| json!({
                "guest_path": p.guest_path,
                "host_path": p.host_path,
                "mode": p.mode,
            })).collect::<Vec<_>>(),
            "network": { "domains": manifest.permissions.network.domains.clone() },
        },
        "methods": manifest.methods.iter().map(|m| json!({
            "name": m.name,
            "description": m.description,
            "airlock_level": m.airlock_level,
            "parameters": m.parameters,
        })).collect::<Vec<_>>(),
    });
    let canonical = serde_json::to_string(&stable_sort_value(&payload))
        .map_err(|e| format!("Failed to canonicalize manifest: {}", e))?;
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|e| format!("Invalid HMAC key: {}", e))?;
    mac.update(canonical.as_bytes());
    Ok(hex::encode(mac.finalize().into_bytes()))
}

pub fn write_temp_downloaded_skill(
    skill_id: &str,
    manifest_toml: &str,
    wasm_bytes: &[u8],
) -> Result<PathBuf, String> {
    let temp_dir = std::env::temp_dir().join(format!("rainy-skill-{}-{}", skill_id, uuid::Uuid::new_v4()));
    fs::create_dir_all(&temp_dir).map_err(|e| format!("Failed to create temp skill dir: {}", e))?;
    fs::write(temp_dir.join("skill.toml"), manifest_toml)
        .map_err(|e| format!("Failed to write temp manifest: {}", e))?;
    fs::write(temp_dir.join("module.wasm"), wasm_bytes)
        .map_err(|e| format!("Failed to write temp wasm: {}", e))?;
    Ok(temp_dir)
}

pub fn verify_downloaded_bundle_signature(
    manifest_toml: &str,
    wasm_bytes: &[u8],
    provided_digest: &str,
    secret: &str,
) -> bool {
    if provided_digest.trim().is_empty() || secret.trim().is_empty() {
        return false;
    }
    let mut mac = match HmacSha256::new_from_slice(secret.as_bytes()) {
        Ok(m) => m,
        Err(_) => return false,
    };
    mac.update(manifest_toml.as_bytes());
    mac.update(b"\n");
    mac.update(wasm_bytes);
    let expected = hex::encode(mac.finalize().into_bytes());
    safe_equal_hex(&expected, provided_digest)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use crate::models::neural::AirlockLevel;
    use crate::services::skill_installer::types::{
        SkillBinary, SkillTomlFsPerm, SkillTomlMethod, SkillTomlNetworkPerm, SkillTomlParameter,
        SkillTomlPermissions,
    };

    fn minimal_manifest_with_method(name: &str) -> SkillToml {
        SkillToml {
            id: "tp_demo".to_string(),
            name: "Demo".to_string(),
            version: "1.0.0".to_string(),
            author: "tester".to_string(),
            description: String::new(),
            runtime: "wasi-core-v1".to_string(),
            entry: None,
            binary: SkillBinary {
                path: "module.wasm".to_string(),
                sha256: "00".to_string(),
            },
            permissions: SkillTomlPermissions {
                filesystem: Vec::<SkillTomlFsPerm>::new(),
                network: SkillTomlNetworkPerm { domains: vec![] },
            },
            methods: vec![SkillTomlMethod {
                name: name.to_string(),
                description: "demo".to_string(),
                airlock_level: AirlockLevel::Safe,
                parameters: HashMap::<String, SkillTomlParameter>::new(),
            }],
            signature: None,
        }
    }

    #[test]
    fn verifies_downloaded_bundle_signature() {
        let manifest = "id = \"demo\"\nname = \"Demo\"\n";
        let wasm = b"\0asm\x01\0\0\0";
        let secret = "test-platform-key";

        let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("hmac");
        mac.update(manifest.as_bytes());
        mac.update(b"\n");
        mac.update(wasm);
        let digest = hex::encode(mac.finalize().into_bytes());

        assert!(verify_downloaded_bundle_signature(
            manifest, wasm, &digest, secret
        ));
        assert!(!verify_downloaded_bundle_signature(
            manifest,
            wasm,
            "00",
            secret
        ));
    }

    #[test]
    fn manifest_hmac_changes_when_method_changes() {
        let a = minimal_manifest_with_method("custom_read");
        let b = minimal_manifest_with_method("custom_write");
        let sig_a = compute_manifest_hmac(&a, "secret").expect("sig a");
        let sig_b = compute_manifest_hmac(&b, "secret").expect("sig b");
        assert_ne!(sig_a, sig_b);
    }
}
