use super::crypto::{decrypt_bytes, encrypt_bytes};
use super::key_provider::{MacOSKeychainVaultKeyProvider, VaultKeyProvider};
use super::repository::{MemoryVaultRepository, VaultRow};
use super::types::{DecryptedMemoryEntry, MemorySensitivity, MemoryVaultStats, StoreMemoryInput};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

const MIGRATION_PLAINTEXT_DB: &str = "migrate_plaintext_memory_entries_v1";

#[derive(Debug, Clone)]
pub struct MemoryVaultService {
    repository: Arc<MemoryVaultRepository>,
    master_key: Arc<Vec<u8>>,
}

impl MemoryVaultService {
    pub async fn new(app_data_dir: PathBuf) -> Result<Self, String> {
        Self::new_with_provider(
            app_data_dir,
            Arc::new(MacOSKeychainVaultKeyProvider::new()) as Arc<dyn VaultKeyProvider>,
        )
        .await
    }

    pub async fn new_with_provider(
        app_data_dir: PathBuf,
        provider: Arc<dyn VaultKeyProvider>,
    ) -> Result<Self, String> {
        let repository = Arc::new(MemoryVaultRepository::new(app_data_dir).await?);
        let master_key = Arc::new(provider.get_or_create_master_key()?);
        let service = Self {
            repository,
            master_key,
        };
        service.run_plaintext_migration().await?;
        Ok(service)
    }

