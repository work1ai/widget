# Pitfalls Research

**Domain:** Embeddable chat widget (Web Component, Shadow DOM, WebSocket streaming)
**Researched:** 2026-03-04
**Confidence:** MEDIUM (based on well-documented patterns; web search and doc fetch unavailable for live verification)

---

## Critical Pitfalls

### Pitfall 1: Shadow DOM Blocks Host Page Styles From Reaching Internal Elements — By Design, But Causes Theming Failures

**What goes wrong:**
Shadow DOM provides style isolation, which is the entire point. But developers underestimate how complete this isolation is. Google Fonts loaded on the host page will not apply inside the shadow root. The host page's CSS reset will not reach widget internals. `font-family: inherit` does nothing because there is no inheritance chain through the shadow boundary for most properties. Customers set `body { font-family: 'Inter' }` and expect the widget to match — it will not.

**Why it happens:**
Only CSS inherited properties that are set on the host element itself (or its ancestors) cross the shadow boundary. `font-family`, `color`, and `line-height` do inherit, but only if the host page sets them on an ancestor of `<work1-chat-widget>` — not via class selectors targeting body/html. Font-face declarations defined in the light DOM are not available inside the shadow root; the font files must be loaded independently or the `@font-face` must be duplicated inside the shadow root or in an adoptedStyleSheet.

**How to avoid:**
- Define all `@font-face` rules in the shadow root's styles OR use `document.adoptedStyleSheets` to share font definitions.
- For the default font, use `system-ui, sans-serif` which requires no font loading.
- Use CSS custom properties (`--w1-font-family`) as the theming mechanism, since custom properties DO inherit through shadow boundaries.
- Document clearly that custom fonts require the customer to also load the font file on their page (the widget inherits the font-family custom property, but needs the font-face to be resolvable).
- Test the widget embedded on a page with a restrictive CSS reset to catch missing defaults early.

**Warning signs:**
- Widget text renders in Times New Roman or serif fallback on customer sites.
- Customer reports that "fonts don't match our site."
- Custom properties work for colors but not for fonts.

**Phase to address:**
Phase 1 (core UI). Theming architecture with CSS custom properties and `system-ui` defaults must be established from the start.

---

### Pitfall 2: CSP Violations on Customer Sites Block Widget Loading or Functionality

**What goes wrong:**
Many enterprise and security-conscious sites deploy strict Content-Security-Policy headers. Common CSP issues for embeddable widgets:
1. `script-src` blocks the CDN-loaded widget script unless the customer adds the CDN domain or a nonce/hash.
2. `style-src 'unsafe-inline'` is often absent — Lit's default behavior of using `<style>` tags inside shadow DOM can trigger CSP violations on pages that disallow inline styles.
3. `connect-src` blocks WebSocket connections to `wss://chat.example.com` unless explicitly allowed.
4. `font-src` blocks loading custom fonts from the widget's CDN if used.
5. `img-src` blocks icons/images served from the widget CDN.

The worst outcome: the widget silently fails to render or connect, with errors only visible in the browser console. Customers blame the widget, not their CSP.

**Why it happens:**
Widget developers test on their own sites with permissive CSP (or none). CSP violations are silent from the user's perspective — no visible error, just a broken widget. Lit uses constructable stylesheets (`adoptedStyleSheets`) where supported, which avoids `style-src` issues in modern browsers, but falls back to inline `<style>` tags in older browsers. The WebSocket connection being blocked by `connect-src` is particularly insidious because the widget loads fine but cannot connect.

**How to avoid:**
- Use Lit's `adoptedStyleSheets` (the default in modern browsers) — this does NOT violate `style-src` because constructable stylesheets are not inline styles. Verify this works without `'unsafe-inline'` in `style-src`.
- Never use inline `style` attributes programmatically on elements (use CSS classes or custom properties instead).
- Never use `eval()`, `new Function()`, or `innerHTML` with script content.
- Document CSP requirements clearly: customers must add the CDN domain to `script-src` and the WebSocket host to `connect-src`.
- Provide a CSP troubleshooting guide with exact directives needed.
- Test with a maximally restrictive CSP: `default-src 'none'; script-src 'self' cdn.example.com; style-src 'self'; connect-src wss://chat.example.com; img-src 'self'`.
- Bundle all icons as inline SVG within templates (no external image loads needed).

