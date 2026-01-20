// Rainy Cowork - User Settings Service
// Manages user preferences including AI model selection

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Available AI model for selection
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelOption {
    pub id: String,
    pub name: String,
    pub description: String,
    pub thinking_level: String,
    pub is_premium: bool,
    pub is_available: bool,
    pub provider: String,
}

/// User settings persisted to disk
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettings {
    pub selected_model: String,
    pub theme: String,
    pub notifications_enabled: bool,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            selected_model: "gemini-3-flash-high".to_string(),
            theme: "system".to_string(),
            notifications_enabled: true,
        }
    }
}

/// Settings manager for persistence and retrieval
pub struct SettingsManager {
    settings_path: PathBuf,
    settings: UserSettings,
}

impl SettingsManager {
    pub fn new() -> Self {
        let settings_path = Self::get_settings_path();
        let settings = Self::load_from_disk(&settings_path);

        Self {
            settings_path,
            settings,
        }
    }

    fn get_settings_path() -> PathBuf {
        let app_data = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("com.enosislabs.rainy-cowork");

        // Ensure directory exists
        fs::create_dir_all(&app_data).ok();

        app_data.join("settings.json")
    }

    fn load_from_disk(path: &PathBuf) -> UserSettings {
        if path.exists() {
            if let Ok(contents) = fs::read_to_string(path) {
                if let Ok(settings) = serde_json::from_str(&contents) {
                    return settings;
                }
            }
        }
        UserSettings::default()
    }

    fn save_to_disk(&self) -> Result<(), String> {
        let json = serde_json::to_string_pretty(&self.settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        fs::write(&self.settings_path, json).map_err(|e| format!("Failed to save settings: {}", e))
    }

    /// Get current user settings
    pub fn get_settings(&self) -> &UserSettings {
        &self.settings
    }

    /// Get selected model
    pub fn get_selected_model(&self) -> &str {
        &self.settings.selected_model
    }

    /// Set selected model and persist
    pub fn set_selected_model(&mut self, model: String) -> Result<(), String> {
        self.settings.selected_model = model;
        self.save_to_disk()
    }

    /// Set theme and persist
    pub fn set_theme(&mut self, theme: String) -> Result<(), String> {
        self.settings.theme = theme;
        self.save_to_disk()
    }

    /// Set notifications and persist
    pub fn set_notifications(&mut self, enabled: bool) -> Result<(), String> {
        self.settings.notifications_enabled = enabled;
        self.save_to_disk()
    }

    /// Get available models based on user's tier
    pub fn get_available_models(is_paid: bool, paid_models: &[String]) -> Vec<ModelOption> {
        let mut models = vec![];

        // Free tier Gemini BYOK models
        models.push(ModelOption {
            id: "gemini-3-flash-minimal".to_string(),
            name: "Gemini 3 Flash (Fast)".to_string(),
            description: "Fast responses with minimal thinking".to_string(),
            thinking_level: "minimal".to_string(),
            is_premium: false,
            is_available: true,
            provider: "Google Gemini".to_string(),
        });

        models.push(ModelOption {
            id: "gemini-3-flash-high".to_string(),
            name: "Gemini 3 Flash (Smart)".to_string(),
            description: "Deep reasoning for complex tasks".to_string(),
            thinking_level: "high".to_string(),
            is_premium: false,
            is_available: true,
            provider: "Google Gemini".to_string(),
        });

        models.push(ModelOption {
            id: "gemini-2.5-flash-lite".to_string(),
            name: "Gemini 2.5 Flash Lite".to_string(),
            description: "Lightweight, cost-effective responses".to_string(),
            thinking_level: "none".to_string(),
            is_premium: false,
            is_available: true,
            provider: "Google Gemini".to_string(),
        });

        // Premium models from Rainy API
        if is_paid {
            for model_id in paid_models {
                let (name, desc) = Self::get_model_info(model_id);
                models.push(ModelOption {
                    id: model_id.clone(),
                    name,
                    description: desc,
                    thinking_level: "n/a".to_string(),
                    is_premium: true,
                    is_available: true,
                    provider: "Rainy API".to_string(),
                });
            }
        } else {
            // Show locked premium models
            for (id, name, desc) in [
                ("gpt-4o", "GPT-4o", "OpenAI's flagship multimodal model"),
                ("gpt-5", "GPT-5", "OpenAI's most advanced reasoning model"),
                (
                    "claude-sonnet-4",
                    "Claude Sonnet 4",
                    "Anthropic's balanced model",
                ),
                (
                    "gemini-2.5-pro",
                    "Gemini 2.5 Pro",
                    "Google's most capable model",
                ),
            ] {
                models.push(ModelOption {
                    id: id.to_string(),
                    name: name.to_string(),
                    description: desc.to_string(),
                    thinking_level: "n/a".to_string(),
                    is_premium: true,
                    is_available: false,
                    provider: "Rainy API".to_string(),
                });
            }
        }

        models
    }

    fn get_model_info(model_id: &str) -> (String, String) {
        match model_id {
            "gpt-4o" => (
                "GPT-4o".to_string(),
                "OpenAI's flagship multimodal model".to_string(),
            ),
            "gpt-5" => (
                "GPT-5".to_string(),
                "OpenAI's most advanced reasoning model".to_string(),
            ),
            "gpt-5-pro" => (
                "GPT-5 Pro".to_string(),
                "Maximum capability for complex tasks".to_string(),
            ),
            "o3" => (
                "O3".to_string(),
                "OpenAI's reasoning-focused model".to_string(),
            ),
            "o4-mini" => (
                "O4 Mini".to_string(),
                "Fast and efficient reasoning".to_string(),
            ),
            "claude-sonnet-4" => (
                "Claude Sonnet 4".to_string(),
                "Anthropic's balanced model".to_string(),
            ),
            "claude-opus-4-1" => (
                "Claude Opus 4.1".to_string(),
                "Anthropic's most capable model".to_string(),
            ),
            "gemini-2.5-pro" => (
                "Gemini 2.5 Pro".to_string(),
                "Google's most capable model".to_string(),
            ),
            "gemini-2.5-flash" => (
                "Gemini 2.5 Flash".to_string(),
                "Fast multimodal responses".to_string(),
            ),
            _ => (model_id.to_string(), "AI model".to_string()),
        }
    }
}

impl Default for SettingsManager {
    fn default() -> Self {
        Self::new()
    }
}
