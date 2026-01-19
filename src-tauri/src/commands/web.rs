// Web Commands
// Tauri commands for web content extraction
// Part of Rainy Cowork Phase 3

use crate::services::WebResearchService;
use serde::{Deserialize, Serialize};
use tauri::{command, State};

/// Response structure for web content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebContentResponse {
    pub url: String,
    pub title: String,
    pub content_markdown: String,
    pub description: Option<String>,
    pub extracted_at: String,
    pub size_bytes: usize,
}

impl From<crate::services::web_research::WebContent> for WebContentResponse {
    fn from(content: crate::services::web_research::WebContent) -> Self {
        Self {
            url: content.url,
            title: content.title,
            content_markdown: content.content_markdown,
            description: content.description,
            extracted_at: content.extracted_at.to_rfc3339(),
            size_bytes: content.size_bytes,
        }
    }
}

/// Fetch and extract content from a URL
/// Returns the page content converted to Markdown
#[command]
pub async fn fetch_web_content(
    url: String,
    service: State<'_, WebResearchService>,
) -> Result<WebContentResponse, String> {
    service
        .fetch_url(&url)
        .await
        .map(WebContentResponse::from)
        .map_err(|e| e.to_string())
}

/// Get cache statistics
#[command]
pub fn get_web_cache_stats(service: State<'_, WebResearchService>) -> (usize, usize) {
    service.cache_stats()
}

/// Clear the web content cache
#[command]
pub fn clear_web_cache(service: State<'_, WebResearchService>) {
    service.clear_cache();
}

// Note: search_web deferred to v0.4.0 (Rainy API v2)
// #[command]
// pub async fn search_web(
//     query: String,
//     max_results: u32,
// ) -> Result<Vec<SearchResult>, String> {
//     // Will use rainy-sdk search endpoint
//     unimplemented!("Web search will be available in v0.4.0 via Rainy API v2")
// }
