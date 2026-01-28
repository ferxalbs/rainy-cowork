// Rainy Cowork - AI Module
// AI provider abstraction using rainy-sdk for premium features

pub mod gemini;
pub mod keychain;
pub mod provider;

// PHASE 3: AI Provider Integration
pub mod features;
pub mod provider_registry;
pub mod provider_trait;
pub mod provider_types;
pub mod providers;
pub mod router;

// Legacy exports (deprecated)
pub use provider::AIProviderManager;

// PHASE 3 exports - only what's actively used
pub use provider_registry::ProviderRegistry;
pub use provider_trait::{AIProvider, AIProviderFactory};
pub use provider_types::{
    AIError, ChatCompletionRequest, ChatCompletionResponse, ChatMessage, EmbeddingRequest,
    EmbeddingResponse, ProviderCapabilities, ProviderConfig, ProviderHealth, ProviderId,
    ProviderResult, ProviderType, StreamingCallback, StreamingChunk, TokenUsage,
};
pub use router::IntelligentRouter;

// PHASE 3 items available via full path when needed:
// - providers::{RainySDKProvider, OpenAIProvider, AnthropicProvider, XAIProvider}
// - router::{LoadBalancer, CostOptimizer, CapabilityMatcher, FallbackChain, CircuitBreaker}
// - features::{EmbeddingService, StreamingService, WebSearchService, UsageAnalytics}
