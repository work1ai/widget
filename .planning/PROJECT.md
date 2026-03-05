# Work1 Chat Widget

## What This Is

An embeddable chat widget that connects to the Work1 Agent Chat backend over WebSocket. External customers drop a `<script>` tag or install an npm package to add a floating chat window to their sites, enabling real-time streaming conversations with an AI agent. Built as a Web Component using Lit with Shadow DOM encapsulation.

## Core Value

The widget must reliably connect to the chat backend and stream agent responses in real time — if messaging doesn't work, nothing else matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] WebSocket connection to `wss://<host>/ws` with full protocol support (connected, token, typing, message_end, status, reconnecting, session_end, error)
- [ ] Streaming message display — tokens append in real time, finalized on message_end
- [ ] Floating bubble + slide-up chat panel UI
- [ ] Deep theming via CSS custom properties, CSS parts, and HTML attributes
- [ ] Custom icons/logo support (bubble icon, header)
- [ ] Layout configurability (position, width, height)
- [ ] CDN distribution (UMD bundle via `<script>` tag)
- [ ] npm distribution (ESM package with TypeScript declarations)
- [ ] Markdown rendering for agent messages (bold, italic, links, code, lists)
- [ ] Error handling for all protocol scenarios (rejected connection, reconnecting, session end, message too large)
- [ ] Shadow DOM encapsulation — no style/DOM leaking to host page
- [ ] CSP-compatible — works with strict Content-Security-Policy
- [ ] XSS prevention — sanitize all rendered content, especially agent markdown
- [ ] AI disclosure badge ("Powered by AI")
- [ ] Unit and integration tests

### Out of Scope

- Custom message rendering (cards, carousels, product displays) — not needed for v1
- Accessibility/WCAG compliance — deferred, focus on functionality first
- i18n / localization — English only for v1
- Client-side reconnection logic — server handles agent reconnection; widget offers manual reconnect on WebSocket drop
- Message persistence — conversations are ephemeral, session-only
- Mobile native SDKs — web only

## Context

- **Backend:** The Work1 chat-server (v0.1.0) is live and available for testing. Protocol is WebSocket over TLS, documented in DRAFT.md.
- **Architecture decision:** Three layers — ChatClient (WebSocket), ChatStore (reactive state), Lit UI components. Defined in the design document.
- **Build tooling:** Vite producing UMD + ESM bundles with TypeScript declarations.
- **Target audience:** External customers embedding the widget on their own websites. Must be isolated, secure, and easy to integrate.
- **Protocol:** Single message type from client (`{"type":"message","content":"..."}`) with 4096 byte limit. Server sends: connected, token, typing, message_end, status, reconnecting, session_end, error events.

## Constraints

- **Tech stack**: Lit (Web Components), TypeScript, Vite — decided in design doc
- **Protocol**: Must implement chat-server v0.1.0 WebSocket contract exactly as specified in DRAFT.md
- **Browsers**: Modern only — Chrome/Edge/Firefox/Safari last 2 versions
- **Security**: CSP-compatible, XSS-safe markdown rendering, full Shadow DOM isolation
- **Distribution**: Both CDN script tag and npm package from day one

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web Components (Lit) over React/framework-specific | Framework-agnostic for external customers — works everywhere | — Pending |
| Shadow DOM for encapsulation | Prevents style/DOM conflicts on customer sites | — Pending |
| marked for markdown | Lightweight, well-maintained, supports sanitization | — Pending |
| Vite for bundling | Fast dev server, handles UMD + ESM output, good Lit support | — Pending |
| No client-side reconnection | Server handles agent reconnection; simpler widget, less edge cases | — Pending |
| CSS parts + custom properties for theming | Allows deep customization without breaking encapsulation | — Pending |

---
*Last updated: 2026-03-04 after initialization*