    pub async fn put(&self, input: StoreMemoryInput) -> Result<(), String> {
        let tags_json = serde_json::to_vec(&input.tags)
            .map_err(|e| format!("Failed to serialize tags: {}", e))?;
        let metadata_json = serde_json::to_vec(&input.metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

        let content = encrypt_bytes(
            self.master_key.as_slice(),
            &input.workspace_id,
            &input.id,
            input.content.as_bytes(),
        )?;
        let tags = encrypt_bytes(
            self.master_key.as_slice(),
            &input.workspace_id,
            &input.id,
            &tags_json,
        )?;
        let metadata = encrypt_bytes(
            self.master_key.as_slice(),
            &input.workspace_id,
            &input.id,
            &metadata_json,
        )?;

        let embedding_bytes = input.embedding.as_ref().map(|v| {
            let mut bytes = Vec::with_capacity(v.len() * 4);
            for f in v {
                bytes.extend_from_slice(&f.to_le_bytes());
            }
            bytes
        });

        let row = VaultRow {
            id: input.id,
            workspace_id: input.workspace_id,
            source: input.source,
            sensitivity: input.sensitivity.as_str().to_string(),
            created_at: input.created_at,
            last_accessed: input.created_at,
            access_count: 0,
            content_ciphertext: content.ciphertext,
            content_nonce: content.nonce,
            tags_ciphertext: tags.ciphertext,
            tags_nonce: tags.nonce,
            metadata_ciphertext: Some(metadata.ciphertext),
            metadata_nonce: Some(metadata.nonce),
            embedding: embedding_bytes,
        };

        self.repository.upsert_encrypted(&row, 1).await
    }

    pub async fn search_workspace(
        &self,
        workspace_id: &str,
        query: &str,
        limit: usize,
    ) -> Result<Vec<DecryptedMemoryEntry>, String> {
        let rows = self
            .repository
            .list_workspace_rows(workspace_id, limit.saturating_mul(10).max(50))
            .await?;
        let query_lc = query.to_lowercase();
        let mut results = Vec::new();

        for row in rows {
            let entry = self.decrypt_row(&row)?;
            if query_lc.is_empty() || entry.content.to_lowercase().contains(&query_lc) {
                let touched = entry.access_count + 1;
                let now = chrono::Utc::now().timestamp();
                let _ = self.repository.touch_access(&entry.id, now, touched).await;

                results.push(DecryptedMemoryEntry {
                    access_count: touched,
                    last_accessed: now,
                    ..entry
                });
            }
            if results.len() >= limit {
                break;
            }
        }

        Ok(results)
    }

    pub async fn search_workspace_vector(
        &self,
        workspace_id: &str,
        query_embedding: &[f32],
        limit: usize,
    ) -> Result<Vec<(DecryptedMemoryEntry, f32)>, String> {
        let rows = self
            .repository
            .search_workspace_vector(workspace_id, query_embedding, limit)
            .await?;
        let mut results = Vec::new();

        for (row, distance) in rows {
            let entry = self.decrypt_row(&row)?;
            let touched = entry.access_count + 1;
            let now = chrono::Utc::now().timestamp();
            let _ = self.repository.touch_access(&entry.id, now, touched).await;

            results.push((
                DecryptedMemoryEntry {
                    access_count: touched,
                    last_accessed: now,
                    ..entry
                },
                distance,
            ));
        }

        Ok(results)
    }

    pub async fn recent_workspace(
        &self,
        workspace_id: &str,
        limit: usize,
    ) -> Result<Vec<DecryptedMemoryEntry>, String> {
        let rows = self
            .repository
            .list_workspace_rows(workspace_id, limit)
            .await?;
        let mut out = Vec::with_capacity(rows.len());
        for row in rows {
            out.push(self.decrypt_row(&row)?);
        }
        Ok(out)
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<DecryptedMemoryEntry>, String> {
        let row = self.repository.get_by_id(id).await?;
        row.map(|r| self.decrypt_row(&r)).transpose()
    }

    pub async fn delete_by_id(&self, id: &str) -> Result<(), String> {
        self.repository.delete_by_id(id).await
    }

    pub async fn stats(&self, workspace_id: Option<&str>) -> Result<MemoryVaultStats, String> {
        let (total_entries, workspace_entries) = self.repository.counts(workspace_id).await?;
        Ok(MemoryVaultStats {
            total_entries,
            workspace_entries,
        })
    }

    fn decrypt_row(&self, row: &VaultRow) -> Result<DecryptedMemoryEntry, String> {
        let content_bytes = decrypt_bytes(
            self.master_key.as_slice(),
            &row.workspace_id,
            &row.id,
            &row.content_ciphertext,
            &row.content_nonce,
        )?;
        let tags_bytes = decrypt_bytes(
            self.master_key.as_slice(),
            &row.workspace_id,
            &row.id,
            &row.tags_ciphertext,
            &row.tags_nonce,
        )?;

        let metadata_bytes = match (&row.metadata_ciphertext, &row.metadata_nonce) {
            (Some(cipher), Some(nonce)) => decrypt_bytes(
                self.master_key.as_slice(),
                &row.workspace_id,
                &row.id,
                cipher,
                nonce,
            )?,
            _ => b"{}".to_vec(),
        };

        let content = String::from_utf8(content_bytes)
            .map_err(|e| format!("Invalid decrypted content encoding: {}", e))?;
        let tags: Vec<String> = serde_json::from_slice(&tags_bytes)
            .map_err(|e| format!("Invalid decrypted tags json: {}", e))?;
        let metadata: HashMap<String, String> = serde_json::from_slice(&metadata_bytes)
            .map_err(|e| format!("Invalid decrypted metadata json: {}", e))?;

        let embedding = row.embedding.as_ref().map(|bytes| {
            let mut floats = Vec::with_capacity(bytes.len() / 4);
            for chunk in bytes.chunks_exact(4) {
                let f = f32::from_le_bytes(chunk.try_into().unwrap());
                floats.push(f);
            }
            floats
        });

        Ok(DecryptedMemoryEntry {
            id: row.id.clone(),
            workspace_id: row.workspace_id.clone(),
            content,
            tags,
            source: row.source.clone(),
            sensitivity: MemorySensitivity::from_db(&row.sensitivity),
            created_at: row.created_at,
            last_accessed: row.last_accessed,
            access_count: row.access_count,
            metadata,
            embedding,
        })
    }

    async fn run_plaintext_migration(&self) -> Result<(), String> {
        if self
            .repository
            .migration_completed(MIGRATION_PLAINTEXT_DB)
            .await?
        {
            return Ok(());
        }

        let mut rows = match self
            .repository
            .conn()
            .query(
                "SELECT id, workspace_id, content, source, timestamp, metadata_json
             FROM memory_entries",
                (),
            )
            .await
        {
            Ok(r) => r,
            Err(_) => return Ok(()), // Table doesn't exist, ignore
        };

        while let Ok(Some(row)) = rows.next().await {
            let id: String = row.get(0).unwrap_or_default();
            if self.repository.get_by_id(&id).await?.is_some() {
                continue;
            }
            let workspace_id: String = row.get(1).unwrap_or_default();
            let content: String = row.get(2).unwrap_or_default();
            let source: String = row.get(3).unwrap_or_default();
            let timestamp: i64 = row.get(4).unwrap_or(0);
            let metadata_json: String = row.get(5).unwrap_or_default();
            let metadata: HashMap<String, String> =
                serde_json::from_str(&metadata_json).unwrap_or_default();

            self.put(StoreMemoryInput {
                id,
                workspace_id,
                content,
                tags: vec!["legacy".to_string()],
                source: if source.trim().is_empty() {
                    "legacy".to_string()
                } else {
                    source
                },
                sensitivity: MemorySensitivity::Internal,
                metadata,
                created_at: timestamp,
                embedding: None,
            })
            .await?;
        }

        let _ = self
            .repository
            .conn()
            .execute("DELETE FROM memory_entries", ())
            .await;

        self.repository
            .mark_migration_completed(MIGRATION_PLAINTEXT_DB)
            .await
    }
}
