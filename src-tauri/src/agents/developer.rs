// Developer Agent Module
//
// This module implements the DeveloperAgent, which specializes in:
// - Code writing and generation
// - Code refactoring
// - Debugging and testing
//
// ## Capabilities
//
// - Code generation
// - Code refactoring
// - Debugging
// - Testing
//
// ## Usage
//
// ```rust
// use rainy_cowork_lib::agents::{DeveloperAgent, AgentConfig, AgentRegistry};
//
// let config = AgentConfig {
//     agent_id: "developer-1".to_string(),
//     workspace_id: "workspace-1".to_string(),
//     ai_provider: "gemini".to_string(),
//     model: "gemini-2.0-flash".to_string(),
//     settings: serde_json::json!({}),
// };
//
// let registry = Arc::new(AgentRegistry::new());
// let agent = DeveloperAgent::new(config, registry);
// ```

use crate::agents::{
    Agent, AgentConfig, AgentError, AgentInfo, AgentMessage, AgentRegistry, AgentStatus, AgentType,
    BaseAgent, Task, TaskResult,
};
use std::sync::Arc;

/// DeveloperAgent specializes in code development and maintenance
///
/// This agent handles:
/// - Code generation from specifications
/// - Code refactoring and optimization
/// - Debugging and error resolution
/// - Testing and test generation
pub struct DeveloperAgent {
    /// Base agent providing common functionality
    base: BaseAgent,
    // Registry removed (unused)
}

impl DeveloperAgent {
    /// Create a new DeveloperAgent
    ///
    /// # Arguments
    ///
    /// * `config` - Agent configuration
    /// * `registry` - Agent registry for accessing services
    ///
    /// # Returns
    ///
    /// A new DeveloperAgent instance
    pub fn new(config: AgentConfig, registry: Arc<AgentRegistry>) -> Self {
        let ai_provider = registry.ai_provider();
        let base = BaseAgent::new(config, ai_provider, Arc::new(()));

        Self { base }
    }

    /// Generate code based on specifications
    ///
    /// # Arguments
    ///
    /// * `language` - Programming language
    /// * `specification` - Code specification and requirements
    ///
    /// # Returns
    ///
    /// Generated code
    async fn generate_code(
        &self,
        language: &str,
        specification: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Generate {} code for the following specification:\n\n\
             {}\n\n\
             Requirements:\n\
             - Write clean, well-documented code\n\
             - Follow best practices and conventions\n\
             - Include error handling where appropriate\n\
             - Add comments explaining complex logic",
            language, specification
        );

        let code = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Generated Code ({})\n\
             ====================\n\n\
             {}",
            language, code
        ))
    }

    /// Refactor existing code
    ///
    /// # Arguments
    ///
    /// * `code` - Code to refactor
    /// * `refactoring_goals` - Goals for refactoring (performance, readability, etc.)
    ///
    /// # Returns
    ///
    /// Refactored code
    async fn refactor_code(
        &self,
        code: &str,
        refactoring_goals: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Refactor the following code with these goals: {}\n\n\
             Code:\n{}\n\n\
             Provide:\n\
             - Refactored code\n\
             - Explanation of changes\n\
             - Benefits of the refactoring",
            refactoring_goals, code
        );

        let refactored = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Refactored Code\n\
             Goals: {}\n\n\
             {}",
            refactoring_goals, refactored
        ))
    }

    /// Debug code and identify issues
    ///
    /// # Arguments
    ///
    /// * `code` - Code to debug
    /// * `error_message` - Error message or issue description
    ///
    /// # Returns
    ///
    /// Debugging analysis and fixes
    async fn debug_code(&self, code: &str, error_message: &str) -> Result<String, AgentError> {
        let prompt = format!(
            "Debug the following code:\n\n\
             Code:\n{}\n\n\
             Error/Issue: {}\n\n\
             Provide:\n\
             - Root cause analysis\n\
             - Fixed code\n\
             - Explanation of the fix\n\
             - Prevention recommendations",
            code, error_message
        );

        let debug_result = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Debugging Analysis\n\
             Error: {}\n\n\
             {}",
            error_message, debug_result
        ))
    }

    /// Generate tests for code
    ///
    /// # Arguments
    ///
    /// * `code` - Code to test
    /// * `test_framework` - Testing framework to use
    ///
    /// # Returns
    ///
    /// Generated tests
    async fn generate_tests(&self, code: &str, test_framework: &str) -> Result<String, AgentError> {
        let prompt = format!(
            "Generate comprehensive tests for the following code using {}:\n\n\
             Code:\n{}\n\n\
             Provide:\n\
             - Unit tests\n\
             - Integration tests if applicable\n\
             - Edge case tests\n\
             - Test documentation",
            test_framework, code
        );

        let tests = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Generated Tests ({})\n\
             ===================\n\n\
             {}",
            test_framework, tests
        ))
    }
}

#[async_trait::async_trait]
impl Agent for DeveloperAgent {
    fn info(&self) -> AgentInfo {
        AgentInfo {
            id: self.base.info().id,
            name: "Developer".to_string(),
            agent_type: AgentType::Developer,
            status: self.base.info().status,
            current_task: self.base.info().current_task,
        }
    }

