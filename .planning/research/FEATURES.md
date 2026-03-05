# Feature Research

**Domain:** Embeddable AI chat widget (customer-facing, website-embedded)
**Researched:** 2026-03-04
**Confidence:** MEDIUM (based on training data knowledge of Intercom, Crisp, Drift, Tidio, LiveChat, Zendesk, tawk.to, Olark, HubSpot Chat; no live verification available)

## Scope

This analysis covers **widget-side features only** -- what the end user sees and interacts with in the embedded chat window. Backend/admin panel features (agent dashboards, analytics, routing rules) are out of scope.

The Work1 widget is specifically an **AI agent chat widget** (not human live chat), which narrows the feature set: no agent avatars, no queue positions, no "leave a message" flows. The protocol is fixed (DRAFT.md) and ephemeral (no persistence).

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or amateurish.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Floating bubble launcher | Every chat widget uses this pattern. Users scan bottom-right for chat. | LOW | Already in design doc. Support bottom-right and bottom-left positions. |
| Slide-up chat panel | Standard interaction model. Click bubble, panel slides up. | LOW | Already in design doc. Must animate smoothly (CSS transitions, not JS). |
| Real-time message streaming | Users expect ChatGPT-style token-by-token text appearance for AI. | MEDIUM | Core value. Protocol supports via `token` + `message_end` events. |
| Typing indicator | Every chat product shows "..." or animation while response is being generated. | LOW | Protocol supports via `typing` events. Use animated dots. |
| Markdown rendering in agent messages | AI responses use markdown (bold, lists, code blocks, links). Must render properly. | MEDIUM | Use `marked` with DOMPurify/sanitization. Support: bold, italic, links, code, lists. |
| Message input with send button | Text input area + send action. Enter to send, Shift+Enter for newline. | LOW | Standard pattern. Must disable when disconnected. |
| Connection state feedback | Users need to know if chat is connected, reconnecting, or broken. | LOW | Show banners/indicators for reconnecting, errors, session ended states. |
| Error messages | When things break, tell the user clearly. Don't silently fail. | LOW | Protocol provides error events. Show as system messages in chat. |
| Greeting/welcome message | First-time message before user types anything. Sets context. | LOW | Config attribute `greeting`. Display as agent message on panel open. |
| Close/minimize button | Users must be able to dismiss the panel and return to the page. | LOW | Standard X button in header. Returns to bubble state. |
| Auto-scroll to newest message | Chat should scroll to bottom as new tokens/messages arrive. | LOW | Must handle edge case: don't auto-scroll if user has scrolled up to read history. |
| Mobile responsive | Widget must work on mobile screens (full-width panel, appropriate sizing). | MEDIUM | Panel should go full-width/full-height on narrow viewports. Touch-friendly input. |
| Shadow DOM encapsulation | Host page CSS must not break widget. Widget CSS must not leak out. | MEDIUM | Already decided (Lit + Shadow DOM). Non-negotiable for embeddable widgets. |
| CSP compatibility | Many enterprise sites have strict Content-Security-Policy. Widget must work. | MEDIUM | No inline styles via `style=""`, no `eval()`, no inline scripts. Lit handles this if configured. |
| XSS prevention | Agent markdown could contain malicious content. Must sanitize all rendered HTML. | MEDIUM | Sanitize `marked` output. Never use `innerHTML` with unsanitized content. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but create meaningful value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Deep theming via CSS custom properties + CSS parts | Most widgets offer color picker at best. CSS custom properties let developers match their brand exactly without iframe limitations. | MEDIUM | Already in design doc. Expose `::part()` selectors for advanced customization. This is a genuine advantage over iframe-based widgets like Intercom. |
| Zero-dependency Web Component | Works in React, Vue, Angular, vanilla -- no framework lock-in. Competitors often ship React-only or require adapters. | LOW | Already decided. The Web Component approach itself is the differentiator. |
| Lightweight bundle size | Intercom loads 200-300KB+ of JS. A sub-50KB widget loads faster and doesn't tank page performance. | MEDIUM | Lit is ~5KB. Target total bundle under 50KB gzipped. Actively monitor with bundlesize or similar. |
| Status messages for tool use | "Looking up service details..." shows the AI is doing work, not just slow. Competitors show generic "typing" only. | LOW | Protocol already sends `status` events with tool-specific messages. Display as transient indicator above typing dots. |
| Health check before showing bubble | Don't show chat bubble if service is down. Avoids frustrated users clicking dead buttons. | LOW | Optional `GET /health` endpoint exists. Poll on page load, hide bubble if degraded. |
| Smooth open/close animations | Professional polish. Many budget widgets snap open with no transition. | LOW | CSS transitions on panel. 200-300ms ease-out. No JS animation libraries needed. |
| Keyboard accessibility | Tab navigation, Enter to send, Escape to close. Not standard in most widgets. | MEDIUM | Important for professional sites. Focus trapping when panel is open. aria-labels on interactive elements. |
| Pre-chat greeting with delayed appearance | Bubble appears immediately, but a "tooltip" greeting pops up after 3-5 seconds. Draws attention without being invasive. | LOW | Crisp and Tidio do this well. Small notification-style tooltip near the bubble. |
| Start new conversation action | After session ends (idle timeout, error), clearly offer to start fresh. | LOW | Already in design doc for session_end handling. Clean UX for session reset. |
| Copy message content | Users often want to copy AI responses (especially code blocks). | LOW | Copy button on hover for agent messages. Essential for code-heavy responses. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems -- especially for an AI-only, ephemeral chat widget.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Pre-chat forms (name/email collection) | "We need to know who we're talking to" | Adds friction before conversation. Kills conversion rates. AI chat doesn't need identity to help. The protocol has no concept of user identity. | If needed later, collect info mid-conversation via the AI agent itself asking naturally. |
| Chat history persistence (localStorage) | "Users should see past conversations" | PROJECT.md explicitly says ephemeral. Adding persistence creates data privacy obligations (GDPR right-to-delete), stale conversation UX issues, and storage quota problems. Protocol has no session resume. | Show "Conversations are not saved" in UI. Keep it simple and privacy-friendly. |
| File/image upload | "Users need to share screenshots" | Requires backend file handling, storage, virus scanning, CDN. Protocol only supports text messages. Massive scope increase. | Defer entirely. If needed, add as protocol v2 feature with backend support. |
| Sound notifications | "Play a ding when agent responds" | Annoying. Unexpected audio on websites is hostile UX. Different user contexts (office, public, headphones). Auto-play audio policies in browsers. | Never auto-play sound. If added, must be opt-in and off by default. |
| Emoji picker | "Users love emojis" | Significant bundle size increase for emoji data/images. Users can type emoji on their own keyboards (OS-level). | Support rendering emojis in messages (they already render). Don't add a picker UI. |
| Proactive/triggered messages | "Pop open chat automatically based on page behavior" | Aggressive. Users hate unsolicited popups. Creates negative brand association. Intercom moved away from aggressive triggers. | Allow the bubble tooltip as gentle attention, but never auto-open the panel or inject messages without user action. |
| Multi-language auto-detection | "Detect user language and switch UI" | i18n is high complexity for small teams. Locale detection is unreliable. PROJECT.md says English only for v1. | English v1. Add i18n framework in v2 if demand warrants. Use simple string constants so i18n is addable later. |
| Rich message types (cards, carousels, buttons) | "The AI should show product cards and quick-reply buttons" | Requires complex rendering engine, protocol extensions, and tight backend coupling. PROJECT.md explicitly defers this. | Stick with markdown for v1. Markdown can render links, lists, formatted text -- covers 90% of needs. |
| Avatar/profile customization | "Show agent photo and name" | It's an AI, not a human. Showing a human avatar for AI is deceptive. Adding avatar support is complexity for no v1 value. | Show a simple bot/AI icon. "Powered by AI" badge handles disclosure. |
| Offline mode / leave a message | "What if no one is available?" | This is an AI agent, not human support. The AI is either available (service up) or not (service down). "Leave a message" implies human follow-up that doesn't exist. | Use health check to hide bubble when service is down. Show clear error when connection fails. |
| Chat ratings / feedback buttons | "Let users rate the conversation" | Requires backend support for storing ratings. Protocol has no feedback mechanism. Premature optimization -- get the chat working first, then measure. | Defer to v2. When added, submit via separate REST endpoint, not WebSocket. |

