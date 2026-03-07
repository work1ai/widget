# Phase 1: Connection Layer - Research

**Researched:** 2026-03-04
**Domain:** WebSocket client, TypeScript/Vite project scaffolding, Lit Web Components (foundation only)
**Confidence:** HIGH

## Summary

Phase 1 establishes the project foundation (TypeScript + Vite + Lit) and builds the `ChatClient` class -- a WebSocket client that implements the chat-server v0.1.0 protocol documented in DRAFT.md. The ChatClient must parse all 8 server message types, manage connection lifecycle, and emit typed events for the ChatStore layer (Phase 2) to consume. No UI is built in this phase.

The protocol is well-specified in DRAFT.md with clear message schemas, close codes, and lifecycle flows. The ChatClient should extend `EventTarget` (native browser API) for event emission -- this is the standard pattern for non-UI classes in the Web Components ecosystem and avoids adding a dependency. The Vite library mode configuration supports IIFE + ESM dual output needed for CDN and npm distribution.

**Primary recommendation:** Build ChatClient as an EventTarget subclass with strongly-typed event maps. Use Vitest for testing with `vitest-websocket-mock` for WebSocket interaction tests. Scaffold the Lit custom element shell (`<work1-chat-widget>`) but defer all UI rendering to Phase 2.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Connect WebSocket when user opens the chat panel (not on widget mount, not on first message)
- Disconnect WebSocket when user closes the chat panel -- each panel open starts a fresh conversation
- No client-side auto-reconnection on unexpected WebSocket close -- show "Connection lost" UI with manual "Reconnect" / "Start new conversation" button
- Server URL configured via `server-url` HTML attribute on the element (explicit, no script-src inference)
- Keep text input enabled during server-side agent reconnection (`reconnecting` event) -- user can still type and send, server buffers up to 50 messages
- Show a non-blocking thin banner at the top of the chat panel: "Reconnecting..." with subtle animation -- not a system message in the chat flow
- If reconnection fails (fatal error then close), show server error message in chat, disable input, offer "Start new conversation" button
- On `session_end` (e.g., idle timeout): keep conversation history visible, disable input, show reason + "Start new conversation" button at bottom
- `session_start` event from agent server: parse and emit internally but don't surface in UI -- `connected` event is the user-facing readiness signal
- `status` event content: pass through as-is (raw string) -- UI layer decides display treatment. No normalization to enums
- Error discrimination: treat all `error` events the same initially; if WebSocket closes shortly after, escalate to fatal. React to the close event, don't infer from message content
- Message validation: lenient with console warnings -- accept what we can, `console.warn` on malformed messages. Matches CONN-08 spirit of graceful handling
- `debug` boolean HTML attribute on the element -- when set, log all WebSocket events to console. Silent by default
- Debug log format: parsed summary, not raw frames (e.g., `[work1-widget] connected session=abc123`, `[work1-widget] token (12 chars)`) -- clean, readable, no sensitive data risk
- Expose `session_id` as a read-only property on the element AND dispatch a custom DOM event (`w1-connected`) with session_id detail -- customers can use for support tickets
- Emit custom DOM events for all connection lifecycle changes (connected, disconnected, error, session-end) -- lets host page react (analytics, fallback contact info)
- Widget element will be `<work1-chat-widget>` with `server-url` and `debug` attributes at minimum
- Custom DOM events prefixed: `w1-connected`, `w1-disconnected`, `w1-error`, `w1-session-end`

