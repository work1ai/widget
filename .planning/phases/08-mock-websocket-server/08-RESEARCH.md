# Phase 8: Mock WebSocket Server - Research

**Researched:** 2026-03-07
**Domain:** Client-side WebSocket mocking, streaming simulation, protocol emulation
**Confidence:** HIGH

## Summary

Phase 8 builds a client-side mock WebSocket class (`MockWebSocket`) that implements the browser WebSocket interface and emulates the chat-server v0.1.0 protocol. The mock lives entirely in `playground/` and requires only a small injection point change in `ChatClient.connect()` and `ChatStore.connect()` to accept an optional WebSocket constructor.

The existing codebase already demonstrates this pattern: `vitest-websocket-mock` is used in `chat-client.test.ts` and works by replacing the global WebSocket. Our approach is cleaner -- constructor injection rather than global monkey-patching. The protocol types in `chat-client.types.ts` provide a complete, typed contract (9 server message types) that the mock must produce. The `isServerMessage()` runtime guard validates every message, so the mock MUST produce structurally valid messages or they will be silently rejected.

**Primary recommendation:** Build MockWebSocket as a class implementing the WebSocket interface subset used by ChatClient (onmessage, onclose, onerror, send, close, readyState). Use `setTimeout` for async delays. Import protocol types from `src/chat-client.types.ts` for type-safe message construction.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fake WebSocket class (`MockWebSocket`) that implements the WebSocket interface -- no global monkey-patching, no real server
- ChatClient's `connect()` method gets an optional `WebSocket` constructor param: `connect(url, { WebSocket?: typeof WebSocket })`
- ChatStore's `connect()` passes the option through to ChatClient
- MockWebSocket auto-sends `connected` message after ~50ms async delay (simulates server handshake)
- Playground wires mock externally -- widget component has zero knowledge of mocks
- Playground starts in mock mode by default -- `npm run playground` shows a working widget immediately
- Word-by-word token chunking (split on spaces)
- 30-50ms delay between token events
- Brief typing indicator (~200ms) before first token in each response
- Full protocol sequence per response: `typing: true` -> tokens -> `message_end`
- Echo mode echoes user messages with "You said: " prefix
- `triggerScenario(name)` method on MockWebSocket -- Phase 9 control panel will call this
- Greeting auto-fires on connect after `connected` message
- Kitchen-sink markdown scenario exercises all rendering paths
- Three error types: protocol error, connection rejected (1008), unexpected disconnect (non-1000)
- Session end: `{ type: 'session_end', reason: '...', content: '...' }`
- `playground/mock-ws.ts` -- MockWebSocket class
- `playground/scenarios.ts` -- canned response content
- Two files in playground/, zero new files in src/ (except the connect() option change)

### Claude's Discretion
- Exact typing indicator delay value (within 100-300ms range)
- Exact token delay value (within 30-50ms range)
- MockWebSocket internal implementation details (timer management, cleanup)
- Exact long markdown content wording
- Error message text content

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOCK-01 | Mock server echoes user messages back with simulated streaming tokens | Echo mode with "You said: " prefix, word-by-word streaming with typing indicator -> tokens -> message_end sequence |
| MOCK-02 | Mock server supports canned greeting scenario | Auto-fires on connect after `connected` message, streamed with typing indicator |
| MOCK-03 | Mock server supports canned long markdown response scenario | Kitchen-sink markdown content exercising headings, bold/italic, lists, code blocks, inline code, links |
| MOCK-04 | Mock server supports canned error state scenarios | Three error types: protocol error message, WebSocket close 1008, WebSocket close non-1000 |
| MOCK-05 | Mock server supports canned session end scenario | `session_end` message with reason and content fields |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.7.0 | Implementation language | Project standard |
| Vite | ^6.0.0 | Dev server for playground | Already configured in `vite.config.playground.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | - | No new dependencies needed -- MockWebSocket is pure TypeScript using browser APIs (setTimeout, MessageEvent) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom MockWebSocket | `vitest-websocket-mock` | Already a devDep but designed for test environments, not playground runtime; wrong abstraction |
| Constructor injection | Global WebSocket override | Pollutes global scope, harder to toggle mock/real in Phase 9 |

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure
```
playground/
  index.html          # Existing -- update to wire mock
  mock-ws.ts          # NEW: MockWebSocket class + streaming logic
  scenarios.ts        # NEW: Canned response content (text constants)