---

## Feature Dependencies

```
Shadow DOM Encapsulation
    └──required-by──> CSS Custom Properties Theming
    └──required-by──> CSP Compatibility

WebSocket Connection (ChatClient)
    └──required-by──> Message Streaming (token events)
    └──required-by──> Typing Indicator (typing events)
    └──required-by──> Status Messages (status events)
    └──required-by──> Connection State Feedback (reconnecting/error/session_end)
    └──required-by──> Send Messages (chat-input)

Message Streaming
    └──required-by──> Markdown Rendering (renders finalized message content)
    └──required-by──> Auto-scroll (scrolls as tokens arrive)

Markdown Rendering
    └──required-by──> XSS Prevention (sanitize rendered HTML)
    └──required-by──> Copy Message Content (copy rendered/raw content)

Floating Bubble
    └──required-by──> Chat Panel (bubble toggles panel)
    └──required-by──> Pre-chat Tooltip (tooltip anchors to bubble)

Chat Panel
    └──required-by──> Mobile Responsive (panel adapts to viewport)
    └──required-by──> Greeting Message (displays in panel)

Connection State Feedback
    └──required-by──> Start New Conversation (shown after session_end)

Health Check ──enhances──> Floating Bubble (hide bubble when service down)
Keyboard Accessibility ──enhances──> Chat Panel (tab navigation, focus trapping)
Copy Message ──enhances──> Markdown Rendering (copy button on messages)
Animations ──enhances──> Chat Panel + Floating Bubble (polish)
```

