# Work1 Chat Widget — Design Document

**Date:** 2026-03-04
**Status:** Approved
**Protocol Version:** 1.0 (matches chat-server v0.1.0)

---

## Decisions

| Decision | Choice |
|----------|--------|
| Distribution format | Web Component (custom element) |
| Internal rendering | Lit (Shadow DOM) |
| Language | TypeScript |
| Deployment | CDN script tag + npm package |
| UI presentation | Floating bubble + slide-up panel |
| Theming | CSS custom properties + config attributes |
| Markdown | Lightweight parser (marked) for agent messages |
| Persistence | None — ephemeral, session-only |
| i18n | English only |
| Architecture | Layered: ChatClient + ChatStore + Lit UI components |

---

## Architecture

Three layers, single bundle output:

1. **Connection layer** (`ChatClient`) — Plain TypeScript class. Manages WebSocket lifecycle, message parsing. No UI dependency.
2. **State layer** (`ChatStore`) — Reactive store bridging ChatClient events to UI. Uses Lit reactive controller pattern.
3. **UI layer** — Lit components: `<work1-chat-widget>` shell plus internal sub-components.

---

## Project Structure

```
widget/
├── src/
│   ├── client/
│   │   ├── chat-client.ts        # WebSocket connection, message parsing
│   │   ├── types.ts              # Protocol message types
│   │   └── constants.ts          # Defaults: max message size, timeouts
│   ├── state/
│   │   └── chat-store.ts         # Reactive state management
│   ├── components/
│   │   ├── work1-chat-widget.ts  # <work1-chat-widget> main shell
│   │   ├── chat-bubble.ts        # Floating toggle button
│   │   ├── chat-panel.ts         # Chat window (header, messages, input)
│   │   ├── message-list.ts       # Scrollable message container
│   │   ├── message-bubble.ts     # Single message (user or agent)
│   │   ├── chat-input.ts         # Text input + send button
│   │   ├── typing-indicator.ts   # Agent typing animation
│   │   └── status-bar.ts         # Reconnecting/status/error banners
│   ├── styles/
│   │   ├── theme.ts              # CSS custom property definitions + defaults
│   │   └── shared.ts             # Shared style utilities
│   └── index.ts                  # Entry point, registers custom element, exports
├── package.json
├── tsconfig.json
├── vite.config.ts                # UMD for CDN, ESM for npm
└── DRAFT.md
```

**Build:** Vite. Outputs UMD (`dist/work1-chat-widget.js`) and ESM (`dist/work1-chat-widget.es.js`) bundles plus TypeScript declarations.

---

## Connection Layer — ChatClient

Plain TypeScript class, no UI dependencies.

```typescript
class ChatClient {
  constructor(url: string)

  connect(): void
  disconnect(): void
  send(content: string): void

  on(event: 'connected', cb: (sessionId: string) => void): void
  on(event: 'token', cb: (content: string) => void): void
  on(event: 'typing', cb: (active: boolean) => void): void
  on(event: 'message_end', cb: () => void): void
  on(event: 'status', cb: (content: string) => void): void
  on(event: 'reconnecting', cb: () => void): void
  on(event: 'session_end', cb: (reason: string, content: string) => void): void
  on(event: 'error', cb: (content: string) => void): void
  on(event: 'close', cb: (code: number) => void): void

  readonly state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  readonly sessionId: string | null
}
```

**Responsibilities:**
- Opens WebSocket to `wss://<host>/ws`
- Parses incoming JSON, dispatches typed events
- Validates outbound message size (4096 byte limit)
- Tracks connection state
- Handles unexpected close (emits `close` event with code)
- Ignores unknown/malformed message types (logs warning)

**Not responsible for:** Client-side reconnection. The server handles agent reconnection. If the WebSocket itself drops, the UI layer offers a "Reconnect" button.

---

## State Layer — ChatStore

```typescript
interface ChatState {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'ended'
  sessionId: string | null
  messages: ChatMessage[]
  currentStreamContent: string
  isTyping: boolean
  statusText: string | null
  errorText: string | null
  endReason: string | null
}

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: number
}
```