### Claude's Discretion
- Project folder structure and file organization
- TypeScript configuration choices
- Vite build configuration details
- ChatClient internal class/interface design
- Event emitter pattern choice (EventTarget, custom, etc.)
- Test framework selection for Phase 1 validation

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONN-01 | Widget connects to `wss://<host>/ws` via WebSocket when user opens chat panel | ChatClient.connect(url) method; WebSocket API is native browser -- no library needed |
| CONN-02 | Widget receives and stores `session_id` from `connected` event | Parse `connected` message type, store on ChatClient instance, expose as read-only property |
| CONN-03 | Widget handles connection rejection (close code 1008) with "unable to connect" UI and retry button | WebSocket `onclose` handler checks `event.code === 1008`; ChatClient emits typed `rejected` event |
| CONN-04 | Widget handles unexpected WebSocket close with "connection lost" UI and "Start new conversation" button | WebSocket `onclose` for non-1000 codes; ChatClient emits `disconnected` event with close details |
| CONN-05 | Widget displays non-blocking "Reconnecting..." banner on `reconnecting` event | Parse `reconnecting` message type; ChatClient emits `reconnecting` event |
| CONN-06 | Widget clears reconnecting banner on `status` "Connection restored" event | Parse `status` message; ChatClient emits `status` event with content string |
| CONN-07 | Widget handles `session_end` event -- shows reason, disables input, offers "Start new conversation" | Parse `session_end` message type with `reason` and `content` fields; ChatClient emits typed event |
| CONN-08 | Widget ignores unknown/malformed message types gracefully (console warning in dev) | JSON.parse with try/catch, switch on `type` field, default case logs warning if debug mode |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | 3.3.x | Web Component base class | Project constraint -- framework-agnostic, Shadow DOM, tiny footprint |
| typescript | 5.7.x | Type safety | Project constraint -- strict mode for protocol types |
| vite | 6.x | Build tool and dev server | Project constraint -- library mode with IIFE+ESM output, Lit support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.x | Test runner | Unit tests for ChatClient protocol parsing and state transitions |
| vitest-websocket-mock | 0.5.x | WebSocket test mocking | Testing ChatClient WebSocket interactions without a real server |
| vite-plugin-dts | latest | TypeScript declarations | Generate .d.ts files for npm distribution (needed from Phase 1 for build validation) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| EventTarget (for ChatClient) | mitt, eventemitter3 | EventTarget is native, zero-dependency, works with DOM event system; third-party adds bundle size for no benefit |
| vitest-websocket-mock | MSW (Mock Service Worker) | MSW is more comprehensive but heavier; vitest-websocket-mock is purpose-built, simpler API for this use case |
| vitest-websocket-mock | Manual WebSocket mock | vitest-websocket-mock handles mock-socket plumbing, connection lifecycle, message assertions -- hand-rolling is error-prone |

**Installation:**
```bash
npm create vite@latest . -- --template lit-ts
npm install lit
npm install -D typescript vitest vitest-websocket-mock vite-plugin-dts
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  chat-client.ts          # ChatClient class (EventTarget subclass)
  chat-client.types.ts    # Protocol types, event maps, message schemas
  work1-chat-widget.ts    # Lit custom element shell (minimal in Phase 1)
  index.ts                # Public API exports
vite.config.ts            # Library mode config (IIFE + ESM)
tsconfig.json             # Strict TypeScript config
```

### Pattern 1: ChatClient as EventTarget Subclass
**What:** ChatClient extends native EventTarget, dispatches strongly-typed CustomEvents for each protocol message type.
**When to use:** Always -- this is the core architecture for the connection layer.
**Example:**
```typescript
// chat-client.types.ts
export interface ChatClientEventMap {
  'connected': CustomEvent<{ session_id: string }>;
  'token': CustomEvent<{ content: string }>;
  'typing': CustomEvent<{ active: boolean }>;
  'message_end': CustomEvent<void>;
  'status': CustomEvent<{ content: string }>;
  'reconnecting': CustomEvent<void>;
  'session_end': CustomEvent<{ reason: string; content: string }>;
  'error': CustomEvent<{ content: string }>;
  'disconnected': CustomEvent<{ code: number; reason: string }>;
  'rejected': CustomEvent<{ code: number }>;
}

// Typed EventTarget helper
export interface TypedEventTarget<M> {
  addEventListener<K extends keyof M>(
    type: K,
    listener: (ev: M[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof M>(
    type: K,
    listener: (ev: M[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  dispatchEvent(event: Event): boolean;
}

// chat-client.ts
export class ChatClient extends (EventTarget as {
  new(): TypedEventTarget<ChatClientEventMap> & EventTarget;
  prototype: EventTarget;
}) {
  private ws: WebSocket | null = null;
  private _sessionId: string | null = null;
  private _debug: boolean = false;

  get sessionId(): string | null { return this._sessionId; }
  get connected(): boolean { return this.ws?.readyState === WebSocket.OPEN; }

  constructor(options?: { debug?: boolean }) {
    super();
    this._debug = options?.debug ?? false;
  }

  connect(url: string): void {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (event) => this.handleMessage(event);
    this.ws.onclose = (event) => this.handleClose(event);
    this.ws.onerror = () => {}; // errors surface through onclose
  }

  disconnect(): void {
    this.ws?.close(1000, 'User closed');
    this.ws = null;
  }

  send(content: string): void {
    this.ws?.send(JSON.stringify({ type: 'message', content }));
  }

  private handleMessage(event: MessageEvent): void {
    let data: unknown;
    try {
      data = JSON.parse(event.data);
    } catch {
      this.warn('Malformed JSON received');
      return;
    }
    // ... switch on data.type, dispatch typed CustomEvents
  }

  private handleClose(event: CloseEvent): void {
    if (event.code === 1008) {
      this.dispatchEvent(new CustomEvent('rejected', { detail: { code: 1008 } }));
    } else if (event.code !== 1000) {
      this.dispatchEvent(new CustomEvent('disconnected', {
        detail: { code: event.code, reason: event.reason }
      }));
    }
    this.ws = null;
  }

  private log(msg: string): void {
    if (this._debug) console.log(`[work1-widget] ${msg}`);
  }

  private warn(msg: string): void {
    console.warn(`[work1-widget] ${msg}`);
  }
}
```

