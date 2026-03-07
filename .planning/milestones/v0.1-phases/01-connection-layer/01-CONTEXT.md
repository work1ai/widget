# Phase 1: Connection Layer - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

WebSocket client (ChatClient) implementing the chat-server v0.1.0 protocol with full event parsing, plus TypeScript/Vite project scaffolding. No UI in this phase — only the connection layer and project setup.

Requirements: CONN-01 through CONN-08.

</domain>

<decisions>
## Implementation Decisions

### Connection timing
- Connect WebSocket when user opens the chat panel (not on widget mount, not on first message)
- Disconnect WebSocket when user closes the chat panel — each panel open starts a fresh conversation
- No client-side auto-reconnection on unexpected WebSocket close — show "Connection lost" UI with manual "Reconnect" / "Start new conversation" button
- Server URL configured via `server-url` HTML attribute on the element (explicit, no script-src inference)

### Input during reconnection
- Keep text input enabled during server-side agent reconnection (`reconnecting` event) — user can still type and send, server buffers up to 50 messages
- Show a non-blocking thin banner at the top of the chat panel: "Reconnecting..." with subtle animation — not a system message in the chat flow
- If reconnection fails (fatal error then close), show server error message in chat, disable input, offer "Start new conversation" button
- On `session_end` (e.g., idle timeout): keep conversation history visible, disable input, show reason + "Start new conversation" button at bottom

### Protocol handling
- `session_start` event from agent server: parse and emit internally but don't surface in UI — `connected` event is the user-facing readiness signal
- `status` event content: pass through as-is (raw string) — UI layer decides display treatment. No normalization to enums
- Error discrimination: treat all `error` events the same initially; if WebSocket closes shortly after, escalate to fatal. React to the close event, don't infer from message content
- Message validation: lenient with console warnings — accept what we can, `console.warn` on malformed messages. Matches CONN-08 spirit of graceful handling

### Dev/debug experience
- `debug` boolean HTML attribute on the element — when set, log all WebSocket events to console. Silent by default
- Debug log format: parsed summary, not raw frames (e.g., `[work1-widget] connected session=abc123`, `[work1-widget] token (12 chars)`) — clean, readable, no sensitive data risk
- Expose `session_id` as a read-only property on the element AND dispatch a custom DOM event (`w1-connected`) with session_id detail — customers can use for support tickets
- Emit custom DOM events for all connection lifecycle changes (connected, disconnected, error, session-end) — lets host page react (analytics, fallback contact info)

### Claude's Discretion
- Project folder structure and file organization
- TypeScript configuration choices
- Vite build configuration details
- ChatClient internal class/interface design
- Event emitter pattern choice (EventTarget, custom, etc.)
- Test framework selection for Phase 1 validation

</decisions>

<specifics>
## Specific Ideas

- Protocol spec is fully documented in DRAFT.md at project root — implementation should match it exactly
- Widget element will be `<work1-chat-widget>` with `server-url` and `debug` attributes at minimum
- Custom DOM events should be prefixed (e.g., `w1-connected`, `w1-disconnected`, `w1-error`, `w1-session-end`)
- "No client-side reconnection" is a deliberate simplification — server handles agent reconnection; widget only offers manual reconnect on WebSocket drop

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the foundational patterns
- PROJECT.md specifies: Lit (Web Components), TypeScript, Vite
- Architecture: three layers — ChatClient (WebSocket), ChatStore (reactive state), Lit UI components

### Integration Points
- ChatClient will be consumed by ChatStore in Phase 2
- Custom DOM events will be the public API for host page integration
- `server-url` and `debug` attributes set the pattern for all future configurable attributes

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-connection-layer*
*Context gathered: 2026-03-04*