**Key behaviors:**
- `token` → append to `currentStreamContent`
- `message_end` → finalize `currentStreamContent` into a `ChatMessage(role: 'agent')`, clear stream
- User send → immediately add `ChatMessage(role: 'user')`
- `typing(true/false)` → toggle `isTyping`
- `status` → set `statusText` (auto-clears on next `token` or `message_end`)
- `session_end` → set `connectionStatus = 'ended'`, store reason
- `error` + close → set `connectionStatus = 'disconnected'`, store error

---

## UI Components

### Component Tree

```
<work1-chat-widget host="wss://..." primary-color="#0066FF" position="bottom-right">
  └── Shadow DOM
      ├── <chat-bubble>           — Floating circular button
      └── <chat-panel>            — Chat window (hidden until opened)
          ├── <header>            — Title bar + close button + "Powered by AI" badge
          ├── <message-list>      — Scrollable message area
          │   ├── <message-bubble role="agent">   — Markdown rendered
          │   ├── <message-bubble role="user">    — Plain text
          │   ├── <typing-indicator>
          │   └── <status-bar>
          └── <chat-input>        — Text area + send button
```

### Configuration Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `host` | `string` | (required) | WebSocket URL |
| `title` | `string` | `"Chat"` | Panel header title |
| `greeting` | `string` | `""` | Initial message before conversation |
| `primary-color` | `string` | `"#0066FF"` | Brand color |
| `position` | `string` | `"bottom-right"` | `bottom-right` or `bottom-left` |
| `bubble-icon` | `string` | `"chat"` | Built-in icon name or custom icon URL |
| `width` | `string` | `"380px"` | Panel width |
| `height` | `string` | `"600px"` | Panel max height |

### CSS Custom Properties

```css
work1-chat-widget {
  --w1-primary: #0066FF;
  --w1-bg: #FFFFFF;
  --w1-text: #1A1A1A;
  --w1-agent-bubble-bg: #F0F0F0;
  --w1-user-bubble-bg: var(--w1-primary);
  --w1-user-bubble-text: #FFFFFF;
  --w1-font-family: system-ui, sans-serif;
  --w1-font-size: 14px;
  --w1-border-radius: 12px;
  --w1-panel-width: 380px;
  --w1-panel-height: 600px;
}
```

Attributes set defaults; CSS custom properties override them.

### CDN Usage

```html
<script src="https://cdn.example.com/work1-chat-widget.js"></script>
<work1-chat-widget
  host="wss://chat.example.com/ws"
  title="Support Chat"
  greeting="Hi! How can I help you today?"
  primary-color="#0066FF"
  position="bottom-right"
></work1-chat-widget>
```

### AI Disclosure

A small "Powered by AI" badge in the header. Always visible, not configurable.

### Markdown Rendering

Agent messages rendered via `marked` with sanitization (no raw HTML/scripts). Supports: bold, italic, links (open in new tab), code blocks, inline code, lists.

---

## Error Handling

| Scenario | UI Behavior |
|----------|-------------|
| Connection rejected (code 1008) | "Unable to connect to chat. Please try again later." + Retry button |
| Unexpected WebSocket close | "Connection lost." + "Start new conversation" button. History visible, input disabled. |
| `reconnecting` event | Non-blocking banner: "Reconnecting..." Input stays enabled. |
| `session_end` event | Show reason in chat. Disable input. "Start new conversation" button. |
| `error` (connection stays open) | Display as system message. Input stays enabled. |
| Message too large (client-side) | Inline validation: "Message is too long." Prevent send. |
| Unknown/malformed events | Silently ignored. Console warning in dev builds. |

---

## Testing Strategy

**Unit tests (Vitest):**
- `ChatClient` — mock WebSocket, verify event parsing, state transitions, message validation
- `ChatStore` — verify state mutations for each event type, token accumulation
- Components — Lit testing utilities, verify DOM for each state

**Integration tests:**
- Full widget with mock WebSocket server — end-to-end message flow
- Reconnection flow: connected → reconnecting → restored
- Session end flow: connected → idle timeout → ended

**Dev environment:**
- `dev/index.html` with the widget and a mock WebSocket server for visual development
