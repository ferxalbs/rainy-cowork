use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSoul {
    pub name: String,
    pub description: String,
    pub version: String,

    // Core identity
    pub personality: String, // "Helpful", "Strict", "Creative"
    pub tone: String,        // "Formal", "Casual", "Pirate"

    // The raw markdown content of SOUL.md, usually defining the prompt
    pub soul_content: String,

    // Optional: Embedding vector of the soul content for identity verification/search
    pub embedding: Option<Vec<f32>>,
}

impl Default for AgentSoul {
    fn default() -> Self {
        Self {
            name: "New Agent".to_string(),
            description: "A Rainy agent".to_string(),
            version: "1.0.0".to_string(),
            personality: "Helpful".to_string(),
            tone: "Professional".to_string(),
            soul_content: "# Agent Identity\nYou are a helpful assistant.".to_string(),
            embedding: None,
        }
    }
}
