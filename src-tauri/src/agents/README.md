# Agents Module

This module implements the multi-agent system for Rainy MaTE, providing the foundational infrastructure for agent-based task orchestration and execution.

## Overview

The agents module provides:

- **Agent Trait**: Core interface that all agents must implement
- **BaseAgent**: Common implementation providing shared functionality
- **DirectorAgent**: Orchestrator for coordinating multiple specialized agents
- **MessageBus**: Inter-agent communication infrastructure
- **AgentRegistry**: Centralized agent management and task assignment
- **StatusMonitor**: Real-time agent status tracking
- **TaskManager**: Task assignment and lifecycle management

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AgentRegistry                           │
│  - Registers and manages all agents                         │
│  - Assigns tasks to appropriate agents                      │
│  - Coordinates agent communication                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DirectorAgent                           │
│  - Decomposes complex tasks into subtasks                  │
│  - Assigns subtasks to specialized agents                   │
│  - Coordinates parallel execution                          │
│  - Aggregates results from multiple agents                  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Researcher    │ │    Executor     │ │     Creator     │
│  - Research     │ │  - Execute      │ │  - Create       │
│  - Gather info  │ │  - Operations   │ │  - Content      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      MessageBus                              │
│  - Routes messages between agents                           │
│  - Handles asynchronous communication                       │
└─────────────────────────────────────────────────────────────┘
```

## Agent Types

| Agent Type | Responsibility | Capabilities |
|------------|----------------|--------------|
| **Director** | Orchestrates and coordinates all other agents | Task decomposition, agent assignment, parallel coordination, result aggregation |
| **Researcher** | Conducts research and gathers information | Web research, data collection, information synthesis |
| **Executor** | Executes tasks and operations | File operations, system commands, task execution |
| **Creator** | Creates content and artifacts | Document generation, content creation, artifact production |
| **Designer** | Designs UI/UX and visual elements | UI design, visual styling, layout planning |
| **Developer** | Writes and maintains code | Code generation, refactoring, debugging |
| **Analyst** | Analyzes data and provides insights | Data analysis, pattern recognition, reporting |
| **Critic** | Evaluates quality and provides feedback | Quality assessment, review, recommendations |
| **Governor** | Enforces security and compliance policies | Security checks, compliance validation, policy enforcement |

## Usage

### Creating a DirectorAgent

```rust
use rainy_cowork_lib::agents::{DirectorAgent, AgentConfig, AgentRegistry};
use std::sync::Arc;

// Create registry
let ai_provider = Arc::new(AIProviderManager::new());
let registry = Arc::new(AgentRegistry::new(ai_provider));

// Create director
let config = AgentConfig {
    agent_id: "director-1".to_string(),
    workspace_id: "workspace-1".to_string(),
    ai_provider: "gemini".to_string(),
    model: "gemini-2.0-flash".to_string(),
    settings: serde_json::json!({}),
};

let director = DirectorAgent::new(config, registry);
```

### Processing a Task

```rust
use rainy_cowork_lib::agents::{Task, TaskContext, TaskPriority};

let task = Task {
    id: "task-1".to_string(),
    description: "Research and create a comprehensive report on AI trends".to_string(),
    priority: TaskPriority::High,
    dependencies: vec![],
    context: TaskContext {
        workspace_id: "workspace-1".to_string(),
        user_instruction: "Create a report".to_string(),
        relevant_files: vec![],
        memory_context: vec![],
    },
};

let result = director.process_task(task).await?;
println!("Result: {}", result.output);
```

### Registering Specialized Agents

```rust
use rainy_cowork_lib::agents::{BaseAgent, AgentType};

// Create and register a researcher agent
let researcher_config = AgentConfig {
    agent_id: "researcher-1".to_string(),
    workspace_id: "workspace-1".to_string(),
    ai_provider: "gemini".to_string(),
    model: "gemini-2.0-flash".to_string(),
    settings: serde_json::json!({}),
};

let message_bus = registry.message_bus();
let researcher = Arc::new(BaseAgent::new(
    researcher_config.clone(),
    registry.ai_provider(),
    message_bus,
));

