// Creator Agent Module
//
// This module implements the CreatorAgent, which specializes in:
// - Document generation
// - Content creation
// - Report writing
//
// ## Capabilities
//
// - Document generation
// - Content creation
// - Template-based writing
// - Report generation
//
// ## Usage
//
// ```rust
// use rainy_cowork_lib::agents::{CreatorAgent, AgentConfig, AgentRegistry};
//
// let config = AgentConfig {
//     agent_id: "creator-1".to_string(),
//     workspace_id: "workspace-1".to_string(),
//     ai_provider: "gemini".to_string(),
//     model: "gemini-2.0-flash".to_string(),
//     settings: serde_json::json!({}),
// };
//
// let registry = Arc::new(AgentRegistry::new());
// let agent = CreatorAgent::new(config, registry);
// ```

use std::sync::Arc;
use crate::agents::{
    Agent, AgentConfig, AgentError, AgentInfo, AgentMessage,
    AgentStatus, AgentType, Task, TaskResult,
    BaseAgent, AgentRegistry
};

/// CreatorAgent specializes in content creation and document generation
///
/// This agent handles:
/// - Document generation from templates or scratch
/// - Content creation (articles, blog posts, documentation)
/// - Report writing and formatting
/// - Template-based content generation
pub struct CreatorAgent {
    /// Base agent providing common functionality
    base: BaseAgent,
    /// Agent registry for accessing other agents and services
    registry: Arc<AgentRegistry>,
}

impl CreatorAgent {
    /// Create a new CreatorAgent
    ///
    /// # Arguments
    ///
    /// * `config` - Agent configuration
    /// * `registry` - Agent registry for accessing services
    ///
    /// # Returns
    ///
    /// A new CreatorAgent instance
    pub fn new(
        config: AgentConfig,
        registry: Arc<AgentRegistry>,
    ) -> Self {
        let ai_provider = registry.ai_provider();
        let message_bus = registry.message_bus();
        let base = BaseAgent::new(config, ai_provider, message_bus);

        Self { base, registry }
    }

    /// Generate a document based on specifications
    ///
    /// # Arguments
    ///
    /// * `title` - Document title
    /// * `content_type` - Type of document (report, article, documentation, etc.)
    /// * `content` - Content requirements and specifications
    ///
    /// # Returns
    ///
    /// Generated document content
    async fn generate_document(
        &self,
        title: &str,
        content_type: &str,
        content: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Generate a {} with the title: '{}'\n\n\
             Requirements: {}\n\n\
             Create a well-structured, professional document with proper formatting.",
            content_type, title, content
        );

        let document = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Document: {}\n\
             Type: {}\n\n\
             {}",
            title, content_type, document
        ))
    }

    /// Create content based on specifications
    ///
    /// # Arguments
    ///
    /// * `content_type` - Type of content (article, blog post, etc.)
    /// * `topic` - Topic or subject
    /// * `requirements` - Specific requirements for the content
    ///
    /// # Returns
    ///
    /// Generated content
    async fn create_content(
        &self,
        content_type: &str,
        topic: &str,
        requirements: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Create a {} about: '{}'\n\n\
             Requirements: {}\n\n\
             Make it engaging, informative, and well-structured.",
            content_type, topic, requirements
        );

        let content = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Content Type: {}\n\
             Topic: {}\n\n\
             {}",
            content_type, topic, content
        ))
    }

    /// Generate a report based on data and findings
    ///
    /// # Arguments
    ///
    /// * `report_type` - Type of report (analysis, summary, etc.)
    /// * `data` - Data to include in the report
    /// * `findings` - Key findings to highlight
    ///
    /// # Returns
    ///
    /// Generated report
    async fn generate_report(
        &self,
        report_type: &str,
        data: &str,
        findings: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Generate a {} report based on the following:\n\n\
             Data:\n{}\n\n\
             Key Findings:\n{}\n\n\
             Create a professional report with executive summary, analysis, and recommendations.",
            report_type, data, findings
        );

        let report = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Report Type: {}\n\n\
             {}",
            report_type, report
        ))
    }

    /// Generate content from a template
    ///
    /// # Arguments
    ///
    /// * `template` - Template structure
    /// * `variables` - Variables to fill in the template
    ///
    /// # Returns
    ///
    /// Generated content from template
    async fn generate_from_template(
        &self,
        template: &str,
        variables: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Generate content using the following template:\n\n\
             Template:\n{}\n\n\
             Variables:\n{}\n\n\
             Fill in the template with the provided variables and create complete content.",
            template, variables
        );

        let content = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Template-Based Content\n\n\
             {}",
            content
        ))
    }
}

