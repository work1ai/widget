# Milestones

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

