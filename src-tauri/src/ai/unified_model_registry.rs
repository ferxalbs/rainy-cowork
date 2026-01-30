// Unified Model Registry
// @TODO: Registry integration pending Phase 4
#![allow(dead_code)]

// Aggregates models from all providers with user preferences

use crate::ai::provider_types::ProviderCapabilities;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Unified model information from all providers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedModel {
    /// Unique model identifier (provider/model format)
    pub id: String,
    /// Display name
    pub name: String,
    /// Provider source
    pub provider: ProviderSource,
    /// Model capabilities
    pub capabilities: ModelCapabilities,
    /// User preference: enabled
    pub is_enabled: bool,
    /// Available based on plan/API key
    pub is_available: bool,
    /// Priority for sorting (lower = higher priority)
    pub priority: u32,
    /// Optional description
    pub description: Option<String>,
}

/// Provider source for unified models
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ProviderSource {
    /// Rainy API - direct access, pay-as-you-go
    RainyApi,
    /// Cowork subscription - tiered access
    Cowork,
    /// Individual OpenAI provider
    OpenAI,
    /// Individual Anthropic provider
    Anthropic,
    /// Individual xAI provider
    XAI,
    /// Local/Ollama provider
    Local,
}

impl std::fmt::Display for ProviderSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProviderSource::RainyApi => write!(f, "Rainy API"),
            ProviderSource::Cowork => write!(f, "Cowork"),
            ProviderSource::OpenAI => write!(f, "OpenAI"),
            ProviderSource::Anthropic => write!(f, "Anthropic"),
            ProviderSource::XAI => write!(f, "xAI"),
            ProviderSource::Local => write!(f, "Local"),
        }
    }
}

/// Model capabilities for filtering
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelCapabilities {
    /// Supports streaming responses
    pub streaming: bool,
    /// Supports function calling
    pub function_calling: bool,
    /// Supports vision/image analysis
    pub vision: bool,
    /// Supports web search
    pub web_search: bool,
    /// Maximum context tokens
    pub max_tokens: u32,
}

/// User model preferences
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserModelPreferences {
    /// Enabled model IDs
    pub enabled_models: Vec<String>,
    /// Default model for chat
    pub default_chat_model: String,
    /// Default model for processing
    pub default_processing_model: String,
    /// Hidden model IDs
    pub hidden_models: Vec<String>,
    /// Provider priorities (lower = higher priority)
    pub provider_priorities: Vec<(ProviderSource, u32)>,
}

impl Default for UserModelPreferences {
    fn default() -> Self {
        Self {
            enabled_models: vec![],
            default_chat_model: "rainy-api/gemini-2.5-flash".to_string(),
            default_processing_model: "cowork/gemini-2.5-pro".to_string(),
            hidden_models: vec![],
            provider_priorities: vec![
                (ProviderSource::RainyApi, 1),
                (ProviderSource::Cowork, 2),
                (ProviderSource::OpenAI, 3),
                (ProviderSource::Anthropic, 4),
                (ProviderSource::XAI, 5),
                (ProviderSource::Local, 6),
            ],
        }
    }
}

/// Unified model registry
pub struct UnifiedModelRegistry {
    /// Cached models from all providers
    models: DashMap<String, UnifiedModel>,
    /// User preferences
    user_preferences: Arc<tokio::sync::RwLock<UserModelPreferences>>,
}

impl UnifiedModelRegistry {
    /// Create new registry
    pub fn new() -> Self {
        Self {
            models: DashMap::new(),
            user_preferences: Arc::new(tokio::sync::RwLock::new(UserModelPreferences::default())),
        }
    }

    /// Get user preferences
    pub async fn get_preferences(&self) -> UserModelPreferences {
        self.user_preferences.read().await.clone()
    }

    /// Update user preferences
    pub async fn update_preferences(&self, prefs: UserModelPreferences) {
        *self.user_preferences.write().await = prefs;
    }

    /// Add or update a model
    pub fn upsert_model(&self, model: UnifiedModel) {
        self.models.insert(model.id.clone(), model);
    }

    /// Get a specific model
    pub fn get_model(&self, id: &str) -> Option<UnifiedModel> {
        self.models.get(id).map(|m| m.clone())
    }

