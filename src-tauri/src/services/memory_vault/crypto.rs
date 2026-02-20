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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption_roundtrip() {
        let master_key = b"0123456789abcdef0123456789abcdef"; // 32 bytes
        let workspace_id = "ws-testing";
        let entry_id = "entry-123";
        let plaintext = b"Hello, encrypted vault!";

        // Encrypt
        let encrypted = encrypt_bytes(master_key, workspace_id, entry_id, plaintext).unwrap();
        assert_ne!(encrypted.ciphertext, plaintext);
        assert_eq!(encrypted.nonce.len(), 12);

        // Decrypt
        let decrypted = decrypt_bytes(
            master_key,
            workspace_id,
            entry_id,
            &encrypted.ciphertext,
            &encrypted.nonce,
        )
        .unwrap();

        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_encryption_different_entries_different_ciphertexts() {
        let master_key = b"0123456789abcdef0123456789abcdef";
        let workspace_id = "ws-testing";
        let plaintext = b"Hello, encrypted vault!";

        let enc1 = encrypt_bytes(master_key, workspace_id, "entry-1", plaintext).unwrap();
        let enc2 = encrypt_bytes(master_key, workspace_id, "entry-2", plaintext).unwrap();

        assert_ne!(enc1.ciphertext, enc2.ciphertext);
        assert_ne!(enc1.nonce, enc2.nonce);
    }

    #[test]
    fn test_decryption_fails_with_wrong_key_or_workspace() {
        let master_key = b"0123456789abcdef0123456789abcdef";
        let wrong_key = b"abcdef0123456789abcdef0123456789";
        let workspace_id = "ws-testing";
        let entry_id = "entry-123";
        let plaintext = b"Hello, encrypted vault!";

        let encrypted = encrypt_bytes(master_key, workspace_id, entry_id, plaintext).unwrap();

        // 1. Wrong master key
        let res1 = decrypt_bytes(
            wrong_key,
            workspace_id,
            entry_id,
            &encrypted.ciphertext,
            &encrypted.nonce,
        );
        assert!(res1.is_err());

        // 2. Wrong workspace id
        let res2 = decrypt_bytes(
            master_key,
            "ws-wrong",
            entry_id,
            &encrypted.ciphertext,
            &encrypted.nonce,
        );
        assert!(res2.is_err());

        // 3. Wrong entry id
        let res3 = decrypt_bytes(
            master_key,
            workspace_id,
            "entry-wrong",
            &encrypted.ciphertext,
            &encrypted.nonce,
        );
        assert!(res3.is_err());
    }
}
