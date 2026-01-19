# Changelog

All notable changes to Rainy Cowork will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-18

### Added - Phase 3: Content Extraction (Milestone 3.1)

**Rust Backend (`src-tauri/src/`)**
- `services/web_research.rs` - Web content extraction service:
  - URL fetching with reqwest
  - HTML-to-Markdown conversion (Rust-native via scraper)
  - DashMap caching with 5-minute TTL
  - Error handling with `WebResearchError` enum
- `commands/web.rs` - Tauri commands:
  - `fetch_web_content` - Extract content from URL
  - `get_web_cache_stats` - Cache statistics
  - `clear_web_cache` - Clear cached content

**Frontend (`src/`)**
- `types/web.ts` - WebContent and WebCacheStats types
- `hooks/useWebResearch.ts` - React hook for content extraction

**Dependencies**
- `scraper` v0.23 - HTML parsing
- `url` v2.5 - URL validation
- `regex` v1.11 - Markdown cleanup

**Documentation**
- `ROADMAP.md` - Public roadmap with version milestones

**Tavily Web Search (rainy-api-v2)**
- `services/tavily.ts` - Tavily SDK wrapper:
  - Search with depth, domains, answer options
  - Content extraction from URLs
  - Singleton pattern with environment initialization
- `routes/search.ts` - Search API endpoints:
  - `POST /api/v1/search` - Web search with Zod validation
  - `POST /api/v1/search/extract` - Content extraction
  - Cowork plan `web_research` feature gating

### Added - Phase 3: Document Generation (Milestone 3.2)

**Rust Backend (`src-tauri/src/`)**
- `services/document.rs` - Document generation service:
  - Handlebars template engine
  - 4 built-in templates (meeting notes, project report, email, quick note)
  - Markdown → HTML conversion
- `commands/document.rs` - Tauri commands:
  - `list_document_templates` - List all templates
  - `get_template` - Get specific template
  - `generate_document` - Generate from template + context
  - `markdown_to_html` - Convert markdown to HTML

**Frontend (`src/`)**
- `types/document.ts` - TemplateInfo, GeneratedDocument types
- `hooks/useDocument.ts` - React hook for document generation

**Dependencies**
- `handlebars` v6 - Template rendering



### Added - Cowork Plan Integration

**Rust Backend (`src-tauri/src/`)**
- `rainy-sdk` v0.4.2 integration for Cowork services
- `provider.rs` - Updated AIProviderManager with plan-based model access
- `commands/ai.rs` - New `get_cowork_status` command returning plan info, usage tracking, and feature availability
- `CoworkStatus` struct with plan, usage, models, and features
- Caching system for Cowork capabilities (5-minute TTL)

**Frontend (`src/`)**
- `services/tauri.ts` - Added `CoworkStatus`, `CoworkUsage`, `CoworkFeatures` types
- `hooks/useCoworkStatus.ts` - New hook for plan status with computed helpers:
  - `hasPaidPlan`, `plan`, `planName`, `isValid`
  - `usagePercent`, `remainingUses`, `isOverLimit`
  - `canUseWebResearch`, `canUseDocumentExport`, `canUseImageAnalysis`
- `components/settings/SettingsPanel.tsx` - New **Subscription** tab:
  - Plan display with status badge
  - Usage progress bar (color-coded)
  - Remaining uses and reset date
  - Feature availability checkmarks
  - Upgrade button for users on Free plan

### Changed
- `Cargo.toml` - Updated `rainy-sdk` from 0.4.1 to 0.4.2
- Replaced "premium" terminology with plan-based language throughout codebase
- AIProviderManager now uses `is_paid()` instead of `is_premium()`

### Technical
- SDK types: `CoworkTier` → `CoworkPlan` (Free/GoPlus/Plus/Pro/ProPlus)
- SDK types: `CoworkLimits` → `CoworkUsage` with usage tracking fields
- Backward compatibility aliases for deprecated types

## [0.2.0] - 2026-01-17

### Added - Phase 2: Core AI Features Foundation