**Warning signs:**
- Widget works in development but fails on customer staging environments.
- Console errors mentioning "Refused to apply inline style" or "Refused to connect."
- Customer opens a support ticket saying "widget doesn't appear" — first question should be about CSP.

**Phase to address:**
Phase 1 (core build). CSP compatibility must be validated from the first build output. Add a CI test that loads the widget under strict CSP.

---

### Pitfall 3: Markdown Rendering Enables XSS via Unsanitized HTML in Agent Responses

**What goes wrong:**
The agent's responses are rendered as markdown. `marked` by default converts markdown to HTML, including raw HTML passthrough. If an agent response contains `<img onerror="alert(1)">` or `<a href="javascript:void(0)">`, it will execute in the customer's page context. Even within Shadow DOM, JavaScript execution happens in the main document's context — Shadow DOM is NOT a security boundary. A compromised or prompt-injected agent could inject scripts that steal customer page data, session tokens, or perform actions as the user.

**Why it happens:**
Developers assume Shadow DOM provides security isolation (it does not — only style/DOM isolation). They also assume `marked` sanitizes by default (it does not — `marked` is a parser, not a sanitizer). The combination creates a false sense of security.

**How to avoid:**
- Use `marked` with `{async: false}` and configure it to strip all raw HTML: set the `renderer` to escape HTML entities or use `marked`'s built-in sanitization options.
- Apply DOMPurify as a post-processing step on the HTML output from `marked`. DOMPurify is ~7KB gzipped and purpose-built for this.
- Configure DOMPurify strictly: `DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'code', 'pre', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'blockquote'], ALLOWED_ATTR: ['href', 'class'], ALLOW_DATA_ATTR: false })`.
- Force all `<a>` tags to have `target="_blank"` and `rel="noopener noreferrer"` via DOMPurify hooks or marked renderer overrides.
- Never use Lit's `unsafeHTML` directive without sanitization first.
- Write explicit tests with XSS payloads: `<script>alert(1)</script>`, `<img onerror=alert(1)>`, `[link](javascript:alert(1))`, and markdown-based injection like `[click](data:text/html,<script>alert(1)</script>)`.

**Warning signs:**
- Using `innerHTML` or Lit's `unsafeHTML` anywhere in the rendering pipeline without DOMPurify.
- Tests only verify "markdown renders correctly" but never test "malicious markdown is neutralized."
- `marked` used with default options and no post-sanitization step.

**Phase to address:**
Phase 1 (message rendering). Sanitization must be built into the markdown pipeline from the first line of code, not added retroactively.

---

### Pitfall 4: Lit Re-renders Entire Message List on Every Streaming Token, Causing Jank

**What goes wrong:**
Tokens arrive character-by-character (per the protocol: `{"type":"token","content":"<string>"}`). Each token appends to `currentStreamContent` in the store. If this triggers a reactive update that re-renders the entire message list, you get: DOM thrashing on every character, layout recalculations, broken scroll position, high CPU usage, and visible stuttering — especially on long conversations with many messages.

**Why it happens:**
Lit's reactive property system triggers `requestUpdate()` when any reactive property changes. If `messages` and `currentStreamContent` are reactive properties on the same component (e.g., `message-list`), every token causes a full re-render of the list. Lit's `repeat` directive with proper keys helps, but only if the existing message items are truly unchanged. The real problem is architecture: streaming state mixed with stable message state in the same rendering scope.

