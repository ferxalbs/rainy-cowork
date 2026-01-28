# PHASE 4 Implementation Plan: Advanced UI/UX & SDK Integration

**Project**: Rainy Cowork (RAINY MATE)  
**Version**: 0.4.26
**Status**: Planning  
**Target**: Week 13-15 (PHASE 4: Advanced UI/UX)  
**Last Updated**: 2026-01-28  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [PHASE 4 Architecture](#3-phase-4-architecture)
4. [Rainy SDK Integration Strategy](#4-rainy-sdk-integration-strategy)
5. [HeroUI v3 Component Integration](#5-heroui-v3-component-integration)
6. [Detailed Implementation Plan](#6-detailed-implementation-plan)
7. [Frontend Implementation](#7-frontend-implementation)
8. [Backend Enhancements](#8-backend-enhancements)
9. [Testing Strategy](#9-testing-strategy)
10. [Success Metrics](#10-success-metrics)

---

## 1. Executive Summary

### 1.1 PHASE 4 Scope and Objectives

PHASE 4 focuses on two critical areas:

1. **Advanced UI/UX Implementation**: Leveraging HeroUI v3 components to create a polished, professional, and accessible user interface that matches the application's advanced backend capabilities.

2. **Rainy SDK Integration for System Viability**: Adapting the SDK integration to ensure maximum reliability by properly utilizing both **Rainy API Mode** and **Rainy Cowork Mode** as appropriate for different use cases.

### 1.2 Key Deliverables

| Component | Description | Status |
|-----------|-------------|--------|
| **HeroUI v3 Components** | Full integration of HeroUI v3 compound components | 🟡 Planned |
| **Main Application Layout** | Three-panel layout (Sidebar, Main, Context) | 🟡 Planned |
| **Cowork Panel** | Central AI interaction interface | 🟡 Planned |
| **Task Dashboard** | Visual task management with progress | 🟡 Planned |
| **Provider Selector** | Enhanced AI provider selection UI | 🟡 Planned |
| **Rainy SDK Dual-Mode** | Proper Rainy API vs Cowork mode selection | 🟡 Planned |
| **Accessibility** | Full ARIA support, keyboard navigation | 🟡 Planned |
| **Theme System** | Complete light/dark/system theme | 🟡 Planned |

### 1.3 Success Criteria

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| UI Component Coverage | >90% | HeroUI v3 components utilized |
| Accessibility Score | 100% | WCAG 2.1 AA compliance |
| SDK Mode Utilization | 100% | Proper mode selection per use case |
| Theme Consistency | 100% | All components themed correctly |
| Bundle Size Impact | <20% | Increase from PHASE 3 |

---

## 2. Current State Assessment

### 2.1 Already Implemented ✅

**PHASE 1: Core Cowork Engine (Completed)**
- Workspace management with permissions
- File operations engine with versioning
- Task queue system with priorities

**PHASE 2: Intelligence Layer (Completed)**
- Multi-agent system (Director, 6 Specialized Agents, Critic, Governor)
- Memory system (Short-term RingBuffer, Long-term LanceDB)
- Reflection engine for self-improvement

**PHASE 3: AI Provider Integration (Completed)**
- Provider abstraction layer with `AIProvider` trait
- Individual providers: OpenAI, Anthropic, xAI, Rainy SDK
- Intelligent router with load balancing, cost optimization
- Circuit breaker and fallback chain
- 14 Tauri commands for provider management

**UI Foundation (Existing)**
- HeroUI v3 beta 5 installed and configured
- Basic layout components (`TahoeLayout`, `Sidebar`, `Header`)
- Theme system with light/dark modes
- Tailwind CSS v4 with custom design tokens

### 2.2 Rainy SDK Current Integration ✅

**Two-Mode Architecture Understood:**

#### Rainy API Mode
- **Purpose**: Standard pay-as-you-go API access
- **API Key Format**: `ra-<api_key>`
- **Best For**: Direct AI provider access, no subscription limits
- **Methods**: `simple_chat()`, `chat_completion()`, `web_search()`, `embed()`

#### Rainy Cowork Mode  
- **Purpose**: Subscription-based access with tiered plans
- **API Key Format**: `ra-cowork<api_key>` (57 characters)
- **Best For**: Users with Cowork subscriptions (Free, GoPlus, Plus, Pro, ProPlus)
- **Methods**: `get_cowork_capabilities()`, `get_cowork_profile()`, plan-limited access

### 2.3 Not Implemented / Needs Enhancement ❌

**UI Components**
- Missing HeroUI v3 compound component patterns
- No `Card.Header`, `Card.Content` usage
- Limited `Modal`, `Tabs`, `Toast` implementation
- Missing `Select` for provider selection
- Missing `Progress` for task tracking

**Layout**
- Current layout doesn't match PHASE 4 design
- Missing three-panel layout (Workspaces, Cowork Panel, Tasks/Analytics)
- No recent changes panel
- Missing agent visualization

**SDK Integration Gaps**
- No automatic mode selection logic
- Missing streaming UI integration
- Web search UI not connected to SDK

---

## 3. PHASE 4 Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🎨 PRESENTATION LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  HeroUI v3 + React 19 + Tailwind CSS v4                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   Sidebar    │  │    Main      │  │   Context    │              │   │
│  │  │  (Workspaces)│  │(Cowork Panel)│  │  (Tasks/     │              │   │
│  │  │              │  │              │  │   Analytics) │              │   │
│  │  │ • Folders    │  │ • Chat Input │  │ • Progress   │              │   │
│  │  │ • Agents     │  │ • Responses  │  │ • History    │              │   │
│  │  │ • Tasks      │  │ • Actions    │  │ • Changes    │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│                           🔌 INTEGRATION LAYER                               │
│  Tauri v2 Commands + Event Bus + Streaming Support                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                           🧠 AI PROVIDER LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Rainy SDK Dual-Mode Integration                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  Rainy API   │  │  Rainy       │  │  Individual  │              │   │
│  │  │  Mode        │  │  Cowork      │  │  Providers   │              │   │
│  │  │              │  │  Mode        │  │              │              │   │
│  │  │ • Direct AI  │  │ • Subscription│  │ • OpenAI    │              │   │
│  │  │ • Pay-as-go  │  │ • Tiered     │  │ • Anthropic │              │   │
│  │  │ • No limits  │  │ • Features   │  │ • xAI       │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Application Layout Design

```
┌─────────────────────────────────────────────────────────────────────┐
│  🌧️ RAINY MATE       [🔍 Search] [⚙️ Settings] [👤 Profile]        │
├────────────────┬────────────────────────────────────────────────────┤
│                │                                                    │
│  📁 WORKSPACES │  💬 COWORK PANEL                                   │
│  ───────────── │  ┌──────────────────────────────────────────────┐  │
│  > Documents   │  │ What would you like me to help you with?     │  │
│  > Projects    │  │                                              │  │
│  > Downloads   │  │ [Natural language input area with AI assist] │  │
│                │  │                                              │  │
│  🤖 AGENTS     │  └──────────────────────────────────────────────┘  │
│  ───────────── │  [🧠 GPT-4] [🔒 Local] [▶️ Execute]                │
│  ○ Director    │                                                    │
│  ○ Researcher  │  📊 ACTIVE TASKS                                   │
│  ○ Executor    │  ┌──────────────────────────────────────────────┐  │
│  ○ Creator     │  │ ⚡ Organizing downloads... [Progress: 75%]   │  │
│                │  │ [Pause] [Stop] [View Details]                │  │
│  📋 TASKS      │  └──────────────────────────────────────────────┘  │
│  ───────────── │  ┌──────────────────────────────────────────────┐  │
│  ✓ Completed   │  │ 📝 Generating report...    [Progress: 30%]   │  │
│  ⏳ Running    │  │ [Pause] [Stop] [View Details]                │  │
│  📝 Queued     │  └──────────────────────────────────────────────┘  │
│                │                                                    │
│  📈 ANALYTICS  │  📁 RECENT CHANGES                                 │
│  ───────────── │  ┌──────────────────────────────────────────────┐  │
│  Credits Used  │  │ ✏️ report.md     (modified)    [Undo] [View] │  │
│  Tasks Today   │  │ ➕ summary.txt   (created)     [Undo] [View] │  │
│  Success Rate  │  │ 🗑️ temp.log     (deleted)     [Undo] [View] │  │
│                │  └──────────────────────────────────────────────┘  │
└────────────────┴────────────────────────────────────────────────────┘
```

---

## 4. Rainy SDK Integration Strategy

### 4.1 Dual-Mode Selection Logic

```rust
// src-tauri/src/ai/sdk_mode_selector.rs

pub enum SDKMode {
    /// Rainy API Mode - Direct AI access, pay-as-you-go
    RainyApi,
    /// Rainy Cowork Mode - Subscription-based, tiered plans
    RainyCowork,
}

pub struct SDKModeSelector {
    client: RainyClient,
    mode: SDKMode,
}

impl SDKModeSelector {
    /// Determine best mode based on API key format and use case
    pub fn select_mode(api_key: &str, use_case: UseCase) -> SDKMode {
        if api_key.starts_with("ra-cowork") {
            // Cowork key detected - use Cowork mode
            SDKMode::RainyCowork
        } else if api_key.starts_with("ra-") {
            // Regular Rainy API key
            match use_case {
                // Use Rainy API mode for direct AI operations
                UseCase::DirectCompletion => SDKMode::RainyApi,
                UseCase::Streaming => SDKMode::RainyApi,
                UseCase::Embedding => SDKMode::RainyApi,
                // Use Cowork mode for subscription features
                UseCase::WebResearch => SDKMode::RainyCowork,
                UseCase::DocumentExport => SDKMode::RainyCowork,
            }
        } else {
            // Fallback to Rainy API mode
            SDKMode::RainyApi
        }
    }
}
```

### 4.2 Mode-Specific Features

| Feature | Rainy API Mode | Rainy Cowork Mode | Implementation |
|---------|---------------|-------------------|----------------|
| Chat Completion | ✅ Full access | ✅ Plan-limited | Use SDK `chat_completion()` |
| Streaming | ✅ Supported | ✅ Supported | Use SDK `create_chat_completion_stream()` |
| Web Search | ❌ Not available | ✅ Requires plan | Check `features.web_research` |
| Embeddings | ✅ Full access | ✅ Plan-limited | Use SDK `embed()` |
| Usage Tracking | ❌ None | ✅ Built-in | Use `CoworkUsage` |
| Rate Limiting | ✅ 10 req/s | ✅ Plan-based | SDK handles automatically |

### 4.3 SDK Integration Modules

```
src-tauri/src/ai/sdk/
├── mod.rs                    # Module exports
├── mode_selector.rs          # Mode selection logic
├── api_mode.rs               # Rainy API mode implementation
├── cowork_mode.rs            # Rainy Cowork mode implementation
├── streaming.rs              # Streaming response handling
└── web_search.rs             # Web search integration
```

---

## 5. HeroUI v3 Component Integration

### 5.1 Component Mapping

| HeroUI Component | Current Usage | PHASE 4 Enhancement | Location |
|------------------|---------------|---------------------|----------|
| `Card` | Basic usage | Compound pattern: `Card.Header`, `Card.Content`, `Card.Footer` | Task cards, workspace panels |
| `Button` | Basic usage | All variants: primary, secondary, tertiary, danger | Actions, navigation |
| `Progress` | Not used | Linear and circular progress | Task execution |
| `Modal` | Not used | Compound pattern with `Modal.Header`, `Modal.Content` | Confirmations, details |
| `Tabs` | Not used | `Tabs.List`, `Tabs.Panel` | Workspace views |
| `Toast` | Not used | Notification system | All actions |
| `TextArea` | Not used | Auto-resize, AI assist | Task input |
| `Select` | Not used | Provider selection | AI provider picker |
| `Switch` | Not used | Settings toggles | Feature flags |
| `Dropdown` | Not used | Context menus | File operations |
| `Avatar` | Not used | Agent visualization | Agent list |
| `Spinner` | Not used | Loading states | Async operations |
| `Badge` | Not used | Status indicators | Task status |
| `Tooltip` | Not used | Help text | Icon buttons |
| `Separator` | Not used | Visual dividers | Sidebar |
| `ScrollShadow` | Not used | Scroll indicators | Long lists |

### 5.2 Component Structure

```tsx
// Example: Task Card with HeroUI v3 Compound Pattern
import { Card, Button, Progress, Badge } from "@heroui/react";

<TaskCard>
  <Card>
    <Card.Header>
      <div className="flex items-center gap-2">
        <Badge color={task.status === 'running' ? 'primary' : 'default'}>
          {task.status}
        </Badge>
        <span className="font-semibold">{task.name}</span>
      </div>
    </Card.Header>
    <Card.Content>
      <p className="text-muted-foreground">{task.description}</p>
      <Progress value={task.progress} className="mt-2" />
    </Card.Content>
    <Card.Footer className="flex justify-end gap-2">
      <Button variant="secondary" size="sm">Pause</Button>
      <Button variant="danger" size="sm">Cancel</Button>
    </Card.Footer>
  </Card>
</TaskCard>
```

---

## 6. Detailed Implementation Plan

### Week 13: SDK Integration & Core Components

#### Day 1-2: Rainy SDK Mode Selector
- [ ] Create `ai/sdk/mode_selector.rs`
- [ ] Implement API key format detection
- [ ] Implement use case-based mode selection
- [ ] Add comprehensive tests

#### Day 3-4: SDK Streaming Integration
- [ ] Create `ai/sdk/streaming.rs`
- [ ] Integrate SDK streaming with frontend
- [ ] Create `useSDKStreaming` hook
- [ ] Add streaming UI components

#### Day 5-7: HeroUI v3 Core Components
- [ ] Update `Card` usage to compound pattern
- [ ] Implement `Progress` components for tasks
- [ ] Create `Modal` components for confirmations
- [ ] Add `Button` variants (primary, secondary, tertiary)

### Week 14: Layout & Navigation

#### Day 1-3: Three-Panel Layout
- [ ] Refactor `TahoeLayout` to three-panel design
- [ ] Implement collapsible sidebar
- [ ] Create responsive breakpoints
- [ ] Add drag-to-resize functionality

#### Day 4-5: Cowork Panel
- [ ] Create `CoworkPanel` component
- [ ] Implement chat input with HeroUI `TextArea`
- [ ] Add provider selector with HeroUI `Select`
- [ ] Create message history display

#### Day 6-7: Task Dashboard
- [ ] Create task visualization with `Progress`
- [ ] Implement task cards with HeroUI compound pattern
- [ ] Add task actions (pause, resume, cancel)
- [ ] Create task queue visualization

### Week 15: Polish & Accessibility

#### Day 1-3: Theme System
- [ ] Complete theme variable mapping
- [ ] Add high contrast mode
- [ ] Implement reduced motion option
- [ ] Test theme consistency across components

#### Day 4-5: Accessibility
- [ ] Add full keyboard navigation
- [ ] Implement ARIA labels and roles
- [ ] Add focus indicators
- [ ] Test with screen readers

#### Day 6-7: Integration & Testing
- [ ] End-to-end testing of all components
- [ ] Performance optimization
- [ ] Bundle size analysis
- [ ] Documentation updates

---

## 7. Frontend Implementation

### 7.1 New Components to Create

```
src/components/
├── layout/
│   ├── MainLayout.tsx           # Three-panel layout
│   ├── Sidebar.tsx              # Enhanced with HeroUI
│   ├── CoworkPanel.tsx          # Central AI interface
│   └── TaskPanel.tsx            # Task visualization
├── ui/
│   ├── TaskCard.tsx             # HeroUI Card compound
│   ├── ProviderSelector.tsx     # HeroUI Select
│   ├── ChatInput.tsx            # HeroUI TextArea
│   ├── ProgressIndicator.tsx    # HeroUI Progress
│   ├── NotificationToast.tsx    # HeroUI Toast
│   └── ModalDialog.tsx          # HeroUI Modal
└── providers/
    └── SDKProvider.tsx          # Rainy SDK context
```

### 7.2 New Hooks to Create

```
src/hooks/
├── useSDKMode.ts               # SDK mode selection
├── useSDKStreaming.ts          # SDK streaming
├── useNotification.ts          # Toast notifications
└── useKeyboardNavigation.ts    # Accessibility
```

### 7.3 Theme Configuration

```typescript
// src/config/theme.ts
export const rainyMateTheme = {
  colors: {
    primary: { DEFAULT: "#4F46E5", foreground: "#FFFFFF" },
    secondary: { DEFAULT: "#7C3AED", foreground: "#FFFFFF" },
    success: { DEFAULT: "#10B981" },
    warning: { DEFAULT: "#F59E0B" },
    danger: { DEFAULT: "#EF4444" },
  },
  effects: {
    blur: "backdrop-blur-md",
    glass: "bg-white/70 dark:bg-gray-900/70",
  },
};
```

---

## 8. Backend Enhancements

### 8.1 New Tauri Commands

```rust
// SDK Mode Commands
#[command]
pub async fn get_sdk_mode(api_key: String) -> Result<SDKMode, String>;

#[command]
pub async fn select_optimal_mode(
    api_key: String, 
    use_case: UseCase
) -> Result<SDKMode, String>;

// Streaming Commands
#[command]
pub async fn stream_chat_completion(
    request: ChatRequest,
    window: Window
) -> Result<(), String>;

// Enhanced Provider Commands
#[command]
pub async fn get_provider_recommendations(
    task_type: TaskType
) -> Result<Vec<ProviderRecommendation>, String>;
```

### 8.2 SDK Integration Structure

```rust
// src-tauri/src/ai/sdk/mod.rs

pub mod mode_selector;
pub mod api_mode;
pub mod cowork_mode;
pub mod streaming;
pub mod web_search;

pub use mode_selector::{SDKMode, SDKModeSelector};
pub use streaming::StreamingHandler;
```

---

## 9. Testing Strategy

### 9.1 Component Testing
- Unit tests for all HeroUI component wrappers
- Accessibility testing with axe-core
- Visual regression testing with Storybook

### 9.2 Integration Testing
- SDK mode selection logic
- Provider switching
- Theme switching
- Keyboard navigation

### 9.3 End-to-End Testing
- Complete user workflows
- Multi-agent task execution
- Provider fallback scenarios
- Accessibility compliance

---

## 10. Success Metrics

### 10.1 UI/UX Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Component Coverage | >90% | % of HeroUI components used |
| Theme Consistency | 100% | Visual inspection across themes |
| Accessibility Score | 100% | WCAG 2.1 AA compliance |
| User Satisfaction | >4.5/5 | User feedback surveys |

### 10.2 SDK Integration Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Mode Selection Accuracy | 100% | Correct mode per use case |
| Streaming Latency | <100ms | Time to first chunk |
| Fallback Success Rate | >99% | Recovery from failures |
| SDK Feature Utilization | 100% | All SDK features used |

### 10.3 Performance Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Bundle Size | <5MB | Gzipped JavaScript |
| First Contentful Paint | <1.5s | Lighthouse |
| Time to Interactive | <3s | Lighthouse |
| Memory Usage | <200MB | Chrome DevTools |

---

## Appendix A: HeroUI v3 Component Quick Reference

### Compound Component Patterns

```tsx
// Card Pattern
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Content>Body</Card.Content>
  <Card.Footer>Actions</Card.Footer>
</Card>

// Modal Pattern
<Modal>
  <Modal.Header>Title</Modal.Header>
  <Modal.Content>Body</Modal.Content>
  <Modal.Footer>Actions</Modal.Footer>
</Modal>

// Tabs Pattern
<Tabs>
  <Tabs.List>
    <Tabs.Tab id="1">Tab 1</Tabs.Tab>
    <Tabs.Tab id="2">Tab 2</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="1">Content 1</Tabs.Panel>
  <Tabs.Panel id="2">Content 2</Tabs.Panel>
</Tabs>
```

### Semantic Variants

```tsx
// Button Variants (Semantic)
<Button variant="primary">Save</Button>      // Main action
<Button variant="secondary">Edit</Button>    // Alternative
<Button variant="tertiary">Cancel</Button>   // Dismissive
<Button variant="danger">Delete</Button>     // Destructive
```

---

## Appendix B: Rainy SDK API Reference

### Mode Detection

```rust
// Detect mode from API key
fn detect_mode(api_key: &str) -> SDKMode {
    if api_key.starts_with("ra-cowork") {
        SDKMode::RainyCowork
    } else if api_key.starts_with("ra-") {
        SDKMode::RainyApi
    } else {
        SDKMode::RainyApi // Default fallback
    }
}
```

### Streaming Usage

```rust
// Create streaming completion
let request = ChatCompletionRequest::new(model, messages)
    .with_stream(true);

let mut stream = client.create_chat_completion_stream(request).await?;

while let Some(chunk) = stream.next().await {
    match chunk {
        Ok(response) => {
            // Send to frontend via Tauri event
            window.emit("chat-chunk", response)?;
        }
        Err(e) => {
            window.emit("chat-error", e.to_string())?;
        }
    }
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-28  
**Author**: Architecture Team  
**Reviewers**: TBD