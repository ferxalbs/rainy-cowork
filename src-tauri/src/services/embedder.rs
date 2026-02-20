use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
struct OpenAIEmbeddingRequest {
    input: String,
    model: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIEmbeddingResponse {
    data: Vec<OpenAIEmbeddingData>,
}

#[derive(Debug, Deserialize)]
struct OpenAIEmbeddingData {
    embedding: Vec<f32>,
}

#[derive(Debug)]
pub struct EmbedderService {
    client: Client,
    api_key: String,
    model: String,
}

impl EmbedderService {
    pub fn new(api_key: String, model: Option<String>) -> Self {
        Self {
            client: Client::new(),
            api_key,
            model: model.unwrap_or_else(|| "text-embedding-3-small".to_string()),
        }
    }

    pub async fn embed_text(&self, text: &str) -> Result<Vec<f32>, String> {
        if self.api_key.is_empty() {
            return Err("Missing embedding API key".to_string());
        }

        let req_body = OpenAIEmbeddingRequest {
            input: text.to_string(),
            model: self.model.clone(),
        };

        let res = self
            .client
            .post("https://api.openai.com/v1/embeddings") // Or OpenRouter equivalent if supported
            .bearer_auth(&self.api_key)
            .json(&req_body)
            .send()
            .await
            .map_err(|e| format!("Embedding request failed: {}", e))?;

        if !res.status().is_success() {
            let status = res.status();
            let text_err = res.text().await.unwrap_or_default();
            return Err(format!("Embedding API error: {} - {}", status, text_err));
        }

        let mut parsed: OpenAIEmbeddingResponse = res
            .json()
            .await
            .map_err(|e| format!("Parsing embedding response failed: {}", e))?;

        parsed
            .data
            .pop()
            .map(|data| data.embedding)
            .ok_or_else(|| "No embedding returned".to_string())
    }
}