**Rust Backend (`src-tauri/src/`)**
- `models/mod.rs` - Data models: Task, FileChange, Workspace, TaskEvent, FileVersion
- `commands/` - Tauri commands for tasks, AI, and file operations (18 commands total)
- `services/task_manager.rs` - TaskManager with DashMap, async execution, progress channels
- `services/file_manager.rs` - FileManager with workspace-based versioning (`.rainy-versions/`)
- `ai/provider.rs` - AIProvider trait abstraction and AIProviderManager
- `ai/rainy_api.rs` - Rainy API provider (Enosis Labs) with OpenAI-compatible format
- `ai/gemini.rs` - Google Gemini provider for direct user API keys
- `ai/keychain.rs` - macOS Keychain integration via `security-framework`

**Frontend Hooks & Services (`src/`)**
- `services/tauri.ts` - Typed wrappers for all Tauri commands with Channel support
- `hooks/useTauriTask.ts` - Task management hook with event-driven updates
- `hooks/useAIProvider.ts` - AI provider management with Keychain integration

**Dependencies Added**
- Rust: tokio, reqwest, dashmap, uuid, chrono, thiserror, security-framework, tracing
- Tauri plugins: fs, dialog, notification
- Frontend: @tauri-apps/plugin-fs, plugin-dialog, plugin-notification

### Changed
- Updated `Cargo.toml` with Phase 2 dependencies
- Updated `capabilities/default.json` with fs, dialog, notification permissions
- Rewrote `lib.rs` to wire all modules and register 18 commands

## [0.1.1] - 2026-01-17


### Changed
- **macOS Tahoe-style UI redesign** - Premium floating elements with glassmorphism
- **Floating sidebar** - Rounded corners (24px), drop shadow, collapsible sections
- **Glass surface main content** - Backdrop blur, subtle borders
- **Overlay title bar** - Traffic light spacer on macOS, seamless integration
- **Window transparency** - Enabled in Tauri config for glass effects
- **Improved color palette** - Rose/pink tinted light theme, deep charcoal dark theme
- **Window drag regions** - Proper `-webkit-app-region: drag` for window movement
- **Responsive design** - Works across different screen sizes

### Added
- `FloatingSidebar.tsx` - New collapsible sidebar with Tasks, Favorites, Locations, Settings
- `TahoeLayout.tsx` - New layout component with floating elements
- OS detection for Windows vs macOS controls
- Premium hover elevation effects
- Smooth animations for component appearance

### Technical
- Tauri config: `titleBarStyle: "overlay"`, `transparent: true`
- CSS variables for floating shadows and glass effects
- Custom scrollbar styling matching macOS



### Added
- **Initial Tauri + React + HeroUI v3 foundation**
- **Layout Components**
  - `Header.tsx` - App header with theme toggle (light/dark mode), settings button, user avatar
  - `Sidebar.tsx` - Collapsible navigation sidebar with folders, tasks, history, and settings sections
  - `MainLayout.tsx` - Responsive grid layout combining header, sidebar, and main content
- **Task Components**
  - `TaskInput.tsx` - Natural language task input with HeroUI TextArea, AI provider selector (OpenAI, Anthropic, Ollama), and Start Task button
  - `TaskCard.tsx` - Task display card with progress bar, status icons, pause/stop/view actions
- **File Components**
  - `FileTable.tsx` - Recent file changes display with operation icons (create, modify, delete, move, rename)
- **Type Definitions**
  - `types/index.ts` - TypeScript interfaces for Task, AIProvider, FileChange, Folder, AppSettings
- **Styling**
  - `global.css` - macOS-themed design tokens with OKLCH colors, system fonts (SF Pro), custom animations
  - Dark/light mode with system preference detection
  - Custom scrollbar styling for macOS native feel
- **Configuration**
  - Updated `index.html` with proper title, meta tags, and system font configuration
  - Updated `main.tsx` with correct CSS imports (no HeroUI Provider needed in v3)

### Technical Details
- HeroUI v3 Beta (v3.0.0-beta.3) with compound component patterns
- Tailwind CSS v4 integration
- Tauri 2.0 for native macOS app
- React 19 + TypeScript
- lucide-react for icons

### Known Limitations
- AI provider integration is UI-only (no API calls yet)
- File system operations not connected to Tauri backend
- Toast notifications deferred to v0.2.0