    /// Get all models aggregated from all providers
    pub async fn get_all_models(&self) -> Vec<UnifiedModel> {
        let prefs = self.user_preferences.read().await;
        let mut models: Vec<UnifiedModel> = self
            .models
            .iter()
            .map(|entry| entry.value().clone())
            .collect();

        // Apply user preferences
        for model in &mut models {
            // Check if model is explicitly enabled
            model.is_enabled =
                prefs.enabled_models.contains(&model.id) || prefs.enabled_models.is_empty(); // Empty means all enabled

            // Check if model is hidden
            model.is_available = !prefs.hidden_models.contains(&model.id);
        }

        // Sort by provider priority then by model priority
        models.sort_by(|a, b| {
            let a_provider_priority = prefs
                .provider_priorities
                .iter()
                .find(|(p, _)| *p == a.provider)
                .map(|(_, priority)| *priority)
                .unwrap_or(999);

            let b_provider_priority = prefs
                .provider_priorities
                .iter()
                .find(|(p, _)| *p == b.provider)
                .map(|(_, priority)| *priority)
                .unwrap_or(999);

            a_provider_priority
                .cmp(&b_provider_priority)
                .then_with(|| a.priority.cmp(&b.priority))
        });

        models
    }

    /// Get models filtered by capability
    pub async fn get_models_with_capability(
        &self,
        capability: ModelCapability,
    ) -> Vec<UnifiedModel> {
        let all_models = self.get_all_models().await;
        all_models
            .into_iter()
            .filter(|m| match capability {
                ModelCapability::Streaming => m.capabilities.streaming,
                ModelCapability::FunctionCalling => m.capabilities.function_calling,
                ModelCapability::Vision => m.capabilities.vision,
                ModelCapability::WebSearch => m.capabilities.web_search,
            })
            .collect()
    }

    /// Get enabled models only
    pub async fn get_enabled_models(&self) -> Vec<UnifiedModel> {
        self.get_all_models()
            .await
            .into_iter()
            .filter(|m| m.is_enabled && m.is_available)
            .collect()
    }

    /// Toggle model enabled state
    pub async fn toggle_model(&self, model_id: String, enabled: bool) -> Result<(), String> {
        let mut prefs = self.user_preferences.write().await;

        if enabled {
            if !prefs.enabled_models.contains(&model_id) {
                prefs.enabled_models.push(model_id);
            }
        } else {
            prefs.enabled_models.retain(|id| id != &model_id);
        }

        Ok(())
    }

    /// Set default model for context
    pub async fn set_default_model(
        &self,
        model_id: String,
        context: ModelContext,
    ) -> Result<(), String> {
        let mut prefs = self.user_preferences.write().await;

        match context {
            ModelContext::Chat => prefs.default_chat_model = model_id,
            ModelContext::Processing => prefs.default_processing_model = model_id,
        }

        Ok(())
    }

    /// Get default model for context
    pub async fn get_default_model(&self, context: ModelContext) -> Option<String> {
        let prefs = self.user_preferences.read().await;
        let model_id = match context {
            ModelContext::Chat => &prefs.default_chat_model,
            ModelContext::Processing => &prefs.default_processing_model,
        };

        // Verify model exists and is enabled
        if let Some(model) = self.models.get(model_id) {
            if model.is_enabled && model.is_available {
                return Some(model_id.clone());
            }
        }

        // Fallback to first available model
        let enabled = self.get_enabled_models().await;
        enabled.first().map(|m| m.id.clone())
    }

    /// Hide/show model
    pub async fn hide_model(&self, model_id: String, hidden: bool) -> Result<(), String> {
        let mut prefs = self.user_preferences.write().await;

        if hidden {
            if !prefs.hidden_models.contains(&model_id) {
                prefs.hidden_models.push(model_id);
            }
        } else {
            prefs.hidden_models.retain(|id| id != &model_id);
        }

        Ok(())
    }

    /// Clear all models (for refresh)
    pub fn clear(&self) {
        self.models.clear();
    }
}

impl Default for UnifiedModelRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Model capability for filtering
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ModelCapability {
    Streaming,
    FunctionCalling,
    Vision,
    WebSearch,
}

/// Model usage context
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ModelContext {
    Chat,
    Processing,
}

/// Convert ProviderCapabilities to ModelCapabilities
impl From<ProviderCapabilities> for ModelCapabilities {
    fn from(caps: ProviderCapabilities) -> Self {
        Self {
            streaming: caps.streaming,
            function_calling: caps.function_calling,
            vision: caps.vision,
            web_search: caps.web_search,
            max_tokens: caps.max_context_tokens,
        }
    }
}
