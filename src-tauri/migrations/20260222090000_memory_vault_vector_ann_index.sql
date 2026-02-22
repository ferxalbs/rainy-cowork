-- HIVE MIND SEED (STEP 3): libSQL ANN vector index for Gemini 3072 embeddings
-- Best-effort migration for environments with libSQL vector index support.

CREATE INDEX IF NOT EXISTS idx_memory_vault_embedding_gemini_3072
ON memory_vault_entries(libsql_vector_idx(embedding));