src/
  chat-client.ts      # MODIFY: connect() accepts optional WebSocket constructor
  chat-store.ts       # MODIFY: connect() passes WebSocket option through
```

### Pattern 1: WebSocket Interface Subset
**What:** MockWebSocket implements only the WebSocket interface members that ChatClient actually uses.
**When to use:** Always -- implementing the full WebSocket spec is unnecessary.
**Example:**
```typescript
// ChatClient uses these WebSocket members:
// - constructor(url: string)
// - onmessage: ((event: MessageEvent) => void) | null
// - onclose: ((event: CloseEvent) => void) | null
// - onerror: (() => void) | null
// - send(data: string): void
// - close(code?: number, reason?: string): void
// - readyState: number

// Static constants needed:
// - WebSocket.OPEN (referenced in ChatClient.connected getter)

type WebSocketConstructor = new (url: string) => WebSocket;

class MockWebSocket implements Pick<WebSocket,
  'onmessage' | 'onclose' | 'onerror' | 'send' | 'close' | 'readyState'
> {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    // Auto-connect after async delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.emit({ type: 'connected', session_id: 'mock-session-001' });
      // Then auto-fire greeting scenario
      this.triggerScenario('greeting');
    }, 50);
  }
  // ...
}
```

### Pattern 2: Constructor Injection
**What:** ChatClient.connect() accepts an optional WebSocket constructor to use instead of the global `WebSocket`.
**When to use:** The key integration point -- minimal change to production code.
**Example:**
```typescript
// In chat-client.ts
connect(url: string, options?: { WebSocket?: WebSocketConstructor }): void {
  const WS = options?.WebSocket ?? WebSocket;
  this.ws = new WS(url);
  this.ws.onmessage = (event: MessageEvent) => this.handleMessage(event);
  this.ws.onclose = (event: CloseEvent) => this.handleClose(event);
  this.ws.onerror = () => {};
}

// In chat-store.ts
connect(url: string, debug: boolean, options?: { WebSocket?: WebSocketConstructor }): void {
  // ...
  this.client.connect(url, { WebSocket: options?.WebSocket });
}
```

### Pattern 3: Streaming Simulation with Timer Chain
**What:** Simulate token-by-token streaming using chained setTimeout calls.
**When to use:** For all streamed responses (echo, greeting, markdown).
**Example:**
```typescript
private async streamResponse(content: string): Promise<void> {
  // 1. Typing indicator
  this.emit({ type: 'typing', active: true });
  await this.delay(200);  // ~200ms typing indicator

  // 2. Token-by-token
  const words = content.split(' ');
  for (let i = 0; i < words.length; i++) {
    const token = (i === 0 ? '' : ' ') + words[i];
    this.emit({ type: 'token', content: token });
    await this.delay(40);  // 30-50ms between tokens
  }

  // 3. End message
  this.emit({ type: 'message_end' });
}

