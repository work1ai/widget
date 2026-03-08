# Milestones

## v0.3 Customization, Docs & CI/CD (Shipped: 2026-03-08)

**Phases completed:** 4 phases, 6 plans, 0 tasks

**Key accomplishments:**
- Configurable chat title, subtitle, and greeting message via HTML attributes (no native tooltip conflict)
- Real-time connection status indicator (green/yellow/red dot) in title bar
- Updated "Powered by work1.ai" branding badge with link to https://work1.ai
- VitePress documentation site with integration guide, API reference, theming guide, and events page
- GitHub Actions CI/CD pipeline: build/test on push/PR, npm publish with provenance, docs deployment

**Stats:**
- Lines of code: ~43,000 (total project including docs)
- Timeline: 2 days (2026-03-07 to 2026-03-08)
- Files changed: 49 (6,951 insertions, 142 deletions)
- Git range: feat(10-01) to feat(13-01)
- Requirements: 18/18 satisfied

---

## v0.2 Dev Playground (Shipped: 2026-03-07)

**Phases completed:** 3 phases, 5 plans, 10 tasks

**Key accomplishments:**
- Vite dev playground on port 5180 with hot reload, fully excluded from production bundles
- WebSocket constructor injection across ChatClient/ChatStore/Widget chain for mock/real switching
- MockWebSocket class with token-by-token streaming and 6 triggerable scenarios
- Playground control panel Lit component with 10-color theme picker, mock/real toggle, and scenario buttons
- 14 unit tests for playground controls covering all 7 requirement IDs

**Stats:**
- Lines of code: 4,191 TypeScript (total project)
- Timeline: 1 day (2026-03-07)
- Files changed: 34 (4,402 insertions, 66 deletions)
- Git range: feat(07-01) to test(09-02)
- Requirements: 15/15 satisfied

---

## v0.1 Work1 Chat Widget (Shipped: 2026-03-07)

**Phases completed:** 6 phases, 17 plans, 0 tasks

**Key accomplishments:**
- WebSocket client with full chat-server v0.1.0 protocol support (8 event types, typed events)
- Reactive UI with floating bubble, slide-up chat panel, message list with scroll management
- Real-time token streaming with markdown rendering (marked + DOMPurify sanitization)
- Deep theming via 10 CSS custom properties, ::part() selectors, and HTML attributes
- Mobile responsive layout with visualViewport keyboard handling
- Dual-format distribution: CDN IIFE bundle (116 KB) + npm ESM package with TypeScript declarations

**Stats:**
- Lines of code: 3,085 TypeScript
- Timeline: 3 days (2026-03-04 to 2026-03-06)
- Commits: 83
- Git range: feat(01-01) to feat(06-01)
- Requirements: 60/60 satisfied

**Known Gaps (tech debt):**
- INT-01: sessionId getter returns null (ChatStore doesn't expose ChatClient.sessionId to host page)
- INT-02: w1-error and w1-session-end DOM events never dispatched (setupDOMEventForwarding empty stub)
- Nyquist VALIDATION.md incomplete across phases

---

