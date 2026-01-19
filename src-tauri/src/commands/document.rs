// Document Generation Commands
// Tauri commands for document creation and template management
// Part of Rainy Cowork Phase 3 - Milestone 3.2

use crate::services::document::{DocumentService, DocumentTemplate, TemplateCategory};
use serde::{Deserialize, Serialize};
use tauri::{command, State};

/// Template info for frontend (simplified view)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub fields: Vec<FieldInfo>,
}

/// Field info for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldInfo {
    pub name: String,
    pub label: String,
    pub field_type: String,
    pub required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<String>,
}

impl From<&DocumentTemplate> for TemplateInfo {
    fn from(template: &DocumentTemplate) -> Self {
        Self {
            id: template.id.clone(),
            name: template.name.clone(),
            description: template.description.clone(),
            category: format!("{:?}", template.category).to_lowercase(),
            fields: template
                .required_fields
                .iter()
                .map(|f| FieldInfo {
                    name: f.name.clone(),
                    label: f.label.clone(),
                    field_type: format!("{:?}", f.field_type).to_lowercase(),
                    required: f.required,
                    default: f.default.clone(),
                })
                .collect(),
        }
    }
}

/// Response for document generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateDocumentResponse {
    pub id: String,
    pub template_id: String,
    pub content: String,
    pub html: String,
    pub generated_at: String,
    pub word_count: usize,
}

/// List all available document templates
#[command]
pub fn list_document_templates(service: State<'_, DocumentService>) -> Vec<TemplateInfo> {
    service
        .list_templates()
        .iter()
        .map(|t| TemplateInfo::from(*t))
        .collect()
}

/// Get templates by category
#[command]
pub fn get_templates_by_category(
    category: String,
    service: State<'_, DocumentService>,
) -> Vec<TemplateInfo> {
    let cat = match category.to_lowercase().as_str() {
        "report" => TemplateCategory::Report,
        "meeting" => TemplateCategory::Meeting,
        "email" => TemplateCategory::Email,
        "note" => TemplateCategory::Note,
        _ => TemplateCategory::Custom,
    };

    service
        .get_templates_by_category(cat)
        .iter()
        .map(|t| TemplateInfo::from(*t))
        .collect()
}

/// Get a specific template by ID
#[command]
pub fn get_template(
    template_id: String,
    service: State<'_, DocumentService>,
) -> Result<TemplateInfo, String> {
    service
        .get_template(&template_id)
        .map(TemplateInfo::from)
        .ok_or_else(|| format!("Template not found: {}", template_id))
}

/// Generate a document from template with context
#[command]
pub fn generate_document(
    template_id: String,
    context: serde_json::Value,
    service: State<'_, DocumentService>,
) -> Result<GenerateDocumentResponse, String> {
    let generated = service
        .generate(&template_id, &context)
        .map_err(|e| e.to_string())?;

    let html = DocumentService::markdown_to_html(&generated.content_markdown);

    Ok(GenerateDocumentResponse {
        id: generated.id,
        template_id: generated.template_id,
        content: generated.content_markdown,
        html,
        generated_at: generated.generated_at,
        word_count: generated.word_count,
    })
}

/// Convert markdown to HTML
#[command]
pub fn markdown_to_html(markdown: String) -> String {
    DocumentService::markdown_to_html(&markdown)
}
