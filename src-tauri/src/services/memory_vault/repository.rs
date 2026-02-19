use sqlx::{sqlite::SqlitePoolOptions, Row, SqlitePool};
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct VaultRow {
    pub id: String,
    pub workspace_id: String,
    pub source: String,
    pub sensitivity: String,
    pub created_at: i64,
    pub last_accessed: i64,
    pub access_count: i64,
    pub content_ciphertext: Vec<u8>,
    pub content_nonce: Vec<u8>,
    pub tags_ciphertext: Vec<u8>,
    pub tags_nonce: Vec<u8>,
    pub metadata_ciphertext: Option<Vec<u8>>,
    pub metadata_nonce: Option<Vec<u8>>,
}

#[derive(Debug, Clone)]
pub struct MemoryVaultRepository {
    pool: SqlitePool,
}

impl MemoryVaultRepository {
    pub async fn new(app_data_dir: PathBuf) -> Result<Self, String> {
        let _ = std::fs::create_dir_all(&app_data_dir);
        let db_path = app_data_dir.join("rainy_cowork_v2.db");
        if !db_path.exists() {
            std::fs::File::create(&db_path).map_err(|e| format!("Failed to create db file: {}", e))?;
        }
        let db_url = format!("sqlite://{}", db_path.to_string_lossy());

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&db_url)
            .await
            .map_err(|e| format!("Failed to open sqlite for vault: {}", e))?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS memory_vault_entries (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                source TEXT NOT NULL,
                sensitivity TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                last_accessed INTEGER NOT NULL,
                access_count INTEGER NOT NULL DEFAULT 0,
                content_ciphertext BLOB NOT NULL,
                content_nonce BLOB NOT NULL,
                tags_ciphertext BLOB NOT NULL,
                tags_nonce BLOB NOT NULL,
                metadata_ciphertext BLOB,
                metadata_nonce BLOB,
                key_version INTEGER NOT NULL DEFAULT 1
            )",
        )
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create vault table: {}", e))?;

        sqlx::query(
            "CREATE INDEX IF NOT EXISTS idx_memory_vault_workspace_time
             ON memory_vault_entries(workspace_id, created_at DESC)",
        )
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create vault index: {}", e))?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS memory_vault_migrations (
                id TEXT PRIMARY KEY,
                completed_at INTEGER NOT NULL
            )",
        )
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create vault migration table: {}", e))?;

        Ok(Self { pool })
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    pub async fn upsert_encrypted(
        &self,
        row: &VaultRow,
        key_version: i64,
    ) -> Result<(), String> {
        sqlx::query(
            "INSERT INTO memory_vault_entries
             (id, workspace_id, source, sensitivity, created_at, last_accessed, access_count,
              content_ciphertext, content_nonce, tags_ciphertext, tags_nonce, metadata_ciphertext, metadata_nonce, key_version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               workspace_id = excluded.workspace_id,
               source = excluded.source,
               sensitivity = excluded.sensitivity,
               created_at = excluded.created_at,
               last_accessed = excluded.last_accessed,
               access_count = excluded.access_count,
               content_ciphertext = excluded.content_ciphertext,
               content_nonce = excluded.content_nonce,
               tags_ciphertext = excluded.tags_ciphertext,
               tags_nonce = excluded.tags_nonce,
               metadata_ciphertext = excluded.metadata_ciphertext,
               metadata_nonce = excluded.metadata_nonce,
               key_version = excluded.key_version",
        )
        .bind(&row.id)
        .bind(&row.workspace_id)
        .bind(&row.source)
        .bind(&row.sensitivity)
        .bind(row.created_at)
        .bind(row.last_accessed)
        .bind(row.access_count)
        .bind(&row.content_ciphertext)
        .bind(&row.content_nonce)
        .bind(&row.tags_ciphertext)
        .bind(&row.tags_nonce)
        .bind(&row.metadata_ciphertext)
        .bind(&row.metadata_nonce)
        .bind(key_version)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to upsert vault entry: {}", e))?;

        Ok(())
    }

    pub async fn list_workspace_rows(&self, workspace_id: &str, limit: usize) -> Result<Vec<VaultRow>, String> {
        let rows = sqlx::query(
            "SELECT id, workspace_id, source, sensitivity, created_at, last_accessed, access_count,
                    content_ciphertext, content_nonce, tags_ciphertext, tags_nonce, metadata_ciphertext, metadata_nonce
             FROM memory_vault_entries
             WHERE workspace_id = ?
             ORDER BY created_at DESC
             LIMIT ?",
        )
        .bind(workspace_id)
        .bind(limit as i64)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to list vault entries: {}", e))?;

        Ok(rows.into_iter().map(row_to_vault).collect())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<VaultRow>, String> {
        let row = sqlx::query(
            "SELECT id, workspace_id, source, sensitivity, created_at, last_accessed, access_count,
                    content_ciphertext, content_nonce, tags_ciphertext, tags_nonce, metadata_ciphertext, metadata_nonce
             FROM memory_vault_entries WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| format!("Failed to get vault entry: {}", e))?;

        Ok(row.map(row_to_vault))
    }

    pub async fn delete_by_id(&self, id: &str) -> Result<(), String> {
        sqlx::query("DELETE FROM memory_vault_entries WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to delete vault entry: {}", e))?;
        Ok(())
    }

    pub async fn touch_access(&self, id: &str, last_accessed: i64, access_count: i64) -> Result<(), String> {
        sqlx::query(
            "UPDATE memory_vault_entries
             SET last_accessed = ?, access_count = ?
             WHERE id = ?",
        )
        .bind(last_accessed)
        .bind(access_count)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to update vault access counters: {}", e))?;
        Ok(())
    }

    pub async fn counts(&self, workspace_id: Option<&str>) -> Result<(usize, usize), String> {
        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM memory_vault_entries")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| format!("Failed to count vault entries: {}", e))?;

        let workspace: i64 = if let Some(ws) = workspace_id {
            sqlx::query_scalar("SELECT COUNT(*) FROM memory_vault_entries WHERE workspace_id = ?")
                .bind(ws)
                .fetch_one(&self.pool)
                .await
                .map_err(|e| format!("Failed to count workspace vault entries: {}", e))?
        } else {
            total
        };

        Ok((total as usize, workspace as usize))
    }

    pub async fn migration_completed(&self, id: &str) -> Result<bool, String> {
        let exists: Option<String> =
            sqlx::query_scalar("SELECT id FROM memory_vault_migrations WHERE id = ?")
                .bind(id)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| format!("Failed to check vault migration marker: {}", e))?;
        Ok(exists.is_some())
    }

    pub async fn mark_migration_completed(&self, id: &str) -> Result<(), String> {
        sqlx::query("INSERT OR REPLACE INTO memory_vault_migrations (id, completed_at) VALUES (?, ?)")
            .bind(id)
            .bind(chrono::Utc::now().timestamp())
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to mark vault migration: {}", e))?;
        Ok(())
    }
}

fn row_to_vault(row: sqlx::sqlite::SqliteRow) -> VaultRow {
    VaultRow {
        id: row.get("id"),
        workspace_id: row.get("workspace_id"),
        source: row.get("source"),
        sensitivity: row.get("sensitivity"),
        created_at: row.get("created_at"),
        last_accessed: row.get("last_accessed"),
        access_count: row.get("access_count"),
        content_ciphertext: row.get("content_ciphertext"),
        content_nonce: row.get("content_nonce"),
        tags_ciphertext: row.get("tags_ciphertext"),
        tags_nonce: row.get("tags_nonce"),
        metadata_ciphertext: row.get("metadata_ciphertext"),
        metadata_nonce: row.get("metadata_nonce"),
    }
}