private emit(msg: ServerMessage): void {
  if (this.onmessage) {
    this.onmessage(new MessageEvent('message', {
      data: JSON.stringify(msg),
    }));
  }
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms);
    this.timers.push(id);  // Track for cleanup
  });
}
```

### Pattern 4: Scenario Triggering
**What:** Public method on MockWebSocket for triggering canned scenarios.
**When to use:** Phase 9 control panel will call `triggerScenario('error-protocol')` etc.
**Example:**
```typescript
triggerScenario(name: string): void {
  switch (name) {
    case 'greeting':
      this.streamResponse(GREETING_TEXT);
      break;
    case 'long-markdown':
      this.streamResponse(LONG_MARKDOWN_TEXT);
      break;
    case 'error-protocol':
      this.emit({ type: 'error', content: 'Something went wrong. Please try again.' });
      break;
    case 'error-rejected':
      this.simulateClose(1008, 'Connection rejected');
      break;
    case 'error-disconnect':
      this.simulateClose(1006, 'Unexpected disconnect');
      break;
    case 'session-end':
      this.emit({ type: 'session_end', reason: 'timeout', content: 'Session expired due to inactivity.' });
      break;
  }
}
```

### Anti-Patterns to Avoid
- **Global WebSocket override:** Never do `window.WebSocket = MockWebSocket`. Makes it impossible to have real connections alongside mock.
- **Real timer-based tests:** Don't use `setInterval` for streaming -- use chained `setTimeout` via async/await for cleaner cancellation.
- **Sending before OPEN state:** ChatClient checks `readyState === WebSocket.OPEN` before sending. MockWebSocket must set `readyState = 1` before the connected message or `send()` will be a no-op.
- **Missing MessageEvent wrapping:** ChatClient does `JSON.parse(event.data)` in `handleMessage`. Mock must wrap payloads in `MessageEvent` with `data` property, not pass raw objects.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket test infrastructure | Custom test mock framework | `vitest-websocket-mock` (already installed) | Tests already use it; playground mock is a separate concern |
| Protocol type definitions | Duplicate type definitions in playground | Import from `src/chat-client.types.ts` | Single source of truth, type-safe message construction |
| Markdown content rendering | Custom markdown renderer | `marked` + `DOMPurify` (already in widget) | Already implemented in message rendering pipeline |

**Key insight:** The mock only produces JSON strings. The entire rendering pipeline (markdown, sanitization, streaming accumulation) is already built and tested. The mock just needs to emit the right protocol messages in the right sequence.

## Common Pitfalls

### Pitfall 1: readyState Not Set Before Connected Message
**What goes wrong:** ChatClient checks `this.ws?.readyState === WebSocket.OPEN` in the `connected` getter and before `send()`. If MockWebSocket emits `connected` without setting `readyState = 1`, the widget appears connected but sending messages silently fails.
**Why it happens:** The `connected` protocol message and the WebSocket `readyState` are separate concepts.
**How to avoid:** Set `readyState = MockWebSocket.OPEN` (1) BEFORE emitting the `connected` server message.
**Warning signs:** Echo mode doesn't work -- user types but nothing comes back.

### Pitfall 2: Synchronous Message Dispatch
**What goes wrong:** If MockWebSocket emits messages synchronously in the constructor, `ChatClient.connect()` hasn't finished wiring `onmessage` yet, so messages are lost.
**Why it happens:** `new WebSocket(url)` returns immediately, then `ChatClient` sets `ws.onmessage` on the next line. Any synchronous emit in the constructor fires before `onmessage` is assigned.
**How to avoid:** All message emission must be async (via `setTimeout`), even the initial `connected` message. The ~50ms delay covers this.
**Warning signs:** Widget stays in "connecting" state forever.

### Pitfall 3: Token Spacing
**What goes wrong:** Splitting "Hello world" on spaces and emitting each word without leading spaces produces "Helloworld" when tokens are concatenated.
**Why it happens:** ChatStore's token handler does `this.streamingContent += e.detail.content` -- raw concatenation.
**How to avoid:** First token has no leading space; subsequent tokens include a leading space: `" world"`. The pattern `(i === 0 ? '' : ' ') + words[i]` handles this.
**Warning signs:** Streamed text has no spaces between words.

### Pitfall 4: Timer Leaks on Disconnect
**What goes wrong:** If user disconnects mid-stream, pending `setTimeout` callbacks fire on a dead MockWebSocket, potentially causing errors.
**Why it happens:** `setTimeout` callbacks capture `this` and fire regardless of connection state.
**How to avoid:** Track all timer IDs in an array. In `close()`, call `clearTimeout` on all pending timers. Check `readyState` before emitting in timer callbacks.
**Warning signs:** Console errors after closing the widget.

### Pitfall 5: CloseEvent Construction
**What goes wrong:** `new CloseEvent('close', { code, reason })` may behave differently across environments. ChatClient checks `event.code` in `handleClose`.
**Why it happens:** CloseEvent is a browser API that may not be available or may have different constructor signatures in all environments.
**How to avoid:** Use `new CloseEvent('close', { code, reason, wasClean: false })` which is well-supported in modern browsers. The playground runs in a real browser, not happy-dom.
**Warning signs:** Error scenarios don't trigger the widget's error/disconnected states.

### Pitfall 6: ChatStore.connect() Signature Change
**What goes wrong:** The widget component calls `this.store.connect(this.serverUrl, this.debug)` in `handleOpen()`. If ChatStore's signature changes incompatibly, the widget breaks.
**Why it happens:** Adding the `options` parameter.
**How to avoid:** Make the options parameter optional with a default: `connect(url: string, debug: boolean, options?: { WebSocket?: WebSocketConstructor })`. This is backward-compatible -- the widget call site doesn't need to change. Only the playground passes the option.
**Warning signs:** TypeScript compilation errors in `work1-chat-widget.ts`.

## Code Examples

### ChatClient.connect() Modification
```typescript
// Source: Existing code analysis + CONTEXT.md decision
// In src/chat-client.ts

