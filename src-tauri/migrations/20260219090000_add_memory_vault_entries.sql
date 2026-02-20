CREATE TABLE IF NOT EXISTS memory_vault_entries (
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
    embedding F32_BLOB(1536),
    key_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_memory_vault_workspace_time
    ON memory_vault_entries(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS memory_vault_migrations (
    id TEXT PRIMARY KEY,
    completed_at INTEGER NOT NULL
);