### Dependency Notes

- **WebSocket is the foundation:** Everything depends on the connection layer working. Build and test ChatClient first, in isolation.
- **Markdown requires sanitization:** These are inseparable. Never render markdown without sanitization in the same implementation pass.
- **Shadow DOM enables theming:** CSS custom properties pierce shadow DOM by design. CSS parts expose internals for advanced styling. Both depend on Shadow DOM being in place.
- **Mobile responsive depends on panel existing:** Responsive behavior is a CSS concern on top of the panel component, not a separate component.

---

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to ship a working, professional chat widget.

- [ ] Floating bubble launcher (bottom-right/left, configurable) -- the entry point
- [ ] Chat panel with open/close animation -- the container
- [ ] WebSocket connection to chat-server -- the foundation
- [ ] Real-time message streaming (token accumulation) -- the core experience
- [ ] Typing indicator -- expected AI chat behavior
- [ ] Markdown rendering with XSS sanitization -- AI responses need formatting
- [ ] Message input with Enter-to-send -- how users interact
- [ ] Connection state feedback (connecting, reconnecting, errors, session end) -- trust signals
- [ ] Greeting message -- sets first-time context
- [ ] Shadow DOM encapsulation -- non-negotiable for embeddable widgets
- [ ] CSS custom properties theming (primary color, fonts, sizes) -- customers must brand it
- [ ] CDN script tag distribution -- lowest friction integration
- [ ] npm package distribution -- developer-friendly integration
- [ ] AI disclosure badge -- ethical/legal requirement
- [ ] Auto-scroll with scroll-lock on user scroll-up -- usability basic
- [ ] Mobile responsive panel -- significant traffic comes from mobile

### Add After Validation (v1.x)

Features to add once core is working and deployed to real customers.

- [ ] CSS parts for advanced theming -- when customers request deeper customization
- [ ] Health check integration -- when service reliability is proven and monitoring shows dead-button issues
- [ ] Keyboard accessibility (tab, escape, focus trapping) -- when enterprise customers require it
- [ ] Copy message content button -- when users report needing to copy AI responses
- [ ] Pre-chat tooltip on bubble -- when conversion optimization begins
- [ ] Status messages for tool use -- when agent tool use is common enough to warrant UI
- [ ] Configurable bubble icon (URL or built-in set) -- when branding requests come in
- [ ] Bundle size optimization pass -- when performance metrics show issues

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] i18n / localization framework -- when non-English markets are targeted
- [ ] Rich message types (cards, buttons, quick replies) -- when protocol v2 supports them
- [ ] File upload -- when backend file handling exists
- [ ] Chat ratings/feedback -- when there's a backend to receive and act on feedback
- [ ] WCAG 2.1 AA compliance -- when accessibility audit is prioritized
- [ ] Message persistence / conversation history -- only if protocol adds session resume

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| WebSocket connection + streaming | HIGH | MEDIUM | P1 |
| Floating bubble + panel | HIGH | LOW | P1 |
| Markdown rendering + sanitization | HIGH | MEDIUM | P1 |
| Message input (Enter/Shift+Enter) | HIGH | LOW | P1 |
| Typing indicator | HIGH | LOW | P1 |
| Connection state feedback | HIGH | LOW | P1 |
| Shadow DOM encapsulation | HIGH | LOW | P1 |
| Greeting message | MEDIUM | LOW | P1 |
| CSS custom properties theming | HIGH | MEDIUM | P1 |
| Auto-scroll | MEDIUM | LOW | P1 |
| AI disclosure badge | MEDIUM | LOW | P1 |
| CDN + npm distribution | HIGH | MEDIUM | P1 |
| Mobile responsive | HIGH | MEDIUM | P1 |
| CSP compatibility | MEDIUM | LOW | P1 |
| XSS prevention | HIGH | LOW | P1 |
| Open/close animations | MEDIUM | LOW | P1 |
| Status messages (tool use) | MEDIUM | LOW | P2 |
| Copy message button | MEDIUM | LOW | P2 |
| Health check integration | LOW | LOW | P2 |
| Keyboard accessibility | MEDIUM | MEDIUM | P2 |
| CSS parts (advanced theming) | LOW | LOW | P2 |
| Pre-chat tooltip | LOW | LOW | P2 |
| Custom bubble icon (URL) | LOW | LOW | P2 |
| Bundle size monitoring | MEDIUM | LOW | P2 |
| i18n framework | LOW | HIGH | P3 |
| Rich message types | MEDIUM | HIGH | P3 |
| WCAG compliance | MEDIUM | HIGH | P3 |
| File upload | LOW | HIGH | P3 |
| Chat feedback/ratings | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch -- the widget is incomplete without these
- P2: Should have, add when possible -- improves quality and adoption
- P3: Nice to have, future consideration -- wait for demand signals