// Add type at module level (or import from a shared types file)
type WebSocketConstructor = new (url: string) => WebSocket;

connect(url: string, options?: { WebSocket?: WebSocketConstructor }): void {
  const WS = options?.WebSocket ?? WebSocket;
  this.ws = new WS(url);
  this.ws.onmessage = (event: MessageEvent) => this.handleMessage(event);
  this.ws.onclose = (event: CloseEvent) => this.handleClose(event);
  this.ws.onerror = () => {};
}
```

### ChatStore.connect() Modification
```typescript
// Source: Existing code analysis + CONTEXT.md decision
// In src/chat-store.ts

type WebSocketConstructor = new (url: string) => WebSocket;

connect(url: string, debug: boolean, options?: { WebSocket?: WebSocketConstructor }): void {
  if (this.client) {
    this.client.disconnect();
  }

  this.client = new ChatClient({ debug });
  this.wireClientEvents();
  this.client.connect(url, { WebSocket: options?.WebSocket });
  this.connectionState = 'connecting';
  this.host.requestUpdate();
}
```

### Playground Wiring
```typescript
// Source: CONTEXT.md decisions
// In playground/index.html <script type="module">

import '../src/index.ts';
import { MockWebSocket } from './mock-ws.ts';

const widget = document.querySelector('w1-chat-widget');
// Widget needs a server-url attribute to trigger connection on panel open
widget.setAttribute('server-url', 'ws://mock');
widget.setAttribute('debug', '');

// Access the store to pass mock WebSocket
// The widget calls store.connect() internally on first panel open.
// We need the playground to intercept that call.
//
// Approach: Set the widget's server-url and override globally just for playground
// OR: expose the WebSocket option through the widget element.
//
// Simplest: Add a playground-only attribute or property on the widget
// that passes through to store.connect().
```

### Playground Integration Strategy
```typescript
// The cleanest approach per CONTEXT.md "playground wires mock externally":
//
// Option A: Widget gets an optional `wsConstructor` property (not attribute)
//   - Widget passes it to store.connect()
//   - Playground sets: widget.wsConstructor = MockWebSocket
//   - Clean but adds a property to production widget
//
// Option B: Playground creates its own ChatStore with mock, bypasses widget
//   - Breaks the widget's encapsulation
//
// Option C: Widget accepts options bag via property
//   widget.connectOptions = { WebSocket: MockWebSocket }
//   - Widget passes to store.connect() when connecting
//
// RECOMMENDED: Option A with a simple property.
// The property is typed but undocumented -- playground-only.
// Zero attributes, zero DOM surface.

// playground/index.html
import '../src/index.ts';
import { MockWebSocket } from './mock-ws.ts';

const widget = document.querySelector('w1-chat-widget')!;
widget.setAttribute('server-url', 'ws://mock');
widget.setAttribute('debug', '');
// Type assertion needed since property isn't in public API
(widget as any)._mockWebSocket = MockWebSocket;
```

**Note:** The exact playground wiring mechanism needs to balance "widget has zero knowledge of mocks" with "playground needs to inject MockWebSocket into the connection flow." The recommended approach is a pass-through property on the widget that ChatStore receives -- this is the minimal production code change.

### MockWebSocket Key Implementation Details
```typescript
// Source: Protocol analysis from chat-client.types.ts and chat-client.ts

