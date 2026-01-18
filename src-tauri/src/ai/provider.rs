// Rainy Cowork - AI Provider Trait and Manager
// Abstraction layer for multiple AI providers

use crate::ai::{gemini::GeminiProvider, keychain::KeychainManager, rainy_api::RainyApiProvider};
use crate::models::{AIProviderConfig, ProviderType};
use async_trait::async_trait;

/// Error type for AI operations
#[derive(Debug, thiserror::Error)]
pub enum AIError {
    #[error("API request failed: {0}")]
    RequestFailed(String),
    #[error("Invalid API key")]
    InvalidApiKey,
    #[error("Rate limited")]
    RateLimited,
    #[error("Model not found: {0}")]
    ModelNotFound(String),
    #[error("Provider not available: {0}")]
    ProviderNotAvailable(String),
}

/// Trait for AI providers
#[async_trait]
pub trait AIProvider: Send + Sync {
    /// Get provider name
    fn name(&self) -> &str;

    /// Get available models
    fn available_models(&self) -> Vec<String>;

    /// Complete a prompt (non-streaming)
    async fn complete(&self, model: &str, prompt: &str) -> Result<String, AIError>;

    /// Complete with progress callback
    async fn complete_with_progress<F>(
        &self,
        model: &str,
        prompt: &str,
        on_progress: F,
    ) -> Result<String, AIError>
    where
        F: Fn(u8, Option<String>) + Send + Sync + 'static;

    /// Validate an API key
    async fn validate_key(&self, api_key: &str) -> Result<bool, AIError>;
}

/// Manager for AI providers
pub struct AIProviderManager {
    keychain: KeychainManager,
    rainy_api: RainyApiProvider,
    gemini: GeminiProvider,
}

impl AIProviderManager {
    pub fn new() -> Self {
        Self {
            keychain: KeychainManager::new(),
            rainy_api: RainyApiProvider::new(),
            gemini: GeminiProvider::new(),
        }
    }

    /// List available providers
    pub async fn list_providers(&self) -> Vec<AIProviderConfig> {
        vec![
            AIProviderConfig {
                provider: ProviderType::RainyApi,
                name: "Rainy API".to_string(),
                model: "gpt-4o".to_string(),
                is_available: true,
                requires_api_key: true,
            },
            AIProviderConfig {
                provider: ProviderType::Gemini,
                name: "Google Gemini".to_string(),
                model: "gemini-1.5-pro".to_string(),
                is_available: true,
                requires_api_key: true,
            },
        ]
    }

    /// Validate an API key for a provider
    pub async fn validate_api_key(&self, provider: &str, api_key: &str) -> Result<bool, String> {
        match provider {
            "rainy_api" => self
                .rainy_api
                .validate_key(api_key)
                .await
                .map_err(|e| e.to_string()),
            "gemini" => self
                .gemini
                .validate_key(api_key)
                .await
                .map_err(|e| e.to_string()),
            _ => Err(format!("Unknown provider: {}", provider)),
        }
    }

    /// Store API key in macOS Keychain
    pub async fn store_api_key(&self, provider: &str, api_key: &str) -> Result<(), String> {
        self.keychain.store_key(provider, api_key)
    }

    /// Get API key from macOS Keychain
    pub async fn get_api_key(&self, provider: &str) -> Result<Option<String>, String> {
        self.keychain.get_key(provider)
    }

    /// Delete API key from macOS Keychain
    pub async fn delete_api_key(&self, provider: &str) -> Result<(), String> {
        self.keychain.delete_key(provider)
    }

    /// Get available models for a provider
    pub async fn get_models(&self, provider: &str) -> Result<Vec<String>, String> {
        match provider {
            "rainy_api" => Ok(self.rainy_api.available_models()),
            "gemini" => Ok(self.gemini.available_models()),
            _ => Err(format!("Unknown provider: {}", provider)),
        }
    }

    /// Execute a prompt using the specified provider
    pub async fn execute_prompt<F>(
        &self,
        provider: &ProviderType,
        model: &str,
        prompt: &str,
        on_progress: F,
    ) -> Result<String, String>
    where
        F: Fn(u8, Option<String>) + Send + Sync + 'static,
    {
        let provider_name = match provider {
            ProviderType::RainyApi => "rainy_api",
            ProviderType::Gemini => "gemini",
        };

        // Get API key from keychain
        let api_key = self
            .get_api_key(provider_name)
            .await?
            .ok_or_else(|| format!("No API key found for {}", provider_name))?;

        match provider {
            ProviderType::RainyApi => self
                .rainy_api
                .complete_with_api_key(model, prompt, &api_key, on_progress)
                .await
                .map_err(|e| e.to_string()),
            ProviderType::Gemini => self
                .gemini
                .complete_with_api_key(model, prompt, &api_key, on_progress)
                .await
                .map_err(|e| e.to_string()),
        }
    }
}

impl Default for AIProviderManager {
    fn default() -> Self {
        Self::new()
    }
}