**How to avoid:**
- Isolate streaming state to a dedicated component. The `message-list` should render finalized messages and delegate the current streaming message to a separate `<streaming-message>` component. Only that component re-renders on token events.
- Use `requestAnimationFrame` batching for token updates. Accumulate tokens and update the DOM at most once per frame (60fps = ~16ms intervals). Do not re-render on every individual token event.
- Use Lit's `repeat` directive with stable keys for the finalized message list so Lit can skip unchanged items.
- For the streaming message, consider direct DOM manipulation (`this.renderRoot.querySelector('.streaming-content').textContent += token`) instead of reactive re-rendering. This is the one case where breaking out of Lit's reactive model is justified for performance.
- Profile with Chrome DevTools Performance tab during a long streaming response to verify frame times stay under 16ms.

**Warning signs:**
- Scrollbar jumps during streaming.
- CPU spikes visible during agent responses.
- `requestUpdate` called hundreds of times per second in Lit dev tools.
- Message list "flickers" during streaming.

**Phase to address:**
Phase 1 (streaming display). The architecture decision to isolate streaming from finalized messages must be made before building the message list component.

---

### Pitfall 5: WebSocket Connection Drops Silently Without Recovery Path

**What goes wrong:**
The WebSocket connection drops and the widget shows no indication. Common causes: user's network switches (WiFi to cellular), laptop sleep/wake, corporate proxy timeout, server deploy/restart. The widget appears functional (UI is visible, input is enabled) but messages go nowhere. The user types a message, hits send, and nothing happens — or worse, the send appears to succeed (message shows in the chat) but the backend never receives it.

**Why it happens:**
The browser WebSocket API does not reliably fire `onclose` in all network-loss scenarios. Mobile browsers may suspend the WebSocket without firing events. The `readyState` property may still show `OPEN` even when the TCP connection is dead (no heartbeat mechanism). The design doc says "no client-side reconnection" — server handles agent reconnection — but if the WebSocket itself drops (not the agent connection), there is no recovery mechanism beyond a manual "Reconnect" button that the user must notice.

**How to avoid:**
- Implement a client-side heartbeat/ping mechanism: send a lightweight message (or rely on WebSocket protocol pings) on a timer (e.g., every 30 seconds). If no response within a timeout (e.g., 10 seconds), treat the connection as dead.
- Immediately disable the input and show a "Connection lost" banner when the connection drops.
- On `send()`, check `ws.readyState === WebSocket.OPEN` before sending. If not open, queue the message and show connection error.
- Detect browser visibility changes (`document.visibilitychange`). When the page becomes visible again after being hidden, verify the WebSocket is still alive (send a ping or check readyState).
- Consider automatic reconnection with exponential backoff (1s, 2s, 4s, max 30s) for WebSocket-level drops. The design doc says no client-side reconnection for *agent* reconnection, but WebSocket transport-level reconnection is different and user-expected.
- Cap reconnection attempts (e.g., 3-5 tries) then fall back to the manual "Start new conversation" button.

**Warning signs:**
- Users report "the chat just stops working" without error messages.
- Widget works fine on fast connections but fails on mobile/flaky networks.
- No `onclose` event fires during testing with network throttling.

**Phase to address:**
Phase 1 (connection layer). The ChatClient must handle WebSocket health monitoring from the start. Revisit the "no client-side reconnection" decision — it should apply to agent-level reconnection (which the server handles) but NOT to transport-level WebSocket recovery.

---

### Pitfall 6: Bundle Size Exceeds Acceptable Limits for a Third-Party Embed

**What goes wrong:**
The widget ships at 150KB+ gzipped, which is unacceptable for a third-party embed that customers add to every page of their site. Common bloat sources: `marked` (~40KB min), `DOMPurify` (~7KB gzip), Lit itself (~16KB gzip), plus application code. Add full emoji support, syntax highlighting for code blocks, or a rich text editor and it balloons further. Customers complain about page load performance impact, or simply refuse to embed it.

