# Phase 2: UI Shell & Messaging - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Floating bubble button, chat panel with open/close animation, message input with send, and user message display -- the complete visual shell and send-side experience. Users can open a chat panel, type messages, and see them appear as user bubbles. Agent response streaming and markdown rendering are Phase 3.

Requirements: MSG-01 through MSG-06, SHEL-01 through SHEL-10.

</domain>

<decisions>
## Implementation Decisions

### Message bubbles
- Right-aligned user messages (accent color background), left-aligned agent messages (neutral color background)
- Rounded rectangles with subtle drop shadow (12-16px border-radius)
- No timestamps -- conversations are ephemeral, timestamps add clutter without value
- Consecutive same-sender messages grouped: reduced spacing between them, pointed tail on last bubble only (iMessage/WhatsApp pattern)

### Input area
- Character/byte counter appears only near the 4096-byte limit (~200 chars remaining), turns red at limit. Hidden otherwise
- Send button is an icon (arrow/send SVG) inside the input area on the right side. Accent-colored when active, grayed when disabled
- Textarea auto-grows from single line up to 4-5 lines (~120px max), then scrolls internally
- Placeholder text configurable via HTML attribute (e.g., `placeholder`), default: "Type a message..."
- Enter sends, Shift+Enter inserts newline (per MSG-02)

### Bubble & panel appearance
- Floating bubble: ~56px circle, accent-colored fill, white chat-bubble SVG icon, subtle shadow. Bottom-right by default (configurable per SHEL-08)
- Panel header: configurable title (default "Chat") on left, "Powered by AI" badge (subtle, always visible per CONT-05), close [X] button on right. Accent-colored background, white text
- Open/close animation: panel slides up from bubble position, 250ms ease-out. Slides back down on close
- Greeting message (CONT-04): configurable text displayed as first agent bubble (plain text) when panel opens. Panel never appears empty

### Scroll behavior
- Auto-scroll to bottom as new messages arrive
- Auto-scroll pauses when user scrolls up (SHEL-07)
- "Scroll to bottom" floating pill with new message count (e.g., "3 new messages") appears when user is scrolled up and new content arrives
- Auto-scroll resumes only when user scrolls back to within ~50px of bottom, or clicks the scroll-to-bottom button. Never force-scrolls
- Smooth scroll animation for manual actions (clicking scroll-to-bottom button). Instant scroll during active streaming/new messages to keep up with content flow

### Claude's Discretion
- ChatStore reactive state layer design (between ChatClient and UI components)
- Component decomposition (how to split bubble, panel, input, message list)
- CSS architecture within Shadow DOM
- SVG icon design for bubble and send button
- Exact spacing, typography, and color values (will be themeable in Phase 4)
- Disabled state visual treatment for input when disconnected

</decisions>

<specifics>
## Specific Ideas

- Bubble and panel should feel like Intercom/Drift quality -- modern, clean, professional
- iMessage/WhatsApp-style message grouping for consecutive same-sender bubbles
- The greeting message gives the panel an immediate welcoming feel on open -- never shows an empty chat area
- Placeholder attribute follows the pattern established by `server-url` and `debug` in Phase 1

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ChatClient` (src/chat-client.ts): Full WebSocket protocol client with EventTarget-based typed events. Has `connect()`, `disconnect()`, `send()` methods. Ready to be wrapped by ChatStore
- `Work1ChatWidget` (src/work1-chat-widget.ts): LitElement shell with `server-url` and `debug` attributes. Currently renders `<slot>`, needs to be expanded with actual UI
- Lit + TypeScript + decorators pattern established in Phase 1

### Established Patterns
- EventTarget for event dispatch (ChatClient uses CustomEvent with typed detail)
- HTML attribute configuration (`server-url`, `debug`) with Lit `@property` decorators
- Custom DOM events prefixed with `w1-` (w1-connected, w1-disconnected, w1-error, w1-session-end)
- Barrel exports from src/index.ts

### Integration Points
- `Work1ChatWidget.openConnection()` / `closeConnection()` -- panel open/close should trigger these
- ChatClient events (token, typing, message_end, status, reconnecting, error, session_end) feed into ChatStore
- New attributes to add: `placeholder`, `greeting`, `title` (following established `@property` pattern)
- `w1-` DOM events continue to bubble from the widget element

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 02-ui-shell-messaging*
*Context gathered: 2026-03-04*
