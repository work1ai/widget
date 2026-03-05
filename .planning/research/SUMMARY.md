# Project Research Summary

**Project:** Work1 Chat Widget
**Domain:** Embeddable AI chat widget (Web Component, Shadow DOM, WebSocket streaming)
**Researched:** 2026-03-04
**Confidence:** MEDIUM

## Executive Summary

The Work1 Chat Widget is an embeddable, framework-agnostic AI chat interface delivered as a Web Component. The established approach for this type of product is a three-layer architecture (Connection, State, UI) built with Lit for Web Component rendering, using Shadow DOM for style/DOM encapsulation from the host page. The stack is lean -- three production dependencies (Lit, marked, DOMPurify) targeting a sub-50KB gzipped CDN bundle. The widget connects to an existing chat-server via native WebSocket, streams AI responses token-by-token, and renders them as sanitized markdown. Distribution is dual-format: IIFE for CDN script tags, ESM for npm consumers.

The recommended approach follows a bottom-up build order starting with the WebSocket connection layer (ChatClient), then reactive state management (ChatStore as a Lit ReactiveController), then leaf UI components, then container assembly, and finally build/distribution. This order is dictated by hard dependencies: everything in the UI depends on state, and state depends on the connection layer. The WebSocket protocol is already specified (DRAFT.md), giving a firm contract to build against. Theming via CSS custom properties (which pierce Shadow DOM by spec) is a genuine differentiator over iframe-based competitors like Intercom and Crisp.

The primary risks are: (1) XSS via unsanitized markdown rendering -- Shadow DOM is NOT a security boundary, so DOMPurify must be integrated from day one; (2) streaming performance jank from re-rendering the entire message list on every token arrival -- the streaming message must be isolated in its own component; (3) CSP violations silently breaking the widget on enterprise customer sites -- must test under strict CSP from the first build; (4) WebSocket connections dropping silently without user feedback -- needs heartbeat detection and clear connection state UI; (5) bundle size creep beyond the 50KB target -- needs a CI gate from the start.

## Key Findings

### Recommended Stack

The stack is intentionally minimal with only 3 production dependencies. Lit 3.3.2 is the standard library for Web Components (~5KB gzipped), providing Shadow DOM encapsulation, reactive properties, and decorators with no framework lock-in. Vite 6.4.x handles building and dev server, with library mode producing ESM + IIFE bundles (IIFE is preferred over UMD because Web Components self-register, so there is no module export to consume). TypeScript 5.9.x provides type safety throughout.

**Core technologies:**
- **Lit 3.3.2**: Web Component rendering -- the standard, purpose-built library for custom elements with Shadow DOM
- **marked 17.0.4**: Markdown to HTML -- lightweight (~40KB), synchronous API ideal for streaming token rendering
- **DOMPurify 3.3.1**: HTML sanitization -- industry standard for preventing XSS in rendered markdown
- **Vite 6.4.x**: Build tooling -- mature library mode, fast HMR dev server, IIFE + ESM dual output
- **Vitest 4.x + happy-dom + Playwright**: Testing -- unit tests with happy-dom for speed, Playwright for real-browser integration tests

