# Reflection & Governance System

## Overview

The Reflection & Governance system provides quality evaluation, security enforcement, and self-improvement capabilities for the multi-agent system. This is PHASE 2.4 of Rainy MaTE implementation.

## Components

### 1. CriticAgent

**Location:** `src-tauri/src/agents/critic.rs`

The CriticAgent evaluates task results for quality, accuracy, and coherence, providing actionable improvement suggestions.

**Capabilities:**
- Quality evaluation (0-100 score)
- Accuracy assessment
- Coherence checking
- Improvement suggestions

**Usage:**
```rust
use rainy_cowork_lib::agents::{CriticAgent, AgentConfig, AgentRegistry};

let config = AgentConfig {
    agent_id: "critic-1".to_string(),
    workspace_id: "workspace-1".to_string(),
    ai_provider: "gemini".to_string(),
    model: "gemini-2.0-flash".to_string(),
    settings: serde_json::json!({}),
};

let critic = CriticAgent::new(config, registry.clone());
let suggestions = critic.suggest_improvements(&task_result).await?;
let quality_score = critic.get_quality_score(&task_result).await?;
```

**Public Interface:**
- `new(config, registry)` - Create a new CriticAgent
- `suggest_improvements(result)` - Get improvement suggestions
- `get_quality_score(result)` - Get quality score (0-100)

### 2. GovernorAgent

**Location:** `src-tauri/src/agents/governor.rs`

The GovernorAgent enforces security policies, approves operations, and ensures compliance with safety guidelines.

**Capabilities:**
- Security policy enforcement
- Operation approval
- Compliance verification
- Dangerous operation blocking

**Usage:**
```rust
use rainy_cowork_lib::agents::{GovernorAgent, AgentConfig, AgentRegistry};

let config = AgentConfig {
    agent_id: "governor-1".to_string(),
    workspace_id: "workspace-1".to_string(),
    ai_provider: "gemini".to_string(),
    model: "gemini-2.0-flash".to_string(),
    settings: serde_json::json!({}),
};

let governor = GovernorAgent::new(config, registry.clone());

// Check if operation is allowed
let allowed = governor.check_operation("delete file.txt").await?;

// Request approval
let decision = governor.request_approval("exec system command").await?;

// Manage policies
governor.add_policy(SecurityPolicy {
    id: "no_network".to_string(),
    name: "Prevent network access".to_string(),
    description: "Block network operations".to_string(),
    enabled: true,
}).await;

let policies = governor.list_policies().await;
```

**Public Interface:**
- `new(config, registry)` - Create a new GovernorAgent
- `check_operation(operation)` - Check if operation is allowed
- `request_approval(operation)` - Request AI approval for operation
- `add_policy(policy)` - Add a security policy
- `remove_policy(policy_id)` - Remove a security policy
- `set_policy_enabled(policy_id, enabled)` - Enable/disable policy
- `list_policies()` - List all security policies

**Default Policies:**
- `no_file_deletion` - Blocks file deletion operations
- `no_system_commands` - Blocks system command execution

### 3. ReflectionEngine

**Location:** `src-tauri/src/services/reflection.rs`

The ReflectionEngine analyzes task results, learns from errors and successes, and provides optimization strategies for continuous system improvement.

**Capabilities:**
- Error pattern identification
- Success analysis
- Strategy generation
- Optimization reporting

**Usage:**
```rust
use rainy_cowork_lib::services::{ReflectionEngine, AIProviderManager};

let ai_provider = Arc::new(AIProviderManager::new());
let reflection = ReflectionEngine::new(ai_provider);

// Analyze task result
let reflection_result = reflection.analyze_result(&task, &result).await?;

// Get learned patterns
let error_patterns = reflection.get_error_patterns().await;
let strategies = reflection.get_strategies().await;

// Generate optimization report
let report = reflection.optimize().await?;

// Clear data
reflection.clear_error_patterns().await;
reflection.clear_strategies().await;
```

**Public Interface:**
- `new(ai_provider)` - Create a new ReflectionEngine
- `analyze_result(task, result)` - Analyze a task result
- `get_error_patterns()` - Get all error patterns
- `get_strategies()` - Get all strategies
- `optimize()` - Generate optimization report
- `clear_error_patterns()` - Clear all error patterns
- `clear_strategies()` - Clear all strategies

