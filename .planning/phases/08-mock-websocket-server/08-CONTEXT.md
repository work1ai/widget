# Phase 8: Mock WebSocket Server - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Client-side mock that simulates backend streaming and protocol scenarios. Developers test widget behavior against simulated responses without a real server. The mock implements the chat-server v0.1.0 protocol (9 server message types). Phase 9 will add UI controls for scenario triggering (MOCK-06) — this phase builds the mock engine and wires it into the playground.

</domain>

<decisions>
## Implementation Decisions

### Mock injection approach
- Fake WebSocket class (`MockWebSocket`) that implements the WebSocket interface — no global monkey-patching, no real server
- ChatClient's `connect()` method gets an optional `WebSocket` constructor param: `connect(url, { WebSocket?: typeof WebSocket })`
- ChatStore's `connect()` passes the option through to ChatClient
- MockWebSocket auto-sends `connected` message after ~50ms async delay (simulates server handshake)
- Playground wires mock externally — widget component has zero knowledge of mocks
- Playground starts in mock mode by default — `npm run playground` shows a working widget immediately

### Streaming simulation
- Word-by-word token chunking (split on spaces)
- 30-50ms delay between token events
- Brief typing indicator (~200ms) before first token in each response
- Full protocol sequence per response: `typing: true` → tokens → `message_end`

### Echo mode (MOCK-01)
- Mock echoes user messages with "You said: " prefix
- Streamed word-by-word with same typing indicator + token delays

### Canned scenarios
- `triggerScenario(name)` method on MockWebSocket — Phase 9 control panel will call this
- **Greeting (MOCK-02):** Auto-fires on connect after `connected` message. Content: "Hello! How can I help you today?" Streamed with typing indicator.
- **Long markdown (MOCK-03):** Kitchen-sink markdown content — headings, bold/italic, bullet lists, numbered lists, code blocks, inline code, links. Exercises all rendering paths.
- **Error scenarios (MOCK-04):** Three error types:
  - Protocol error: `{ type: 'error', content: 'Something went wrong...' }`
  - Connection rejected: WebSocket close with code 1008
  - Unexpected disconnect: WebSocket close with non-1000 code
- **Session end (MOCK-05):** `{ type: 'session_end', reason: '...', content: '...' }` — exercises session-end UI state

### File organization
- `playground/mock-ws.ts` — MockWebSocket class with streaming logic and scenario triggering
- `playground/scenarios.ts` — canned response content (greeting text, long markdown, error messages, session end text)
- Mock imports protocol types from `src/chat-client.types.ts` for type safety
- Two files in playground/, zero new files in src/ (except the connect() option change)

### Claude's Discretion
- Exact typing indicator delay value (within 100-300ms range)
- Exact token delay value (within 30-50ms range)
- MockWebSocket internal implementation details (timer management, cleanup)
- Exact long markdown content wording
- Error message text content

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/chat-client.types.ts`: Full protocol type definitions (`ServerMessage` union, `ClientMessage`, `isServerMessage` guard) — mock imports these for type-safe message construction
- `src/chat-client.ts`: `ChatClient.connect()` currently calls `new WebSocket(url)` directly — needs small change to accept injected constructor
- `src/chat-store.ts`: `ChatStore.connect()` creates ChatClient and calls `client.connect(url)` — needs to pass through WebSocket option

### Established Patterns
- Three-layer architecture: ChatClient (protocol) → ChatStore (state) → UI components
- ChatClient extends typed EventTarget — mock must produce messages that pass through `isServerMessage()` guard
- Protocol defines 9 server message types + 1 client message type (well-documented contract)
- Tests already mock WebSocket behavior (in `chat-client.test.ts`) — mock approach is proven

### Integration Points
- `playground/index.html`: Existing playground page — will import MockWebSocket and wire it to widget
- `ChatClient.connect()`: Injection point for MockWebSocket constructor
- `ChatStore.connect()`: Pass-through for WebSocket option from playground to ChatClient
- `work1-chat-widget.ts`: Widget calls `store.connect(url, debug)` — may need to pass WebSocket option

</code_context>

<specifics>
## Specific Ideas

- Greeting auto-streams on connect — developer sees widget working immediately without any interaction
- Echo mode with "You said: " prefix makes it obvious the mock is active
- Kitchen-sink markdown scenario should exercise: `# heading`, `**bold**`, `*italic*`, `- bullet`, `1. numbered`, `` `inline code` ``, fenced code block with language, and `[link](url)`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-mock-websocket-server*
*Context gathered: 2026-03-07*