---

## Competitor Feature Analysis

Analysis based on training data knowledge of major embeddable chat widgets (MEDIUM confidence -- not verified against live products as of 2026-03-04).

| Feature | Intercom | Crisp | Tidio | Our Approach |
|---------|----------|-------|-------|--------------|
| Launcher style | Bubble (bottom-right) | Bubble (bottom-right/left) | Bubble (bottom-right) | Bubble, configurable position |
| Panel style | Slide-up panel, large | Slide-up panel | Slide-up panel | Slide-up panel, configurable size |
| Theming | Limited color config via admin | Color config + some CSS | Admin panel config | Deep CSS custom properties + CSS parts |
| Framework approach | React (iframe) | Custom JS (iframe) | React (iframe) | Web Component (Shadow DOM) -- no iframe |
| Bundle size | 200-300KB+ | ~100KB+ | 150KB+ | Target sub-50KB gzipped |
| Markdown | Limited formatting | Basic markdown | Basic formatting | Full markdown via marked |
| Typing indicator | Yes (dots animation) | Yes (dots) | Yes (dots) | Yes, animated dots |
| Rich messages | Cards, carousels, buttons | Some rich types | Cards, quick replies | Markdown only (v1) |
| File upload | Yes | Yes | Yes | No (v1) |
| Pre-chat form | Yes (configurable) | Yes | Yes | No (anti-feature) |
| Offline mode | Leave a message | Leave a message | Leave a message | Hide bubble (health check) |
| Sound | Configurable ding | Optional sound | Sound on message | No (anti-feature) |
| Chat history | Persisted (account-based) | Persisted (cookie) | Persisted | Ephemeral (by design) |
| Mobile UX | Full-screen panel | Full-screen panel | Full-screen panel | Responsive full-width panel |
| CSP compatible | Iframe (mostly) | Iframe (mostly) | Iframe (mostly) | Native Shadow DOM (fully) |
| Encapsulation method | iframe | iframe | iframe | Shadow DOM |

**Key insight:** Most competitors use iframes for encapsulation, which provides strong isolation but limits theming and creates accessibility barriers. Our Shadow DOM + Web Component approach gives equal isolation with superior theming capability and native DOM integration. This is the primary technical differentiator.

---

## Sources

- Training data knowledge of Intercom Messenger, Crisp Chat, Tidio, LiveChat, Zendesk Web Widget, tawk.to, Olark, HubSpot Chat (MEDIUM confidence -- not verified against live products)
- Project DRAFT.md (WebSocket protocol specification) (HIGH confidence -- primary source)
- Project design document `docs/plans/2026-03-04-chat-widget-design.md` (HIGH confidence -- primary source)
- PROJECT.md constraints and scope (HIGH confidence -- primary source)

**Note:** Web search and web fetch tools were unavailable during this research. Feature landscape is based on extensive training data about these products but should be considered MEDIUM confidence. The competitor feature matrix in particular may have shifted since training cutoff (May 2025). Core conclusions about table stakes vs differentiators are stable patterns unlikely to have changed.

---
*Feature research for: Embeddable AI Chat Widget*
*Researched: 2026-03-04*
