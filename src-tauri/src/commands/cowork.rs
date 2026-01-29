// src-tauri/src/commands/cowork.rs
use crate::ai::AIProviderManager;
use rainy_sdk::cowork::CoworkModelsResponse;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

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

#[tauri::command]
pub async fn get_cowork_models(
    provider_manager: State<'_, Arc<AIProviderManager>>,
) -> Result<CoworkModelsResponse, String> {
    provider_manager.get_cowork_models_from_api().await
}

#[tauri::command]
pub async fn get_cowork_status(
    provider_manager: State<'_, Arc<AIProviderManager>>,
) -> Result<CoworkStatus, String> {
    let caps = provider_manager.get_capabilities().await;

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
            credits_ceiling: 0.0,
            resets_at: String::new(),
        },
        upgrade_message: caps.upgrade_message,
    })
}

#[tauri::command]
pub async fn can_use_feature(
    feature: String,
    provider_manager: State<'_, Arc<AIProviderManager>>,
) -> Result<bool, String> {
    Ok(provider_manager.can_use_feature(&feature).await)
}
