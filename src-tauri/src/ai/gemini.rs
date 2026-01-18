// Rainy Cowork - Google Gemini Provider (GenAI SDK)
// Updated for Gemini 3 models with thinking level support

use crate::ai::provider::AIError;
use reqwest::Client;
use serde::{Deserialize, Serialize};

/// Gemini API base URL (v1beta for latest features)
const GEMINI_API_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1beta";

/// Thinking levels for Gemini 3 models
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ThinkingLevel {
    Minimal,
    Low,
    Medium,
    High,
}

impl Default for ThinkingLevel {
    fn default() -> Self {
        ThinkingLevel::High
    }
}

/// Gemini provider - for users with their own Google API key
pub struct GeminiProvider {
    client: Client,
}

impl GeminiProvider {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    /// Get available Gemini model IDs
    pub fn available_models(&self) -> Vec<String> {
        vec![
            "gemini-3-pro-preview".to_string(),
            "gemini-3-flash-preview".to_string(),
            "gemini-2.5-pro".to_string(),
            "gemini-2.5-flash".to_string(),
            "gemini-2.5-flash-lite".to_string(),
        ]
    }

    /// Validate API key against Gemini API
    pub async fn validate_key(&self, api_key: &str) -> Result<bool, AIError> {
        let response = self
            .client
            .get(format!("{}/models?key={}", GEMINI_API_BASE_URL, api_key))
            .send()
            .await
            .map_err(|e| AIError::RequestFailed(e.to_string()))?;

        Ok(response.status().is_success())
    }

    /// Complete a prompt with API key and progress callback
    pub async fn complete_with_api_key<F>(
        &self,
        model: &str,
        prompt: &str,
        api_key: &str,
        on_progress: F,
    ) -> Result<String, AIError>
    where
        F: Fn(u8, Option<String>) + Send + Sync + 'static,
    {
        on_progress(10, Some("Preparing Gemini request...".to_string()));

        // Build thinking config based on model type
        let generation_config = if model.starts_with("gemini-3") {
            // Gemini 3 uses thinkingLevel - default to high for best reasoning
            Some(GenerationConfig {
                thinking_config: Some(ThinkingConfig {
                    thinking_level: Some(ThinkingLevel::High),
                    thinking_budget: None,
                }),
            })
        } else if model.starts_with("gemini-2.5") {
            // Gemini 2.5 uses thinkingBudget (-1 for dynamic)
            Some(GenerationConfig {
                thinking_config: Some(ThinkingConfig {
                    thinking_level: None,
                    thinking_budget: Some(-1),
                }),
            })
        } else {
            None
        };

        let request_body = GeminiRequest {
            contents: vec![GeminiContent {
                parts: vec![GeminiPart {
                    text: prompt.to_string(),
                }],
            }],
            generation_config,
        };

        on_progress(30, Some(format!("Sending to {}...", model)));

        let url = format!(
            "{}/models/{}:generateContent?key={}",
            GEMINI_API_BASE_URL, model, api_key
        );

        let response = self
            .client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| AIError::RequestFailed(e.to_string()))?;

        if response.status() == 401 || response.status() == 403 {
            return Err(AIError::InvalidApiKey);
        }

        if response.status() == 429 {
            return Err(AIError::RateLimited);
        }

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AIError::RequestFailed(error_text));
        }

        on_progress(70, Some("Processing Gemini response...".to_string()));

        let gemini_response: GeminiResponse = response
            .json()
            .await
            .map_err(|e| AIError::RequestFailed(format!("Failed to parse response: {}", e)))?;

        on_progress(90, Some("Extracting content...".to_string()));

        // Extract text content from response
        let content = gemini_response
            .candidates
            .first()
            .and_then(|c| c.content.parts.first())
            .map(|p| p.text.clone())
            .unwrap_or_default();

        on_progress(100, Some("Complete".to_string()));

        Ok(content)
    }
}

impl Default for GeminiProvider {
    fn default() -> Self {
        Self::new()
    }
}

// GenAI SDK request/response structures

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
    #[serde(skip_serializing_if = "Option::is_none")]
    generation_config: Option<GenerationConfig>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GenerationConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    thinking_config: Option<ThinkingConfig>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ThinkingConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    thinking_level: Option<ThinkingLevel>,
    #[serde(skip_serializing_if = "Option::is_none")]
    thinking_budget: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Vec<GeminiCandidate>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: GeminiContent,
}
