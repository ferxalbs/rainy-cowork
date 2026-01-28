# PHASE 3 Implementation Plan: AI Provider Integration

**Project**: Rainy Cowork (RAINY MATE)  
**Version**: 0.4.3  
**Status**: Planning  
**Target**: Week 10-12 (PHASE 3: AI Provider Integration)  
**Last Updated**: 2026-01-27  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Architecture Overview](#3-architecture-overview)
4. [Detailed Implementation Plan](#4-detailed-implementation-plan)
5. [Rainy SDK Integration](#5-rainy-sdk-integration)
6. [Testing Strategy](#6-testing-strategy)
7. [Migration & Compatibility](#7-migration--compatibility)
8. [Dependencies](#8-dependencies)
9. [Risks & Mitigation](#9-risks--mitigation)
10. [Success Metrics](#10-success-metrics)

---

## 1. Executive Summary

### 1.1 PHASE 3 Scope and Objectives

PHASE 3 focuses on implementing a robust, enterprise-grade AI Provider Integration layer that enables RAINY MATE to seamlessly connect with multiple AI providers while maintaining optimal performance, cost efficiency, and reliability. This phase leverages the **rainy-sdk** (v0.6.1) crate from crates.io, which provides unified access to multiple AI providers through two distinct modes:

1. **Rainy API Mode**: Standard pay-as-you-go API access for direct AI provider interactions
2. **Rainy Cowork Mode**: Subscription-based access with tiered plans (Free, GoPlus, Plus, Pro, ProPlus)

### 1.2 Key Deliverables

| Component | Description | Status |
|-----------|-------------|--------|
| **Provider Abstraction** | Unified AIProvider trait for all providers | 🟡 Planned |
| **Individual Providers** | OpenAI, Anthropic, Google, xAI, Local (Ollama Planned for future Versions), Via RAINY API is the Priority others providers dont the priority | 🟡 Planned |
| **Intelligent Router** | Task-based provider selection and load balancing | 🟡 Planned |
| **Cost Optimizer** | Automatic cost optimization across providers | 🟡 Planned |
| **Fallback Chain** | Automatic failover on provider failures | 🟡 Planned |
| **Rainy SDK Integration** | Full integration with rainy-sdk v0.6.1 | 🟡 Planned |
| **Usage Analytics** | Comprehensive usage tracking and reporting | 🟡 Planned |

### 1.3 Success Criteria

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Provider Switch Latency | <20ms | Time to switch between providers |
| Fallback Success Rate | >99% | Automatic recovery from failures |
| Cost Optimization | >15% | Reduction in API costs vs single provider |
| Task Routing Accuracy | >95% | Correct provider selection for task type |
| SDK Integration Coverage | 100% | All rainy-sdk features utilized |

---

## 2. Current State Assessment

### 2.1 Already Implemented ✅

**AI Provider Management (src-tauri/src/ai/provider.rs)**
- `AIProviderManager` with Rainy SDK integration
- Support for 3 provider types:
  - `ProviderType::RainyApi` - Standard Rainy API (Pay-as-you-go)
  - `ProviderType::CoworkApi` - Cowork Subscription (Free/Pro/ProPlus)
  - `ProviderType::Gemini` - Direct Google Gemini API
- Connection pooling for `RainyClient` instances
- 5-minute caching for Cowork capabilities
- API key validation and storage via KeychainManager
- Capabilities checking with usage tracking
- Model availability per subscription plan

**Rainy SDK Features Currently Used**
```rust
rainy-sdk = { version = "0.6.1", features = ["rate-limiting", "tracing", "cowork"] }
```
- `RainyClient::with_api_key()` - Client initialization
- `get_cowork_capabilities()` - Subscription and usage info
- `get_cowork_models()` - Available models for plan
- `simple_chat()` - Single-turn chat completion
- `create_chat_completion()` - Full chat completion with options
- `list_available_models()` - All available models
- `CoworkCapabilities` - Plan, usage, models, features
- `CoworkPlan` - Subscription tier management

**Frontend Integration**
- `useAIProvider.ts` hook for provider management
- `useCoworkStatus.ts` hook for subscription status
- Settings panel with provider configuration
- Model selection based on subscription plan
- Usage tracking visualization

### 2.2 Partially Implemented ⚠️

**Provider Abstraction**
- Basic provider type enum exists but lacks full trait abstraction
- No standardized provider interface for non-SDK providers
- Missing capability-based provider selection

**Cost Optimization**
- No automatic cost-based provider selection
- Missing usage analytics for cost tracking
- No budget limits or alerts

**Fallback Mechanisms**
- Basic error handling exists but no automatic fallback chain
- No retry logic with exponential backoff
- Missing circuit breaker pattern

### 2.3 Not Implemented ❌

**Individual Provider Modules**
- OpenAI direct integration (GPT-4, GPT-4o, o1)
- Anthropic direct integration (Claude 3.5/4, Opus)
- Google direct integration (Gemini 2.0, Flash)
- xAI integration (Grok-4.1)
- Custom OpenAI-compatible endpoints via Rainy SDK is an SDK OpenAI-compatible

**Intelligent Routing**
- Task-based model selection
- Capability matching
- Load balancing across providers
- Quality-based provider ranking

**Advanced SDK Features**
- Streaming responses (`stream: true`)
- Multi-turn conversations with context
- Tool calling and function execution
- Embedding generation
- Web search integration (`web_search()`)
- Advanced error handling and retries

---

## 3. Architecture Overview

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎨 PRESENTATION LAYER                        │
│  React 19 + HeroUI v3 + Custom Hooks (useAIProvider, etc.)      │
├─────────────────────────────────────────────────────────────────┤
│                    🔌 INTEGRATION LAYER                         │
│  Tauri v2 Commands + Event Channels                             │
├─────────────────────────────────────────────────────────────────┤
│                    🧠 AI PROVIDER LAYER                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Provider   │  │  Intelligent │  │      Rainy SDK       │  │
│  │  Registry   │◄─┤   Router     │◄─┤   (v0.6.1)           │  │
│  │             │  │              │  │  • Rainy API Mode    │  │
│  │ • OpenAI    │  │ • Load Bal   │  │  • Cowork Mode       │  │
│  │ • Anthropic │  │ • Cost Opt   │  │  • Web Search        │  │
│  │ • Google    │  │ • Fallback   │  │  • Embeddings        │  │
│  │ • xAI       │  │ • Rate Limit │  │                      │  │
│  │ • Local     │  │              │  │                      │  │
│  │ • Custom    │  │              │  │                      │  │
│  └─────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    💾 PERSISTENCE LAYER                         │
│  Keychain (API Keys) + Settings (Preferences) + Usage Cache     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Provider Hierarchy prioricin Rainy SDK and the ecosystem

```
                    ┌──────────────────┐
                    │  AIProvider      │
                    │  (Trait)         │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  Rainy  │          │ Direct  │          │  Local  │
   │  SDK    │          │  HTTP   │          │  LLM    │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                    │
   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
   │• Rainy  │          │• OpenAI │          │• Ollama │
   │  API    │          │• Claude │          │• LM St  │
   │• Cowork │          │• Gemini │          │         │
   └─────────┘          │• xAI    │          └─────────┘
                        │• Custom │
                        └─────────┘
```

### 3.3 Rainy SDK Two-Mode Architecture

```rust
// Mode 1: Rainy API - Direct AI Provider Access
let client = RainyClient::with_api_key("ra-<api_key>")?;
let response = client
    .create_chat_completion(ChatCompletionRequest::new("gpt-4o", messages))
    .await?;

// Mode 2: Rainy Cowork - Subscription-Based Access
let client = RainyClient::with_api_key("ra-cowork<api_key>")?;
let caps = client.get_cowork_capabilities().await?;
// caps.plan, caps.models, caps.features, caps.usage
let response = client.simple_chat("gemini-pro", prompt).await?;

// Shared Features (Both Modes)
let models = client.list_available_models().await?;
let web_results = client.web_search("query", Some(options)).await?;
```

---

## 4. Detailed Implementation Plan

### 4.1 Provider Abstraction Layer (Week 10)

#### 4.1.1 AIProvider Trait Definition

**File**: `src-tauri/src/ai/provider_trait.rs`

```rust
/// Core trait for all AI providers
#[async_trait::async_trait]
pub trait AIProvider: Send + Sync {
    /// Provider identifier
    fn provider_id(&self) -> ProviderId;
    
    /// Provider display name
    fn provider_name(&self) -> String;
    
    /// Execute a completion request
    async fn complete(&self, request: CompletionRequest) -> Result<CompletionResponse, AIError>;
    
    /// Generate embeddings
    async fn embed(&self, text: &str) -> Result<Vec<f32>, AIError>;
    
    /// Get provider capabilities
    fn capabilities(&self) -> ProviderCapabilities;
    
    /// Get pricing information
    fn pricing(&self) -> Option<PricingInfo>;
    
    /// Check if provider is available
    async fn health_check(&self) -> HealthStatus;
    
    /// Stream completions
    async fn complete_stream(
        &self, 
        request: CompletionRequest,
        on_chunk: Box<dyn Fn(String) + Send + Sync>
    ) -> Result<(), AIError>;
}

/// Provider capabilities for routing decisions
#[derive(Debug, Clone)]
pub struct ProviderCapabilities {
    pub supports_streaming: bool,
    pub supports_embeddings: bool,
    pub supports_tools: bool,
    pub supports_vision: bool,
    pub max_context_length: usize,
    pub models: Vec<String>,
    pub cost_tier: CostTier, // Low, Medium, High
    pub latency_tier: LatencyTier, // Fast, Medium, Slow
}
```

**Implementation Notes**:
- Use `async-trait` for async methods in traits
- All providers must be `Send + Sync` for concurrent access
- Return standardized `AIError` enum for error handling
- Support both streaming and non-streaming completions

#### 4.1.2 Provider Registry

**File**: `src-tauri/src/ai/provider_registry.rs`

```rust
/// Central registry for all AI providers
pub struct ProviderRegistry {
    providers: Arc<RwLock<HashMap<ProviderId, Arc<dyn AIProvider>>>>,
    rainy_sdk_client: Option<Arc<RainyClient>>,
    config: ProviderConfig,
}

impl ProviderRegistry {
    /// Register a new provider
    pub async fn register(&self, provider: Arc<dyn AIProvider>) -> Result<(), RegistryError>;
    
    /// Get provider by ID
    pub async fn get(&self, id: ProviderId) -> Option<Arc<dyn AIProvider>>;
    
    /// List all registered providers
    pub async fn list_all(&self) -> Vec<ProviderInfo>;
    
    /// List providers by capability
    pub async fn list_by_capability(&self, cap: Capability) -> Vec<Arc<dyn AIProvider>>;
    
    /// Initialize all providers from configuration
    pub async fn initialize_providers(&self) -> Result<(), RegistryError>;
}
```

**Deliverables**:
- [ ] `src-tauri/src/ai/provider_trait.rs` (< 200 lines)
- [ ] `src-tauri/src/ai/provider_registry.rs` (< 300 lines)
- [ ] `src-tauri/src/ai/provider_types.rs` (< 200 lines)
- [ ] Unit tests for all components

---

### 4.2 Individual Provider Implementations (Week 10-11)

#### 4.2.1 OpenAI Provider

**File**: `src-tauri/src/ai/providers/openai.rs`

```rust
pub struct OpenAIProvider {
    client: reqwest::Client,
    api_key: String,
    base_url: String,
    models: Vec<String>,
}

#[async_trait::async_trait]
impl AIProvider for OpenAIProvider {
    fn provider_id(&self) -> ProviderId {
        ProviderId::OpenAI
    }
    
    async fn complete(&self, request: CompletionRequest) -> Result<CompletionResponse, AIError> {
        // Direct OpenAI API integration
        // POST https://api.openai.com/v1/chat/completions
    }
    
    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_streaming: true,
            supports_embeddings: true,
            supports_tools: true,
            supports_vision: true,
            max_context_length: 128000,
            models: vec!["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1"]
                .into_iter().map(String::from).collect(),
            cost_tier: CostTier::High,
            latency_tier: LatencyTier::Medium,
        }
    }
}
```

**Supported Models**:
- GPT-4o (multimodal, fast)
- GPT-4o-mini (cost-effective)
- GPT-4-turbo (legacy)
- o1 (reasoning)

**⚠️ Implementation Note**: 
This provider should be implemented as an **additional option** alongside the existing Rainy SDK integration. The current system uses rainy-sdk with gemini models successfully. Do not remove or modify existing rainy-sdk integration. Add OpenAI as an **optional provider** that users can configure if they have their own OpenAI API key. The Rainy SDK is designed for modularize use OpenAI models and others with the OpenAI-Like API endpoint, this SDK is expanded for others endpoints.

#### 4.2.2 Anthropic Provider

**File**: `src-tauri/src/ai/providers/anthropic.rs`

```rust
pub struct AnthropicProvider {
    client: reqwest::Client,
    api_key: String,
}

#[async_trait::async_trait]
impl AIProvider for AnthropicProvider {
    fn provider_id(&self) -> ProviderId {
        ProviderId::Anthropic
    }
    
    async fn complete(&self, request: CompletionRequest) -> Result<CompletionResponse, AIError> {
        // Anthropic Messages API
        // POST https://api.anthropic.com/v1/messages
    }
    
    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_streaming: true,
            supports_embeddings: false, // Use OpenAI for embeddings
            supports_tools: true,
            supports_vision: true,
            max_context_length: 200000,
            models: vec!["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"]
                .into_iter().map(String::from).collect(),
            cost_tier: CostTier::High,
            latency_tier: LatencyTier::Medium,
        }
    }
}
```

**Supported Models**:
- Claude 3.5 Sonnet (balanced)
- Claude 3 Opus (powerful)
- Claude 3 Haiku (fast)

#### 4.2.3 Google (Gemini) Provider

**File**: `src-tauri/src/ai/providers/google.rs`

```rust
pub struct GoogleProvider {
    client: reqwest::Client,
    api_key: String,
}

#[async_trait::async_trait]
impl AIProvider for GoogleProvider {
    fn provider_id(&self) -> ProviderId {
        ProviderId::Google
    }
    
    async fn complete(&self, request: CompletionRequest) -> Result<CompletionResponse, AIError> {
        // Google Gemini API
        // POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    }
    
    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_streaming: true,
            supports_embeddings: true,
            supports_tools: true,
            supports_vision: true,
            max_context_length: 1000000,
            models: vec!["gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash"]
                .into_iter().map(String::from).collect(),
            cost_tier: CostTier::Low,
            latency_tier: LatencyTier::Fast,
        }
    }
}
```

**Supported Models**:
- Gemini 2.0 Flash (fast, cost-effective)
- Gemini 2.5 Pro (powerful)
- Gemini 3 Flash (light and faster)

#### 4.2.4 xAI (Grok) Provider

**File**: `src-tauri/src/ai/providers/xai.rs`

```rust
pub struct XAIProvider {
    client: reqwest::Client,
    api_key: String,
}

#[async_trait::async_trait]
impl AIProvider for XAIProvider {
    fn provider_id(&self) -> ProviderId {
        ProviderId::XAI
    }
    
    async fn complete(&self, request: CompletionRequest) -> Result<CompletionResponse, AIError> {
        // xAI API (OpenAI-compatible)
        // POST https://api.x.ai/v1/chat/completions
    }
    
    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_streaming: true,
            supports_embeddings: false,
            supports_tools: true,
            supports_vision: false,
            max_context_length: 128000,
            models: vec!["grok-4", "grok-4-fast-code"]
                .into_iter().map(String::from).collect(),
            cost_tier: CostTier::Medium,
            latency_tier: LatencyTier::Fast,
        }
    }
}
```

#### 4.2.5 Local/Ollama Provider

**File**: `src-tauri/src/ai/providers/ollama.rs`

```rust
pub struct OllamaProvider {
    client: reqwest::Client,
    base_url: String, // Default: http://localhost:11434
}

#[async_trait::async_trait]
impl AIProvider for OllamaProvider {
    fn provider_id(&self) -> ProviderId {
        ProviderId::Ollama
    }
    
    async fn complete(&self, request: CompletionRequest) -> Result<CompletionResponse, AIError> {
        // Ollama API
        // POST http://localhost:11434/api/generate
    }
    
    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_streaming: true,
            supports_embeddings: true,
            supports_tools: false,
            supports_vision: false,
            max_context_length: 32768,
            models: vec![], // Dynamic based on installed models
            cost_tier: CostTier::Free,
            latency_tier: LatencyTier::Medium, // Depends on hardware
        }
    }
    
    /// List locally available models
    pub async fn list_local_models(&self) -> Result<Vec<String>, AIError>;
}
```

**Features**:
- Auto-detect installed models
- Support for Llama, Mistral, CodeLlama, etc.
- Zero API costs (runs locally)

#### 4.2.6 Custom Provider

**File**: `src-tauri/src/ai/providers/custom.rs`

```rust
pub struct CustomProvider {
    client: reqwest::Client,
    config: CustomProviderConfig,
}

pub struct CustomProviderConfig {
    pub name: String,
    pub base_url: String,
    pub api_key: Option<String>,
    pub models: Vec<String>,
    pub headers: HashMap<String, String>,
}

#[async_trait::async_trait]
impl AIProvider for CustomProvider {
    fn provider_id(&self) -> ProviderId {
        ProviderId::Custom(self.config.name.clone())
    }
    
    async fn complete(&self, request: CompletionRequest) -> Result<CompletionResponse, AIError> {
        // OpenAI-compatible API
    }
}
```

**Use Cases**:
- Self-hosted models (vLLM, TGI)
- Enterprise proxies
- Third-party OpenAI-compatible services

#### 4.2.7 Rainy SDK Provider Wrapper

**File**: `src-tauri/src/ai/providers/rainy_sdk.rs`

```rust
/// Wrapper around rainy-sdk that implements AIProvider trait
pub struct RainySdkProvider {
    client: Arc<RainyClient>,
    mode: RainySdkMode,
}

pub enum RainySdkMode {
    Api,     // Standard Rainy API
    Cowork,  // Cowork subscription
}

#[async_trait::async_trait]
impl AIProvider for RainySdkProvider {
    fn provider_id(&self) -> ProviderId {
        match self.mode {
            RainySdkMode::Api => ProviderId::RainyApi,
            RainySdkMode::Cowork => ProviderId::RainyCowork,
        }
    }
    
    async fn complete(&self, request: CompletionRequest) -> Result<CompletionResponse, AIError> {
        let sdk_request = ChatCompletionRequest::new(&request.model, request.messages)
            .with_temperature(request.temperature)
            .with_max_tokens(request.max_tokens.unwrap_or(1024));
        
        let response = self.client.create_chat_completion(sdk_request).await
            .map_err(|e| AIError::ProviderError(e.to_string()))?;
        
        Ok(CompletionResponse {
            content: response.choices.first()
                .map(|c| c.message.content.clone())
                .unwrap_or_default(),
            usage: response.usage.map(|u| UsageInfo {
                prompt_tokens: u.prompt_tokens,
                completion_tokens: u.completion_tokens,
                total_tokens: u.total_tokens,
            }),
        })
    }
    
    async fn embed(&self, text: &str) -> Result<Vec<f32>, AIError> {
        // Use rainy-sdk embedding endpoint
    }
    
    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_streaming: true,
            supports_embeddings: true,
            supports_tools: true,
            supports_vision: true,
            max_context_length: 200000,
            models: self.get_available_models(),
            cost_tier: CostTier::Medium,
            latency_tier: LatencyTier::Fast,
        }
    }
}
```

**Deliverables**:
- [ ] `src-tauri/src/ai/providers/mod.rs` - Provider module exports
- [ ] `src-tauri/src/ai/providers/openai.rs` (< 300 lines)
- [ ] `src-tauri/src/ai/providers/anthropic.rs` (< 300 lines)
- [ ] `src-tauri/src/ai/providers/google.rs` (< 300 lines)
- [ ] `src-tauri/src/ai/providers/xai.rs` (< 250 lines)
- [ ] `src-tauri/src/ai/providers/ollama.rs` (< 300 lines)
- [ ] `src-tauri/src/ai/providers/custom.rs` (< 250 lines)
- [ ] `src-tauri/src/ai/providers/rainy_sdk.rs` (< 350 lines)
- [ ] Unit tests for each provider

---

### 4.3 Intelligent Router (Week 11)

#### 4.3.1 Router Architecture

**File**: `src-tauri/src/ai/router.rs`

```rust
/// Intelligent router for provider selection
pub struct IntelligentRouter {
    registry: Arc<ProviderRegistry>,
    load_balancer: LoadBalancer,
    cost_optimizer: CostOptimizer,
    capability_matcher: CapabilityMatcher,
    fallback_chain: FallbackChain,
    usage_tracker: Arc<UsageTracker>,
}

impl IntelligentRouter {
    /// Route a completion request to the best provider
    pub async fn route_completion(
        &self,
        task: &TaskRequirements,
    ) -> Result<Arc<dyn AIProvider>, RouterError> {
        // 1. Get all providers that can handle this task
        let candidates = self.capability_matcher.find_candidates(task).await?;
        
        // 2. Apply cost optimization
        let cost_optimized = self.cost_optimizer.optimize(candidates, task).await?;
        
        // 3. Apply load balancing
        let balanced = self.load_balancer.select(cost_optimized).await?;
        
        // 4. Return best provider
        Ok(balanced)
    }
    
    /// Execute with automatic fallback
    pub async fn execute_with_fallback<F, T>(
        &self,
        task: &TaskRequirements,
        operation: F,
    ) -> Result<T, RouterError>
    where
        F: Fn(Arc<dyn AIProvider>) -> BoxFuture<'static, Result<T, AIError>>,
    {
        self.fallback_chain.execute(task, operation).await
    }
}
```

#### 4.3.2 Load Balancer

**File**: `src-tauri/src/ai/router/load_balancer.rs`

```rust
pub struct LoadBalancer {
    strategy: LoadBalancingStrategy,
    provider_health: Arc<RwLock<HashMap<ProviderId, HealthMetrics>>>,
}

pub enum LoadBalancingStrategy {
    RoundRobin,
    LeastConnections,
    WeightedResponseTime,
    Random,
}

impl LoadBalancer {
    /// Select best provider based on strategy
    pub async fn select(
        &self,
        candidates: Vec<Arc<dyn AIProvider>>,
    ) -> Result<Arc<dyn AIProvider>, RouterError> {
        match self.strategy {
            LoadBalancingStrategy::RoundRobin => self.round_robin(candidates).await,
            LoadBalancingStrategy::LeastConnections => self.least_connections(candidates).await,
            LoadBalancingStrategy::WeightedResponseTime => self.weighted_response_time(candidates).await,
            LoadBalancingStrategy::Random => self.random(candidates).await,
        }
    }
}
```

#### 4.3.3 Cost Optimizer

**File**: `src-tauri/src/ai/router/cost_optimizer.rs`

```rust
pub struct CostOptimizer {
    budget_limits: Arc<RwLock<BudgetLimits>>,
    provider_costs: Arc<RwLock<HashMap<ProviderId, CostModel>>>,
}

pub struct CostModel {
    pub input_cost_per_1k: f64,  // Cost per 1000 input tokens
    pub output_cost_per_1k: f64, // Cost per 1000 output tokens
    pub context_window_cost: Option<f64>,
}

impl CostOptimizer {
    /// Optimize provider selection based on cost
    pub async fn optimize(
        &self,
        candidates: Vec<Arc<dyn AIProvider>>,
        task: &TaskRequirements,
    ) -> Result<Vec<Arc<dyn AIProvider>>, RouterError> {
        // Calculate estimated cost for each provider
        let mut with_costs: Vec<(Arc<dyn AIProvider>, f64)> = candidates
            .into_iter()
            .filter_map(|p| {
                let cost = self.estimate_cost(&p, task).ok()?;
                Some((p, cost))
            })
            .collect();
        
        // Sort by cost (lowest first)
        with_costs.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(Ordering::Equal));
        
        // Return top N providers within budget
        Ok(with_costs.into_iter().take(3).map(|(p, _)| p).collect())
    }
    
    fn estimate_cost(
        &self,
        provider: &Arc<dyn AIProvider>,
        task: &TaskRequirements,
    ) -> Result<f64, CostError> {
        let pricing = provider.pricing().ok_or(CostError::NoPricingInfo)?;
        let input_tokens = task.estimated_input_tokens;
        let output_tokens = task.estimated_output_tokens;
        
        let cost = (input_tokens as f64 / 1000.0) * pricing.input_cost
            + (output_tokens as f64 / 1000.0) * pricing.output_cost;
        
        Ok(cost)
    }
}
```

#### 4.3.4 Capability Matcher

**File**: `src-tauri/src/ai/router/capability_matcher.rs`

```rust
pub struct CapabilityMatcher;

impl CapabilityMatcher {
    /// Find providers that can handle the given task
    pub async fn find_candidates(
        &self,
        task: &TaskRequirements,
    ) -> Result<Vec<Arc<dyn AIProvider>>, RouterError> {
        let registry = self.registry.read().await;
        let all_providers = registry.list_all().await;
        
        Ok(all_providers
            .into_iter()
            .filter(|p| self.can_handle(p, task))
            .collect())
    }
    
    fn can_handle(&self, provider: &Arc<dyn AIProvider>, task: &TaskRequirements) -> bool {
        let caps = provider.capabilities();
        
        // Check required capabilities
        if task.requires_streaming && !caps.supports_streaming {
            return false;
        }
        if task.requires_embeddings && !caps.supports_embeddings {
            return false;
        }
        if task.requires_tools && !caps.supports_tools {
            return false;
        }
        if task.requires_vision && !caps.supports_vision {
            return false;
        }
        
        // Check context length
        if task.estimated_input_tokens > caps.max_context_length {
            return false;
        }
        
        // Check model availability
        if !task.preferred_model.is_empty() && !caps.models.contains(&task.preferred_model) {
            return false;
        }
        
        true
    }
}

pub struct TaskRequirements {
    pub task_type: TaskType,
    pub preferred_model: String,
    pub estimated_input_tokens: usize,
    pub estimated_output_tokens: usize,
    pub requires_streaming: bool,
    pub requires_embeddings: bool,
    pub requires_tools: bool,
    pub requires_vision: bool,
    pub max_latency_ms: u64,
    pub max_cost_usd: Option<f64>,
}

pub enum TaskType {
    QuickResponse,      // Use fast, cheap models
    ComplexReasoning,   // Use powerful models
    CodeGeneration,     // Use code-optimized models
    CreativeWriting,    // Use creative models
    Analysis,           // Use analytical models
    Vision,             // Requires vision capability
}
```

#### 4.3.5 Fallback Chain

**File**: `src-tauri/src/ai/router/fallback_chain.rs`

```rust
pub struct FallbackChain {
    max_retries: u32,
    retry_delay: Duration,
    circuit_breaker: CircuitBreaker,
}

pub struct CircuitBreaker {
    failure_threshold: u32,
    reset_timeout: Duration,
    state: Arc<RwLock<CircuitState>>,
}

pub enum CircuitState {
    Closed,     // Normal operation
    Open,       // Failing, reject requests
    HalfOpen,   // Testing if recovered
}

impl FallbackChain {
    /// Execute operation with automatic fallback
    pub async fn execute<F, T>(
        &self,
        task: &TaskRequirements,
        operation: F,
    ) -> Result<T, RouterError>
    where
        F: Fn(Arc<dyn AIProvider>) -> BoxFuture<'static, Result<T, AIError>>,
    {
        let candidates = self.get_fallback_chain(task).await?;
        let mut last_error = None;
        
        for (idx, provider) in candidates.iter().enumerate() {
            // Check circuit breaker
            if self.circuit_breaker.is_open(provider.provider_id()).await {
                tracing::warn!("Circuit breaker open for {:?}", provider.provider_id());
                continue;
            }
            
            // Try operation
            match operation(provider.clone()).await {
                Ok(result) => {
                    self.circuit_breaker.record_success(provider.provider_id()).await;
                    return Ok(result);
                }
                Err(e) => {
                    tracing::error!(
                        "Provider {:?} failed (attempt {}): {}",
                        provider.provider_id(),
                        idx + 1,
                        e
                    );
                    self.circuit_breaker.record_failure(provider.provider_id()).await;
                    last_error = Some(e);
                    
                    // Exponential backoff before next attempt
                    if idx < candidates.len() - 1 {
                        tokio::time::sleep(self.retry_delay * (idx + 1) as u32).await;
                    }
                }
            }
        }
        
        Err(RouterError::AllProvidersFailed(last_error.unwrap_or_else(|| {
            AIError::ProviderError("No providers available".to_string())
        })))
    }
    
    /// Get ordered list of fallback providers
    async fn get_fallback_chain(
        &self,
        task: &TaskRequirements,
    ) -> Result<Vec<Arc<dyn AIProvider>>, RouterError> {
        // Priority:
        // 1. Preferred provider if specified
        // 2. Providers matching capability requirements
        // 3. Ordered by cost (cheaper first for non-critical tasks)
        // 4. Ordered by quality (better first for critical tasks)
        
        todo!("Implement fallback chain ordering")
    }
}
```

**Deliverables**:
- [ ] `src-tauri/src/ai/router/mod.rs` - Router module exports
- [ ] `src-tauri/src/ai/router.rs` - Main router implementation (< 400 lines)
- [ ] `src-tauri/src/ai/router/load_balancer.rs` (< 300 lines)
- [ ] `src-tauri/src/ai/router/cost_optimizer.rs` (< 350 lines)
- [ ] `src-tauri/src/ai/router/capability_matcher.rs` (< 300 lines)
- [ ] `src-tauri/src/ai/router/fallback_chain.rs` (< 350 lines)
- [ ] Unit tests for routing logic

---

### 4.4 Rainy SDK Enhanced Integration (Week 11-12)

#### 4.4.1 Web Search Integration

**File**: `src-tauri/src/ai/features/web_search.rs`

```rust
use rainy_sdk::SearchOptions;

pub struct WebSearchService {
    client: Arc<RainyClient>,
}

impl WebSearchService {
    /// Perform web search using Rainy SDK
    pub async fn search(&self, query: &str, options: SearchOptions) -> Result<SearchResults, AIError> {
        let results = self.client.web_search(query, Some(options)).await
            .map_err(|e| AIError::ProviderError(e.to_string()))?;
        
        Ok(SearchResults {
            query: query.to_string(),
            results: results.results.into_iter().map(|r| SearchResult {
                title: r.title,
                url: r.url,
                content: r.content,
                score: r.score,
            }).collect(),
            answer: results.answer,
        })
    }
    
    /// Search with AI-generated answer
    pub async fn search_with_answer(&self, query: &str) -> Result<(Vec<SearchResult>, Option<String>), AIError> {
        let options = SearchOptions::advanced()
            .with_answer(true)
            .with_max_results(5);
        
        let results = self.search(query, options).await?;
        Ok((results.results, results.answer))
    }
}

pub struct SearchResults {
    pub query: String,
    pub results: Vec<SearchResult>,
    pub answer: Option<String>,
}

pub struct SearchResult {
    pub title: String,
    pub url: String,
    pub content: String,
    pub score: f64,
}
```

#### 4.4.2 Embeddings Service

**File**: `src-tauri/src/ai/features/embeddings.rs`

```rust
pub struct EmbeddingsService {
    client: Arc<RainyClient>,
    cache: Arc<RwLock<HashMap<String, Vec<f32>>>>,
}

impl EmbeddingsService {
    /// Generate embeddings for text
    pub async fn embed(&self, text: &str) -> Result<Vec<f32>, AIError> {
        // Check cache first
        {
            let cache = self.cache.read().await;
            if let Some(embedding) = cache.get(text) {
                return Ok(embedding.clone());
            }
        }
        
        // Generate via SDK
        let embedding = self.client.embed(text).await
            .map_err(|e| AIError::ProviderError(e.to_string()))?;
        
        // Cache result
        {
            let mut cache = self.cache.write().await;
            cache.insert(text.to_string(), embedding.clone());
        }
        
        Ok(embedding)
    }
    
    /// Generate embeddings for multiple texts (batch)
    pub async fn embed_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, AIError> {
        // Parallel embedding generation
        let futures: Vec<_> = texts.iter()
            .map(|t| self.embed(t))
            .collect();
        
        futures::future::try_join_all(futures).await
    }
    
    /// Calculate cosine similarity between two embeddings
    pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f64 {
        let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
        let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
        let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
        
        (dot_product / (norm_a * norm_b)) as f64
    }
}
```

#### 4.4.3 Streaming Support

**File**: `src-tauri/src/ai/features/streaming.rs`

```rust
use rainy_sdk::ChatCompletionRequest;
use tokio::sync::mpsc;

pub struct StreamingService {
    client: Arc<RainyClient>,
}

impl StreamingService {
    /// Stream chat completion
    pub async fn stream_completion(
        &self,
        request: ChatCompletionRequest,
        on_chunk: mpsc::Sender<String>,
    ) -> Result<(), AIError> {
        let stream = self.client
            .create_chat_completion_stream(request)
            .await
            .map_err(|e| AIError::ProviderError(e.to_string()))?;
        
        tokio::spawn(async move {
            let mut stream = stream;
            while let Some(chunk) = stream.next().await {
                match chunk {
                    Ok(delta) => {
                        if let Some(content) = delta.choices.first()
                            .and_then(|c| c.delta.content.as_ref()) {
                            if on_chunk.send(content.clone()).await.is_err() {
                                break;
                            }
                        }
                    }
                    Err(e) => {
                        tracing::error!("Stream error: {}", e);
                        break;
                    }
                }
            }
        });
        
        Ok(())
    }
}
```

#### 4.4.4 Usage Analytics

**File**: `src-tauri/src/ai/features/usage_analytics.rs`

```rust
use rainy_sdk::cowork::CoworkUsage;
use chrono::{DateTime, Utc};

pub struct UsageAnalytics {
    storage: Arc<dyn UsageStorage>,
}

#[derive(Debug, Clone)]
pub struct UsageRecord {
    pub timestamp: DateTime<Utc>,
    pub provider: ProviderId,
    pub model: String,
    pub task_type: TaskType,
    pub input_tokens: u32,
    pub output_tokens: u32,
    pub cost_usd: f64,
    pub latency_ms: u64,
    pub success: bool,
}

impl UsageAnalytics {
    /// Record a usage event
    pub async fn record(&self, record: UsageRecord) -> Result<(), StorageError> {
        self.storage.save(record).await
    }
    
    /// Get usage summary for time period
    pub async fn get_summary(
        &self,
        start: DateTime<Utc>,
        end: DateTime<Utc>,
    ) -> Result<UsageSummary, StorageError> {
        let records = self.storage.query(start, end).await?;
        
        let total_requests = records.len() as u64;
        let total_tokens: u64 = records.iter()
            .map(|r| r.input_tokens as u64 + r.output_tokens as u64)
            .sum();
        let total_cost: f64 = records.iter().map(|r| r.cost_usd).sum();
        let avg_latency: u64 = if total_requests > 0 {
            records.iter().map(|r| r.latency_ms).sum::<u64>() / total_requests
        } else {
            0
        };
        let success_rate: f64 = if total_requests > 0 {
            records.iter().filter(|r| r.success).count() as f64 / total_requests as f64
        } else {
            0.0
        };
        
        Ok(UsageSummary {
            total_requests,
            total_tokens,
            total_cost,
            avg_latency,
            success_rate,
        })
    }
    
    /// Get provider breakdown
    pub async fn get_provider_breakdown(
        &self,
        start: DateTime<Utc>,
        end: DateTime<Utc>,
    ) -> Result<HashMap<ProviderId, ProviderStats>, StorageError> {
        let records = self.storage.query(start, end).await?;
        
        let mut breakdown: HashMap<ProviderId, ProviderStats> = HashMap::new();
        
        for record in records {
            let stats = breakdown.entry(record.provider.clone())
                .or_insert_with(ProviderStats::default);
            
            stats.requests += 1;
            stats.tokens += record.input_tokens as u64 + record.output_tokens as u64;
            stats.cost += record.cost_usd;
            stats.total_latency += record.latency_ms;
            
            if record.success {
                stats.successful_requests += 1;
            }
        }
        
        // Calculate averages
        for stats in breakdown.values_mut() {
            if stats.requests > 0 {
                stats.avg_latency = stats.total_latency / stats.requests;
                stats.success_rate = stats.successful_requests as f64 / stats.requests as f64;
            }
        }
        
        Ok(breakdown)
    }
}

pub struct UsageSummary {
    pub total_requests: u64,
    pub total_tokens: u64,
    pub total_cost: f64,
    pub avg_latency: u64,
    pub success_rate: f64,
}

#[derive(Default)]
pub struct ProviderStats {
    pub requests: u64,
    pub tokens: u64,
    pub cost: f64,
    pub total_latency: u64,
    pub successful_requests: u64,
    pub avg_latency: u64,
    pub success_rate: f64,
}
```

**Deliverables**:
- [ ] `src-tauri/src/ai/features/mod.rs` - Features module exports
- [ ] `src-tauri/src/ai/features/web_search.rs` (< 300 lines)
- [ ] `src-tauri/src/ai/features/embeddings.rs` (< 300 lines)
- [ ] `src-tauri/src/ai/features/streaming.rs` (< 250 lines)
- [ ] `src-tauri/src/ai/features/usage_analytics.rs` (< 400 lines)
- [ ] Tauri commands for feature access
- [ ] Frontend hooks for streaming and analytics

---

### 4.5 Tauri Commands (Week 12)

**File**: `src-tauri/src/commands/ai_providers.rs`

```rust
/// List all available AI providers
#[tauri::command]
pub async fn list_ai_providers(
    state: State<'_, AIProviderState>,
) -> Result<Vec<ProviderInfo>, String> {
    let registry = state.registry.read().await;
    registry.list_all().await.map_err(|e| e.to_string())
}

/// Get provider capabilities
#[tauri::command]
pub async fn get_provider_capabilities(
    state: State<'_, AIProviderState>,
    provider_id: ProviderId,
) -> Result<ProviderCapabilities, String> {
    let registry = state.registry.read().await;
    let provider = registry.get(provider_id).await
        .ok_or("Provider not found")?;
    Ok(provider.capabilities())
}

/// Route and execute completion
#[tauri::command]
pub async fn execute_with_routing(
    state: State<'_, AIProviderState>,
    task: TaskRequirements,
    prompt: String,
) -> Result<String, String> {
    let router = &state.router;
    
    let provider = router.route_completion(&task).await
        .map_err(|e| e.to_string())?;
    
    let request = CompletionRequest {
        messages: vec![ChatMessage::user(prompt)],
        model: task.preferred_model,
        temperature: 0.7,
        max_tokens: Some(1024),
    };
    
    let response = provider.complete(request).await
        .map_err(|e| e.to_string())?;
    
    Ok(response.content)
}

/// Stream completion with routing
#[tauri::command]
pub async fn stream_with_routing(
    state: State<'_, AIProviderState>,
    task: TaskRequirements,
    prompt: String,
    on_chunk: Channel<String>,
) -> Result<(), String> {
    let router = &state.router;
    let provider = router.route_completion(&task).await
        .map_err(|e| e.to_string())?;
    
    let request = CompletionRequest {
        messages: vec![ChatMessage::user(prompt)],
        model: task.preferred_model,
        temperature: 0.7,
        max_tokens: Some(1024),
    };
    
    provider.complete_stream(request, Box::new(move |chunk| {
        let _ = on_chunk.send(chunk);
    })).await.map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Get usage analytics
#[tauri::command]
pub async fn get_usage_analytics(
    state: State<'_, AIProviderState>,
    days: u32,
) -> Result<UsageSummary, String> {
    let analytics = &state.analytics;
    let end = Utc::now();
    let start = end - chrono::Duration::days(days as i64);
    
    analytics.get_summary(start, end).await
        .map_err(|e| e.to_string())
}

/// Get Cowork status (from rainy-sdk)
#[tauri::command]
pub async fn get_cowork_status(
    state: State<'_, AIProviderState>,
) -> Result<CoworkStatus, String> {
    let client = state.rainy_client.read().await;
    
    if let Some(client) = client.as_ref() {
        let caps = client.get_cowork_capabilities().await
            .map_err(|e| e.to_string())?;
        
        Ok(CoworkStatus {
            plan: caps.profile.plan.name,
            is_paid: caps.profile.plan.is_paid(),
            models: caps.models,
            features: FeatureStatus {
                web_research: caps.features.web_research,
                document_export: caps.features.document_export,
                image_analysis: caps.features.image_analysis,
            },
            usage: UsageStatus {
                used: caps.profile.usage.used,
                limit: caps.profile.usage.limit,
                remaining: caps.profile.usage.remaining(),
                reset_at: caps.profile.usage.reset_at,
            },
        })
    } else {
        Err("No API key configured".to_string())
    }
}
```

**Deliverables**:
- [ ] `src-tauri/src/commands/ai_providers.rs` (< 400 lines)
- [ ] Update `src-tauri/src/commands/mod.rs` with new exports
- [ ] Register commands in `lib.rs`

---

## 5. Rainy SDK Integration

### 5.1 SDK Features Overview

| Feature | Rainy API Mode | Rainy Cowork Mode | Implementation |
|---------|---------------|-------------------|----------------|
| `simple_chat()` | ✅ | ✅ | `execute_prompt()` |
| `create_chat_completion()` | ✅ | ✅ | Direct calls |
| `create_chat_completion_stream()` | ✅ | ✅ | Streaming support |
| `embed()` | ✅ | ✅ | Embeddings service |
| `web_search()` | ✅ | ✅ | Web research feature |
| `get_cowork_capabilities()` | ❌ | ✅ | Plan management |
| `get_cowork_profile()` | ❌ | ✅ | Profile info |
| `list_available_models()` | ✅ | ✅ | Model discovery |

### 5.2 SDK Configuration

**Cargo.toml**:
```toml
[dependencies]
rainy-sdk = { version = "0.6.1", features = ["rate-limiting", "tracing", "cowork"] }
```

**Feature Flags**:
- `rate-limiting`: Automatic rate limit handling
- `tracing`: Detailed logging and tracing
- `cowork`: Cowork subscription features

### 5.3 SDK Error Handling

```rust
use rainy_sdk::RainyError;

fn handle_sdk_error(e: RainyError) -> AIError {
    match e {
        RainyError::RateLimited { retry_after } => {
            AIError::RateLimited(retry_after)
        }
        RainyError::InvalidApiKey => {
            AIError::InvalidApiKey
        }
        RainyError::ProviderError { provider, message } => {
            AIError::ProviderNotAvailable(format!("{}: {}", provider, message))
        }
        _ => AIError::ProviderError(e.to_string()),
    }
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_provider_registry() {
        let registry = ProviderRegistry::new();
        
        // Register a mock provider
        let mock = Arc::new(MockProvider::new());
        registry.register(mock.clone()).await.unwrap();
        
        // Retrieve provider
        let retrieved = registry.get(ProviderId::OpenAI).await;
        assert!(retrieved.is_some());
    }
    
    #[tokio::test]
    async fn test_intelligent_router() {
        let router = create_test_router().await;
        
        let task = TaskRequirements {
            task_type: TaskType::QuickResponse,
            preferred_model: "gpt-4o".to_string(),
            estimated_input_tokens: 100,
            estimated_output_tokens: 500,
            requires_streaming: false,
            requires_embeddings: false,
            requires_tools: false,
            requires_vision: false,
            max_latency_ms: 2000,
            max_cost_usd: Some(0.01),
        };
        
        let provider = router.route_completion(&task).await;
        assert!(provider.is_ok());
    }
    
    #[tokio::test]
    async fn test_fallback_chain() {
        let chain = FallbackChain::new();
        
        let result = chain.execute(&task, |provider| {
            async move {
                // Simulate failure for first provider
                if provider.provider_id() == ProviderId::OpenAI {
                    Err(AIError::ProviderError("Failed".to_string()))
                } else {
                    Ok("Success".to_string())
                }
            }.boxed()
        }).await;
        
        assert!(result.is_ok());
    }
}
```

### 6.2 Integration Tests

```rust
#[tokio::test]
async fn test_rainy_sdk_integration() {
    let client = RainyClient::with_api_key("test-key").unwrap();
    
    // Test capabilities
    let caps = client.get_cowork_capabilities().await;
    assert!(caps.is_ok());
    
    // Test chat completion
    let response = client.simple_chat("gemini-pro", "Hello").await;
    assert!(response.is_ok());
}

#[tokio::test]
async fn test_provider_switching() {
    let router = create_test_router().await;
    
    // First request - should use preferred provider
    let provider1 = router.route_completion(&task).await.unwrap();
    
    // Simulate failure and retry
    // Should automatically switch to fallback provider
}
```

### 6.3 Frontend Tests

```typescript
// useAIProvider.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAIProvider } from './useAIProvider';

describe('useAIProvider', () => {
  it('should list available providers', async () => {
    const { result } = renderHook(() => useAIProvider());
    
    await act(async () => {
      await result.current.refreshProviders();
    });
    
    expect(result.current.providers.length).toBeGreaterThan(0);
  });
  
  it('should route task to appropriate provider', async () => {
    const { result } = renderHook(() => useAIProvider());
    
    const response = await act(async () => {
      return result.current.executeWithRouting({
        taskType: 'quick_response',
        prompt: 'Hello'
      });
    });
    
    expect(response).toBeDefined();
  });
});
```

---

## 7. Migration & Compatibility

### 7.1 Breaking Changes

| Change | Impact | Migration |
|--------|--------|-----------|
| New `AIProvider` trait | All providers must implement trait | Refactor existing providers |
| `ProviderType` enum expansion | New provider variants | Update match statements |
| Router integration | Routes all AI requests | Add router to state management |

### 7.2 Migration Path

```rust
// OLD: Direct provider usage
let provider = AIProviderManager::new();
let result = provider.execute_prompt(&ProviderType::RainyApi, model, prompt, on_progress).await?;

// NEW: Router-based usage
let router = IntelligentRouter::new(registry);
let task = TaskRequirements {
    task_type: TaskType::QuickResponse,
    preferred_model: model.to_string(),
    // ...
};
let result = router.execute_with_fallback(&task, |provider| {
    async move {
        provider.complete(request).await
    }.boxed()
}).await?;
```

### 7.3 Backward Compatibility

- Keep `AIProviderManager` as wrapper around new router
- Deprecate old methods with warnings
- Provide migration guide in CHANGELOG

---

## 8. Dependencies

### 8.1 Rust Dependencies

```toml
[dependencies]
# Already present
rainy-sdk = { version = "0.6.1", features = ["rate-limiting", "tracing", "cowork"] }
async-trait = "0.1"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.13", features = ["json", "stream"] }
dashmap = "6"

# New for PHASE 3
futures = "0.3"
tower = { version = "0.5", features = ["retry", "timeout"] }
backoff = { version = "0.4", features = ["tokio"] }
prometheus = { version = "0.13", optional = true } # For metrics
```

### 8.2 Frontend Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x"
  }
}
```

---

## 9. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Rainy SDK breaking changes | Medium | High | Pin version, monitor releases |
| Provider API changes | Medium | Medium | Abstract behind trait, update adapters |
| Rate limiting complexity | Medium | Medium | Implement exponential backoff, caching |
| Cost overruns | Low | High | Budget limits, alerts, cost optimizer |
| Circuit breaker false positives | Low | Medium | Configurable thresholds, health checks |
| Performance degradation | Low | High | Load testing, monitoring, profiling |

---

## 10. Success Metrics

### 10.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Provider latency | <200ms (p95) | APM tracing |
| Fallback success rate | >99% | Router metrics |
| Cost savings | >15% | Usage analytics |
| Routing accuracy | >95% | Task outcome tracking |
| SDK integration coverage | 100% | Feature checklist |
| Test coverage | >80% | Code coverage reports |

### 10.2 User Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Provider switching | <50ms perceived | User feedback |
| Error recovery | Transparent to user | Success rate |
| Cost transparency | Clear in UI | User surveys |
| Feature discoverability | >80% find new providers | Analytics |

---

## 11. Appendix

### 11.1 File Structure

```
src-tauri/src/ai/
├── mod.rs                      # Module exports
├── provider_trait.rs           # AIProvider trait definition
├── provider_registry.rs        # Provider registry
├── provider_types.rs           # Shared types
├── provider.rs                 # Legacy manager (deprecated)
├── providers/
│   ├── mod.rs
│   ├── openai.rs
│   ├── anthropic.rs
│   ├── google.rs
│   ├── xai.rs
│   ├── ollama.rs
│   ├── custom.rs
│   └── rainy_sdk.rs
├── router/
│   ├── mod.rs
│   ├── router.rs
│   ├── load_balancer.rs
│   ├── cost_optimizer.rs
│   ├── capability_matcher.rs
│   └── fallback_chain.rs
└── features/
    ├── mod.rs
    ├── web_search.rs
    ├── embeddings.rs
    ├── streaming.rs
    └── usage_analytics.rs

src-tauri/src/commands/
├── ai_providers.rs             # New commands
└── mod.rs                      # Updated exports

src/hooks/
├── useAIProvider.ts            # Updated with routing
├── useStreaming.ts             # New streaming hook
└── useUsageAnalytics.ts        # New analytics hook
```

### 11.2 Configuration

**Settings Schema**:
```json
{
  "ai_providers": {
    "enabled": ["rainy_sdk", "openai", "anthropic"],
    "default_provider": "rainy_sdk",
    "routing": {
      "strategy": "cost_optimized",
      "fallback_enabled": true,
      "max_retries": 3,
      "budget_limit_usd": 100.0
    },
    "providers": {
      "openai": {
        "api_key": "sk-...",
        "base_url": "https://api.openai.com/v1"
      },
      "anthropic": {
        "api_key": "sk-ant-..."
      },
      "ollama": {
        "base_url": "http://localhost:11434"
      }
    }
  }
}
```

### 11.3 API Reference

See individual module documentation for complete API reference.

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-27  
**Status**: Ready for Implementation  
**Next Review**: After Week 10 Completion

---

*RAINY MATE - AI Provider Integration for the Multi-Agent Era* 🌧️