## Data Structures

### QualityEvaluation
```rust
pub struct QualityEvaluation {
    pub quality_score: u8,        // 0-100
    pub accuracy: String,          // Assessment
    pub coherence: String,         // Assessment
    pub suggestions: Vec<String>,   // Improvement suggestions
}
```

### SecurityPolicy
```rust
pub struct SecurityPolicy {
    pub id: String,              // Unique identifier
    pub name: String,            // Human-readable name
    pub description: String,      // Policy description
    pub enabled: bool,           // Whether enabled
}
```

### ApprovalDecision
```rust
pub struct ApprovalDecision {
    pub approved: bool,          // Whether approved
    pub reason: String,          // Reason for decision
}
```

### Reflection
```rust
pub struct Reflection {
    pub task_id: String,         // Task ID analyzed
    pub success: bool,           // Whether successful
    pub insights: Vec<String>,   // Insights gained
    pub improvements: Vec<String>, // Suggested improvements
}
```

### ErrorPattern
```rust
pub struct ErrorPattern {
    pub id: String,                    // Unique identifier
    pub error_type: String,            // Type of error
    pub root_cause: String,            // Root cause
    pub prevention_strategy: String,     // Prevention strategy
    pub count: usize,                  // Occurrence count
}
```

### Strategy
```rust
pub struct Strategy {
    pub id: String,              // Unique identifier
    pub name: String,            // Strategy name
    pub description: String,      // Strategy description
    pub effectiveness: f64,      // Effectiveness score (0-1)
}
```

### OptimizationReport
```rust
pub struct OptimizationReport {
    pub error_patterns_count: usize,      // Number of patterns
    pub strategies_count: usize,         // Number of strategies
    pub recommendations: Vec<String>,     // Recommendations
}
```

## Integration with Multi-Agent System

### Registration

Agents can be registered through Tauri commands:

```typescript
// Register CriticAgent
const criticId = await invoke('register_agent', {
  agent_type: 'critic',
  name: 'Quality Evaluator',
  workspace_id: 'workspace-1',
  ai_provider: 'gemini',
  model: 'gemini-2.0-flash',
  settings: {}
});

// Register GovernorAgent
const governorId = await invoke('register_agent', {
  agent_type: 'governor',
  name: 'Security Enforcer',
  workspace_id: 'workspace-1',
  ai_provider: 'gemini',
  model: 'gemini-2.0-flash',
  settings: {}
});
```

### Task Flow

1. **Task Execution** - Agent executes task
2. **Quality Evaluation** - CriticAgent evaluates result
3. **Security Check** - GovernorAgent approves operation
4. **Reflection** - ReflectionEngine analyzes result
5. **Optimization** - System learns and improves

## Testing

### Unit Tests

Each component includes comprehensive unit tests:

```bash
# Run all tests
cargo test

# Run specific module tests
cargo test --package rainy-cowork-lib --lib agents::critic
cargo test --package rainy-cowork-lib --lib agents::governor
cargo test --package rainy-cowork-lib --lib services::reflection
```

### Test Coverage

- **CriticAgent**: Quality evaluation, serialization
- **GovernorAgent**: Policy management, approval logic
- **ReflectionEngine**: Pattern analysis, strategy generation

## Architecture Principles

### Modularization
- Each component < 400 lines
- Single responsibility
- Explicit public interface
- No circular dependencies

### Thread Safety
- Uses `Arc<RwLock>` for shared state
- Async/await with tokio
- Proper error handling

### Performance
- Minimal blocking operations
- Efficient data structures
- Lazy evaluation where possible

## Future Enhancements

1. **Advanced Quality Metrics**
   - Performance benchmarks
   - Resource usage analysis
   - User satisfaction tracking

2. **Policy Templates**
   - Pre-configured policy sets
   - Policy inheritance
   - Dynamic policy updates

3. **Machine Learning**
   - Pattern recognition
   - Predictive optimization
   - Automated strategy selection

4. **Integration**
   - External audit tools
   - Compliance frameworks
   - Security scanners

## Dependencies

- `tokio` - Async runtime
- `serde` - Serialization
- `async-trait` - Async trait support
- `uuid` - Unique identifiers

## License

See LICENSE file for details.