**Why it happens:**
In a standalone app, 150KB is nothing. For a third-party widget loaded on every page of a customer's site alongside their own app bundle, every kilobyte matters. Developers add dependencies without tracking total size. Tree-shaking helps but only if libraries are ESM and side-effect-free. `marked` is a particularly large dependency for what amounts to rendering bold, italic, links, code, and lists.

**How to avoid:**
- Set a hard bundle size budget: target under 50KB gzipped for the UMD bundle. Track it in CI with `bundlesize` or Vite's `rollup-plugin-visualizer`.
- Consider replacing `marked` (~40KB) with a minimal markdown subset parser. The widget only needs: bold, italic, links, code/code blocks, lists, and line breaks. A purpose-built parser for this subset can be under 2KB.
- Alternatively, use `marked` but configure it to only include needed extensions and verify tree-shaking removes unused code.
- Lit is ~16KB gzipped which is reasonable for what it provides. Do not try to replace it.
- Lazy-load DOMPurify only when rendering markdown (it is only needed for agent messages, not for the widget chrome).
- Use Vite's `build.rollupOptions.output.manualChunks` to analyze what is going into the bundle.
- Avoid adding runtime dependencies for things that can be done with CSS (animations, transitions, layout).
- Inline SVG icons in templates instead of shipping an icon font or icon library.

**Warning signs:**
- Bundle exceeds 50KB gzipped without anyone noticing.
- `npm install` adds transitive dependencies nobody reviewed.
- Adding "just one more library" for a minor feature (e.g., date formatting, emoji picker).