// MockWebSocket.send() is called by ChatClient.send() which sends:
// JSON.stringify({ type: 'message', content: userText })
//
// MockWebSocket should parse this and trigger echo response:
send(data: string): void {
  if (this.readyState !== MockWebSocket.OPEN) return;

  try {
    const msg = JSON.parse(data);
    if (msg.type === 'message') {
      // Echo mode: respond with streamed "You said: <content>"
      this.streamResponse(`You said: ${msg.content}`);
    }
  } catch {
    // Ignore malformed messages
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global WebSocket monkey-patching | Constructor injection / dependency injection | Modern best practice | Cleaner, testable, supports mock/real toggle |
| Mock servers (actual WS server process) | Client-side fake WebSocket | - | No server process needed, works in browser only |
| Synchronous mocks | Async mocks with realistic delays | - | Better exercises real timing behavior, catches race conditions |

**Deprecated/outdated:**
- None relevant -- WebSocket API is stable and unchanged.

## Open Questions

1. **Playground-to-widget mock injection mechanism**
   - What we know: CONTEXT.md says "playground wires mock externally" and "widget component has zero knowledge of mocks"
   - What's unclear: The exact mechanism to pass MockWebSocket constructor from playground script to the widget's internal `store.connect()` call. The widget's `handleOpen()` calls `this.store.connect(this.serverUrl, this.debug)` with no WebSocket option currently.
   - Recommendation: Add an optional `_wsConstructor` property to the widget class that gets passed through to `store.connect()`. This is a private convention (underscore prefix), not a public API. The playground sets it before the first panel open. Alternatively, the playground could directly call the store's connect with the mock, but this requires exposing the store.

2. **Static constants on MockWebSocket**
   - What we know: ChatClient uses `WebSocket.OPEN` (the static constant from the global WebSocket class) in its `connected` getter.
   - What's unclear: When MockWebSocket is injected as constructor, `WebSocket.OPEN` still references the global. This is fine since it's a constant (1). But if ChatClient ever does `this.ws.constructor.OPEN` or similar, it would need MockWebSocket to have static OPEN = 1.
   - Recommendation: Current ChatClient code uses `WebSocket.OPEN` (global), not instance-based lookup. No issue, but add static constants to MockWebSocket for completeness and future-proofing.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^3.0.0 with happy-dom |
| Config file | vitest config in vite.config.ts (or root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOCK-01 | Echo mode streams "You said: " + user input | manual | Open playground, type message, observe echo | N/A - playground feature |
| MOCK-02 | Greeting auto-fires on connect | manual | Open playground, observe greeting message | N/A - playground feature |
| MOCK-03 | Long markdown response renders correctly | manual | Trigger scenario in console, observe rendering | N/A - playground feature |
| MOCK-04 | Error scenarios trigger widget error states | manual | Trigger error scenarios in console, observe UI | N/A - playground feature |
| MOCK-05 | Session end triggers widget session-end state | manual | Trigger session-end in console, observe UI | N/A - playground feature |

**Note:** These requirements are playground/developer-experience features. The mock WebSocket itself could be unit tested, but the success criteria explicitly describe visual/interactive behaviors ("visible token-by-token streaming", "renders in the chat panel", "trigger the widget's error and session-end UI states"). The primary validation is manual: run `npm run playground` and exercise each scenario.

### Unit Tests for MockWebSocket (Optional but Recommended)
| Behavior | Test Type | File |
|----------|-----------|------|
| MockWebSocket emits connected after delay | unit | `playground/mock-ws.test.ts` |
| MockWebSocket echoes user messages | unit | `playground/mock-ws.test.ts` |
| MockWebSocket streams tokens word-by-word | unit | `playground/mock-ws.test.ts` |
| triggerScenario fires correct messages | unit | `playground/mock-ws.test.ts` |
| close() clears pending timers | unit | `playground/mock-ws.test.ts` |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green + manual playground verification

### Wave 0 Gaps
- [ ] ChatClient.connect() signature change must not break existing `chat-client.test.ts` tests
- [ ] ChatStore.connect() signature change must not break existing `chat-store.test.ts` tests
- [ ] Verify existing tests pass after modifications: `npx vitest run src/chat-client.test.ts src/chat-store.test.ts`

## Sources

### Primary (HIGH confidence)
- `src/chat-client.ts` -- Current connect() implementation, WebSocket usage patterns
- `src/chat-client.types.ts` -- Complete protocol type definitions (9 server message types)
- `src/chat-store.ts` -- Current connect() implementation, event wiring
- `src/chat-client.test.ts` -- Existing WebSocket mock patterns with vitest-websocket-mock
- `src/work1-chat-widget.ts` -- Widget's handleOpen() and store.connect() call site
- `playground/index.html` -- Current playground structure
- `08-CONTEXT.md` -- User decisions constraining implementation

### Secondary (MEDIUM confidence)
- MDN WebSocket API documentation -- WebSocket interface contract (stable, well-known)
- MDN MessageEvent, CloseEvent constructors -- Browser event construction

### Tertiary (LOW confidence)
- None -- all research based on direct code analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, pure TypeScript implementation
- Architecture: HIGH -- patterns derived directly from existing code analysis and locked user decisions
- Pitfalls: HIGH -- identified from concrete code analysis (readyState checks, onmessage timing, token concatenation)

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain -- WebSocket API and project protocol are fixed)
