use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSkills {
    pub capabilities: Vec<Capability>,
    // Map of tool_name -> config
    pub tools: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Permission {
    Read,
    Write,
    Execute,
    Network,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capability {
    pub name: String, // e.g., "filesystem", "browser"
    pub description: String,
    pub scopes: Vec<String>, // e.g., "/Users/fer/Documents", "*.google.com"
    pub permissions: Vec<Permission>,
}

impl AgentSkills {
    pub fn new() -> Self {
        Self {
            capabilities: Vec::new(),
            tools: HashMap::new(),
        }
    }

    pub fn can_access_path(&self, path: &str) -> bool {
        // Simple check if any filesystem capability covers this path
        // In real impl, this would need glob matching / path prefix checking
        self.capabilities.iter().any(|cap| {
            cap.name == "filesystem" && cap.scopes.iter().any(|scope| path.starts_with(scope))
        })
    }
}
