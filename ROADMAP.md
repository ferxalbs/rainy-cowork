# Rainy Cowork Roadmap

## Current Version: v0.2.1

### v0.3.0 - Phase 3: Advanced Features (In Progress)

**Web Browsing & Research**
- [ ] MCP Server Integration (Playwright/Chrome MCP Tools)
- [ ] URL content extraction (Rust-native HTML→Markdown)
- [ ] Content caching and rate limiting

**Document Generation**
- [ ] Template-based document generation (Rust)
- [ ] Markdown export with handlebars templates
- [ ] AI-assisted document creation (Premium/Cowork)

**Image Processing**
- [ ] Metadata extraction (EXIF, dimensions)
- [ ] Thumbnail generation
- [ ] AI vision analysis (Premium/Cowork)

**macOS Deep Integration**
- [ ] Menu bar quick access
- [ ] System tray with task status
- [ ] Shortcuts app integration

---

### v0.3.5 - Email & Calendar Integration (Planned)

> ⚠️ Requires Google OAuth verification

**Gmail Integration**
- [ ] OAuth2 authentication flow
- [ ] Email reading and composition
- [ ] AI-assisted draft creation

**Google Calendar**
- [ ] Event listing and viewing
- [ ] Event creation via AI commands

---

### v0.4.0 - Web Search (Planned)

**Rainy API v2 Integration**
- [ ] Web search endpoint integration
- [ ] Search result aggregation
- [ ] AI-powered result summarization
- [ ] Multi-source search (Premium)

**Alternative: MCP Server Approach**
> 💡 Consider Playwright MCP or Chrome MCP Tools for browser automation:
> - Real-time web interaction
> - JavaScript-rendered content
> - Form filling and navigation

---

### v0.5.0 - Plugin Ecosystem (Future)

- [ ] Plugin API definition
- [ ] Community plugin marketplace
- [ ] Custom workflow automation

---

## Open Core Model

| Feature | Free (OSS) | Premium (Cowork) |
|---------|------------|------------------|
| URL Content Extraction | ✅ | ✅ |
| Document Templates | ✅ | ✅ |
| Image Metadata | ✅ | ✅ |
| AI Document Generation | ❌ | ✅ |
| AI Vision Analysis | ❌ | ✅ |
| Web Search (v0.4.0) | Limited | Unlimited |
| Email/Calendar | ❌ | ✅ |

---

*Last Updated: January 2026*
