use crate::ai::keychain::KeychainManager;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};
use rand::RngCore;

const VAULT_MASTER_KEY_ID: &str = "memory_vault_master_key_v1";

pub trait VaultKeyProvider: Send + Sync {
    fn get_or_create_master_key(&self) -> Result<Vec<u8>, String>;
}

#[derive(Default)]
pub struct MacOSKeychainVaultKeyProvider {
    keychain: KeychainManager,
}

impl MacOSKeychainVaultKeyProvider {
    pub fn new() -> Self {
        Self {
            keychain: KeychainManager::new(),
        }
    }
}

impl VaultKeyProvider for MacOSKeychainVaultKeyProvider {
    fn get_or_create_master_key(&self) -> Result<Vec<u8>, String> {
        if let Some(encoded) = self.keychain.get_key(VAULT_MASTER_KEY_ID)? {
            let bytes = BASE64_STANDARD
                .decode(encoded.as_bytes())
                .map_err(|e| format!("Invalid vault key encoding: {}", e))?;
            if bytes.len() != 32 {
                return Err("Vault key must be 32 bytes".to_string());
            }
            return Ok(bytes);
        }

        let mut key = [0u8; 32];
        rand::rngs::OsRng.fill_bytes(&mut key);
        let encoded = BASE64_STANDARD.encode(key);
        self.keychain.store_key(VAULT_MASTER_KEY_ID, &encoded)?;
        Ok(key.to_vec())
    }
}
