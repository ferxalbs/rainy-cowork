// Web Commands
// Tauri commands for web content extraction
// Part of Rainy Cowork Phase 3

use crate::services::BrowserController;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
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

/// Fetch and extract content from a URL
/// Returns the page content (text/html)
#[command]
pub async fn fetch_web_content(
    url: String,
    state: State<'_, Arc<BrowserController>>,
) -> Result<WebContentResponse, String> {
    let controller = state.inner();

    // Navigate to the URL
    // This uses the native CDP browser controller
    let nav_result = controller.navigate(&url).await?;

    // Try to get the full content, fallback to the preview if get_content fails
    // In the future we might want to pipe this through a readability library to get clean markdown
    let content = match controller.get_content().await {
        Ok(c) => c,
        Err(_) => nav_result.content_preview.clone(),
    };

    Ok(WebContentResponse {
        url: nav_result.url,
        title: nav_result.title,
        content_markdown: content.clone(), // Using raw content for now, frontend can parse if needed
        description: None,
        extracted_at: chrono::Utc::now().to_rfc3339(),
        size_bytes: content.len(),
    })
}

/// Get cache statistics
/// Unused in native browser controller implementation
#[command]
pub fn get_web_cache_stats(_state: State<'_, Arc<BrowserController>>) -> (usize, usize) {
    (0, 0)
}

/// Clear the web content cache
/// Unused in native browser controller implementation
#[command]
pub fn clear_web_cache(_state: State<'_, Arc<BrowserController>>) {
    // No-op
}