### Pattern 2: Lit Element Shell with Attribute-Driven Config
**What:** Minimal Lit element that reads `server-url` and `debug` attributes but defers UI rendering to Phase 2.
**When to use:** Phase 1 scaffolding -- establishes the custom element registration and attribute pattern.
**Example:**
```typescript
// Source: Lit official docs (https://lit.dev/docs/components/events/)
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ChatClient } from './chat-client.js';

@customElement('work1-chat-widget')
export class Work1ChatWidget extends LitElement {
  @property({ attribute: 'server-url' })
  serverUrl = '';

  @property({ type: Boolean, reflect: true })
  debug = false;

  private client: ChatClient | null = null;

  get sessionId(): string | null {
    return this.client?.sessionId ?? null;
  }

  // Called by UI layer (Phase 2) when panel opens
  openConnection(): void {
    if (!this.serverUrl) {
      console.error('[work1-widget] server-url attribute is required');
      return;
    }
    this.client = new ChatClient({ debug: this.debug });
    this.setupClientListeners();
    this.client.connect(this.serverUrl);
  }

  closeConnection(): void {
    this.client?.disconnect();
    this.client = null;
  }

  private setupClientListeners(): void {
    this.client!.addEventListener('connected', (e) => {
      this.dispatchEvent(new CustomEvent('w1-connected', {
        detail: { session_id: e.detail.session_id },
        bubbles: true,
        composed: true
      }));
    });
    // ... similar for w1-disconnected, w1-error, w1-session-end
  }
}
```

### Pattern 3: Message Parsing with Lenient Validation
**What:** Parse incoming WebSocket messages with type narrowing, accepting valid fields and warning on malformed data.
**When to use:** Every incoming message from the server.
**Example:**
```typescript
// Protocol message type discriminated union
type ServerMessage =
  | { type: 'connected'; session_id: string }
  | { type: 'token'; content: string }
  | { type: 'typing'; active: boolean }
  | { type: 'message_end' }
  | { type: 'session_start'; session_id: string }
  | { type: 'status'; content: string }
  | { type: 'reconnecting' }
  | { type: 'session_end'; reason: string; content: string }
  | { type: 'error'; content: string };

function isServerMessage(data: unknown): data is ServerMessage {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.type !== 'string') return false;

  switch (obj.type) {
    case 'connected': return typeof obj.session_id === 'string';
    case 'token': return typeof obj.content === 'string';
    case 'typing': return typeof obj.active === 'boolean';
    case 'message_end': return true;
    case 'session_start': return typeof obj.session_id === 'string';
    case 'status': return typeof obj.content === 'string';
    case 'reconnecting': return true;
    case 'session_end': return typeof obj.reason === 'string' && typeof obj.content === 'string';
    case 'error': return typeof obj.content === 'string';
    default: return false; // unknown type
  }
}
```

### Anti-Patterns to Avoid
- **Coupling ChatClient to Lit reactivity:** ChatClient must be a standalone class (no Lit dependency) so it can be tested independently and reused by ChatStore in Phase 2.
- **Using `onmessage` string matching instead of JSON parsing:** Always parse to object, validate structure, use type narrowing.
- **Auto-reconnecting on WebSocket close:** User decision explicitly prohibits this. Show manual reconnect UI instead.
- **Inferring fatal vs recoverable from error message content:** User decision says to react to the close event, not infer from the error content.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket test mocking | Custom mock WebSocket class | `vitest-websocket-mock` | Handles mock-socket plumbing, connection lifecycle, message queueing, assertion matchers |
| TypeScript declarations for npm | Manual .d.ts files | `vite-plugin-dts` | Generates declarations from source automatically, stays in sync |
| Custom element registration | Manual `customElements.define()` boilerplate | Lit `@customElement` decorator | Handles registration, lifecycle, property observation, attribute reflection |
| Event type safety | Runtime type assertions | TypeScript interface + typed EventTarget wrapper | Compile-time safety, IDE autocomplete, zero runtime cost |