**Phase to address:**
Phase 1 (build setup). Set the bundle size budget in CI from day one. Measure after every dependency addition.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `unsafeHTML` without sanitization during prototyping | Faster markdown integration | XSS vulnerability in production | Never — always sanitize, even in prototypes |
| Skipping `requestAnimationFrame` batching for tokens | Simpler streaming code | Jank on long messages, performance complaints | Never — the overhead of batching is trivial |
| Hardcoding the WebSocket URL | Faster initial testing | Cannot deploy to multiple environments | Only in the first day of development |
| Inlining all styles in component files | No separate style architecture needed | Style duplication, harder theming, larger bundle | Phase 1 only — extract to shared styles before Phase 2 |
| Skipping CSP testing | Faster CI | Silent failures on customer sites with strict CSP | Never — add CSP test in Phase 1 |
| Not setting a bundle size budget | No CI config needed | Gradual bloat goes unnoticed | Never — takes 5 minutes to configure |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| WebSocket to chat-server | Not handling close code `1008` (pre-accept rejection) — the `onopen` never fires but neither does a useful `onerror` | Check `onclose` with `code === 1008` and show "Unable to connect" immediately. Do not wait for a timeout. |
| WebSocket to chat-server | Sending messages before `connected` event is received | Queue or disable input until the `connected` event sets `sessionId`. The server may not process messages sent before the agent connection is established. |
| WebSocket to chat-server | Not enforcing 4096-byte limit client-side | Check `new TextEncoder().encode(JSON.stringify(msg)).length` before sending. Using `string.length` is wrong — it counts UTF-16 code units, not bytes. Multi-byte characters (emoji, CJK) will be under-counted. |
| Markdown (marked) | Passing raw `marked()` output to `unsafeHTML` | Always pipe through DOMPurify: `unsafeHTML(DOMPurify.sanitize(marked.parse(content)))` |
| Customer site DOM | Assuming `document.body` is available and writable | The widget is a custom element — it should never touch `document.body` or any DOM outside its own shadow root |
| Customer site events | Widget click handlers use `stopPropagation()` on composed events, breaking customer site interactions | Only stop propagation on events that must not leak. Most events should be allowed to propagate naturally. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering entire message list on every token | Scroll jitter, CPU spikes during streaming | Isolate streaming content to its own component; batch token updates with `requestAnimationFrame` | Noticeable at ~20+ messages in history |
| Parsing markdown on every token arrival | Lag between tokens, visible stutter | Only parse markdown on `message_end` (finalized messages). During streaming, render as plain text or parse on a debounced timer (e.g., every 200ms) | Noticeable with code blocks or complex markdown |
| Auto-scrolling with `scrollIntoView` on every token | Layout thrashing, scroll fights if user scrolled up | Use `scrollTop` assignment instead. Only auto-scroll if user is already at bottom (within threshold). Detect user scroll-up and pause auto-scroll. | Immediately noticeable |
| Creating new DOM nodes for each token | GC pressure, memory growth during long responses | Append to existing text node: `textNode.data += token` or update `textContent` on a container | Long streaming responses (100+ tokens) |
| No cleanup on disconnect | WebSocket stays open, event listeners leak, timers keep running | Implement `disconnectedCallback` in Lit components. Close WebSocket, clear intervals, remove global listeners. | When widget is dynamically added/removed from DOM |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rendering markdown without sanitization | XSS — attacker-controlled content executes scripts in customer page context. Shadow DOM is NOT a security boundary. | Use DOMPurify on all HTML output from `marked`. Whitelist allowed tags and attributes explicitly. |
| Using `javascript:` URLs in markdown links | XSS via link clicks | DOMPurify strips these by default. Also override `marked`'s link renderer to validate `href` starts with `http://` or `https://`. |
| Logging sensitive data to console in production | Customer data visible in browser console to any page script | Strip console.log/debug in production builds. Use Vite's `define` to set `__DEV__` flag. |
| Trusting `Origin` header alone for security | Origin can be spoofed outside browsers | This is the server's problem, not the widget's. But the widget should never include API keys or secrets — the WebSocket URL is the only credential. |
| Not validating server message types | Malformed server messages could cause rendering errors or unexpected behavior | Parse with a strict type guard. Unknown types should be silently dropped (already in design doc). |
| Exposing internal APIs on the custom element | Customer page scripts can call methods on the widget element | Only expose documented public methods. Keep internal methods private/protected. Use TypeScript access modifiers. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback during WebSocket connection | User clicks chat bubble, nothing happens for 1-3 seconds | Show a connecting spinner immediately on bubble click. Transition to chat panel only after `connected` event. |
| Auto-scroll overrides user scroll position | User scrolls up to re-read a message, streaming token yanks them back to bottom | Track whether user has scrolled up. Only auto-scroll when user is at/near bottom. Show a "scroll to bottom" button when new messages arrive and user is scrolled up. |
| No character count feedback near 4096 limit | User types a long message, hits send, gets an error | Show remaining characters when content exceeds 80% of limit. Disable send at limit. |
| Widget panel opens and covers critical page content | Customer's "Buy Now" button or navigation is hidden | Allow position configuration (bottom-right/bottom-left). Keep panel width/height within reasonable bounds. Consider a minimize/maximize toggle. |
| No distinction between "connection lost" and "session ended" | User does not know whether to wait or start over | "Connection lost" = show retry/reconnect option. "Session ended" = show "Start new conversation" option. Different UI treatments for different states. |
| Greeting message appears as an agent message | User thinks the agent has already responded and waits | Display greeting as a system/welcome message with distinct styling, not as an agent chat bubble. |

## "Looks Done But Isn't" Checklist

