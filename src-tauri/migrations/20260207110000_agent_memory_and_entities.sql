CREATE TABLE IF NOT EXISTS memory_entries (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    importance REAL NOT NULL DEFAULT 0.5
);

CREATE TABLE IF NOT EXISTS agent_entities (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    entity_key TEXT NOT NULL,
    entity_value TEXT NOT NULL,
    confidence REAL NOT NULL DEFAULT 0.5,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memory_workspace_time
    ON memory_entries(workspace_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_entities_workspace_key
    ON agent_entities(workspace_id, entity_key);
