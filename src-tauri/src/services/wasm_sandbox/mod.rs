mod types;

pub use types::{WasmExecutionRequest, WasmExecutionResult};

use sha2::{Digest, Sha256};
use std::fs;
use std::sync::Arc;
use tokio::sync::Semaphore;

pub struct WasmSandboxService {
    concurrency: Arc<Semaphore>,
    max_binary_bytes: usize,
}

impl Default for WasmSandboxService {
    fn default() -> Self {
        Self::new()
    }
}

impl WasmSandboxService {
    pub fn new() -> Self {
        Self {
            concurrency: Arc::new(Semaphore::new(4)),
            max_binary_bytes: 8 * 1024 * 1024,
        }
    }

    pub fn sha256_hex(bytes: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(bytes);
        hex::encode(hasher.finalize())
    }

    pub fn validate_wasm_file(&self, path: &std::path::Path) -> Result<Vec<u8>, String> {
        let bytes = fs::read(path).map_err(|e| format!("Failed to read wasm binary: {}", e))?;
        if bytes.len() > self.max_binary_bytes {
            return Err(format!(
                "Wasm binary too large ({} bytes > {} bytes)",
                bytes.len(),
                self.max_binary_bytes
            ));
        }
        if bytes.len() < 8 || &bytes[0..4] != b"\0asm" {
            return Err("Invalid wasm binary header".to_string());
        }
        Ok(bytes)
    }

    pub async fn execute(&self, req: WasmExecutionRequest) -> WasmExecutionResult {
        let _permit = match self.concurrency.acquire().await {
            Ok(p) => p,
            Err(_) => {
                return WasmExecutionResult {
                    stdout: String::new(),
                    stderr: "Sandbox runtime unavailable".to_string(),
                    success: false,
                }
            }
        };

        WasmExecutionResult {
            stdout: String::new(),
            stderr: format!(
                "WASM sandbox host is installed, but runtime execution ABI is not enabled yet for {}.{} (params {} bytes). Install and policy verification are active; execution remains fail-closed.",
                req.skill.id,
                req.method.name,
                req.params_json.len()
            ),
            success: false,
        }
    }
}