**What to avoid:** React/Preact inside the widget, socket.io-client (backend uses raw WebSocket), CSS frameworks (incompatible with Shadow DOM), state management libraries (overkill -- Lit's ReactiveController handles all state needs).

### Expected Features

**Must have (table stakes -- users expect these):**
- Floating bubble launcher with open/close animation
- Real-time message streaming (token-by-token display)
- Typing indicator (animated dots)
- Markdown rendering with XSS sanitization
- Message input with Enter-to-send, Shift+Enter for newline
- Connection state feedback (connecting, reconnecting, error, session ended)
- Greeting/welcome message
- Auto-scroll with scroll-lock on user scroll-up
- Shadow DOM encapsulation (non-negotiable for embeddable widgets)
- CSS custom properties theming
- Mobile responsive panel (full-width on narrow viewports)
- CDN script tag + npm package distribution

**Should have (differentiators):**
- Deep theming via CSS custom properties + CSS parts (advantage over iframe-based competitors)
- Sub-50KB bundle size (competitors ship 150-300KB)
- Status messages for AI tool use ("Looking up details...")
- Health check before showing bubble (hide when service is down)
- Keyboard accessibility (tab, escape, focus trapping)
- Copy message content button

**Defer (v2+):**
- i18n / localization
- Rich message types (cards, buttons, carousels)
- File upload
- Chat ratings/feedback
- Chat history persistence (explicitly ephemeral by design)
- Pre-chat forms (anti-feature -- adds friction, protocol has no identity concept)

### Architecture Approach

Three-layer architecture with strict downward dependency flow: UI Layer (Lit components) reads from State Layer (ChatStore as ReactiveController), State Layer subscribes to Connection Layer (ChatClient as plain TypeScript EventEmitter). ChatClient is framework-free and testable without a DOM. ChatStore uses Lit's ReactiveController protocol to trigger re-renders on state changes. Internal communication follows "properties down, events up" -- parent components pass data via Lit properties, children dispatch CustomEvents.

**Major components:**
1. **ChatClient** -- WebSocket lifecycle, JSON message parsing, typed event emitter. No Lit dependency. Testable in isolation against the protocol spec.
2. **ChatStore** -- Reactive state: messages array (immutable updates), streaming token buffer, connection status, typing/status indicators. Implements Lit ReactiveController.
3. **work1-chat-widget** -- Root custom element. Creates ChatClient + ChatStore, owns Shadow DOM root, bridges HTML attributes to CSS custom properties.
4. **ChatBubble** -- Floating toggle button. Dispatches open/close events.
5. **ChatPanel** -- Chat window container with header, MessageList, and ChatInput.
6. **MessageList** -- Scrollable message area. Renders finalized messages + isolated streaming message component.
7. **MessageBubble** -- Single message (markdown for agent, plain text for user).
8. **ChatInput** -- Text area with send button, character limit enforcement, disabled state.
9. **StatusBar** -- Connection state banners, error messages, session-end notices.

**Key architectural decision:** Lazy connection -- WebSocket connects when user opens the panel, not when the element mounts. Most users never click the bubble, so eager connection wastes server resources and burns the 300s idle timeout.

### Critical Pitfalls

1. **Markdown XSS** -- Shadow DOM is NOT a security boundary. Agent responses rendered via `marked` can execute scripts in the host page context. Always pipe through DOMPurify with a strict allowlist before using Lit's `unsafeHTML`. Write XSS payload tests from day one.
2. **Streaming token re-render jank** -- Every token triggers `requestUpdate()`. If the entire message list re-renders per token, you get jank at 20+ messages. Isolate the streaming message in its own component. Batch token DOM updates via `requestAnimationFrame`.
3. **CSP violations on customer sites** -- Widget loads fine but WebSocket blocked by `connect-src`, or styles blocked by `style-src`. Lit's `adoptedStyleSheets` avoids inline style CSP issues in modern browsers. Test under strict CSP in CI. Document required CSP directives for customers.
4. **WebSocket silent drops** -- Browser WebSocket API does not reliably fire `onclose` on network loss. Implement client-side heartbeat (ping every 30s, timeout at 10s). Distinguish transport-level reconnection (automatic) from agent-level reconnection (server-handled).
5. **Bundle size creep** -- `marked` alone is ~40KB. Set a 50KB gzipped CI gate from the first build. Consider a minimal markdown subset parser if `marked` makes the budget unachievable.
6. **Shadow DOM blocks host page fonts** -- Font-face declarations from the host page do not apply inside Shadow DOM. Default to `system-ui` and use CSS custom properties for font overrides. Document that customers must load font files on their page.

## Implications for Roadmap

Based on research, the architecture has clear dependency layers that dictate build order. The suggested phases follow the bottom-up approach from ARCHITECTURE.md, with pitfall prevention integrated at each step.

### Phase 1: Project Setup and Connection Layer
**Rationale:** The WebSocket protocol (DRAFT.md) is a fixed contract. ChatClient has zero UI dependencies and can be built and tested in complete isolation. Everything else depends on this working correctly.
**Delivers:** TypeScript project with Vite build, ChatClient class with full protocol coverage, unit tests against mock WebSocket, CI pipeline with bundle size gate and strict CSP test.
**Addresses:** WebSocket connection, message sending, event parsing, connection state tracking, heartbeat/health monitoring.
**Avoids:** WebSocket silent drops (Pitfall 5), bundle size creep (Pitfall 6 -- budget set from day one), CSP violations (Pitfall 2 -- tested from first build).

### Phase 2: State Management and Theming Foundation
**Rationale:** ChatStore bridges connection to UI. Must be in place before any UI components can render real data. Theming architecture (CSS custom properties) must be established early because retrofitting it is costly.
**Delivers:** ChatStore ReactiveController with full state management, immutable message array updates, token streaming buffer, theme.ts with CSS custom property system, shared styles.
**Addresses:** Reactive state, token accumulation, connection status tracking, theming via CSS custom properties.
**Avoids:** Streaming jank (Pitfall 4 -- architecture decision to isolate streaming made here), Shadow DOM font issues (Pitfall 1 -- system-ui defaults and custom property theming established).

### Phase 3: Core UI Components
**Rationale:** With state and theming in place, leaf components can be built and tested independently. Bottom-up: build leaves first, then containers.
**Delivers:** MessageBubble (with markdown rendering + DOMPurify sanitization), TypingIndicator, StatusBar, ChatInput, ChatBubble (floating button).
**Addresses:** Markdown rendering, XSS prevention, typing indicator, message input with Enter/Shift+Enter, connection state feedback UI, floating bubble launcher.
**Avoids:** Markdown XSS (Pitfall 3 -- DOMPurify integrated from first markdown render), inline style CSP issues (Pitfall 2 -- use CSS custom properties, not style attributes).

### Phase 4: Component Assembly and Streaming
**Rationale:** Container components assemble leaves. MessageList is the most complex -- it must handle auto-scroll, isolate streaming content, and use Lit's `repeat` directive for performance.
**Delivers:** MessageList with auto-scroll and isolated streaming component, ChatPanel with layout and open/close animation, root work1-chat-widget element with lazy connection, greeting message display.
**Addresses:** Auto-scroll with scroll-lock, streaming token display (isolated component), panel open/close animation, lazy WebSocket connection, greeting message.
**Avoids:** Streaming re-render jank (Pitfall 4 -- streaming component isolated), auto-scroll hijacking (scroll position preserved on user scroll-up).

### Phase 5: Mobile, Polish, and Integration Testing
**Rationale:** Responsive behavior is CSS on top of existing components. Integration tests verify the full stack. This phase catches the "looks done but isn't" issues.
**Delivers:** Mobile responsive layout (full-width panel on narrow viewports), Playwright integration tests, demo page, CSP compatibility validation, multiple-instance testing.
**Addresses:** Mobile responsive, keyboard accessibility basics, AI disclosure badge, start new conversation flow.
**Avoids:** CSP violations on real sites (Pitfall 2 -- end-to-end CSP test), multiple instance conflicts (Anti-pattern 1).

### Phase 6: Build, Distribution, and Documentation
**Rationale:** Once the widget is functionally complete and tested, package it for consumption. Dual-format output, npm package metadata, CDN-ready artifacts.
**Delivers:** IIFE bundle for CDN (single script tag), ESM bundle for npm, TypeScript declarations, package.json with exports field, integration documentation (CSP requirements, theming guide, attribute reference).
**Addresses:** CDN script tag distribution, npm package distribution, bundle size verification (must be under 50KB gzipped).
**Avoids:** Bundle size bloat (Pitfall 6 -- final verification against budget).

### Phase Ordering Rationale

- **Bottom-up by dependency:** ChatClient -> ChatStore -> leaf components -> containers -> root element. Each phase produces testable artifacts that the next phase consumes.
- **Risk-first:** The riskiest integration point (WebSocket protocol) is tackled first. If the protocol implementation has issues, they surface immediately rather than after the UI is built.
- **Pitfall prevention is front-loaded:** All 6 critical pitfalls have prevention steps in Phases 1-2. No pitfall is deferred to "we'll fix it later."
- **UI comes after infrastructure:** Theming architecture, state management, and sanitization pipelines are in place before any visible UI is built. This prevents the common pattern of building pretty UI that must be extensively reworked for security/performance.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Connection Layer):** Needs careful review of DRAFT.md protocol to map all message types and edge cases. The heartbeat/ping mechanism needs design -- the protocol spec may or may not support ping/pong.
- **Phase 4 (Streaming):** Token streaming performance optimization is nuanced. May need to prototype and profile before committing to an approach (isolated component vs. direct DOM manipulation vs. requestAnimationFrame batching).
- **Phase 6 (Distribution):** Vite library mode config (IIFE output, bundling all deps, no externals) should be validated early. The exact Vite 6 config for IIFE format needs verification against current docs.

