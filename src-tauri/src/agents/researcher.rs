// Researcher Agent Module
//
// This module implements the ResearcherAgent, which specializes in:
// - Web search and information gathering
// - File analysis and data extraction
// - Research and documentation
//
// ## Capabilities
//
// - Web search
// - File content analysis
// - Data extraction
// - Research synthesis
//
// ## Usage
//
// ```rust
// use rainy_cowork_lib::agents::{ResearcherAgent, AgentConfig, AgentRegistry};
//
// let config = AgentConfig {
//     agent_id: "researcher-1".to_string(),
//     workspace_id: "workspace-1".to_string(),
//     ai_provider: "gemini".to_string(),
//     model: "gemini-2.0-flash".to_string(),
//     settings: serde_json::json!({}),
// };
//
// let registry = Arc::new(AgentRegistry::new());
// let agent = ResearcherAgent::new(config, registry);
// ```

use std::sync::Arc;
use crate::agents::{
    Agent, AgentConfig, AgentError, AgentInfo, AgentMessage,
    AgentStatus, AgentType, Task, TaskResult,
    BaseAgent, AgentRegistry
};

/// ResearcherAgent specializes in research and information gathering
///
/// This agent handles:
/// - Web search operations
/// - File content analysis
/// - Data extraction from various sources
/// - Research synthesis and documentation
pub struct ResearcherAgent {
    /// Base agent providing common functionality
    base: BaseAgent,
    /// Agent registry for accessing other agents and services
    registry: Arc<AgentRegistry>,
}

impl ResearcherAgent {
    /// Create a new ResearcherAgent
    ///
    /// # Arguments
    ///
    /// * `config` - Agent configuration
    /// * `registry` - Agent registry for accessing services
    ///
    /// # Returns
    ///
    /// A new ResearcherAgent instance
    pub fn new(
        config: AgentConfig,
        registry: Arc<AgentRegistry>,
    ) -> Self {
        let ai_provider = registry.ai_provider();
        let message_bus = registry.message_bus();
        let base = BaseAgent::new(config, ai_provider, message_bus);

        Self { base, registry }
    }

    /// Perform web search for information
    ///
    /// # Arguments
    ///
    /// * `query` - Search query string
    ///
    /// # Returns
    ///
    /// Search results as a formatted string
    async fn perform_web_search(&self, query: &str) -> Result<String, AgentError> {
        // Use AI to generate optimized search query
        let prompt = format!(
            "Generate an optimized web search query for: {}. \
             Return only the search query, no additional text.",
            query
        );
        let search_query = self.base.query_ai(&prompt).await?;

        // TODO: Integrate with web research service
        // For now, return a placeholder response
        let result = format!(
            "Web search performed for: '{}'\n\
             Optimized query: '{}'\n\
             Results: [Integration with web research service pending]",
            query, search_query.trim()
        );

        Ok(result)
    }

    /// Analyze file content and extract information
    ///
    /// # Arguments
    ///
    /// * `file_path` - Path to the file to analyze
    ///
    /// # Returns
    ///
    /// Analysis results as a formatted string
    async fn analyze_file(&self, file_path: &str) -> Result<String, AgentError> {
        // TODO: Use FileManager service to read file content
        // For now, use AI to simulate analysis
        let prompt = format!(
            "Analyze the file at path: {}. \
             Provide insights about its content, structure, and key information. \
             Since I cannot access the file directly, provide a template of what \
             analysis would include.",
            file_path
        );

        let analysis = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "File Analysis: {}\n\
             Path: {}\n\
             Analysis:\n{}",
            file_path, file_path, analysis
        ))
    }

    /// Extract data from provided content
    ///
    /// # Arguments
    ///
    /// * `content` - Content to extract data from
    /// * `extraction_type` - Type of data to extract
    ///
    /// # Returns
    ///
    /// Extracted data as a formatted string
    async fn extract_data(&self, content: &str, extraction_type: &str) -> Result<String, AgentError> {
        let prompt = format!(
            "Extract {} from the following content:\n\n{}\n\n\
             Provide the extracted data in a structured format.",
            extraction_type, content
        );

        let extracted = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Data Extraction ({})\n\
             Extracted Data:\n{}",
            extraction_type, extracted
        ))
    }

    /// Synthesize research findings into a coherent report
    ///
    /// # Arguments
    ///
    /// * `findings` - Collection of research findings
    ///
    /// # Returns
    ///
    /// Synthesized research report
    async fn synthesize_research(&self, findings: &[String]) -> Result<String, AgentError> {
        let findings_text = findings.join("\n\n");

        let prompt = format!(
            "Synthesize the following research findings into a coherent report:\n\n{}\n\n\
             The report should be well-structured, highlight key insights, \
             and provide actionable conclusions.",
            findings_text
        );

        let synthesis = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Research Synthesis Report\n\
             =========================\n\n{}",
            synthesis
        ))
    }
}

