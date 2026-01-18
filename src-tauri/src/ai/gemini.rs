// Rainy Cowork - Google Gemini Provider
// Direct integration for users with their own Gemini API key

use crate::ai::provider::AIError;
use reqwest::Client;
use serde::{Deserialize, Serialize};

/// Gemini API base URL
const GEMINI_API_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1beta";

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

    /// Get available Gemini models
    pub fn available_models(&self) -> Vec<String> {
        vec![
            "gemini-1.5-pro".to_string(),
            "gemini-1.5-flash".to_string(),
            "gemini-1.5-flash-8b".to_string(),
            "gemini-2.0-flash-exp".to_string(),
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
        // Report initial progress
        on_progress(10, Some("Preparing Gemini request...".to_string()));

        let request_body = GeminiRequest {
            contents: vec![GeminiContent {
                parts: vec![GeminiPart {
                    text: prompt.to_string(),
                }],
            }],
        };

        on_progress(30, Some("Sending to Google Gemini...".to_string()));

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
            .map_err(|e| AIError::RequestFailed(e.to_string()))?;

        on_progress(90, Some("Extracting content...".to_string()));

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

// Gemini API request/response structures

#[derive(Debug, Serialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
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