Phases with standard patterns (skip deep research):
- **Phase 2 (State):** Lit ReactiveController is well-documented. Immutable array updates are a standard pattern.
- **Phase 3 (UI Components):** Standard Lit component patterns. Markdown + DOMPurify integration is well-documented.
- **Phase 5 (Mobile/Polish):** CSS responsive patterns are well-established. Playwright testing has mature documentation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry. Lit, marked, DOMPurify are established, stable libraries. Vite 6.x is the mature choice. |
| Features | MEDIUM | Feature landscape based on training data knowledge of competitor products (Intercom, Crisp, Tidio). Core table-stakes patterns are stable. Competitor specifics may have shifted since training cutoff. |
| Architecture | MEDIUM | Three-layer pattern and Lit ReactiveController are well-documented. Specific Vite library mode config and happy-dom Shadow DOM support should be validated during implementation. |
| Pitfalls | MEDIUM | Pitfalls are well-known in the Web Components/embeddable widget domain. Specific mitigation details (DOMPurify config, Lit adoptedStyleSheets CSP behavior) should be verified against current library docs. |

**Overall confidence:** MEDIUM -- The technology choices and architecture patterns are well-established and unlikely to be wrong. The areas of uncertainty are specific configuration details (Vite library mode, happy-dom Shadow DOM completeness) and exact library version APIs, which are best validated during early implementation rather than through more research.

