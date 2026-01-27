# Specialized Agents Documentation

This document provides comprehensive documentation for all specialized agents in the Rainy MaTE multi-agent system.

## Table of Contents

- [ResearcherAgent](#researcheragent)
- [ExecutorAgent](#executoragent)
- [CreatorAgent](#creatoragent)
- [DesignerAgent](#designeragent)
- [DeveloperAgent](#developeragent)
- [AnalystAgent](#analystagent)

---

## ResearcherAgent

### Overview

The ResearcherAgent specializes in research and information gathering tasks. It is designed to handle web searches, file analysis, data extraction, and research synthesis.

### Responsibilities

- Web search and information gathering
- File analysis and data extraction
- Research and documentation
- Research synthesis from multiple sources

### Capabilities

- `web_search`: Perform web searches and gather information
- `file_analysis`: Analyze file content and extract information
- `data_extraction`: Extract structured data from unstructured content
- `research_synthesis`: Synthesize findings from multiple sources into coherent reports

### Usage Example

```rust
use rainy_cowork_lib::agents::{ResearcherAgent, AgentConfig, AgentRegistry};

let config = AgentConfig {
    agent_id: "researcher-1".to_string(),
    workspace_id: "workspace-1".to_string(),
    ai_provider: "gemini".to_string(),
    model: "gemini-2.0-flash".to_string(),
    settings: serde_json::json!({}),
};

let registry = Arc::new(AgentRegistry::new(ai_provider));
let agent = ResearcherAgent::new(config, registry);

// Process a research task
let task = Task {
    id: "task-1".to_string(),
    description: "Search for information about Rust programming".to_string(),
    priority: TaskPriority::Medium,
    dependencies: vec![],
    context: TaskContext {
        workspace_id: "workspace-1".to_string(),
        user_instruction: "Find comprehensive information".to_string(),
        relevant_files: vec![],
        memory_context: vec![],
    },
};

let result = agent.process_task(task).await?;
```

### Task Handling

The ResearcherAgent can handle tasks containing:
- "search"
- "research"
- "analyze"
- "find"
- "extract"
- "investigate"

### Implementation Details

The ResearcherAgent wraps a BaseAgent and implements the Agent trait. It uses the AI provider to:
1. Generate optimized search queries
2. Analyze file content (pending FileManager integration)
3. Extract structured data from content
4. Synthesize research findings into coherent reports

### Future Enhancements

- Integrate with web research service for actual web searches
- Integrate with FileManager for file content reading
- Add support for multiple search engines
- Implement caching for research results

---

## ExecutorAgent

### Overview

The ExecutorAgent specializes in executing operations and tasks. It handles file operations, command execution, and system-level operations.

### Responsibilities

- File operations (move, copy, rename, delete)
- Execute commands and scripts
- Perform system operations
- Batch processing of multiple operations

### Capabilities

- `file_operations`: Perform file system operations
- `command_execution`: Execute shell commands and scripts
- `system_operations`: Perform system-level operations
- `batch_processing`: Execute multiple operations in sequence

### Usage Example

```rust
use rainy_cowork_lib::agents::{ExecutorAgent, AgentConfig, AgentRegistry};

let config = AgentConfig {
    agent_id: "executor-1".to_string(),
    workspace_id: "workspace-1".to_string(),
    ai_provider: "gemini".to_string(),
    model: "gemini-2.0-flash".to_string(),
    settings: serde_json::json!({}),
};

let registry = Arc::new(AgentRegistry::new(ai_provider));
let agent = ExecutorAgent::new(config, registry);

// Process a file operation task
let task = Task {
    id: "task-1".to_string(),
    description: "Move file from /path/to/source to /path/to/destination".to_string(),
    priority: TaskPriority::Medium,
    dependencies: vec![],
    context: TaskContext {
        workspace_id: "workspace-1".to_string(),
        user_instruction: "Move file safely".to_string(),
        relevant_files: vec!["/path/to/source".to_string(), "/path/to/destination".to_string()],
        memory_context: vec![],
    },
};

let result = agent.process_task(task).await?;
```

### Task Handling

The ExecutorAgent can handle tasks containing:
- "move"
- "copy"
- "rename"
- "delete"
- "execute"
- "run"
- "command"
- "batch"
- "system"

### Implementation Details

The ExecutorAgent wraps a BaseAgent and implements the Agent trait. It uses the AI provider to:
1. Generate execution plans for file operations
2. Analyze commands for safety before execution
3. Create batch operation sequences
4. Provide detailed execution reports

### Future Enhancements

- Integrate with FileManager for actual file operations
- Integrate with command execution service
- Add support for parallel batch operations
- Implement operation rollback capabilities

---

## CreatorAgent

### Overview

The CreatorAgent specializes in content creation and document generation. It handles document generation, content creation, and report writing.

### Responsibilities

- Document generation
- Content creation (articles, blog posts, documentation)
- Report writing
- Template-based writing

### Capabilities

- `document_generation`: Generate documents from specifications
- `content_creation`: Create various types of content
- `template_based_writing`: Generate content from templates
- `report_generation`: Create structured reports

### Usage Example

```rust
use rainy_cowork_lib::agents::{CreatorAgent, AgentConfig, AgentRegistry};

let config = AgentConfig {
    agent_id: "creator-1".to_string(),
    workspace_id: "workspace-1".to_string(),
    ai_provider: "gemini".to_string(),
    model: "gemini-2.0-flash".to_string(),
    settings: serde_json::json!({}),
};

let registry = Arc::new(AgentRegistry::new(ai_provider));
let agent = CreatorAgent::new(config, registry);

// Process a content creation task
let task = Task {
    id: "task-1".to_string(),
    description: "Create a blog post about AI".to_string(),
    priority: TaskPriority::Medium,
    dependencies: vec![],
    context: TaskContext {
        workspace_id: "workspace-1".to_string(),
        user_instruction: "Write engaging content about AI".to_string(),
        relevant_files: vec!["Artificial Intelligence".to_string()],
        memory_context: vec![],
    },
};

let result = agent.process_task(task).await?;
```

### Task Handling

The CreatorAgent can handle tasks containing:
- "create"
- "write"
- "generate"
- "document"
- "report"
- "article"
- "blog"
- "template"

### Implementation Details

The CreatorAgent wraps a BaseAgent and implements the Agent trait. It uses the AI provider to:
1. Generate documents with proper structure
2. Create engaging content for various platforms
3. Fill templates with provided variables
4. Generate comprehensive reports with analysis

### Future Enhancements

- Add support for multiple document formats (Markdown, HTML, PDF)
- Integrate with template management system
- Add content versioning
- Implement style customization options

---

## DesignerAgent

### Overview

The DesignerAgent specializes in UI/UX design and visual elements. It handles UI mockups, diagrams, and design suggestions.

### Responsibilities

- UI mockups and wireframing
- Diagram creation (flowcharts, sequence diagrams, etc.)
- Visual formatting and styling
- Design suggestions and recommendations

### Capabilities

- `ui_mockup_generation`: Generate UI mockups and wireframes
- `diagram_creation`: Create various types of diagrams
- `visual_formatting`: Apply visual formatting to content
- `design_suggestions`: Provide design recommendations

### Usage Example

```rust
use rainy_cowork_lib::agents::{DesignerAgent, AgentConfig, AgentRegistry};

let config = AgentConfig {
    agent_id: "designer-1".to_string(),
    workspace_id: "workspace-1".to_string(),
    ai_provider: "gemini".to_string(),
    model: "gemini-2.0-flash".to_string(),
    settings: serde_json::json!({}),
};

let registry = Arc::new(AgentRegistry::new(ai_provider));
let agent = DesignerAgent::new(config, registry);

// Process a design task
let task = Task {
    id: "task-1".to_string(),
    description: "Create a mockup for login page".to_string(),
    priority: TaskPriority::Medium,
    dependencies: vec![],
    context: TaskContext {
        workspace_id: "workspace-1".to_string(),
        user_instruction: "Design modern login page".to_string(),
        relevant_files: vec!["login page".to_string()],
        memory_context: vec![],
    },
};

let result = agent.process_task(task).await?;
```

### Task Handling

The DesignerAgent can handle tasks containing:
- "mockup"
- "wireframe"
- "diagram"
- "flowchart"
- "design"
- "format"
- "style"
- "suggest"

### Implementation Details

The DesignerAgent wraps a BaseAgent and implements the Agent trait. It uses the AI provider to:
1. Generate detailed UI mockups with component hierarchy
2. Create various types of diagrams with proper notation
3. Apply visual formatting for readability
4. Provide design recommendations based on best practices

### Future Enhancements

- Integrate with design tool export (Figma, Sketch, etc.)
- Add support for interactive prototypes
- Implement design system generation
- Add accessibility compliance checking

---

## DeveloperAgent

### Overview

The DeveloperAgent specializes in code development and maintenance. It handles code generation, refactoring, debugging, and testing.

### Responsibilities

- Code writing and generation
- Code refactoring and optimization
- Debugging and error resolution
- Testing and test generation

### Capabilities

- `code_generation`: Generate code from specifications
- `code_refactoring`: Refactor and optimize existing code
- `debugging`: Debug code and identify issues
- `testing`: Generate tests for code

### Usage Example

```rust
use rainy_cowork_lib::agents::{DeveloperAgent, AgentConfig, AgentRegistry};

let config = AgentConfig {
    agent_id: "developer-1".to_string(),
    workspace_id: "workspace-1".to_string(),
    ai_provider: "gemini".to_string(),
    model: "gemini-2.0-flash".to_string(),
    settings: serde_json::json!({}),
};

let registry = Arc::new(AgentRegistry::new(ai_provider));
let agent = DeveloperAgent::new(config, registry);

// Process a code generation task
let task = Task {
    id: "task-1".to_string(),
    description: "Write a function to sort an array".to_string(),
    priority: TaskPriority::Medium,
    dependencies: vec![],
    context: TaskContext {
        workspace_id: "workspace-1".to_string(),
        user_instruction: "Implement efficient sorting".to_string(),
        relevant_files: vec!["Rust".to_string()],
        memory_context: vec![],
    },
};

let result = agent.process_task(task).await?;
```

### Task Handling

The DeveloperAgent can handle tasks containing:
- "code"
- "function"
- "class"
- "implement"
- "generate"
- "write"
- "refactor"
- "optimize"
- "improve"
- "debug"
- "fix"
- "error"
- "test"

### Implementation Details

The DeveloperAgent wraps a BaseAgent and implements the Agent trait. It uses the AI provider to:
1. Generate clean, well-documented code
2. Refactor code for performance and readability
3. Debug code and identify root causes
4. Generate comprehensive tests with edge cases

### Future Enhancements

- Add support for multiple programming languages
- Integrate with code analysis tools
- Implement automated code review
- Add support for test execution and reporting

---

## AnalystAgent

### Overview

The AnalystAgent specializes in data analysis and insights generation. It handles data analysis, visualization, and pattern recognition.

### Responsibilities

- Data analysis and processing
- Data visualization
- Insights generation
- Pattern recognition and trend analysis

### Capabilities

- `data_analysis`: Perform statistical and analytical analysis
- `visualization`: Generate visualization recommendations
- `insights_generation`: Generate actionable insights from data
- `pattern_recognition`: Identify patterns and trends in data

### Usage Example

```rust
use rainy_cowork_lib::agents::{AnalystAgent, AgentConfig, AgentRegistry};

let config = AgentConfig {
    agent_id: "analyst-1".to_string(),
    workspace_id: "workspace-1".to_string(),
    ai_provider: "gemini".to_string(),
    model: "gemini-2.0-flash".to_string(),
    settings: serde_json::json!({}),
};

let registry = Arc::new(AgentRegistry::new(ai_provider));
let agent = AnalystAgent::new(config, registry);

// Process an analysis task
let task = Task {
    id: "task-1".to_string(),
    description: "Analyze sales data".to_string(),
    priority: TaskPriority::Medium,
    dependencies: vec![],
    context: TaskContext {
        workspace_id: "workspace-1".to_string(),
        user_instruction: "Provide comprehensive analysis".to_string(),
        relevant_files: vec!["sales data".to_string()],
        memory_context: vec![],
    },
};

let result = agent.process_task(task).await?;
```

### Task Handling

The AnalystAgent can handle tasks containing:
- "analyze"
- "analysis"
- "data"
- "visualize"
- "chart"
- "graph"
- "insight"
- "pattern"
- "trend"
- "statistics"

### Implementation Details

The AnalystAgent wraps a BaseAgent and implements the Agent trait. It uses the AI provider to:
1. Perform statistical analysis on data
2. Generate visualization recommendations
3. Extract actionable insights from data
4. Identify patterns and trends

### Future Enhancements

- Integrate with data processing libraries
- Add support for real-time analysis
- Implement predictive analytics
- Add support for multiple visualization formats

---

## Common Patterns

All specialized agents follow these common patterns:

### Structure

1. Wrap a `BaseAgent` for common functionality
2. Implement the `Agent` trait
3. Use `AgentRegistry` for accessing services
4. Provide specialized methods for agent-specific capabilities

### Task Processing

1. Update status to `Busy` when starting a task
2. Set current task ID
3. Process task based on description keywords
4. Update status to `Idle` when complete
5. Clear current task ID
6. Return `TaskResult` with success/failure information

### Error Handling

All agents use the `AgentError` enum for consistent error reporting:
- `TaskExecutionFailed`: Task processing errors
- `MessageHandlingFailed`: Message processing errors
- `NotInitialized`: Agent used before initialization
- `AgentBusy`: Agent is currently busy
- `InvalidConfig`: Configuration errors
- `Io`: I/O operation errors
- `Serialization`: JSON serialization errors
- `AIProvider`: AI provider errors
- `Memory`: Memory operation errors
- `ApprovalDenied`: Approval required but not granted

### Testing

Each agent includes comprehensive unit tests:
- Agent creation tests
- Capability verification tests
- Task handling tests
- Integration tests with AgentRegistry

---

## Integration with DirectorAgent

The DirectorAgent orchestrates all specialized agents. It:
1. Analyzes task requirements
2. Determines which agent(s) can handle the task
3. Assigns tasks to appropriate agents
4. Monitors task execution
5. Collects and aggregates results

### Task Assignment Flow

```
User Request
    ↓
DirectorAgent Analysis
    ↓
Agent Selection (can_handle())
    ↓
Task Assignment (process_task())
    ↓
Result Collection
    ↓
Response to User
```

---

## Best Practices

When working with specialized agents:

1. **Use appropriate agent for the task**: Each agent has specific capabilities
2. **Provide clear task descriptions**: Include all relevant context and requirements
3. **Handle errors gracefully**: All agents return Result types for error handling
4. **Monitor agent status**: Use `get_agent_status` to track progress
5. **Leverage agent capabilities**: Use `get_agent_capabilities` to understand what each agent can do

---

## Future Roadmap

### Phase 3: Advanced Features
- Agent collaboration and delegation
- Multi-agent task coordination
- Agent memory and learning
- Performance optimization

### Phase 4: Integration
- Integration with external services
- Plugin system for custom agents
- Advanced analytics and monitoring

---

## Contributing

When adding new specialized agents:

1. Follow the established patterns in existing agents
2. Implement the `Agent` trait completely
3. Include comprehensive unit tests
4. Update this documentation
5. Register the agent in `commands/agents.rs`
6. Export the agent in `agents/mod.rs`

---

## License

Part of the Rainy MaTE project. See main LICENSE file for details.
