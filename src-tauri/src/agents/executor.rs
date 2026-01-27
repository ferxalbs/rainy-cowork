// Executor Agent Module
//
// This module implements the ExecutorAgent, which specializes in:
// - File operations (move, copy, rename, delete)
// - Execute commands and scripts
// - Perform system operations
//
// ## Capabilities
//
// - File operations
// - Command execution
// - System operations
// - Batch processing
//
// ## Usage
//
// ```rust
// use rainy_cowork_lib::agents::{ExecutorAgent, AgentConfig, AgentRegistry};
//
// let config = AgentConfig {
//     agent_id: "executor-1".to_string(),
//     workspace_id: "workspace-1".to_string(),
//     ai_provider: "gemini".to_string(),
//     model: "gemini-2.0-flash".to_string(),
//     settings: serde_json::json!({}),
// };
//
// let registry = Arc::new(AgentRegistry::new());
// let agent = ExecutorAgent::new(config, registry);
// ```

use std::sync::Arc;
use crate::agents::{
    Agent, AgentConfig, AgentError, AgentInfo, AgentMessage,
    AgentStatus, AgentType, Task, TaskResult,
    BaseAgent, AgentRegistry
};

/// ExecutorAgent specializes in executing operations and tasks
///
/// This agent handles:
/// - File system operations (move, copy, rename, delete)
/// - Command and script execution
/// - System-level operations
/// - Batch processing of multiple operations
pub struct ExecutorAgent {
    /// Base agent providing common functionality
    base: BaseAgent,
    /// Agent registry for accessing other agents and services
    registry: Arc<AgentRegistry>,
}

impl ExecutorAgent {
    /// Create a new ExecutorAgent
    ///
    /// # Arguments
    ///
    /// * `config` - Agent configuration
    /// * `registry` - Agent registry for accessing services
    ///
    /// # Returns
    ///
    /// A new ExecutorAgent instance
    pub fn new(
        config: AgentConfig,
        registry: Arc<AgentRegistry>,
    ) -> Self {
        let ai_provider = registry.ai_provider();
        let message_bus = registry.message_bus();
        let base = BaseAgent::new(config, ai_provider, message_bus);

        Self { base, registry }
    }

    /// Execute a file operation
    ///
    /// # Arguments
    ///
    /// * `operation` - Type of operation (move, copy, rename, delete)
    /// * `source` - Source file path
    /// * `destination` - Destination file path (for move, copy, rename)
    ///
    /// # Returns
    ///
    /// Result of the operation
    async fn execute_file_operation(
        &self,
        operation: &str,
        source: &str,
        destination: Option<&str>,
    ) -> Result<String, AgentError> {
        // TODO: Integrate with FileManager service
        // For now, use AI to simulate operation
        let prompt = if let Some(dest) = destination {
            format!(
                "Execute file operation: {} from '{}' to '{}'. \
                 Provide a detailed plan for this operation including safety checks.",
                operation, source, dest
            )
        } else {
            format!(
                "Execute file operation: {} on '{}'. \
                 Provide a detailed plan for this operation including safety checks.",
                operation, source
            )
        };

        let plan = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "File Operation: {}\n\
             Source: {}\n\
             Destination: {}\n\
             Plan:\n{}",
            operation,
            source,
            destination.unwrap_or("N/A"),
            plan
        ))
    }

    /// Execute a command or script
    ///
    /// # Arguments
    ///
    /// * `command` - Command to execute
    /// * `args` - Command arguments
    ///
    /// # Returns
    ///
    /// Result of command execution
    async fn execute_command(&self, command: &str, args: &[String]) -> Result<String, AgentError> {
        // TODO: Integrate with command execution service
        // For now, use AI to simulate execution
        let args_str = args.join(" ");
        let prompt = format!(
            "Execute command: {} {}\n\
             Analyze this command for safety and provide expected output. \
             Note: Actual command execution is pending integration.",
            command, args_str
        );

        let analysis = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Command Execution\n\
             Command: {}\n\
             Arguments: {}\n\
             Analysis:\n{}",
            command, args_str, analysis
        ))
    }

    /// Perform batch operations
    ///
    /// # Arguments
    ///
    /// * `operations` - List of operations to perform
    ///
    /// # Returns
    ///
    /// Results of batch operations
    async fn execute_batch(&self, operations: &[String]) -> Result<String, AgentError> {
        let operations_text = operations
            .iter()
            .enumerate()
            .map(|(i, op)| format!("{}. {}", i + 1, op))
            .collect::<Vec<_>>()
            .join("\n");

        let prompt = format!(
            "Execute the following batch operations:\n\n{}\n\n\
             Provide a detailed execution plan and expected results.",
            operations_text
        );

        let plan = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Batch Operations\n\
             Operations:\n{}\n\n\
             Execution Plan:\n{}",
            operations_text, plan
        ))
    }

    /// Perform system operation
    ///
    /// # Arguments
    ///
    /// * `operation` - System operation to perform
    ///
    /// # Returns
    ///
    /// Result of system operation
    async fn execute_system_operation(&self, operation: &str) -> Result<String, AgentError> {
        let prompt = format!(
            "Execute system operation: {}\n\
             Analyze this operation for safety and provide expected results. \
             Note: Actual system operation execution is pending integration.",
            operation
        );

        let analysis = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "System Operation: {}\n\
             Analysis:\n{}",
            operation, analysis
        ))
    }
}

