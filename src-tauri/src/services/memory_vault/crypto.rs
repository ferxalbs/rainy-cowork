use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use rand::RngCore;
use sha2::{Digest, Sha256};

#[derive(Debug, Clone)]
pub struct EncryptedPayload {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
}

fn derive_entry_key(master_key: &[u8], workspace_id: &str, entry_id: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(master_key);
    hasher.update(workspace_id.as_bytes());
    hasher.update(entry_id.as_bytes());
    let digest = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&digest[..32]);
    key
}

pub fn encrypt_bytes(
    master_key: &[u8],
    workspace_id: &str,
    entry_id: &str,
    plaintext: &[u8],
) -> Result<EncryptedPayload, String> {
    let key_material = derive_entry_key(master_key, workspace_id, entry_id);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_material));

    let mut nonce = [0u8; 12];
    rand::rngs::OsRng.fill_bytes(&mut nonce);
    let nonce_ga = Nonce::from_slice(&nonce);

    let ciphertext = cipher
        .encrypt(nonce_ga, plaintext)
        .map_err(|e| format!("Vault encryption failed: {}", e))?;

    Ok(EncryptedPayload {
        ciphertext,
        nonce: nonce.to_vec(),
    })
}

pub fn decrypt_bytes(
    master_key: &[u8],
    workspace_id: &str,
    entry_id: &str,
    ciphertext: &[u8],
    nonce: &[u8],
) -> Result<Vec<u8>, String> {
    if nonce.len() != 12 {
        return Err("Invalid nonce length for AES-GCM".to_string());
    }

    let key_material = derive_entry_key(master_key, workspace_id, entry_id);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_material));
    let nonce_ga = Nonce::from_slice(nonce);

    cipher
        .decrypt(nonce_ga, ciphertext)
        .map_err(|e| format!("Vault decryption failed: {}", e))
}
