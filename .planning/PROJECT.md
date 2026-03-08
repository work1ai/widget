# Work1 Chat Widget

## What This Is

An embeddable chat widget that connects to the Work1 Agent Chat backend over WebSocket. External customers drop a `<script>` tag or install an npm package to add a floating chat window to their sites, enabling real-time streaming conversations with an AI agent. Built as a Web Component using Lit with Shadow DOM encapsulation.

## Core Value

The widget must reliably connect to the chat backend and stream agent responses in real time — if messaging doesn't work, nothing else matters.

## Requirements

### Validated

- ✓ WebSocket connection with full protocol support (8 event types) — v0.1
- ✓ Streaming message display with real-time token accumulation — v0.1
- ✓ Floating bubble + slide-up chat panel UI — v0.1
- ✓ Deep theming via CSS custom properties, CSS parts, and HTML attributes — v0.1
- ✓ Custom bubble icon support (attribute + slot) — v0.1
- ✓ Layout configurability (position, width, height) — v0.1
- ✓ CDN distribution (IIFE bundle via `<script>` tag) — v0.1
- ✓ npm distribution (ESM package with TypeScript declarations) — v0.1
- ✓ Markdown rendering with DOMPurify sanitization — v0.1
- ✓ Error handling for all protocol scenarios — v0.1
- ✓ Shadow DOM encapsulation — v0.1
- ✓ CSP-compatible (no inline styles, no eval) — v0.1
- ✓ XSS prevention via DOMPurify — v0.1
- ✓ AI disclosure badge ("Powered by AI") — v0.1
- ✓ Mobile responsive layout with keyboard handling — v0.1
- ✓ Unit and integration tests (65 tests passing) — v0.1
- ✓ Local dev playground page served via Vite dev server — v0.2
- ✓ Runtime controls panel for visual theming (colors, position, size, bubble icon) — v0.2
- ✓ Runtime controls for connection settings (WebSocket URL, mock/real toggle) — v0.2
- ✓ Mock WebSocket server with echo mode and canned scenarios — v0.2
- ✓ Playground excluded from CDN/npm distribution bundles — v0.2
- ✓ Configurable chat title, subtitle, and greeting message via HTML attributes — v0.3
- ✓ Connection status indicator (green/yellow/red dot) in chat title bar — v0.3
- ✓ "Powered by work1.ai" branding badge with link — v0.3
- ✓ VitePress documentation site published to GitHub Pages — v0.3
- ✓ GitHub Actions CI/CD: build/test, npm publish with provenance, docs deployment — v0.3

### Active

(None — define next milestone requirements with `/gsd:new-milestone`)

### Backlog

- [ ] Accessibility / WCAG 2.1 AA compliance (keyboard nav, focus trapping, ARIA, contrast)
- [ ] Copy message content button on agent messages
- [ ] Health check polling — hide bubble when service is degraded
- [ ] Pre-chat tooltip on bubble
- [ ] Bundle size monitoring in CI
- [ ] Internationalization / externalized string constants
- [ ] Fix: expose sessionId to host page via ChatStore
- [ ] Fix: implement setupDOMEventForwarding() for w1-error and w1-session-end events

### Out of Scope

- Custom message rendering (cards, carousels) — not needed, protocol only supports text
- Client-side reconnection logic — server handles agent reconnection
- Message persistence — conversations are ephemeral by design
- Mobile native SDKs — web only
- Pre-chat forms (name/email) — adds friction, protocol has no user identity concept
- File/image upload — protocol only supports text
- Sound notifications — hostile UX on third-party sites
- Proactive/auto-open messages — aggressive UX
- Chat ratings/feedback — no backend support
- Offline / leave a message mode — AI is either available or not

## Context

Shipped v0.3 with ~43,000 LOC (TypeScript + docs) across 13 phases (28 plans total).
Tech stack: Lit 3.3, TypeScript 5.9, Vite 6, marked 17, DOMPurify 3.3, VitePress (docs).
Three-layer architecture: ChatClient (WebSocket) -> ChatStore (ReactiveController) -> Lit UI components.
Distribution: IIFE bundle (116 KB self-contained) + ESM (36 KB with externalized deps).
Dev playground with mock WebSocket, runtime controls, and scenario triggers on port 5180.
Documentation site with integration guide, API reference, theming guide, and events page.
CI/CD: GitHub Actions for build/test, npm publish with provenance, docs deployment.
2 minor integration gaps in host-page API (sessionId null, DOM event forwarding stub).

## Constraints

- **Tech stack**: Lit (Web Components), TypeScript, Vite — decided in design doc
- **Protocol**: Must implement chat-server v0.1.0 WebSocket contract exactly as specified in DRAFT.md
- **Browsers**: Modern only — Chrome/Edge/Firefox/Safari last 2 versions
- **Security**: CSP-compatible, XSS-safe markdown rendering, full Shadow DOM isolation
- **Distribution**: Both CDN script tag and npm package from day one

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web Components (Lit) over React/framework-specific | Framework-agnostic for external customers — works everywhere | ✓ Good — works in any framework context |
| Shadow DOM for encapsulation | Prevents style/DOM conflicts on customer sites | ✓ Good — full isolation verified |
| marked for markdown | Lightweight, well-maintained, supports sanitization | ✓ Good — 17.0.4, token-based link renderer works |
| Vite for bundling | Fast dev server, handles ESM + IIFE output, good Lit support | ✓ Good — two separate configs needed for ESM/IIFE |
| No client-side reconnection | Server handles agent reconnection; simpler widget | ✓ Good — reduces complexity significantly |
| CSS parts + custom properties for theming | Allows deep customization without breaking encapsulation | ✓ Good — 10 public CSS vars + ::part() selectors |
| Three-layer architecture (ChatClient/ChatStore/UI) | Clean separation of concerns, testable | ✓ Good — enabled independent unit testing |
| DOMPurify for XSS prevention | Industry-standard HTML sanitizer | ✓ Good — verified against script/onerror/iframe |
| happy-dom over jsdom for tests | ESM compatibility issues with jsdom | ✓ Good — all 79 tests pass |
| IIFE over UMD for CDN bundle | Web Components self-register, no module system needed | ✓ Good — 116 KB self-contained |
| Custom playground over Storybook | Simpler and more tailored to widget testing | ✓ Good — single HTML page with controls sidebar |
| Options object for connect() | Forward-compatible extensibility for WebSocket injection | ✓ Good — enabled mock/real switching cleanly |
| Port 5180 for playground | Avoid conflict with default Vite 5173 | ✓ Good — no port conflicts |
| Console + UI scenario triggers | Console for dev, UI buttons for interactive testing | ✓ Good — MockWebSocket.instance accessible both ways |
| Rename title to chat-title | Avoid HTMLElement.title native tooltip conflict | ✓ Good — no tooltip, clean attribute name |
| Greeting injection post-connect | Show greeting after WebSocket connects, not on panel open | ✓ Good — greeting only appears when backend is ready |
| Reconnecting = connecting (yellow) | No separate visual state needed for reconnecting | ✓ Good — simpler UI, same user intent |
| VitePress for docs | Lightweight, Vue-native, good for component docs | ✓ Good — fast build, custom element support |
| Self-contained publish workflow | Publish workflow runs own build+test, not dependent on CI | ✓ Good — independent, reliable releases |

---
*Last updated: 2026-03-08 after v0.3 milestone*
