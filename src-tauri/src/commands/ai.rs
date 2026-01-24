// Rainy Cowork - AI Provider Commands
// Tauri commands for AI provider management with rainy-sdk integration

use crate::ai::AIProviderManager;
use crate::models::AIProviderConfig;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

/// Cowork status response for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoworkStatus {
    pub has_paid_plan: bool,
    pub plan: String,
    pub plan_name: String,
    pub is_valid: bool,
    pub models: Vec<String>,
    pub features: CoworkFeaturesDto,
    pub usage: CoworkUsageDto,
    pub upgrade_message: Option<String>,
}

/// Feature flags DTO for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoworkFeaturesDto {
    pub web_research: bool,
    pub document_export: bool,
    pub image_analysis: bool,
    pub priority_support: bool,
}

/// Usage tracking DTO for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoworkUsageDto {
    pub used: u32,
    pub limit: u32,
    pub credits_used: f32,
    pub credits_ceiling: f32,
    pub resets_at: String,
}

/// List available AI providers
#[tauri::command]
pub async fn list_providers(
    provider_manager: State<'_, Arc<Mutex<AIProviderManager>>>,
) -> Result<Vec<AIProviderConfig>, String> {
    let mut manager = provider_manager.lock().await;
    Ok(manager.list_providers().await)
}

/// Validate an API key for a provider
#[tauri::command]
pub async fn validate_api_key(
    provider: String,
    api_key: String,
    provider_manager: State<'_, Arc<Mutex<AIProviderManager>>>,
) -> Result<bool, String> {
    let manager = provider_manager.lock().await;
    manager.validate_api_key(&provider, &api_key).await
}

/// Store API key securely in macOS Keychain
#[tauri::command]
pub async fn store_api_key(
    provider: String,
    api_key: String,
    provider_manager: State<'_, Arc<Mutex<AIProviderManager>>>,
) -> Result<(), String> {
    let mut manager = provider_manager.lock().await;
    let result = manager.store_api_key(&provider, &api_key).await;
    // Invalidate cache after storing new key
    manager.invalidate_cache();
    result
}

/// Get stored API key from macOS Keychain
#[tauri::command]
pub async fn get_api_key(
    provider: String,
    provider_manager: State<'_, Arc<Mutex<AIProviderManager>>>,
) -> Result<Option<String>, String> {
    let manager = provider_manager.lock().await;
    manager.get_api_key(&provider).await
}

/// Delete stored API key from macOS Keychain
#[tauri::command]
pub async fn delete_api_key(
    provider: String,
    provider_manager: State<'_, Arc<Mutex<AIProviderManager>>>,
) -> Result<(), String> {
    let mut manager = provider_manager.lock().await;
    let result = manager.delete_api_key(&provider).await;
    // Invalidate cache after deleting key
    manager.invalidate_cache();
    result
}

/// Get available models for a provider
#[tauri::command]
pub async fn get_provider_models(
    provider: String,
    provider_manager: State<'_, Arc<Mutex<AIProviderManager>>>,
) -> Result<Vec<String>, String> {
    let mut manager = provider_manager.lock().await;
    manager.get_models(&provider).await
}

/// Check if API key exists for a provider
#[tauri::command]
pub async fn has_api_key(
    provider: String,
    provider_manager: State<'_, Arc<Mutex<AIProviderManager>>>,
) -> Result<bool, String> {
    let manager = provider_manager.lock().await;
    manager.has_api_key(&provider).await
}

/// Get Cowork subscription status and capabilities
#[tauri::command]
pub async fn get_cowork_status(
    provider_manager: State<'_, Arc<Mutex<AIProviderManager>>>,
) -> Result<CoworkStatus, String> {
    let mut manager = provider_manager.lock().await;
    let caps = manager.get_capabilities().await;

    Ok(CoworkStatus {
        has_paid_plan: caps.profile.plan.is_paid(),
        plan: caps.profile.plan.id.clone(),
        plan_name: caps.profile.plan.name.clone(),
        is_valid: caps.is_valid,
        models: caps.models,
        features: CoworkFeaturesDto {
            web_research: caps.features.web_research,
            document_export: caps.features.document_export,
            image_analysis: caps.features.image_analysis,
            priority_support: caps.features.priority_support,
        },
        usage: CoworkUsageDto {
            used: caps.profile.usage.used,
            limit: caps.profile.usage.limit,
            credits_used: caps.profile.usage.credits_used,
            // Assuming default or calculating if needed, as it was removed from Usage struct
            credits_ceiling: 0.0,
            resets_at: String::new(), // Not in new struct, provide default or fetch if available
        },
        upgrade_message: caps.upgrade_message,
    })
}

/// Check if a feature is available
#[tauri::command]
pub async fn can_use_feature(
    feature: String,
    provider_manager: State<'_, Arc<Mutex<AIProviderManager>>>,
) -> Result<bool, String> {
    let mut manager = provider_manager.lock().await;
    Ok(manager.can_use_feature(&feature).await)
}