#[async_trait::async_trait]
impl Agent for ExecutorAgent {
    fn info(&self) -> AgentInfo {
        AgentInfo {
            id: self.base.info().id,
            name: "Executor".to_string(),
            agent_type: AgentType::Executor,
            status: self.base.info().status,
            current_task: self.base.info().current_task,
        }
    }

    async fn process_task(&self, task: Task) -> Result<TaskResult, AgentError> {
        self.base.update_status(AgentStatus::Busy).await;
        self.base.set_current_task(Some(task.id.clone())).await;

        let result = if task.description.contains("move") ||
                       task.description.contains("copy") ||
                       task.description.contains("rename") ||
                       task.description.contains("delete") {
            // File operation
            let operation = if task.description.contains("move") {
                "move"
            } else if task.description.contains("copy") {
                "copy"
            } else if task.description.contains("rename") {
                "rename"
            } else {
                "delete"
            };

            let default_source = "unknown".to_string();
            let source = task.context.relevant_files
                .first()
                .unwrap_or(&default_source);
            let destination = task.context.relevant_files.get(1);

            self.execute_file_operation(operation, source, destination.map(|s| s.as_str())).await?
        } else if task.description.contains("execute") ||
                   task.description.contains("run") ||
                   task.description.contains("command") {
            // Command execution
            let parts: Vec<&str> = task.description.split_whitespace().collect();
            let command = parts.get(1).unwrap_or(&"");
            let args: Vec<String> = parts[2..].iter().map(|s| s.to_string()).collect();

            self.execute_command(command, &args).await?
        } else if task.description.contains("batch") {
            // Batch operations
            let operations: Vec<String> = task.context.relevant_files
                .iter()
                .cloned()
                .collect();
            self.execute_batch(&operations).await?
        } else if task.description.contains("system") {
            // System operation
            self.execute_system_operation(&task.description).await?
        } else {
            // Use AI to process general execution task
            let prompt = format!(
                "Execution Task: {}\n\nContext: {}\n\n\
                 Please complete this execution task and provide detailed results.",
                task.description,
                task.context.user_instruction
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
                "agent_type": "Executor",
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
            "file_operations".to_string(),
            "command_execution".to_string(),
            "system_operations".to_string(),
            "batch_processing".to_string(),
        ]
    }

    fn can_handle(&self, task: &Task) -> bool {
        let desc = task.description.to_lowercase();
        desc.contains("move") ||
        desc.contains("copy") ||
        desc.contains("rename") ||
        desc.contains("delete") ||
        desc.contains("execute") ||
        desc.contains("run") ||
        desc.contains("command") ||
        desc.contains("batch") ||
        desc.contains("system")
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
    async fn test_executor_agent_creation() {
        let config = AgentConfig {
            agent_id: "executor-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = ExecutorAgent::new(config, registry);
        assert_eq!(agent.info().name, "Executor");
        assert_eq!(agent.info().agent_type, AgentType::Executor);
    }

    #[tokio::test]
    async fn test_executor_capabilities() {
        let config = AgentConfig {
            agent_id: "executor-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = ExecutorAgent::new(config, registry);
        let capabilities = agent.capabilities();

        assert!(capabilities.contains(&"file_operations".to_string()));
        assert!(capabilities.contains(&"command_execution".to_string()));
        assert!(capabilities.contains(&"system_operations".to_string()));
        assert!(capabilities.contains(&"batch_processing".to_string()));
    }

    #[tokio::test]
    async fn test_executor_can_handle() {
        let config = AgentConfig {
            agent_id: "executor-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = ExecutorAgent::new(config, registry);

        let move_task = Task {
            id: "task-1".to_string(),
            description: "Move file from A to B".to_string(),
            priority: crate::agents::types::TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "ws-1".to_string(),
                user_instruction: "Move file".to_string(),
                relevant_files: vec!["/path/to/source".to_string()],
                memory_context: vec![],
            },
        };

        assert!(agent.can_handle(&move_task));

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
