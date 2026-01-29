use rainy_sdk::{
    models::{ResearchDepth, ResearchProvider},
    ResearchConfig, ResearchResult,
};
use tauri::State;

#[tauri::command]
pub async fn perform_research(
    topic: String,
    depth: Option<String>,
    max_sources: Option<u32>,
    managed_research: State<'_, crate::services::managed_research::ManagedResearchService>,
) -> Result<ResearchResult, String> {
    let depth_enum = match depth.as_deref() {
        Some("advanced") => ResearchDepth::Advanced,
        _ => ResearchDepth::Basic,
    };

    let config = ResearchConfig::default()
        .with_provider(ResearchProvider::Exa)
        .with_depth(depth_enum)
        .with_max_sources(max_sources.unwrap_or(10));

    managed_research.perform_research(topic, Some(config)).await
}