**Key insight:** The WebSocket API is native and sufficient -- no ws library needed in the browser. The complexity is in the protocol parsing and state management, not the transport.

## Common Pitfalls

### Pitfall 1: WebSocket onerror Provides No Useful Information
**What goes wrong:** Developers try to extract error details from the `error` event on WebSocket. The browser `ErrorEvent` on WebSocket contains no status code, no message, no useful debugging info.
**Why it happens:** Browser security policy prevents exposing network error details.
**How to avoid:** Use `onclose` exclusively for error handling. The `CloseEvent` provides `code` and `reason`. The `onerror` handler should be a no-op or only log that an error occurred.
**Warning signs:** Code that tries to read `.message` or `.code` from the `error` event.

### Pitfall 2: Close Code 1008 Fires Before Any Messages
**What goes wrong:** When the server rejects the connection (bad origin, rate limit), the WebSocket closes with code 1008 *before accept*. No `connected` event is ever sent. No `error` event is sent.
**Why it happens:** The server rejects the upgrade before the WebSocket is established.
**How to avoid:** Handle 1008 in `onclose` as a special "rejected" case, distinct from "disconnected after previously connected."
**Warning signs:** Tests that assume `connected` always fires before `close`.

### Pitfall 3: JSON.parse Throws on Non-JSON Messages
**What goes wrong:** Server sends something unexpected (e.g., a plain text error, or binary data), and `JSON.parse` throws, crashing the handler.
**Why it happens:** Trusting that all messages will be valid JSON.
**How to avoid:** Wrap `JSON.parse` in try/catch. On failure, `console.warn` and return (per CONN-08 and user decision on lenient validation).
**Warning signs:** No try/catch around message parsing.

### Pitfall 4: Forgetting `composed: true` on Custom DOM Events
**What goes wrong:** Custom events dispatched from inside Shadow DOM don't reach host page event listeners.
**Why it happens:** Shadow DOM event boundary -- events without `composed: true` stop at the shadow root.
**How to avoid:** All `w1-*` custom DOM events must use `{ bubbles: true, composed: true }`.
**Warning signs:** Events work in tests but not when the widget is embedded on a real page.

### Pitfall 5: Vite Library Mode IIFE Needs Global Name
**What goes wrong:** Build fails or produces broken output because IIFE format requires `build.lib.name` but it's missing.
**Why it happens:** ESM doesn't need a name, so developers skip it. But IIFE does.
**How to avoid:** Always set `name` in `build.lib` when formats include `iife`. Use something like `Work1ChatWidget`.
**Warning signs:** Build error mentioning "name" or IIFE output that's an unnamed closure.

### Pitfall 6: TypeScript Decorators Configuration
**What goes wrong:** Lit decorators (`@customElement`, `@property`) don't work or produce wrong output.
**Why it happens:** TypeScript has two decorator systems -- legacy (experimental) and the TC39 standard (5.0+). Lit supports both but the configuration differs.
**How to avoid:** In `tsconfig.json`, set `"experimentalDecorators": true` and `"useDefineForClassFields": false` for Lit's legacy decorator support. This is the recommended configuration per Lit docs.
**Warning signs:** Properties not reactive, custom element not registered, runtime errors about decorators.

## Code Examples

### Vite Library Mode Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ include: ['src'] }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Work1ChatWidget',
      formats: ['es', 'iife'],
      fileName: (format) => `work1-chat-widget.${format}.js`,
    },
    rollupOptions: {
      // Lit should be bundled (not externalized) for CDN use
    },
  },
});
```

### TypeScript Configuration for Lit
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "strict": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
```

### Vitest Configuration
```typescript
// vitest.config.ts (or in vite.config.ts)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // needed for WebSocket global
    globals: true,
  },
});
```

