# Requirements: Work1 Chat Widget

**Defined:** 2026-03-04
**Core Value:** The widget must reliably connect to the chat backend and stream agent responses in real time

## v1 Requirements

### Connection

- [x] **CONN-01**: Widget connects to `wss://<host>/ws` via WebSocket when user opens chat panel
- [x] **CONN-02**: Widget receives and stores `session_id` from `connected` event
- [x] **CONN-03**: Widget handles connection rejection (close code 1008) with "unable to connect" UI and retry button
- [x] **CONN-04**: Widget handles unexpected WebSocket close with "connection lost" UI and "Start new conversation" button
- [x] **CONN-05**: Widget displays non-blocking "Reconnecting..." banner on `reconnecting` event
- [x] **CONN-06**: Widget clears reconnecting banner on `status` "Connection restored" event
- [x] **CONN-07**: Widget handles `session_end` event — shows reason, disables input, offers "Start new conversation"
- [x] **CONN-08**: Widget ignores unknown/malformed message types gracefully (console warning in dev)

### Messaging

- [ ] **MSG-01**: User can type and send messages via text input with send button
- [ ] **MSG-02**: User can press Enter to send, Shift+Enter for newline
- [x] **MSG-03**: Widget sends `{"type":"message","content":"..."}` JSON to server
- [ ] **MSG-04**: Widget enforces 4096 byte message limit client-side with inline validation
- [x] **MSG-05**: Send button and input are disabled when no active WebSocket connection
- [x] **MSG-06**: User messages appear immediately in chat as user bubbles

### Streaming

- [ ] **STRM-01**: Widget accumulates `token` event content into a streaming message bubble
- [ ] **STRM-02**: Widget shows typing indicator (animated dots) on `typing` active=true
- [ ] **STRM-03**: Widget hides typing indicator on `typing` active=false
- [ ] **STRM-04**: Widget finalizes streaming content into a complete agent message on `message_end`
- [ ] **STRM-05**: Widget displays `status` events as transient system indicators (e.g., "Looking up service details...")
- [ ] **STRM-06**: Status indicators auto-clear on next `token` or `message_end`

### UI Shell

- [x] **SHEL-01**: Widget renders a floating circular bubble button (bottom-right by default)
- [x] **SHEL-02**: User can click bubble to open chat panel with slide-up animation
- [x] **SHEL-03**: User can close chat panel via close button in header (returns to bubble)
- [x] **SHEL-04**: Chat panel includes header with configurable title and "Powered by AI" badge
- [ ] **SHEL-05**: Chat panel includes scrollable message area
- [ ] **SHEL-06**: Message area auto-scrolls to newest content as tokens/messages arrive
- [ ] **SHEL-07**: Auto-scroll pauses when user scrolls up to read history
- [x] **SHEL-08**: Panel position is configurable: `bottom-right` or `bottom-left`
- [x] **SHEL-09**: Panel width and height are configurable via attributes
- [x] **SHEL-10**: Open/close animations are smooth CSS transitions (200-300ms)

### Content Rendering

- [ ] **CONT-01**: Agent messages render markdown (bold, italic, links, code blocks, inline code, lists)
- [ ] **CONT-02**: All rendered markdown is sanitized via DOMPurify — no raw HTML/script execution
- [ ] **CONT-03**: Links in agent messages open in new tab (`target="_blank"`)
- [ ] **CONT-04**: Configurable greeting message displays as first agent message when panel opens
- [ ] **CONT-05**: "Powered by AI" badge is always visible in header, not configurable

### Error Handling

- [ ] **ERR-01**: Connection rejected (code 1008) shows "Unable to connect" with retry button
- [ ] **ERR-02**: `error` events display as system messages in chat
- [ ] **ERR-03**: Fatal errors (connection closes after) transition to disconnected state
- [ ] **ERR-04**: Message too large shows inline validation preventing send
- [ ] **ERR-05**: Recoverable errors keep input enabled

### Theming

- [ ] **THEM-01**: Widget exposes CSS custom properties for colors, fonts, sizes, border-radius
- [ ] **THEM-02**: HTML attributes (primary-color, width, height, position) set default CSS custom property values
- [ ] **THEM-03**: CSS custom properties override attribute values when both are set
- [ ] **THEM-04**: Widget exposes `::part()` selectors for deep styling of individual components
- [ ] **THEM-05**: Custom bubble icon support via `bubble-icon` attribute (URL or built-in name)

### Encapsulation & Security

- [ ] **SEC-01**: All widget DOM and styles are inside Shadow DOM — no leaking to host page
- [ ] **SEC-02**: Host page CSS does not affect widget rendering
- [ ] **SEC-03**: Widget is CSP-compatible — no inline styles via `style=""`, no `eval()`, no inline scripts
- [ ] **SEC-04**: Markdown output is sanitized to prevent XSS from agent responses

### Distribution

- [ ] **DIST-01**: Widget is available as CDN script (`<script src="...">`) that registers `<work1-chat-widget>` custom element
- [ ] **DIST-02**: Widget is available as npm package with ESM import
- [ ] **DIST-03**: npm package includes TypeScript type declarations
- [ ] **DIST-04**: CDN bundle is self-contained (all dependencies bundled)

### Responsive

- [ ] **RESP-01**: Chat panel adapts to narrow viewports (full-width/full-height on mobile)
- [ ] **RESP-02**: Input area is touch-friendly on mobile devices

