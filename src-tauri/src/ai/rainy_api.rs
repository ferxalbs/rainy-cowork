// Rainy Cowork - Rainy API Provider
// Primary AI backend from Enosis Labs (OpenAI-compatible format)

use crate::ai::provider::AIError;
use reqwest::Client;
use serde::{Deserialize, Serialize};

/// Rainy API base URL (configurable for production)
const RAINY_API_BASE_URL: &str = "https://api.enosis.ai/v1";

/// Rainy API provider - primary backend with OpenAI-compatible format
pub struct RainyApiProvider {
    client: Client,
}

impl RainyApiProvider {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    /// Get available models from Rainy API
    pub fn available_models(&self) -> Vec<String> {
        vec![
            "gpt-4o".to_string(),
            "gpt-4o-mini".to_string(),
            "gpt-4-turbo".to_string(),
            "claude-3.5-sonnet".to_string(),
            "claude-3-opus".to_string(),
            "llama-3.2-70b".to_string(),
        ]
    }

    /// Validate API key against Rainy API
    pub async fn validate_key(&self, api_key: &str) -> Result<bool, AIError> {
        let response = self
            .client
            .get(format!("{}/models", RAINY_API_BASE_URL))
            .header("Authorization", format!("Bearer {}", api_key))
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
        on_progress(10, Some("Sending request to Rainy API...".to_string()));

        let request_body = ChatCompletionRequest {
            model: model.to_string(),
            messages: vec![ChatMessage {
                role: "user".to_string(),
                content: prompt.to_string(),
            }],
            stream: false,
        };

        on_progress(30, Some("Waiting for AI response...".to_string()));

        let response = self
            .client
            .post(format!("{}/chat/completions", RAINY_API_BASE_URL))
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| AIError::RequestFailed(e.to_string()))?;

        if response.status() == 401 {
            return Err(AIError::InvalidApiKey);
        }

        if response.status() == 429 {
            return Err(AIError::RateLimited);
        }

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AIError::RequestFailed(error_text));
        }

        on_progress(70, Some("Processing response...".to_string()));

        let completion: ChatCompletionResponse = response
            .json()
            .await
            .map_err(|e| AIError::RequestFailed(e.to_string()))?;

        on_progress(90, Some("Extracting content...".to_string()));

        let content = completion
            .choices
            .first()
            .and_then(|c| Some(c.message.content.clone()))
            .unwrap_or_default();

        on_progress(100, Some("Complete".to_string()));

        Ok(content)
    }
}

impl Default for RainyApiProvider {
    fn default() -> Self {
        Self::new()
    }
}

// OpenAI-compatible request/response structures

#[derive(Debug, Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}