### WebSocket Mock Test Example
```typescript
// src/__tests__/chat-client.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import WS from 'vitest-websocket-mock';
import { ChatClient } from '../chat-client';

describe('ChatClient', () => {
  let server: WS;
  let client: ChatClient;

  afterEach(() => {
    client?.disconnect();
    WS.clean();
  });

  it('emits connected with session_id', async () => {
    server = new WS('ws://localhost:1234');
    client = new ChatClient();

    const connected = new Promise<string>((resolve) => {
      client.addEventListener('connected', (e) => {
        resolve(e.detail.session_id);
      });
    });

    client.connect('ws://localhost:1234');
    await server.connected;

    server.send(JSON.stringify({
      type: 'connected',
      session_id: 'test-uuid-123'
    }));

    expect(await connected).toBe('test-uuid-123');
    expect(client.sessionId).toBe('test-uuid-123');
  });

  it('emits rejected on close code 1008', async () => {
    server = new WS('ws://localhost:1234');
    client = new ChatClient();

    const rejected = new Promise<number>((resolve) => {
      client.addEventListener('rejected', (e) => {
        resolve(e.detail.code);
      });
    });

    client.connect('ws://localhost:1234');
    await server.connected;
    server.close({ code: 1008, reason: 'Policy violation', wasClean: false });

    expect(await rejected).toBe(1008);
  });

  it('warns on malformed messages without crashing', async () => {
    server = new WS('ws://localhost:1234');
    client = new ChatClient();
    client.connect('ws://localhost:1234');
    await server.connected;

    // Should not throw
    server.send('not json at all');
    server.send(JSON.stringify({ type: 'unknown_type' }));
    server.send(JSON.stringify({ no_type_field: true }));
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UMD bundles for CDN | IIFE bundles for CDN | Vite 4+ (2023) | UMD still works but IIFE is simpler for self-registering Web Components |
| EventEmitter (Node-style) | EventTarget (native) | Established pattern | Zero dependencies, works with DOM event system, TypeScript-typeable |
| Lit 2 with legacy build | Lit 3 with modern ESM | Lit 3.0 (Oct 2023) | Smaller bundle, better TypeScript support, same API surface |
| Jest for Vite projects | Vitest | Vitest 1.0 (Dec 2023) | Native Vite integration, faster, ESM-native, same API as Jest |

**Deprecated/outdated:**
- UMD format: Still supported but IIFE is preferred for Web Components that self-register via side effects
- Lit 2: Superseded by Lit 3, though API is backward-compatible

## Open Questions

1. **Vitest 4.x compatibility with vitest-websocket-mock**
   - What we know: vitest-websocket-mock 0.5.x was built for Vitest 3.x. Vitest 4.x is current.
   - What's unclear: Whether vitest-websocket-mock works with Vitest 4.x or needs Vitest 3.x.
   - Recommendation: Try with Vitest 4.x first. If incompatible, pin to Vitest 3.x (still fully functional) or use manual WebSocket mocking with `vi.mock`.

2. **Vite version: 6.x vs latest (7.x)**
   - What we know: Vite 7.x is latest. Node.js 20 is in use. STATE.md flags "Vite 6 IIFE library mode config needs verification."
   - What's unclear: Whether Vite 7.x has breaking changes in library mode config.
   - Recommendation: Use Vite 6.x (stable, well-documented, Node 20 compatible). Upgrade later is low-risk since library mode config is stable across versions.

3. **Keep-alive / heartbeat**
   - What we know: DRAFT.md says "The server does not send application-level pings" and "browser WebSocket APIs do this automatically." STATE.md flags this as needing design.
   - What's unclear: Whether browser WebSocket ping/pong is sufficient for all deployment scenarios (proxies, load balancers with short timeouts).
   - Recommendation: No custom heartbeat in Phase 1 -- the protocol spec says it's not needed. If deployments reveal proxy timeout issues, add an application-level ping in a later phase.

## Sources

### Primary (HIGH confidence)
- DRAFT.md (project root) -- complete protocol specification, all message types, close codes, lifecycle
- Lit official docs (https://lit.dev/docs/) -- custom element patterns, event dispatching, decorators
- Vite build options docs (https://vite.dev/config/build-options) -- library mode configuration, IIFE format support

### Secondary (MEDIUM confidence)
- vitest-websocket-mock GitHub (https://github.com/akiomik/vitest-websocket-mock) -- WebSocket mock testing pattern, API
- TypeScript EventTarget typing patterns (https://dev.to/43081j/strongly-typed-event-emitters-using-eventtarget-in-typescript-3658) -- strongly typed event maps

### Tertiary (LOW confidence)
- Vitest 4.x compatibility with vitest-websocket-mock -- needs validation during setup
- Vite 6.x vs 7.x for library mode -- need to verify during project initialization

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Lit/Vite/TypeScript are project constraints, versions verified via npm
- Architecture: HIGH -- EventTarget pattern is well-established for non-UI event emitters, protocol spec is fully documented in DRAFT.md
- Pitfalls: HIGH -- WebSocket browser API behavior is well-documented, common issues are well-known
- Testing: MEDIUM -- vitest-websocket-mock compatibility with Vitest 4.x unverified

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable domain, 30 days)
