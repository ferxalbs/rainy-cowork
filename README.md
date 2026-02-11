# 🌧️ Rainy MaTE

**The Open-Source AI Desktop Agent Platform** — Transform your desktop into an intelligent AI coworker powered by Rainy SDK.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.0+-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![Rust](https://img.shields.io/badge/Rust-1.70+-000000.svg)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178c6.svg)](https://www.typescriptlang.org/)
[![HeroUI](https://img.shields.io/badge/HeroUI-3.0+-ff6b6b.svg)](https://heroui.com/)

> 🚀 **Cross-Platform AI Agent** built with Tauri, React, and Rust  
> 🔒 **Privacy-First** — Your data stays on your device  
> 🎯 **Multi-Provider AI** — OpenAI, Gemini, Groq, Anthropic, xAI, and more  
> ⚡ **Real-Time Streaming** — Token-by-token AI responses  
> 🛡️ **Enterprise Security** — Airlock permissions & audit trails

---

## 🎯 What is Rainy MaTE?

**Rainy MaTE** (formerly Rainy Cowork) is an open-source AI desktop agent platform that combines the power of multiple AI providers with local file operations, web research, and intelligent automation. Built on the **Rainy SDK**, it provides a unified interface to leverage advanced AI capabilities while maintaining complete privacy and control.

### The Problem

Proprietary AI agents like Claude Cowork are expensive ($20-200/month), macOS-only, and keep your data in the cloud. They lock you into a single AI provider and offer limited customization.

### The Solution

Rainy MaTE is a free, open-source, cross-platform AI desktop agent that gives you:

- ✅ **Complete Privacy** — Your files never leave your device
- ✅ **Cross-Platform** — Windows, macOS, and Linux support
- ✅ **Multi-AI Provider** — Choose from OpenAI, Gemini, Groq, Anthropic, xAI, and more
- ✅ **Zero Subscription** — Use your own API keys, pay only for what you use
- ✅ **Full Control** — Customize, extend, and modify as needed
- ✅ **Open Source** — Transparent, auditable, community-driven
- ✅ **Enterprise Ready** — Audit trails, permission policies, SLO monitoring

---

## ✨ Key Features

### 🤖 Intelligent AI Agent

- **ReAct Workflow Engine** — Think → Act loop for autonomous task execution
- **Streaming Responses** — Token-by-token AI output in real-time
- **Multi-Step Planning** — Complex task breakdown and execution
- **Context Awareness** — Memory persistence across conversations
- **Agent Customization** — Create specialized agents with custom personas

### 🧠 Multi-Provider AI Integration

| Provider | Models | Key Features |
|----------|--------|--------------|
| **OpenAI** | GPT-4o, GPT-5, O3, O4-mini | Advanced reasoning, tool calling |
| **Google Gemini** | Gemini 3 Pro, 2.5 Flash/Pro | Thinking capabilities, thought signatures |
| **Anthropic** | Claude 3.5 Sonnet, Opus, Haiku | Long context, vision support |
| **Groq** | Llama 3.1, Llama 3.3 | Ultra-fast inference |
| **Cerebras** | Llama 3.1 8B | High-performance processing |
| **xAI** | Grok-3 | Real-time information |
| **Enosis Labs** | Astronomer 1/2 series | Specialized AI models |

### 📁 Intelligent File Operations

- **Bulk File Management** — Organize thousands of files in seconds
- **Smart Categorization** — AI-powered file sorting and tagging
- **Content Extraction** — Pull text, metadata, and insights from documents
- **Batch Processing** — Apply operations across multiple files
- **Version Control** — Track file changes and maintain history

### 🌐 Web Research & Content

- **Tavily-Powered Search** — Real-time information retrieval
- **Content Extraction** — Convert web pages to clean markdown
- **Research Automation** — Gather, analyze, and synthesize information
- **Citation Management** — Automatic source tracking

### 🔐 Enterprise Security (Airlock System)

| Level | Name | Operations | Approval |
|-------|------|------------|----------|
| **0** | Safe | Read-only operations | Auto-approved |
| **1** | Sensitive | Write operations | Notification |
| **2** | Dangerous | Execute/Delete | Explicit approval |

### ☁️ Cloud Cortex (Rainy ATM)

- **Distributed Neural System** — Desktop-to-cloud coordination
- **Command Queue & Execution** — Persistent command buffer
- **Metrics & SLO Monitoring** — Endpoint performance tracking
- **Alert Management** — Retention, acknowledgment, audit trails
- **Permission Policies** — Workspace-specific access controls
- **Audit Trail** — Immutable policy change history

---

## 🏗️ Architecture

Rainy MaTE uses a modern, modular architecture designed for security, performance, and extensibility.

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│   ┌─────────────────┐    ┌─────────────────────────────────┐   │
│   │   React + Vite  │    │         HeroUI Components       │   │
│   │   (TypeScript)  │    │     (Modern, Accessible UI)    │   │
│   └────────┬────────┘    └─────────────────────────────────┘   │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Tauri 2.0 Bridge                      │   │
│   │         (IPC Commands • File System • Notifications)   │   │
│   └─────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     Rust Backend                         │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│   │   │ AgentRuntime │  │   SkillExec │  │ FileManager │  │   │
│   │   │  (ReAct)     │  │  (Skills)   │  │  (Ops)      │  │   │
│   │   └──────────────┘  └──────────────┘  └─────────────┘  │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│   │   │   Memory     │  │  Intelligent │  │ NeuralLink │  │   │
│   │   │  (Persist)   │  │   Router     │  │ (Cloud)     │  │   │
│   │   └──────────────┘  └──────────────┘  └─────────────┘  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Rainy SDK                             │   │
│   │      (Unified Multi-Provider AI Interface)             │   │
│   └─────────────────────────────────────────────────────────┘   │
│            │           │           │           │                │
│            ▼           ▼           ▼           ▼                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │   OpenAI   │  Gemini  │  Groq  │  Anthropic  │  xAI    │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Rainy ATM (Cloud Cortex)                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │   Hono API (Bun) • Turso Database • Pub/Sub Events    │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │   │
│   │ CommandQueue │  │  SLO Monitor │  │  PermissionSvc    │  │   │
│   └──────────────┘  └──────────────┘  └────────────────────┘  │   │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 19 + Vite + HeroUI | Modern, accessible user interface |
| **Backend** | Rust + Tauri 2.0 | Secure, performant native operations |
| **AI Layer** | Rainy SDK v0.6.4 | Unified multi-provider access |
| **Intelligence** | AgentRuntime v2 + ReAct | Autonomous workflow execution |
| **Routing** | IntelligentRouter | Load balancing & cost optimization |
| **Memory** | SQLite + ContextWindow | Persistent & sliding context |
| **Security** | Airlock + Permissions | Tiered access control |
| **Cloud** | Rainy ATM (Bun + Hono) | Distributed operations & monitoring |
| **Docs** | Next.js + MDX | Developer documentation |

---

## 📦 Project Structure

```
rainy-cowork/                      # Main repository (now Rainy MaTE)
├── src/                            # React TypeScript frontend
│   ├── components/                 # UI components
│   │   ├── agent-chat/            # Chat interface & message bubbles
│   │   ├── agents/                # Agent builder & management
│   │   ├── ai/                    # AI provider configuration
│   │   ├── neural/                # Neural Link UI (Cloud Cortex)
│   │   └── ...
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAgentRuntime.ts     # Agent execution hook
│   │   ├── useAIProvider.ts       # Provider management
│   │   ├── useNeuralService.ts    # Cloud connection
│   │   └── ...
│   ├── services/                  # Frontend services
│   │   └── tauri.ts              # Tauri API bindings
│   └── types/                     # TypeScript type definitions
├── src-tauri/                     # Rust backend (Tauri 2.0)
│   └── src/
│       ├── ai/                    # AI integration
│       │   ├── agent/            # Agent runtime (v2)
│       │   │   ├── runtime.rs     # Core runtime orchestrator
│       │   │   ├── workflow.rs    # ReAct workflow engine
│       │   │   ├── memory.rs      # Memory persistence
│       │   │   ├── context_window.rs  # Sliding context
│       │   │   └── manager.rs     # Agent lifecycle
│       │   ├── providers/         # AI provider implementations
│       │   │   ├── openai.rs      # OpenAI provider
│       │   │   ├── anthropic.rs   # Anthropic provider
│       │   │   ├── gemini.rs      # Google Gemini provider
│       │   │   ├── groq.rs        # Groq provider
│       │   │   ├── xai.rs         # xAI (Grok) provider
│       │   │   └── rainy_sdk.rs   # Rainy SDK bridge
│       │   └── router/            # Intelligent routing
│       │       ├── router.rs      # Main router
│       │       ├── load_balancer.rs
│       │       ├── cost_optimizer.rs
│       │       └── circuit_breaker.rs
│       ├── commands/              # Tauri commands
│       │   ├── agent.rs          # Agent execution
│       │   ├── neural.rs         # Cloud Cortex commands
│       │   ├── airlock.rs        # Permission commands
│       │   └── ...
│       ├── services/              # Business logic
│       │   ├── skill_executor.rs # Tool/skill execution
│       │   ├── memory/           # Memory management
│       │   │   ├── long_term.rs
│       │   │   └── short_term.rs
│       │   ├── neural_service.rs # Cloud Cortex client
│       │   ├── airlock.rs        # Permission enforcement
│       │   └── command_poller.rs # Command queue polling
│       └── models/                # Data models
├── rainy-mate-docs/               # Documentation site (Next.js)
├── rainy-mate-web/               # Landing page website
├── rainy-atm/                    # Cloud Cortex (Operations)
│   └── src/
│       ├── routes/               # Hono API routes
│       ├── db/                   # Database schema
│       └── services/             # Cloud services
├── rainy-sdk/                    # Rust SDK (separate crate)
└── rainy-api-v2/                 # API Gateway (Bun + Hono)
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/) 1.70+
- [Bun](https://bun.sh/) (for API development)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation

```bash
# Clone the repository
git clone https://github.com/enosislabs/rainy-cowork.git
cd rainy-cowork

# Install dependencies
pnpm install

# Start the full development environment
pnpm tauri dev
```

### Cloud Cortex (Rainy ATM) Setup

```bash
# Navigate to ATM directory
cd rainy-atm

# Install dependencies
bun install

# Start development server
bun run dev
```

### Build for Production

```bash
# Build the desktop app
pnpm tauri build

# Build documentation
cd rainy-mate-docs && pnpm build

# Build landing page
cd rainy-mate-web && pnpm build
```

---

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install root dependencies |
| `pnpm dev` | Start Vite dev server (UI only) |
| `pnpm tauri dev` | Start full desktop app |
| `pnpm tauri build` | Build production desktop app |
| `pnpm preview` | Preview production build |
| `cargo test` | Run Rust tests |
| `cd rainy-atm && bun run dev` | Start Cloud Cortex |
| `cd rainy-api-v2 && bun run dev` | Start API Gateway |

---

## 🔧 Configuration

### AI Provider Setup

Configure your preferred AI providers in the settings panel or via environment variables:

```bash
# AI Provider API Keys
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key
XAI_API_KEY=your_xai_key

# Rainy SDK Configuration
RAINY_API_KEY=your_rainy_api_key
RAINY_API_URL=https://api.rainy.com
```

### Folder Permissions

Grant specific folder access to enable AI operations:

- **Downloads** — For file organization tasks
- **Documents** — For document processing and creation
- **Desktop** — For quick access to current work
- **Custom Folders** — Project-specific directories

---

## 🤖 Agent Capabilities & Skills

The Rainy MaTE agent connects to Cloud Cortex via Rainy ATM and executes local skills defined in `skill_executor.rs`.

### Available Skills

| Category | Skills |
|----------|--------|
| **Filesystem** | `read_file`, `write_file`, `list_files`, `search_files`, `delete_file`, `move_file` |
| **Browser** | `browse_url`, `click_element`, `screenshot`, `get_page_content` |
| **Shell** | `execute_command` (Allowed: npm, cargo, git, ls, grep, echo, cat) |
| **Web** | `web_search`, `read_web_page` |
| **Document** | `extract_text`, `convert_format` |

### Adding New Skills

1. Define the skill method in [`src-tauri/src/services/skill_executor.rs`](src-tauri/src/services/skill_executor.rs)
2. Add the tool definition to `get_tool_definitions()`
3. Implement the handler (e.g., `handle_new_skill`)
4. Update `DEFAULT_SKILLS` in [`src/components/neural/NeuralPanel.tsx`](src/components/neural/NeuralPanel.tsx)

---

## 🧪 Testing

### Rust Tests

```bash
# Run all Rust tests
cd src-tauri && cargo test

# Run specific test modules
cargo test --lib agent::runtime
cargo test --lib ai::router
```

### Test Coverage

The project includes comprehensive test coverage:

- **Unit Tests** — Core business logic in Rust
- **Integration Tests** — Tauri command execution
- **Verification Tests** — Agent workflow end-to-end tests
- **Memory Tests** — Context window and persistence tests

---

## 📚 Documentation

Comprehensive documentation is available at:

- **[Rainy MaTE Docs](https://rainy-mate-docs.vercel.app/)** — Main documentation
- **[API Reference](https://rainy-mate-docs.vercel.app/docs/)** — Detailed API docs
- **[Architecture](https://rainy-mate-docs.vercel.app/docs/architecture)** — System architecture
- **[Features](https://rainy-mate-docs.vercel.app/docs/features)** — Feature overview
- **[Contributing](https://rainy-mate-docs.vercel.app/docs/contributing)** — Contribution guide

---

## 🔐 Security

### Airlock Security Levels

Rainy MaTE implements a three-tier security system for agent operations:

| Level | Name | Description | Approval Required |
|-------|------|-------------|-------------------|
| **0** | **Safe** | Read-only operations | Auto-approved |
| **1** | **Sensitive** | Write operations | Notification |
| **2** | **Dangerous** | Execute/Delete | Explicit approval |

### Permission Policies

Enterprise-grade permission management with:

- **Workspace-Specific Policies** — Granular access control
- **Audit Trail** — Immutable policy change history
- **SLO Monitoring** — Service level objective tracking
- **Alert Management** — Retention, acknowledgment, and audit

### Security Best Practices

- API keys stored in OS keychain
- Local-first data by default
- Sandboxed AI operations
- Explicit user permissions for sensitive operations

---

## 🤝 Contributing

We welcome contributions from the community! Rainy MaTE is built by developers, for developers.

### Ways to Contribute

- 🐛 **Bug Reports** — Help us identify and fix issues
- ✨ **Feature Requests** — Suggest new capabilities
- 💻 **Code Contributions** — Submit pull requests
- 📚 **Documentation** — Improve guides and examples
- 🎨 **UI/UX** — Enhance the user experience
- 🧪 **Testing** — Help ensure quality and reliability

### Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat(area): add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

See our [Contributing Guide](https://rainy-mate-docs.vercel.app/docs/contributing) for detailed information.

---

## 📄 License & Legal

This project is licensed under the **MIT License** with additional terms for AI services.

### Legal Documentation

- **[LICENSE](LICENSE)** — MIT License terms
- **[TERMS_OF_USE.md](TERMS_OF_USE.md)** — Complete terms and conditions
- **[PRIVACY_POLICY.md](PRIVACY_POLICY.md)** — Data and privacy handling
- **[SECURITY.md](SECURITY.md)** — Security practices and reporting

### Enosis Labs Integration

When using Enosis Labs AI services, you must also comply with:
- [Enosis Labs Terms of Service](https://enosislabs.vercel.app/terms)
- [Enosis Labs Privacy Policy](https://enosislabs.vercel.app/privacy)

---

## 🌟 Acknowledgments

Rainy MaTE is inspired by the agentic AI revolution and built on the shoulders of giants:

- **Tauri** — For the amazing cross-platform framework
- **React** — For the powerful UI library
- **Rust** — For performance and safety
- **HeroUI** — For beautiful, accessible components
- **OpenAI, Google, Anthropic, xAI** — For advancing AI capabilities
- **The Open Source Community** — For making this possible

Special thanks to all contributors who help make Rainy MaTE better every day! 🎉

---

## 📞 Support

- 📖 **[Documentation](https://rainy-mate-docs.vercel.app/)** — Comprehensive guides
- 💬 **[Discussions](https://github.com/enosislabs/rainy-cowork/discussions)** — Community Q&A
- 🐛 **[Issues](https://github.com/enosislabs/rainy-cowork/issues)** — Bug reports
- 📧 **Email** — Direct support for complex issues

---

<div align="center">

**Built with ❤️ for the open source community**

[⭐ Star on GitHub](https://github.com/enosislabs/rainy-cowork) • [📖 Documentation](https://rainy-mate-docs.vercel.app/) • [💬 Community](https://github.com/enosislabs/rainy-cowork/discussions)

**Rainy MaTE** — *The Open-Source AI Desktop Agent Platform*

</div>

---

## 📚 Documentation

Comprehensive documentation is available at:

- **[Rainy MaTE Docs](https://rainy-mate-docs.vercel.app/)** — Main documentation
- **[API Reference](https://rainy-mate-docs.vercel.app/docs/)** — Detailed API docs
- **[Architecture](https://rainy-mate-docs.vercel.app/docs/architecture)** — System architecture
- **[Features](https://rainy-mate-docs.vercel.app/docs/features)** — Feature overview
- **[Contributing](https://rainy-mate-docs.vercel.app/docs/contributing)** — Contribution guide

---

## 🔐 Security

### Airlock Security Levels

Rainy MaTE implements a three-tier security system for agent operations:

| Level | Name | Description | Approval Required |
|-------|------|-------------|-------------------|
| **0** | **Safe** | Read-only operations | Auto-approved |
| **1** | **Sensitive** | Write operations | Notification |
| **2** | **Dangerous** | Execute/Delete | Explicit approval |

### Permission Policies

Enterprise-grade permission management with:

- **Workspace-Specific Policies** — Granular access control
- **Audit Trail** — Immutable policy change history
- **SLO Monitoring** — Service level objective tracking
- **Alert Management** — Retention, acknowledgment, and audit

### Security Best Practices

- API keys stored in OS keychain
- Local-first data by default
- Sandboxed AI operations
- Explicit user permissions for sensitive operations

---

## 🤝 Contributing

We welcome contributions from the community! Rainy MaTE is built by developers, for developers.

### Ways to Contribute

- 🐛 **Bug Reports** — Help us identify and fix issues
- ✨ **Feature Requests** — Suggest new capabilities
- 💻 **Code Contributions** — Submit pull requests
- 📚 **Documentation** — Improve guides and examples
- 🎨 **UI/UX** — Enhance the user experience
- 🧪 **Testing** — Help ensure quality and reliability

### Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat(area): add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

See our [Contributing Guide](https://rainy-mate-docs.vercel.app/docs/contributing) for detailed information.

---

## 📄 License & Legal

This project is licensed under the **MIT License** with additional terms for AI services.

### Legal Documentation

- **[LICENSE](LICENSE)** — MIT License terms
- **[TERMS_OF_USE.md](TERMS_OF_USE.md)** — Complete terms and conditions
- **[PRIVACY_POLICY.md](PRIVACY_POLICY.md)** — Data and privacy handling
- **[SECURITY.md](SECURITY.md)** — Security practices and reporting

### Enosis Labs Integration

When using Enosis Labs AI services, you must also comply with:
- [Enosis Labs Terms of Service](https://enosislabs.vercel.app/terms)
- [Enosis Labs Privacy Policy](https://enosislabs.vercel.app/privacy)

---

## 🌟 Acknowledgments

Rainy MaTE is inspired by the agentic AI revolution and built on the shoulders of giants:

- **Tauri** — For the amazing cross-platform framework
- **React** — For the powerful UI library
- **Rust** — For performance and safety
- **HeroUI** — For beautiful, accessible components
- **OpenAI, Google, Anthropic, xAI** — For advancing AI capabilities
- **The Open Source Community** — For making this possible

Special thanks to all contributors who help make Rainy MaTE better every day! 🎉

---

## 📞 Support

- 📖 **[Documentation](https://rainy-mate-docs.vercel.app/)** — Comprehensive guides
- 💬 **[Discussions](https://github.com/enosislabs/rainy-cowork/discussions)** — Community Q&A
- 🐛 **[Issues](https://github.com/enosislabs/rainy-cowork/issues)** — Bug reports
- 📧 **Email** — Direct support for complex issues

---

<div align="center">

**Built with ❤️ for the open source community**

[⭐ Star on GitHub](https://github.com/enosislabs/rainy-cowork) • [📖 Documentation](https://rainy-mate-docs.vercel.app/) • [💬 Community](https://github.com/enosislabs/rainy-cowork/discussions)

**Rainy MaTE** — *The Open-Source AI Desktop Agent Platform*

</div>

