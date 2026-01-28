// Intelligent Router Module
// Routes requests to optimal AI providers based on various strategies

pub mod capability_matcher;
pub mod circuit_breaker;
pub mod cost_optimizer;
pub mod fallback_chain;
pub mod load_balancer;
pub mod router;

// Re-exports
pub use capability_matcher::CapabilityMatcher;
pub use circuit_breaker::CircuitBreaker;
pub use cost_optimizer::CostOptimizer;
pub use fallback_chain::FallbackChain;
pub use load_balancer::LoadBalancer;
pub use router::IntelligentRouter;
