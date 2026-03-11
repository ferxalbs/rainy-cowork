use crate::services::memory_vault::MemorySensitivity;
use chrono::{TimeZone, Utc};
use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqlitePoolOptions;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: String,
    pub content: String,
    pub source: String,
    pub timestamp: i64,
    pub metadata: HashMap<String, String>,
    pub importance: f32,
    pub sensitivity: crate::services::memory_vault::MemorySensitivity,
}

#[derive(Debug, Clone)]
pub struct AgentMemory {
    workspace_id: String,
    db: Arc<sqlx::SqlitePool>,
    manager: Arc<crate::services::MemoryManager>,
    #[allow(dead_code)]
    http_client: Client,
}

impl AgentMemory {
    pub async fn new(
        workspace_id: &str,
        app_data_dir: PathBuf,
        manager: Arc<crate::services::MemoryManager>,
    ) -> Self {
        let _ = std::fs::create_dir_all(&app_data_dir);
        let db_path = app_data_dir.join("rainy_cowork_v2.db");
        if !db_path.exists() {
            let _ = std::fs::File::create(&db_path);
        }
        let db_url = format!("sqlite://{}", db_path.to_string_lossy());

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&db_url)
            .await
            .expect("failed to connect to sqlite db for agent memory");

        let _ = sqlx::query(
            "CREATE TABLE IF NOT EXISTS agent_entities (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                entity_key TEXT NOT NULL,
                entity_value TEXT NOT NULL,
                confidence REAL NOT NULL DEFAULT 0.5,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
        )
        .execute(&pool)
        .await;

        let memory = Self {
            workspace_id: workspace_id.to_string(),
            db: Arc::new(pool),
            manager,
            http_client: Client::builder()
                .user_agent("Rainy-MaTE-Agent/1.0")
                .build()
                .unwrap_or_default(),
        };

        memory.migrate_legacy_json_if_present(app_data_dir).await;
        memory
    }

    pub fn manager(&self) -> Arc<crate::services::MemoryManager> {
        self.manager.clone()
    }

    pub async fn store(
        &self,
        content: String,
        source: String,
        metadata: Option<HashMap<String, String>>,
    ) {
        let entry_id = uuid::Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp();
        let metadata = metadata.unwrap_or_default();

        let mut tags = vec![
            format!("workspace:{}", self.workspace_id),
            format!("source:{}", source),
            "agent_memory".to_string(),
        ];
        if let Some(role) = metadata.get("role") {
            tags.push(format!("role:{}", role));
        }
        if let Some(tool) = metadata.get("tool") {
            tags.push(format!("tool:{}", tool));
        }

        let _ = self
            .manager
            .store_workspace_memory(
                &self.workspace_id,
                entry_id,
                content,
                source.clone(),
                tags,
                metadata.clone(),
                timestamp,
                MemorySensitivity::Internal,
            )
            .await;

        if let (Some(entity_key), Some(entity_value)) =
            (metadata.get("entity_key"), metadata.get("entity_value"))
        {
            let _ = sqlx::query(
                "INSERT INTO agent_entities (id, workspace_id, entity_key, entity_value, confidence)
                 VALUES (?, ?, ?, ?, ?)",
            )
            .bind(uuid::Uuid::new_v4().to_string())
            .bind(&self.workspace_id)
            .bind(entity_key)
            .bind(entity_value)
            .bind(0.5_f32)
            .execute(&*self.db)
            .await;
        }
    }

    #[allow(dead_code)]
    pub async fn retrieve(&self, query: &str) -> Vec<MemoryEntry> {
        self.manager
            .search(&self.workspace_id, query, 20)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|row| {
                let importance = 0.5;
                MemoryEntry {
                    id: row.id,
                    content: row.content,
                    source: derive_source_from_tags(&row.tags),
                    timestamp: row.timestamp.timestamp(),
                    metadata: HashMap::new(),
                    importance,
                    sensitivity: MemorySensitivity::Internal,
                }
            })
            .collect()
    }

    #[allow(dead_code)]
    pub async fn ingest_web_page(&self, url: &str) -> Result<String, String> {
        let res = self
            .http_client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch URL: {}", e))?;

        if !res.status().is_success() {
            return Err(format!("HTTP Error: {}", res.status()));
        }

        let html_content = res
            .text()
            .await
            .map_err(|e| format!("Failed to read text: {}", e))?;

        let document = Html::parse_document(&html_content);
        let selector = Selector::parse("body").unwrap();
        let body = document.select(&selector).next();

        let text_content = if let Some(node) = body {
            node.text().collect::<Vec<_>>().join(" ")
        } else {
            "No body content found".to_string()
        };

        let cleaned_text = text_content
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ");
        let truncated_text: String = cleaned_text.chars().take(10000).collect();

        let mut metadata = HashMap::new();
        metadata.insert("original_url".to_string(), url.to_string());
        metadata.insert("type".to_string(), "web_crawl".to_string());

        self.store(
            truncated_text.clone(),
            format!("web:{}", url),
            Some(metadata),
        )
        .await;

        Ok(format!(
            "Successfully ingested {} chars from {}",
            truncated_text.len(),
            url
        ))
    }

    #[allow(dead_code)]
    pub async fn dump_context(&self) -> String {
        let rows = self
            .manager
            .query_workspace_memory(&self.workspace_id, "", 100)
            .await
            .unwrap_or_default();

        rows.iter()
            .map(|entry| {
                format!(
                    "[{}] {}: {}",
                    derive_source_from_tags(&entry.tags),
                    Utc.timestamp_opt(entry.timestamp.timestamp(), 0)
                        .unwrap()
                        .format("%H:%M:%S"),
                    entry.content
                )
            })
            .collect::<Vec<_>>()
            .join("\n")
    }

    async fn migrate_legacy_json_if_present(&self, app_data_dir: PathBuf) {
        let legacy_path = app_data_dir
            .join("memory")
            .join(&self.workspace_id)
            .join("short_term.json");

        if !legacy_path.exists() {
            return;
        }

        let legacy_content = match fs::read_to_string(&legacy_path).await {
            Ok(content) => content,
            Err(_) => return,
        };

        let legacy_entries: Vec<MemoryEntry> = match serde_json::from_str(&legacy_content) {
            Ok(entries) => entries,
            Err(_) => return,
        };

        for entry in legacy_entries {
            let mut tags = vec![
                format!("workspace:{}", self.workspace_id),
                "legacy".to_string(),
                "agent_memory".to_string(),
            ];
            if !entry.source.trim().is_empty() {
                tags.push(format!("source:{}", entry.source));
            }

            let _ = self
                .manager
                .store_workspace_memory(
                    &self.workspace_id,
                    entry.id,
                    entry.content,
                    if entry.source.trim().is_empty() {
                        "legacy".to_string()
                    } else {
                        entry.source.clone()
                    },
                    tags,
                    entry.metadata,
                    entry.timestamp,
                    MemorySensitivity::Internal,
                )
                .await;
        }

        let backup_path = legacy_path.with_extension("json.migrated");
        let _ = fs::rename(&legacy_path, backup_path).await;
    }
}

fn derive_source_from_tags(tags: &[String]) -> String {
    tags.iter()
        .find_map(|tag| tag.strip_prefix("source:").map(|value| value.to_string()))
        .unwrap_or_else(|| "agent_memory".to_string())
}