#[async_trait::async_trait]
impl Agent for ResearcherAgent {
    fn info(&self) -> AgentInfo {
        AgentInfo {
            id: self.base.info().id,
            name: "Researcher".to_string(),
            agent_type: AgentType::Researcher,
            status: self.base.info().status,
            current_task: self.base.info().current_task,
        }
    }

    async fn process_task(&self, task: Task) -> Result<TaskResult, AgentError> {
        self.base.update_status(AgentStatus::Busy).await;
        self.base.set_current_task(Some(task.id.clone())).await;

        let result = if task.description.contains("search") {
            self.perform_web_search(&task.description).await?
        } else if task.description.contains("analyze") {
            let file_path = task.context.relevant_files
                .first()
                .cloned()
                .unwrap_or_else(|| "unknown".to_string());
            self.analyze_file(&file_path).await?
        } else if task.description.contains("extract") {
            // Extract data from context
            let content = &task.context.user_instruction;
            self.extract_data(content, "key information").await?
        } else if task.description.contains("synthesize") {
            // Synthesize from memory context
            let findings: Vec<String> = task.context.memory_context
                .iter()
                .map(|m| m.content.clone())
                .collect();
            self.synthesize_research(&findings).await?
        } else {
            // Use AI to process general research task
            let prompt = format!(
                "Research Task: {}\n\nContext: {}\n\n\
                 Please complete this research task and provide comprehensive findings.",
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
                "agent_type": "Researcher",
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
            AgentMessage::QueryMemory { query } => {
                // Handle memory queries
                let prompt = format!(
                    "Search memory for: {}\n\
                     Provide relevant research findings.",
                    query
                );
                let _ = self.base.query_ai(&prompt).await?;
            }
            _ => {}
        }
        Ok(())
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "web_search".to_string(),
            "file_analysis".to_string(),
            "data_extraction".to_string(),
            "research_synthesis".to_string(),
        ]
    }

    fn can_handle(&self, task: &Task) -> bool {
        let desc = task.description.to_lowercase();
        desc.contains("search") ||
        desc.contains("research") ||
        desc.contains("analyze") ||
        desc.contains("find") ||
        desc.contains("extract") ||
        desc.contains("investigate")
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
    async fn test_researcher_agent_creation() {
        let config = AgentConfig {
            agent_id: "researcher-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = ResearcherAgent::new(config, registry);
        assert_eq!(agent.info().name, "Researcher");
        assert_eq!(agent.info().agent_type, AgentType::Researcher);
    }

    #[tokio::test]
    async fn test_researcher_capabilities() {
        let config = AgentConfig {
            agent_id: "researcher-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = ResearcherAgent::new(config, registry);
        let capabilities = agent.capabilities();

        assert!(capabilities.contains(&"web_search".to_string()));
        assert!(capabilities.contains(&"file_analysis".to_string()));
        assert!(capabilities.contains(&"data_extraction".to_string()));
        assert!(capabilities.contains(&"research_synthesis".to_string()));
    }

    #[tokio::test]
    async fn test_researcher_can_handle() {
        let config = AgentConfig {
            agent_id: "researcher-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = ResearcherAgent::new(config, registry);

        let search_task = Task {
            id: "task-1".to_string(),
            description: "Search for information about Rust".to_string(),
            priority: crate::agents::types::TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "ws-1".to_string(),
                user_instruction: "Find Rust documentation".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };

        assert!(agent.can_handle(&search_task));

        let code_task = Task {
            id: "task-2".to_string(),
            description: "Write a function".to_string(),
            priority: crate::agents::types::TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "ws-1".to_string(),
                user_instruction: "Write code".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };

        assert!(!agent.can_handle(&code_task));
    }
}