registry.register_agent(researcher, researcher_config).await?;
```

## DirectorAgent Workflow

The DirectorAgent follows a four-step workflow:

1. **Task Decomposition**
   - Analyzes the user's task using AI
   - Breaks down complex tasks into subtasks
   - Identifies dependencies between subtasks
   - Determines which agent types should handle each subtask

2. **Agent Assignment**
   - Finds available agents of the required types
   - Assigns subtasks to appropriate agents
   - Handles agent availability and load balancing

3. **Parallel Coordination**
   - Executes subtasks in parallel when possible
   - Respects dependencies between subtasks
   - Monitors progress and handles failures
   - Implements retry logic for failed tasks

4. **Result Aggregation**
   - Collects results from all completed subtasks
   - Uses AI to combine results into a cohesive output
   - Handles partial failures gracefully
   - Provides a unified response to the user

## Data Structures

### SubTask

Represents a decomposed subtask:

```rust
pub struct SubTask {
    pub id: String,              // Unique identifier
    pub description: String,      // What to do
    pub agent_type: String,      // Which agent should handle
    pub dependencies: Vec<String>, // Subtask IDs this depends on
    pub priority: TaskPriority,   // Priority level
}
```

### TaskAssignment

Represents assignment of a subtask to an agent:

```rust
pub struct TaskAssignment {
    pub subtask_id: String,      // ID of the subtask
    pub agent_id: String,        // ID of assigned agent
    pub status: AssignmentStatus, // Current status
    pub dependencies: Vec<String>, // Dependencies
}
```

### AssignmentStatus

Status of a task assignment:

- `Pending`: Task is waiting to be executed
- `InProgress`: Task is currently being executed
- `Completed`: Task completed successfully
- `Failed`: Task failed

## Error Handling

All agent operations return `Result<T, AgentError>`, where `AgentError` includes:

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

## Concurrency and Thread Safety

The agent system is designed for concurrent execution:

- All agents implement `Send + Sync`
- Uses `Arc` for shared ownership across threads
- Uses `RwLock` for thread-safe state management
- Uses `tokio::spawn` for parallel task execution
- Message bus provides asynchronous communication

## Testing

The module includes comprehensive unit tests:

```bash
# Run all agent tests
cargo test --package rainy-cowork-lib --lib agents

# Run specific test
cargo test --package rainy-cowork-lib --lib agents::director_agent::tests::test_director_agent_creation
```

## Performance Considerations

- **Parallel Execution**: Subtasks are executed in parallel when dependencies allow
- **Async/Await**: All operations use async/await for non-blocking execution
- **Efficient Communication**: Message bus uses channels for efficient inter-agent communication
- **Lazy Evaluation**: Results are only computed when needed
- **Resource Management**: Proper cleanup of resources on shutdown

## Future Enhancements

Planned improvements:

- [ ] Implement proper result retrieval via message bus events
- [ ] Add task retry logic with exponential backoff
- [ ] Implement task priority queue
- [ ] Add agent load balancing strategies
- [ ] Implement task cancellation and rollback
- [ ] Add comprehensive logging and monitoring
- [ ] Implement agent health checks
- [ ] Add support for agent pools and scaling

## Module Structure

```
src-tauri/src/agents/
├── mod.rs                    # Module exports
├── agent_trait.rs            # Agent trait and error types
├── base_agent.rs             # Base agent implementation
├── director_agent.rs         # Director agent implementation
├── message_bus.rs            # Inter-agent communication
├── registry.rs               # Agent registry and management
├── status_monitoring.rs      # Agent status tracking
├── task_management.rs        # Task assignment and lifecycle
├── types.rs                  # Core data structures
└── README.md                 # This file
```

## Contributing

When adding new agent types:

1. Create a new module file (e.g., `researcher_agent.rs`)
2. Implement the `Agent` trait
3. Add comprehensive unit tests
4. Update this README with agent details
5. Export the agent in `mod.rs`
6. Register the agent type in `types.rs`

## License

This module is part of the Rainy MaTE project and follows the same license terms.