    async fn process_task(&self, task: Task) -> Result<TaskResult, AgentError> {
        self.base.update_status(AgentStatus::Busy).await;
        self.base.set_current_task(Some(task.id.clone())).await;

        let result = if task.description.contains("generate")
            || task.description.contains("write")
            || task.description.contains("implement")
        {
            // Code generation
            let language = task
                .context
                .relevant_files
                .first()
                .cloned()
                .unwrap_or_else(|| "unknown".to_string());

            self.generate_code(&language, &task.context.user_instruction)
                .await?
        } else if task.description.contains("refactor")
            || task.description.contains("optimize")
            || task.description.contains("improve")
        {
            // Code refactoring
            let code = task
                .context
                .relevant_files
                .first()
                .cloned()
                .unwrap_or_else(|| "No code provided".to_string());

            let refactoring_goals = if task.description.contains("performance") {
                "performance optimization"
            } else if task.description.contains("readability") {
                "improved readability"
            } else {
                "general improvement"
            };

            self.refactor_code(&code, refactoring_goals).await?
        } else if task.description.contains("debug")
            || task.description.contains("fix")
            || task.description.contains("error")
        {
            // Debugging
            let code = task
                .context
                .relevant_files
                .first()
                .cloned()
                .unwrap_or_else(|| "No code provided".to_string());

            let error_message = task
                .context
                .memory_context
                .first()
                .map(|m| m.content.as_str())
                .unwrap_or_else(|| task.context.user_instruction.as_str());

            self.debug_code(&code, error_message).await?
        } else if task.description.contains("test") {
            // Test generation
            let code = task
                .context
                .relevant_files
                .first()
                .cloned()
                .unwrap_or_else(|| "No code provided".to_string());

            let test_framework = if task.description.contains("jest") {
                "Jest"
            } else if task.description.contains("pytest") {
                "pytest"
            } else if task.description.contains("rust") {
                "Rust testing framework"
            } else {
                "appropriate testing framework"
            };

            self.generate_tests(&code, test_framework).await?
        } else {
            // Use AI to process general development task
            let prompt = format!(
                "Development Task: {}\n\nContext: {}\n\n\
                 Please complete this development task and provide high-quality code.",
                task.description, task.context.user_instruction
            );
            self.base.query_ai(&prompt).await?
        };

        self.base.update_status(AgentStatus::Idle).await;
        self.base.set_current_task(None).await;

        Ok(TaskResult {
            success: true,
            output: result,
            errors: vec![],
            metadata: serde_json::json!({
                "task_id": task.id,
                "agent_type": "Developer",
                "agent_id": self.base.config().agent_id,
            }),
        })
    }

    async fn handle_message(&self, message: AgentMessage) -> Result<(), AgentError> {
        match message {
            AgentMessage::TaskAssign { task, .. } => {
                let result = self.process_task(task).await?;
                // Send result back to sender
                // TODO: Implement result sending logic
                let _ = result;
            }
            _ => {}
        }
        Ok(())
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "code_generation".to_string(),
            "code_refactoring".to_string(),
            "debugging".to_string(),
            "testing".to_string(),
        ]
    }

    fn can_handle(&self, task: &Task) -> bool {
        let desc = task.description.to_lowercase();
        desc.contains("code")
            || desc.contains("function")
            || desc.contains("class")
            || desc.contains("implement")
            || desc.contains("generate")
            || desc.contains("write")
            || desc.contains("refactor")
            || desc.contains("debug")
            || desc.contains("fix")
            || desc.contains("test")
            || desc.contains("optimize")
    }

    async fn initialize(&mut self, config: AgentConfig) -> Result<(), AgentError> {
        self.base.initialize(config).await
    }

    async fn shutdown(&mut self) -> Result<(), AgentError> {
        self.base.shutdown().await
    }

    async fn update_status(&self, status: AgentStatus) {
        self.base.update_status(status).await;
    }

    async fn set_current_task(&self, task_id: Option<String>) {
        self.base.set_current_task(task_id).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::types::TaskContext;
    use crate::ai::provider::AIProviderManager;

    #[tokio::test]
    async fn test_developer_agent_creation() {
        let config = AgentConfig {
            agent_id: "developer-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = DeveloperAgent::new(config, registry);
        assert_eq!(agent.info().name, "Developer");
        assert_eq!(agent.info().agent_type, AgentType::Developer);
    }

    #[tokio::test]
    async fn test_developer_capabilities() {
        let config = AgentConfig {
            agent_id: "developer-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = DeveloperAgent::new(config, registry);
        let capabilities = agent.capabilities();

        assert!(capabilities.contains(&"code_generation".to_string()));
        assert!(capabilities.contains(&"code_refactoring".to_string()));
        assert!(capabilities.contains(&"debugging".to_string()));
        assert!(capabilities.contains(&"testing".to_string()));
    }

    #[tokio::test]
    async fn test_developer_can_handle() {
        let config = AgentConfig {
            agent_id: "developer-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = DeveloperAgent::new(config, registry);

        let code_task = Task {
            id: "task-1".to_string(),
            description: "Write a function to sort an array".to_string(),
            priority: crate::agents::types::TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "ws-1".to_string(),
                user_instruction: "Implement sorting".to_string(),
                relevant_files: vec!["Rust".to_string()],
                memory_context: vec![],
            },
        };

        assert!(agent.can_handle(&code_task));

        let research_task = Task {
            id: "task-2".to_string(),
            description: "Research topic".to_string(),
            priority: crate::agents::types::TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "ws-1".to_string(),
                user_instruction: "Research".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };

        assert!(!agent.can_handle(&research_task));
    }
}