### Testing

- [ ] **TEST-01**: Unit tests for ChatClient — WebSocket event parsing, state transitions, message validation
- [ ] **TEST-02**: Unit tests for ChatStore — state mutations for each event type, token accumulation
- [ ] **TEST-03**: Component tests — verify DOM output for each UI state
- [ ] **TEST-04**: Integration tests — full message flow with mock WebSocket server
- [ ] **TEST-05**: Integration tests — reconnection flow and session end flow

## v2 Requirements

### Accessibility

- **A11Y-01**: Keyboard navigation (Tab, Enter, Escape) through all interactive elements
- **A11Y-02**: Focus trapping when chat panel is open
- **A11Y-03**: Screen reader support with ARIA labels
- **A11Y-04**: WCAG 2.1 AA color contrast compliance

### Polish

- **PLSH-01**: Copy message content button on agent messages
- **PLSH-02**: Health check polling — hide bubble when service is degraded
- **PLSH-03**: Pre-chat tooltip on bubble (delayed appearance after 3-5 seconds)
- **PLSH-04**: Bundle size monitoring in CI

### Internationalization

- **I18N-01**: Externalized string constants for UI text
- **I18N-02**: Multi-language support with locale detection

## Out of Scope

| Feature | Reason |
|---------|--------|
| Pre-chat forms (name/email) | Adds friction, AI doesn't need identity, protocol has no user identity concept |
| Chat history persistence | Ephemeral by design, GDPR complexity, protocol has no session resume |
| File/image upload | Protocol only supports text, requires backend file handling |
| Sound notifications | Hostile UX on third-party sites, auto-play policy issues |
| Emoji picker | Users can type emoji via OS keyboard, large bundle size impact |
| Proactive/auto-open messages | Aggressive UX, negative brand association |
| Rich message types (cards, carousels) | Requires protocol v2, high complexity |
| Avatar/profile customization | AI widget, not human chat — deceptive to show human avatar |
| Offline / leave a message mode | AI is either available or not, no human follow-up exists |
| Chat ratings/feedback | No backend support, premature optimization |
| Client-side WebSocket reconnection | Server handles agent reconnection; manual reconnect on WebSocket drop |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONN-01 | Phase 1 | Complete |
| CONN-02 | Phase 1 | Complete |
| CONN-03 | Phase 1 | Complete |
| CONN-04 | Phase 1 | Complete |
| CONN-05 | Phase 1 | Complete |
| CONN-06 | Phase 1 | Complete |
| CONN-07 | Phase 1 | Complete |
| CONN-08 | Phase 1 | Complete |
| MSG-01 | Phase 2 | Pending |
| MSG-02 | Phase 2 | Pending |
| MSG-03 | Phase 2 | Complete |
| MSG-04 | Phase 2 | Pending |
| MSG-05 | Phase 2 | Complete |
| MSG-06 | Phase 2 | Complete |
| STRM-01 | Phase 3 | Pending |
| STRM-02 | Phase 3 | Pending |
| STRM-03 | Phase 3 | Pending |
| STRM-04 | Phase 3 | Pending |
| STRM-05 | Phase 3 | Pending |
| STRM-06 | Phase 3 | Pending |
| SHEL-01 | Phase 2 | Complete |
| SHEL-02 | Phase 2 | Complete |
| SHEL-03 | Phase 2 | Complete |
| SHEL-04 | Phase 2 | Complete |
| SHEL-05 | Phase 2 | Pending |
| SHEL-06 | Phase 2 | Pending |
| SHEL-07 | Phase 2 | Pending |
| SHEL-08 | Phase 2 | Complete |
| SHEL-09 | Phase 2 | Complete |
| SHEL-10 | Phase 2 | Complete |
| CONT-01 | Phase 3 | Pending |
| CONT-02 | Phase 3 | Pending |
| CONT-03 | Phase 3 | Pending |
| CONT-04 | Phase 3 | Pending |
| CONT-05 | Phase 3 | Pending |
| ERR-01 | Phase 3 | Pending |
| ERR-02 | Phase 3 | Pending |
| ERR-03 | Phase 3 | Pending |
| ERR-04 | Phase 3 | Pending |
| ERR-05 | Phase 3 | Pending |
| THEM-01 | Phase 4 | Pending |
| THEM-02 | Phase 4 | Pending |
| THEM-03 | Phase 4 | Pending |
| THEM-04 | Phase 4 | Pending |
| THEM-05 | Phase 4 | Pending |
| SEC-01 | Phase 4 | Pending |
| SEC-02 | Phase 4 | Pending |
| SEC-03 | Phase 4 | Pending |
| SEC-04 | Phase 4 | Pending |
| DIST-01 | Phase 5 | Pending |
| DIST-02 | Phase 5 | Pending |
| DIST-03 | Phase 5 | Pending |
| DIST-04 | Phase 5 | Pending |
| RESP-01 | Phase 5 | Pending |
| RESP-02 | Phase 5 | Pending |
| TEST-01 | Phase 6 | Pending |
| TEST-02 | Phase 6 | Pending |
| TEST-03 | Phase 6 | Pending |
| TEST-04 | Phase 6 | Pending |
| TEST-05 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 60 total
- Mapped to phases: 60
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after roadmap creation*