#[async_trait::async_trait]
impl Agent for CreatorAgent {
    fn info(&self) -> AgentInfo {
        AgentInfo {
            id: self.base.info().id,
            name: "Creator".to_string(),
            agent_type: AgentType::Creator,
            status: self.base.info().status,
            current_task: self.base.info().current_task,
        }
    }

    async fn process_task(&self, task: Task) -> Result<TaskResult, AgentError> {
        self.base.update_status(AgentStatus::Busy).await;
        self.base.set_current_task(Some(task.id.clone())).await;

        let result = if task.description.contains("document") {
            // Document generation
            let title = task.context.relevant_files
                .first()
                .unwrap_or(&"Untitled".to_string());
            let content_type = if task.description.contains("report") {
                "report"
            } else if task.description.contains("documentation") {
                "documentation"
            } else {
                "document"
            };

            self.generate_document(
                title,
                content_type,
                &task.context.user_instruction,
            ).await?
        } else if task.description.contains("create") ||
                   task.description.contains("write") {
            // Content creation
            let content_type = if task.description.contains("article") {
                "article"
            } else if task.description.contains("blog") {
                "blog post"
            } else if task.description.contains("post") {
                "social media post"
            } else {
                "content"
            };

            let topic = task.context.relevant_files
                .first()
                .unwrap_or(&"General topic".to_string());

            self.create_content(
                content_type,
                topic,
                &task.context.user_instruction,
            ).await?
        } else if task.description.contains("report") {
            // Report generation
            let report_type = if task.description.contains("analysis") {
                "analysis"
            } else if task.description.contains("summary") {
                "summary"
            } else {
                "general"
            };

            let data = task.context.relevant_files
                .first()
                .unwrap_or(&"No data provided".to_string());

            let findings = task.context.memory_context
                .first()
                .map(|m| m.content.as_str())
                .unwrap_or("No findings provided");

            self.generate_report(
                report_type,
                data,
                findings,
            ).await?
        } else if task.description.contains("template") {
            // Template-based generation
            let template = task.context.relevant_files
                .first()
                .unwrap_or(&"No template provided".to_string());

            self.generate_from_template(
                template,
                &task.context.user_instruction,
            ).await?
        } else {
            // Use AI to process general creation task
            let prompt = format!(
                "Creation Task: {}\n\nContext: {}\n\n\
                 Please complete this creation task and provide high-quality content.",
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
                "agent_type": "Creator",
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
            "document_generation".to_string(),
            "content_creation".to_string(),
            "template_based_writing".to_string(),
            "report_generation".to_string(),
        ]
    }

    fn can_handle(&self, task: &Task) -> bool {
        let desc = task.description.to_lowercase();
        desc.contains("create") ||
        desc.contains("write") ||
        desc.contains("generate") ||
        desc.contains("document") ||
        desc.contains("report") ||
        desc.contains("article") ||
        desc.contains("blog") ||
        desc.contains("template")
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
    async fn test_creator_agent_creation() {
        let config = AgentConfig {
            agent_id: "creator-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = CreatorAgent::new(config, registry);
        assert_eq!(agent.info().name, "Creator");
        assert_eq!(agent.info().agent_type, AgentType::Creator);
    }

    #[tokio::test]
    async fn test_creator_capabilities() {
        let config = AgentConfig {
            agent_id: "creator-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = CreatorAgent::new(config, registry);
        let capabilities = agent.capabilities();

        assert!(capabilities.contains(&"document_generation".to_string()));
        assert!(capabilities.contains(&"content_creation".to_string()));
        assert!(capabilities.contains(&"template_based_writing".to_string()));
        assert!(capabilities.contains(&"report_generation".to_string()));
    }

    #[tokio::test]
    async fn test_creator_can_handle() {
        let config = AgentConfig {
            agent_id: "creator-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = CreatorAgent::new(config, registry);

        let create_task = Task {
            id: "task-1".to_string(),
            description: "Create a blog post about AI".to_string(),
            priority: crate::agents::types::TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "ws-1".to_string(),
                user_instruction: "Write about AI".to_string(),
                relevant_files: vec!["Artificial Intelligence".to_string()],
                memory_context: vec![],
            },
        };

        assert!(agent.can_handle(&create_task));

        let execute_task = Task {
            id: "task-2".to_string(),
            description: "Execute command".to_string(),
            priority: crate::agents::types::TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "ws-1".to_string(),
                user_instruction: "Execute".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };

        assert!(!agent.can_handle(&execute_task));
    }
}
