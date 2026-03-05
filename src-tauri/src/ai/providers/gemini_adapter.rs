// Gemini BYOK Provider Adapter for IntelligentRouter
//
// Wraps the Google Generative Language API to implement the full AIProvider
// trait so it can be added to the IntelligentRouter. Supports multi-turn
// conversations (chat history), non-streaming completions (for tool-calling
// turns), and SSE streaming for plain-text turns.

use crate::ai::provider_trait::{AIProvider, AIProviderFactory};
use crate::ai::provider_types::{
    AIError, ChatCompletionRequest, ChatCompletionResponse, EmbeddingRequest, EmbeddingResponse,
    MessageContent, ProviderCapabilities, ProviderConfig, ProviderHealth, ProviderId,
    ProviderResult, ProviderType, StreamingCallback, StreamingChunk, TokenUsage,
};
use async_trait::async_trait;
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

const GEMINI_API_BASE: &str = "https://generativelanguage.googleapis.com/v1beta";

// ─── Gemini API types ────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
    #[serde(skip_serializing_if = "Option::is_none")]
    system_instruction: Option<GeminiSystemInstruction>,
    #[serde(skip_serializing_if = "Option::is_none")]
    generation_config: Option<GeminiGenerationConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<GeminiTool>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GeminiContent {
    role: String,
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiSystemInstruction {
    parts: Vec<GeminiTextPart>,
}

/// A text-only part used for system instructions (always text).
#[derive(Debug, Serialize, Deserialize)]
struct GeminiTextPart {
    text: String,
}

/// A part in a message — can be text or a function call from the model.
#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
enum GeminiPart {
    Text { text: String },
    FunctionCall { function_call: GeminiFunctionCall },
    // Catch-all for unknown part types (e.g. inlineData) — skip text extraction.
    Unknown(serde_json::Value),
}

impl GeminiPart {
    fn as_text(&self) -> Option<&str> {
        if let GeminiPart::Text { text } = self {
            Some(text.as_str())
        } else {
            None
        }
    }
}

/// Function call issued by the model (inside a GeminiPart).
#[derive(Debug, Serialize, Deserialize)]
struct GeminiFunctionCall {
    name: String,
    args: serde_json::Value,
}

// ─── Gemini Tool declaration types ──────────────────────────────────────────

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiTool {
    function_declarations: Vec<GeminiFunctionDeclaration>,
}

#[derive(Debug, Serialize)]
struct GeminiFunctionDeclaration {
    name: String,
    description: String,
    parameters: serde_json::Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiThinkingConfig {
    thinking_level: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiGenerationConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_output_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    thinking_config: Option<GeminiThinkingConfig>,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Vec<GeminiCandidate>,
    #[serde(default)]
    usage_metadata: Option<GeminiUsage>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiCandidate {
    content: GeminiContent,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiUsage {
    prompt_token_count: Option<u32>,
    candidates_token_count: Option<u32>,
    total_token_count: Option<u32>,
}

// SSE streaming chunk from Gemini
#[derive(Debug, Deserialize)]
struct GeminiStreamChunk {
    candidates: Option<Vec<GeminiCandidate>>,
}

/// Map our internal model slug to the actual Gemini API model ID.
fn resolve_model_id(model: &str) -> String {
    let normalized = crate::ai::model_catalog::normalize_model_slug(model);
    match normalized {
        "gemini-3-flash-minimal" | "gemini-3-flash-high" | "gemini-3-flash-preview" => {
            "gemini-3-flash-preview".to_string()
        }
        "gemini-3.1-flash-lite-preview" => "gemini-3.1-flash-lite-preview".to_string(),
        // Already a full API id or unknown — pass through unchanged
        other => other.to_string(),
    }
}

/// Extract thinking level from user-provided model slug if available
fn extract_thinking_level(model: &str) -> Option<String> {
    let normalized = crate::ai::model_catalog::normalize_model_slug(model);
    if normalized.contains("-minimal") {
        Some("minimal".to_string())
    } else if normalized.contains("-low") {
        Some("low".to_string())
    } else if normalized.contains("-medium") {
        Some("medium".to_string())
    } else if normalized.contains("-high") {
        Some("high".to_string())
    } else {
        None
    }
}

/// Convert our ChatMessage list to Gemini's `contents` array.
/// System messages are extracted separately into `system_instruction`.
fn build_gemini_request_parts(
    messages: &[crate::ai::provider_types::ChatMessage],
    temperature: Option<f32>,
    max_tokens: Option<u32>,
    thinking_level: Option<String>,
) -> (
    Option<GeminiSystemInstruction>,
    Vec<GeminiContent>,
    Option<GeminiGenerationConfig>,
) {
    let mut system_text_parts: Vec<GeminiTextPart> = Vec::new();
    let mut contents: Vec<GeminiContent> = Vec::new();

    for msg in messages {
        let text = msg.content.text();
        match msg.role.as_str() {
            "system" => {
                system_text_parts.push(GeminiTextPart { text });
            }
            "user" => {
                contents.push(GeminiContent {
                    role: "user".to_string(),
                    parts: vec![GeminiPart::Text { text }],
                });
            }
            "assistant" => {
                contents.push(GeminiContent {
                    role: "model".to_string(),
                    parts: vec![GeminiPart::Text { text }],
                });
            }
            // tool / other roles — append as user turn so the conversation stays coherent.
            _ => {
                contents.push(GeminiContent {
                    role: "user".to_string(),
                    parts: vec![GeminiPart::Text {
                        text: format!("[tool result]\n{}", text),
                    }],
                });
            }
        }
    }

    let system_instruction = if system_text_parts.is_empty() {
        None
    } else {
        Some(GeminiSystemInstruction {
            parts: system_text_parts,
        })
    };

    let generation_config =
        if temperature.is_some() || max_tokens.is_some() || thinking_level.is_some() {
            Some(GeminiGenerationConfig {
                temperature,
                max_output_tokens: max_tokens,
                thinking_config: thinking_level.map(|lvl| GeminiThinkingConfig {
                    thinking_level: lvl,
                }),
            })
        } else {
            None
        };

    (system_instruction, contents, generation_config)
}

/// Recursively clean JSON Schema to match Gemini's strict OpenAPI 3.0 subset requirements.
fn clean_schema_for_gemini(value: &mut serde_json::Value) {
    if let serde_json::Value::Object(map) = value {
        // Remove unsupported JSON Schema features
        map.remove("$schema");
        map.remove("default");
        map.remove("additionalProperties");

        // Ensure type is a single uppercase string (Gemini's protobuf requirement)
        if let Some(type_val) = map.get_mut("type") {
            if let serde_json::Value::Array(arr) = type_val {
                // If it's something like ["string", "null"], take the first element
                if let Some(first) = arr.first() {
                    *type_val = first.clone();
                }
            }
            if let serde_json::Value::String(s) = type_val {
                // Gemini supports STRING, INTEGER, NUMBER, BOOLEAN, ARRAY, OBJECT
                *type_val = serde_json::Value::String(s.to_uppercase());
            }
        }

        // Recursively clean nested properties and items
        if let Some(properties) = map.get_mut("properties") {
            if let serde_json::Value::Object(props) = properties {
                for (_, prop_schema) in props.iter_mut() {
                    clean_schema_for_gemini(prop_schema);
                }
            }
        }
        if let Some(items) = map.get_mut("items") {
            clean_schema_for_gemini(items);
        }
    }
}

/// Convert our internal Tool list to Gemini's functionDeclarations format.
fn build_gemini_tools(tools: &[crate::ai::provider_types::Tool]) -> Option<Vec<GeminiTool>> {
    if tools.is_empty() {
        return None;
    }
    Some(vec![GeminiTool {
        function_declarations: tools
            .iter()
            .map(|t| {
                let mut parameters = t.function.parameters.clone();
                clean_schema_for_gemini(&mut parameters);
                // Ensure the root object type is upper case OBJECT
                if let serde_json::Value::Object(ref mut map) = parameters {
                    map.insert(
                        "type".to_string(),
                        serde_json::Value::String("OBJECT".to_string()),
                    );
                }
                GeminiFunctionDeclaration {
                    name: t.function.name.clone(),
                    description: t.function.description.clone(),
                    parameters,
                }
            })
            .collect(),
    }])
}

// ─── Adapter struct ──────────────────────────────────────────────────────────

pub struct GeminiProviderAdapter {
    config: ProviderConfig,
    api_key: String,
    client: reqwest::Client,
}

impl GeminiProviderAdapter {
    pub fn new(config: ProviderConfig) -> ProviderResult<Self> {
        let api_key = config
            .api_key
            .clone()
            .ok_or_else(|| AIError::Authentication("Gemini API key is required".to_string()))?;

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(config.timeout))
            .build()
            .map_err(|e| AIError::Configuration(format!("HTTP client error: {}", e)))?;

        Ok(Self {
            config,
            api_key,
            client,
        })
    }

    fn model_url(&self, model: &str, endpoint: &str) -> String {
        let api_model = resolve_model_id(model);
        format!(
            "{}/models/{}:{}?key={}",
            GEMINI_API_BASE, api_model, endpoint, self.api_key
        )
    }
}

#[async_trait]
impl AIProvider for GeminiProviderAdapter {
    fn id(&self) -> &ProviderId {
        &self.config.id
    }

    fn provider_type(&self) -> ProviderType {
        ProviderType::Google
    }

    async fn capabilities(&self) -> ProviderResult<ProviderCapabilities> {
        Ok(ProviderCapabilities {
            chat_completions: true,
            embeddings: false,
            streaming: true,
            function_calling: true,
            vision: false,
            web_search: false,
            max_context_tokens: 1_000_000,
            max_output_tokens: 8192,
            models: vec![
                "gemini-3-flash-preview".to_string(),
                "gemini-3.1-flash-lite-preview".to_string(),
            ],
        })
    }

    async fn health_check(&self) -> ProviderResult<ProviderHealth> {
        let url = format!("{}/models?key={}", GEMINI_API_BASE, self.api_key);
        match self.client.get(&url).send().await {
            Ok(r) if r.status().is_success() => Ok(ProviderHealth::Healthy),
            Ok(r) if r.status() == reqwest::StatusCode::TOO_MANY_REQUESTS => {
                Ok(ProviderHealth::Degraded)
            }
            _ => Ok(ProviderHealth::Unhealthy),
        }
    }

    async fn complete(
        &self,
        request: ChatCompletionRequest,
    ) -> ProviderResult<ChatCompletionResponse> {
        let thinking_level = self
            .config
            .params
            .get("thinkingLevel")
            .or_else(|| self.config.params.get("thinking_level"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .or_else(|| extract_thinking_level(&request.model));

        let (system_instruction, contents, generation_config) = build_gemini_request_parts(
            &request.messages,
            request.temperature,
            request.max_tokens,
            thinking_level,
        );

        let gemini_tools = request.tools.as_deref().and_then(build_gemini_tools);

        let body = GeminiRequest {
            contents,
            system_instruction,
            generation_config,
            tools: gemini_tools,
        };

        let url = self.model_url(&request.model, "generateContent");

        let response = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| AIError::NetworkError(format!("Gemini request failed: {}", e)))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AIError::APIError(format!(
                "Gemini API error {}: {}",
                status, error_text
            )));
        }

        let gemini_response: GeminiResponse = response
            .json()
            .await
            .map_err(|e| AIError::APIError(format!("Failed to parse Gemini response: {}", e)))?;

        let candidate = gemini_response
            .candidates
            .into_iter()
            .next()
            .ok_or_else(|| AIError::APIError("No candidates in Gemini response".to_string()))?;

        let finish_reason = candidate
            .finish_reason
            .clone()
            .unwrap_or_else(|| "stop".to_string());

        // Separate text parts from functionCall parts.
        let mut text_parts: Vec<String> = Vec::new();
        let mut tool_calls: Vec<crate::ai::provider_types::ToolCall> = Vec::new();

        for part in candidate.content.parts {
            match part {
                GeminiPart::Text { text } => text_parts.push(text),
                GeminiPart::FunctionCall { function_call } => {
                    tool_calls.push(crate::ai::provider_types::ToolCall {
                        id: uuid::Uuid::new_v4().to_string(),
                        r#type: "function".to_string(),
                        extra_content: None,
                        function: crate::ai::provider_types::FunctionCall {
                            name: function_call.name,
                            arguments: function_call.args.to_string(),
                        },
                    });
                }
                GeminiPart::Unknown(_) => {}
            }
        }

        let text = text_parts.join("");

        let (prompt_tokens, completion_tokens, total_tokens) =
            if let Some(usage) = gemini_response.usage_metadata {
                (
                    usage.prompt_token_count.unwrap_or(0),
                    usage.candidates_token_count.unwrap_or(0),
                    usage.total_token_count.unwrap_or(0),
                )
            } else {
                (0, 0, 0)
            };

        Ok(ChatCompletionResponse {
            content: if text.is_empty() { None } else { Some(text) },
            tool_calls: if tool_calls.is_empty() {
                None
            } else {
                Some(tool_calls)
            },
            model: request.model,
            usage: TokenUsage {
                prompt_tokens,
                completion_tokens,
                total_tokens,
            },
            finish_reason,
        })
    }

    async fn complete_stream(
        &self,
        request: ChatCompletionRequest,
        callback: StreamingCallback,
    ) -> ProviderResult<()> {
        let thinking_level = self
            .config
            .params
            .get("thinkingLevel")
            .or_else(|| self.config.params.get("thinking_level"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .or_else(|| extract_thinking_level(&request.model));

        let (system_instruction, contents, generation_config) = build_gemini_request_parts(
            &request.messages,
            request.temperature,
            request.max_tokens,
            thinking_level,
        );

        let gemini_tools = request.tools.as_deref().and_then(build_gemini_tools);

        let body = GeminiRequest {
            contents,
            system_instruction,
            generation_config,
            tools: gemini_tools,
        };

        let url = self.model_url(&request.model, "streamGenerateContent?alt=sse");

        let response = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| AIError::NetworkError(format!("Gemini stream request failed: {}", e)))?;

        let status = response.status();
        if !status.is_success() {
            let text = response.text().await.unwrap_or_default();
            return Err(AIError::APIError(format!(
                "Gemini stream error {}: {}",
                status, text
            )));
        }

        let mut stream = response.bytes_stream();
        let mut buffer = String::new();

        while let Some(chunk_result) = stream.next().await {
            let chunk =
                chunk_result.map_err(|e| AIError::NetworkError(format!("Stream error: {}", e)))?;
            buffer.push_str(&String::from_utf8_lossy(&chunk));

            // Process complete SSE lines
            while let Some(newline_pos) = buffer.find('\n') {
                let line = buffer.drain(..=newline_pos).collect::<String>();
                let line = line.trim();

                if let Some(data) = line.strip_prefix("data: ") {
                    if data == "[DONE]" {
                        callback(StreamingChunk {
                            content: String::new(),
                            thought: None,
                            is_final: true,
                            finish_reason: Some("stop".to_string()),
                        });
                        return Ok(());
                    }

                    if let Ok(parsed) = serde_json::from_str::<GeminiStreamChunk>(data) {
                        if let Some(candidates) = parsed.candidates {
                            for candidate in candidates {
                                // Only stream text parts — skip functionCall parts
                                // (function calls are resolved via the finalize complete() call).
                                let text = candidate
                                    .content
                                    .parts
                                    .iter()
                                    .filter_map(|p| p.as_text())
                                    .collect::<Vec<_>>()
                                    .join("");

                                if !text.is_empty() {
                                    let is_final = candidate
                                        .finish_reason
                                        .as_deref()
                                        .map(|r| r != "STOP" && r != "MAX_TOKENS")
                                        .unwrap_or(false);
                                    callback(StreamingChunk {
                                        content: text,
                                        thought: None,
                                        is_final,
                                        finish_reason: candidate.finish_reason,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }

    async fn embed(&self, _request: EmbeddingRequest) -> ProviderResult<EmbeddingResponse> {
        Err(AIError::InvalidRequest(
            "Gemini BYOK provider does not support embeddings".to_string(),
        ))
    }

    fn default_model(&self) -> &str {
        &self.config.model
    }

    async fn available_models(&self) -> ProviderResult<Vec<String>> {
        Ok(vec![
            "gemini-3-flash-preview".to_string(),
            "gemini-3.1-flash-lite-preview".to_string(),
        ])
    }

    fn config(&self) -> &ProviderConfig {
        &self.config
    }
}

pub struct GeminiProviderFactory;

#[async_trait]
impl AIProviderFactory for GeminiProviderFactory {
    async fn create(config: ProviderConfig) -> ProviderResult<Arc<dyn AIProvider>> {
        Self::validate_config(&config)?;
        Ok(Arc::new(GeminiProviderAdapter::new(config)?))
    }

    fn validate_config(config: &ProviderConfig) -> ProviderResult<()> {
        if config.api_key.is_none() {
            return Err(AIError::Authentication("API key is required".to_string()));
        }

        if config.model.is_empty() {
            return Err(AIError::InvalidRequest("Model is required".to_string()));
        }

        Ok(())
    }
}
