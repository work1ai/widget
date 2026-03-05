# Phase 3: Streaming & Content - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Agent responses stream in token-by-token with typing indicators, render as sanitized markdown, and errors surface clearly to the user. This phase wires token/typing/message_end/status events from ChatClient through ChatStore into the UI, adds markdown rendering for agent messages, and implements error/status presentation.

Requirements: STRM-01 through STRM-06, CONT-01 through CONT-05, ERR-01 through ERR-05.

</domain>

<decisions>
## Implementation Decisions

### Streaming UX
- Blinking cursor (pipe/block character) at end of streaming text while tokens are arriving -- ChatGPT/Claude pattern
- Typing indicator (animated dots) renders as a temporary agent bubble; when first token arrives, dots are replaced by streaming text in the same bubble position (in-place replacement, no layout shift)
- Markdown is rendered incrementally as tokens arrive -- parsed on every token append, not deferred to message_end
- If user sends a message while agent is streaming, current streaming bubble finalizes as-is (incomplete content preserved), user message appears below, agent may start a new response

### Markdown rendering
- Only agent messages render markdown; user messages stay plain text
- No syntax highlighting for code blocks -- monospace font with distinct background only. Syntax highlighting deferred to a future phase
- No copy-to-clipboard button on code blocks
- Code blocks get a max-height (~200-300px) with internal scrolling (vertical + horizontal for wide lines). Bubble doesn't grow unbounded
- Supported markdown: bold, italic, links, code blocks, inline code, lists (per CONT-01)
- All markdown output sanitized via DOMPurify (per CONT-02)
- Links open in new tab with target="_blank" (per CONT-03)

### Status indicators
- Status events display as small italic text below the typing dots or streaming bubble -- like a subtitle, not a chat message
- Only the latest status text is shown; new status replaces previous (no stacking)
- Status text has a subtle ellipsis pulse animation to indicate activity
- Status auto-clears on next token or message_end (per STRM-06)
- Reconnecting banner (Phase 1: thin top-of-panel banner) stays separate from status indicators -- different location, different purpose

### Error presentation
- Error messages appear as centered colored system messages in the chat flow (subtle red/warning background strip)
- Fatal errors (connection lost, session end) show a persistent "Start new conversation" button at the bottom, replacing the disabled input area
- Connection rejected (code 1008) retry button reconnects to the same server-url (fresh WebSocket, fresh session)
- Message-too-large: prevent sending only (send button disabled), not prevent typing. Already implemented in Phase 2
- Recoverable vs fatal errors: same visual style (colored system message), distinction is behavioral -- recoverable errors keep input enabled, fatal errors disable input and show action button

### Claude's Discretion
- Markdown library configuration and DOMPurify setup details
- Typing indicator dot animation implementation
- Blinking cursor animation CSS
- Exact colors, spacing, and typography for status indicators and error messages
- How ChatStore manages streaming state internally (token accumulation approach)
- Code block background color and border styling

</decisions>

<specifics>
## Specific Ideas

- Streaming UX should feel like ChatGPT/Claude -- blinking cursor, smooth token accumulation, markdown appearing progressively
- Status indicators are purely transient UI, never persisted as messages in the chat history
- The `streaming` boolean field already exists on `ChatMessage` type (added in Phase 2 prep)
- ChatStore has a TODO comment at line 153 for token, typing, message_end, status listeners -- this is the primary integration point

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ChatClient` (src/chat-client.ts): Already dispatches token, typing, message_end, status events via CustomEvent with typed details
- `ChatStore` (src/chat-store.ts): ReactiveController with messages array, connectionState, has TODO for Phase 3 event listeners
- `ChatMessage` type (src/chat-store.types.ts): Has `streaming?: boolean` field ready for use
- `renderMessageBubble` (src/components/message-bubble.ts): Currently renders `message.content` as plain text -- needs markdown rendering for agent role
- `message-list.ts`: Uses `repeat` directive with message.id keys, sentinel-based IntersectionObserver for scroll

### Established Patterns
- Lit + TypeScript + decorators for components
- EventTarget/CustomEvent for ChatClient events
- ReactiveController pattern for ChatStore (mutations call `host.requestUpdate()`)
- Immutable array updates: `this.messages = [...this.messages, newMsg]`
- iMessage-style grouping via `shouldGroup()` function

### Integration Points
- `ChatStore.wireClientEvents()` line 114-153: Add token, typing, message_end, status listeners here
- `renderMessageBubble()`: Add markdown rendering branch for agent messages
- `message-list.ts`: May need to render typing indicator and status text below messages
- New dependencies needed: `marked` (markdown parser) and `dompurify` (sanitizer) -- neither installed yet

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 03-streaming-content*
*Context gathered: 2026-03-04*