- [ ] **Markdown rendering:** Tests include XSS payloads (`<script>`, `onerror=`, `javascript:` URLs, data URLs) — not just "bold renders bold"
- [ ] **Shadow DOM isolation:** Widget tested on a page with aggressive CSS (`* { box-sizing: border-box; margin: 0; }`, Bootstrap, Tailwind reset) — verify no style leaks in or out
- [ ] **CSP compatibility:** Widget loaded under `style-src 'self'; script-src 'self' cdn.example.com` — verify no console errors
- [ ] **WebSocket error handling:** Tested with connection rejection (code 1008), mid-session drop, idle timeout, and malformed server messages
- [ ] **Streaming performance:** Profiled with 50+ messages and a 2000-token streaming response — verify < 16ms frame times
- [ ] **Bundle size:** Measured gzipped size of UMD output — verify under 50KB
- [ ] **Mobile behavior:** Tested on iOS Safari (unique WebSocket behavior, different viewport handling for keyboard)
- [ ] **Multiple instances:** Two `<work1-chat-widget>` elements on the same page do not conflict (separate WebSocket connections, separate state)
- [ ] **Cleanup:** Widget removed from DOM via `element.remove()` — verify WebSocket closes, no leaked timers/listeners
- [ ] **Font rendering:** Widget tested on a page with no Google Fonts — verify system-ui fallback looks acceptable

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| XSS via unsanitized markdown | HIGH | Add DOMPurify, audit all `unsafeHTML` usage, test with XSS payloads, issue security patch to all CDN consumers |
| Bundle size bloat (>100KB gzip) | MEDIUM | Run bundle analyzer, identify largest deps, replace `marked` with minimal parser, lazy-load optional features |
| CSP violations on customer sites | LOW | Document required CSP directives, verify `adoptedStyleSheets` usage, remove any inline style attributes |
| Streaming performance jank | MEDIUM | Refactor to isolate streaming component, add `requestAnimationFrame` batching, profile and verify |
| WebSocket silent drops | LOW | Add heartbeat ping, add `visibilitychange` listener, add connection health indicator |
| Shadow DOM style leakage | MEDIUM | Audit all styles for `:host` specificity, verify no global selectors, test on customer-like pages |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Shadow DOM font/style isolation | Phase 1 (UI foundation) | Test widget on page with CSS reset and no custom fonts — text renders correctly with system-ui |
| CSP violations | Phase 1 (build setup) | CI test loads widget under strict CSP — no console violations |
| Markdown XSS | Phase 1 (message rendering) | Test suite includes 10+ XSS payloads — all neutralized |
| Streaming rendering jank | Phase 1 (streaming display) | Performance profile shows < 16ms frames during 2000-token stream |
| WebSocket silent drops | Phase 1 (connection layer) | Test with network disconnect — widget shows error within 30 seconds |
| Bundle size bloat | Phase 1 (build setup) | CI gate rejects builds over 50KB gzipped |
| Auto-scroll hijacking | Phase 1 (message list) | Manual test: scroll up during streaming, position holds |
| Event propagation leaks | Phase 2 (polish) | Widget click/input events do not trigger host page handlers |
| Multiple instances conflict | Phase 2 (hardening) | Two widgets on same page maintain independent state |
| Cleanup on removal | Phase 2 (hardening) | Memory profiling shows no leaks after widget add/remove cycles |

## Sources

- Lit documentation on Shadow DOM (lit.dev/docs/components/shadow-dom/) — MEDIUM confidence (training data, could not fetch live)
- Lit documentation on rendering (lit.dev/docs/components/rendering/) — MEDIUM confidence (training data)
- DOMPurify documentation (github.com/cure53/DOMPurify) — MEDIUM confidence (training data, well-established library)
- marked documentation (github.com/markedjs/marked) — MEDIUM confidence (training data)
- W3C Shadow DOM specification — HIGH confidence (stable spec, well-documented)
- CSP specification (MDN/W3C) — HIGH confidence (stable, well-documented)
- WebSocket API specification (MDN) — HIGH confidence (stable API)
- Project design document (docs/plans/2026-03-04-chat-widget-design.md) — HIGH confidence (primary source)
- Project protocol contract (DRAFT.md) — HIGH confidence (primary source)

*Note: WebSearch and WebFetch were unavailable during research. All external findings are based on training data (cutoff ~May 2025). Confidence levels reflect this limitation. Core findings are well-established domain knowledge unlikely to have changed, but specific library version details should be verified against current documentation during implementation.*

---
*Pitfalls research for: Work1 Chat Widget (embeddable, Shadow DOM, WebSocket streaming)*
*Researched: 2026-03-04*