### Gaps to Address

- **Vite 6 IIFE library mode:** The exact config for IIFE output (vs UMD) should be validated against Vite 6 docs. The STACK.md recommendation is sound in principle but the config snippet needs verification. Validate in Phase 1 setup.
- **happy-dom Shadow DOM support:** May have incomplete custom element / Shadow DOM behavior. Plan to fall back to Playwright for component tests if happy-dom proves unreliable. Test early in Phase 1.
- **Bundle size budget feasibility:** The 50KB gzipped target with Lit (~5KB) + marked (~12KB gzip) + DOMPurify (~7KB gzip) + widget code leaves ~26KB for application code. This is tight but achievable. If marked proves too heavy, a minimal markdown subset parser is a viable replacement. Measure after Phase 1 build setup.
- **WebSocket heartbeat mechanism:** The protocol spec (DRAFT.md) may not include a ping/pong message type. If not, client-side heartbeat must use WebSocket protocol-level ping frames (which are not accessible from the browser WebSocket API) or a custom application-level ping. This needs resolution in Phase 1 design.
- **marked v17 API:** Version 17 is a major version jump. The synchronous API and configuration options should be verified against current marked docs during Phase 3 implementation.

## Sources

### Primary (HIGH confidence)
- Project design document: `docs/plans/2026-03-04-chat-widget-design.md`
- Protocol specification: `DRAFT.md` (chat-server v0.1.0)
- PROJECT.md (project constraints and scope)

### Secondary (MEDIUM confidence)
- npm registry (queried 2026-03-04): lit@3.3.2, marked@17.0.4, dompurify@3.3.1, vite@6.4.1, vitest@4.0.18, typescript@5.9.3
- Lit documentation patterns (training data for Lit 3.x)
- DOMPurify documentation (training data)
- W3C Shadow DOM and CSS custom properties specifications
- CSP specification (MDN/W3C)
- WebSocket API specification (MDN)
- Competitor analysis: Intercom, Crisp, Tidio, LiveChat, Zendesk (training data, not live-verified)

### Tertiary (LOW confidence)
- Bundle size estimates for individual libraries (need measurement after first build)
- Vite 6.x IIFE library mode configuration specifics (need verification against current Vite docs)
- happy-dom Shadow DOM completeness (need validation during setup)

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
