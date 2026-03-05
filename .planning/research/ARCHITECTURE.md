# Architecture Patterns

**Domain:** Embeddable chat widget (Web Component)
**Researched:** 2026-03-04
**Confidence:** MEDIUM (based on training data for Lit/Web Components patterns; WebSearch/Context7 unavailable for verification)

## Recommended Architecture

Three-layer architecture with strict dependency direction: UI depends on State, State depends on Client, nothing flows backward. This mirrors the design document's decision and aligns with established patterns for embeddable widgets that must remain isolated from host pages.

```
Host Page
  |
  v
<work1-chat-widget host="wss://..." primary-color="#0066FF">
  |
  +-- Shadow DOM boundary (style/DOM isolation)
      |
      +-- UI Layer (Lit components)
      |     |
      |     +-- ChatBubble       (floating toggle button)
      |     +-- ChatPanel        (chat window container)
      |     |     +-- MessageList     (scrollable message area)
      |     |     |     +-- MessageBubble  (individual messages)
      |     |     |     +-- TypingIndicator
      |     |     |     +-- StatusBar
      |     |     +-- ChatInput       (text area + send)
      |     |
      |     reads from / dispatches to
      |     |
      +-- State Layer (ChatStore - Lit ReactiveController)
      |     |
      |     subscribes to events / calls methods
      |     |
      +-- Connection Layer (ChatClient - plain TypeScript)
            |
            WebSocket
            |
            v
      wss://<host>/ws (Work1 chat-server)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `ChatClient` | WebSocket lifecycle, JSON parsing, event dispatch, outbound message validation | ChatStore (via typed event emitter) |
| `ChatStore` | Reactive state management, message accumulation, token streaming buffer, connection state tracking | ChatClient (subscribes to events, calls `connect`/`disconnect`/`send`), UI components (via Lit reactive controller protocol) |
| `work1-chat-widget` | Root custom element, attribute/property bridge, creates ChatClient + ChatStore, owns Shadow DOM root | ChatStore (hosts controller), ChatBubble, ChatPanel |
| `ChatBubble` | Floating toggle button, unread indicator, open/close dispatch | Parent (via custom events) |
| `ChatPanel` | Chat window frame, header, layout, open/close animation | MessageList, ChatInput, StatusBar |
| `MessageList` | Scrollable message container, auto-scroll management | MessageBubble (renders list), TypingIndicator |
| `MessageBubble` | Single message rendering (markdown for agent, plain text for user) | None (leaf component) |
| `ChatInput` | Text input, send button, character limit enforcement, disabled state management | Parent (via custom events with message content) |
| `TypingIndicator` | Animated dots/pulse when agent is typing | None (leaf component) |
| `StatusBar` | Reconnecting banner, error messages, session-end notices, reconnect button | Parent (via custom events for reconnect action) |

### Data Flow

**Inbound (server to UI):**

```
WebSocket message (JSON)
  -> ChatClient parses, emits typed event
    -> ChatStore event handler mutates state
      -> ChatStore calls host.requestUpdate() (Lit ReactiveController protocol)
        -> Lit re-renders affected components
```

**Outbound (user to server):**

```
User types in ChatInput, presses send
  -> ChatInput dispatches CustomEvent('send-message', { detail: { content } })
    -> work1-chat-widget handler calls chatStore.sendMessage(content)
      -> ChatStore adds user message to state, calls chatClient.send(content)
        -> ChatClient validates size, sends JSON over WebSocket
```

**Theming (host page to widget):**

```
Host page sets CSS custom properties or HTML attributes on <work1-chat-widget>
  -> CSS custom properties pierce Shadow DOM boundary automatically
  -> HTML attributes mapped to internal CSS custom property defaults via :host
  -> Internal components consume via var(--w1-primary, fallback)
```

**State change propagation:**

```
ChatStore state mutation
  -> this.host.requestUpdate()  // Lit ReactiveController triggers re-render
    -> work1-chat-widget.render() re-evaluates
      -> Lit's diffing updates only changed DOM
        -> Child components receive new properties, re-render if changed
```

## Patterns to Follow

### Pattern 1: ChatStore as Lit ReactiveController

**What:** ChatStore implements Lit's `ReactiveController` interface, giving it lifecycle hooks tied to the host component. This is the idiomatic Lit approach for shared state that triggers re-renders.

**Why over alternatives:** Lit's ReactiveController is purpose-built for this. Unlike external state libraries (Redux, MobX), it integrates natively with Lit's update cycle -- no glue code, no subscriptions to manage, no memory leak risk from forgotten unsubscriptions. Unlike Lit's `@state()` decorator alone, a controller can encapsulate complex logic (WebSocket event handling) outside the component class.

**When:** Always use for state that drives UI updates and involves side effects (WebSocket events).

**Example:**

```typescript
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ChatClient } from '../client/chat-client.js';

export class ChatStore implements ReactiveController {
  host: ReactiveControllerHost;
  private client: ChatClient;

  // Reactive state - mutations trigger host.requestUpdate()
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'ended' = 'disconnected';
  messages: ChatMessage[] = [];
  currentStreamContent = '';
  isTyping = false;
  statusText: string | null = null;
  errorText: string | null = null;

  constructor(host: ReactiveControllerHost, wsUrl: string) {
    this.host = host;
    host.addController(this);
    this.client = new ChatClient(wsUrl);
    this.bindClientEvents();
  }

  hostConnected() {
    // Component added to DOM - connect WebSocket
    this.client.connect();
    this.update('connecting');
  }

  hostDisconnected() {
    // Component removed from DOM - clean up WebSocket
    this.client.disconnect();
  }

  private update(status?: string) {
    if (status) this.connectionStatus = status as any;
    this.host.requestUpdate();
  }

  private bindClientEvents() {
    this.client.on('token', (content) => {
      this.currentStreamContent += content;
      this.statusText = null;
      this.update();
    });

    this.client.on('message_end', () => {
      if (this.currentStreamContent) {
        this.messages = [...this.messages, {
          id: crypto.randomUUID(),
          role: 'agent',
          content: this.currentStreamContent,
          timestamp: Date.now(),
        }];
        this.currentStreamContent = '';
      }
      this.isTyping = false;
      this.update();
    });

    // ... other event bindings
  }

  sendMessage(content: string) {
    this.messages = [...this.messages, {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }];
    this.client.send(content);
    this.update();
  }
}
```

**Confidence:** MEDIUM -- ReactiveController is well-documented in Lit. The pattern shown here follows standard Lit idioms from training data. Verify `addController`/`requestUpdate` API surface against current Lit docs during implementation.

### Pattern 2: Immutable State Updates for Message Arrays

**What:** Always create new array references when adding messages (`[...this.messages, newMsg]`) rather than pushing to the existing array.

**Why:** Lit's change detection for properties is reference-based. Mutating an existing array will not trigger a re-render. New references guarantee Lit detects the change and re-renders the message list.

**When:** Every message array mutation (user sends, agent message finalized, clearing messages on reconnect).

**Example:**

```typescript
// CORRECT - new reference triggers update
this.messages = [...this.messages, newMessage];

// WRONG - mutation, Lit won't detect change
this.messages.push(newMessage);  // No re-render!
```

**Confidence:** HIGH -- this is fundamental Lit/reactive behavior.

### Pattern 3: Shadow DOM + CSS Custom Properties Theming System

**What:** The root `<work1-chat-widget>` uses Shadow DOM for full encapsulation. Theming crosses the shadow boundary via CSS custom properties (which inherit through shadow boundaries by spec) and `::part()` for structural customization.

**Why:** CSS custom properties are the only CSS mechanism that naturally crosses shadow boundaries. This is by design in the Web Components spec. `::part()` provides targeted structural styling without exposing internal DOM details.

**When:** All visual customization goes through CSS custom properties. Structural customization (e.g., rounding a specific internal element) goes through `::part()`.

**Example:**

```typescript
// theme.ts - Default values with fallback chain
import { css } from 'lit';

export const themeStyles = css`
  :host {
    /* Map HTML attributes to CSS custom properties as fallbacks */
    --w1-primary: var(--w1-primary-override, #0066FF);
    --w1-bg: #FFFFFF;
    --w1-text: #1A1A1A;
    --w1-agent-bubble-bg: #F0F0F0;
    --w1-user-bubble-bg: var(--w1-primary);
    --w1-user-bubble-text: #FFFFFF;
    --w1-font-family: system-ui, -apple-system, sans-serif;
    --w1-font-size: 14px;
    --w1-border-radius: 12px;

    /* Layout */
    --w1-panel-width: 380px;
    --w1-panel-height: 600px;

    font-family: var(--w1-font-family);
    font-size: var(--w1-font-size);
    color: var(--w1-text);
  }
`;

// In the root component:
@customElement('work1-chat-widget')
export class Work1ChatWidget extends LitElement {
  static styles = [themeStyles, componentStyles];

  @property({ attribute: 'primary-color' })
  primaryColor = '#0066FF';

  // Bridge attribute to CSS custom property
  protected updated(changed: PropertyValues) {
    if (changed.has('primaryColor')) {
      this.style.setProperty('--w1-primary', this.primaryColor);
    }
  }
}
```

**Confidence:** HIGH -- CSS custom property inheritance through shadow DOM is part of the web platform spec, not library-specific.

### Pattern 4: ChatClient as Plain EventEmitter (No Lit Dependency)

**What:** ChatClient is a plain TypeScript class with a typed event emitter pattern. No Lit imports, no DOM dependency. Testable in isolation.

**Why:** Separation of concerns. The WebSocket layer should be testable without a DOM. It should be reusable outside Lit (e.g., if someone wants to build a React wrapper later). It also simplifies unit testing -- mock WebSocket, verify events, no component rendering needed.

**When:** Always keep ChatClient free of UI framework dependencies.

**Example:**

```typescript
type EventMap = {
  connected: (sessionId: string) => void;
  token: (content: string) => void;
  typing: (active: boolean) => void;
  message_end: () => void;
  status: (content: string) => void;
  reconnecting: () => void;
  session_end: (reason: string, content: string) => void;
  error: (content: string) => void;
  close: (code: number) => void;
};

export class ChatClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Function>>();

  constructor(private url: string) {}

  on<K extends keyof EventMap>(event: K, cb: EventMap[K]): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
  }

  off<K extends keyof EventMap>(event: K, cb: EventMap[K]): void {
    this.listeners.get(event)?.delete(cb);
  }

  private emit<K extends keyof EventMap>(event: K, ...args: Parameters<EventMap[K]>): void {
    this.listeners.get(event)?.forEach(cb => (cb as Function)(...args));
  }

  connect(): void {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (event) => this.handleMessage(event);
    this.ws.onclose = (event) => this.emit('close', event.code);
    this.ws.onerror = () => {}; // onclose always fires after onerror
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'connected':    this.emit('connected', data.session_id); break;
        case 'token':        this.emit('token', data.content); break;
        case 'typing':       this.emit('typing', data.active); break;
        case 'message_end':  this.emit('message_end'); break;
        case 'status':       this.emit('status', data.content); break;
        case 'reconnecting': this.emit('reconnecting'); break;
        case 'session_end':  this.emit('session_end', data.reason, data.content); break;
        case 'error':        this.emit('error', data.content); break;
        default:
          console.warn(`[work1-chat] Unknown message type: ${data.type}`);
      }
    } catch (e) {
      console.warn('[work1-chat] Failed to parse message:', e);
    }
  }

  send(content: string): void {
    const payload = JSON.stringify({ type: 'message', content });
    if (new Blob([payload]).size > 4096) {
      throw new Error('Message too large. Maximum size is 4096 bytes.');
    }
    this.ws?.send(payload);
  }

  disconnect(): void {
    this.ws?.close(1000);
    this.ws = null;
  }
}
```

**Confidence:** HIGH -- standard TypeScript patterns, no library-specific concerns.

### Pattern 5: Internal Component Communication via Properties Down, Events Up

**What:** Parent components pass data to children via Lit properties. Children communicate to parents via `CustomEvent` dispatch. No shared mutable state between siblings.

**Why:** This is the standard Web Components communication pattern and matches Lit's design. It keeps components decoupled and testable. The ChatStore lives only in the root widget; children receive slices of state as properties and emit events for user actions.

**When:** All parent-child communication within the widget's shadow DOM.

**Example:**

```typescript
// Parent (work1-chat-widget) passes state down as properties:
render() {
  return html`
    <chat-panel
      .messages=${this.store.messages}
      .isTyping=${this.store.isTyping}
      .connectionStatus=${this.store.connectionStatus}
      .currentStreamContent=${this.store.currentStreamContent}
      .statusText=${this.store.statusText}
      @send-message=${this.handleSendMessage}
      @reconnect=${this.handleReconnect}
    ></chat-panel>
  `;
}

// Child (chat-input) dispatches events up:
private handleSend() {
  this.dispatchEvent(new CustomEvent('send-message', {
    detail: { content: this.inputValue },
    bubbles: true,
    composed: false,  // stays within shadow DOM
  }));
}
```

**Key detail:** Use `composed: false` for internal events (they stay within the widget's shadow DOM). Use `composed: true` only for events that should be visible to the host page (e.g., `widget-opened`, `message-sent` if we expose a public API).

**Confidence:** HIGH -- standard Web Components pattern.

### Pattern 6: Lazy Connection (Connect on Open, Not on Mount)

**What:** Do not connect the WebSocket when the element is added to the DOM. Connect when the user clicks the chat bubble to open the panel.

**Why:** The widget sits on every page of the customer's site. Most users never click it. Connecting eagerly wastes server resources (the 5-connection-per-IP limit would be hit by users with multiple tabs). Lazy connection also avoids the idle timeout problem -- a 300s idle timeout starts on connection, so connecting before the user is ready wastes the session.

**When:** Always. This overrides the naive `hostConnected()` approach shown in Pattern 1.

**Corrected flow:**

```
1. Element added to DOM -> render bubble only (no WebSocket)
2. User clicks bubble -> connect WebSocket, show "Connecting..." in panel
3. WebSocket connected event -> show chat UI
4. User closes panel -> keep WebSocket alive (session continues)
5. Session ends / user navigates away -> disconnect
```

**Confidence:** HIGH -- architectural reasoning based on the protocol constraints (idle timeout, connection limits).

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global State or Singleton Store

**What:** Creating a module-level singleton ChatStore that multiple widget instances share, or using `window`-level globals.

**Why bad:** A customer might embed two widget instances (different agents/endpoints). Global state means messages from one bleed into the other. Also breaks testability -- tests can't run in parallel with isolated state.

**Instead:** Each `<work1-chat-widget>` instance creates its own ChatStore and ChatClient. State is scoped to the component tree.

### Anti-Pattern 2: DOM Queries Across Shadow Boundaries

**What:** Using `document.querySelector` from inside the widget to reach host page DOM, or from the host page to reach into the widget's shadow DOM.

**Why bad:** Breaks encapsulation. Host page styles/scripts can corrupt widget state. Widget can accidentally depend on host page structure.

**Instead:** All communication between widget and host page goes through: (1) HTML attributes/properties on `<work1-chat-widget>`, (2) CSS custom properties for theming, (3) CustomEvents with `composed: true` for outbound notifications, (4) public methods on the element class.

### Anti-Pattern 3: Inline Styles in Template Literals for Theming

**What:** Using `style=` attributes computed from properties for theming: `` html`<div style="background: ${this.primaryColor}">` ``

**Why bad:** Cannot be overridden by CSS custom properties. Breaks the cascading nature of theming. Inlines have highest specificity. Also triggers CSP violations if `style-src 'unsafe-inline'` is not set.

**Instead:** Always use CSS custom properties. Bridge HTML attributes to custom properties in `updated()` lifecycle, then consume via `var()` in static styles.

### Anti-Pattern 4: Rendering Unsanitized Markdown as HTML

**What:** Using `marked` output directly with Lit's `unsafeHTML` without sanitization.

**Why bad:** Agent responses could contain XSS payloads (either from a compromised agent or injected user content reflected back). `unsafeHTML(marked.parse(content))` is a direct XSS vector.

**Instead:** Configure `marked` with a sanitizer. Use DOMPurify or marked's built-in sanitization to strip script tags, event handlers, and dangerous HTML. Only allow safe elements (p, strong, em, a, code, pre, ul, ol, li).

### Anti-Pattern 5: Streaming Token Accumulation in the DOM

**What:** Appending each token directly to a DOM text node or innerHTML, bypassing Lit's rendering.

**Why bad:** Bypasses Lit's update batching and diffing. Creates race conditions between manual DOM manipulation and Lit re-renders. Lit may overwrite manual DOM changes on the next render cycle.

**Instead:** Accumulate tokens in `ChatStore.currentStreamContent` (a string). Render the full string each cycle. Lit's diffing is efficient enough -- updating a text binding is a single DOM operation. For very fast token streams, Lit batches `requestUpdate()` calls within a microtask, so multiple tokens per frame are naturally batched.

## Build Output Strategy

### Dual Bundle (UMD + ESM)

**Vite configuration for dual output:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Work1ChatWidget',   // Global variable name for UMD
      formats: ['es', 'umd'],
      fileName: (format) => format === 'es'
        ? 'work1-chat-widget.es.js'
        : 'work1-chat-widget.js',
    },
    rollupOptions: {
      // No externals - bundle everything (Lit, marked, DOMPurify)
      // Widget must be self-contained for CDN usage
    },
    target: 'es2021',           // Modern browsers only
    minify: 'terser',
    sourcemap: true,
  },
});
```

**Key decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Bundle dependencies | Yes, all included | CDN users cannot install dependencies. Widget must be a single file. |
| External dependencies | None | Self-contained for both CDN and npm. Tree-shaking is npm consumers' responsibility. |
| Target | es2021 | Modern browsers only per constraints. Enables native class fields, optional chaining, nullish coalescing. |
| Sourcemaps | Yes | Debug support for customers integrating the widget. |
| TypeScript declarations | Yes (.d.ts) | npm consumers get type safety and IDE support. |

**Entry point (`src/index.ts`):**

```typescript
// Register custom element
import { Work1ChatWidget } from './components/work1-chat-widget.js';

// Only register if not already defined (prevents double-registration errors)
if (!customElements.get('work1-chat-widget')) {
  customElements.define('work1-chat-widget', Work1ChatWidget);
}

// Export for ESM consumers
export { Work1ChatWidget };
export type { ChatMessage, ChatState } from './state/chat-store.js';
```

**Confidence:** MEDIUM -- Vite lib mode with dual formats is well-documented, but exact config options should be verified against current Vite docs during implementation.

## CSP Compatibility

**Requirement:** Widget must work under strict Content-Security-Policy headers.

**Approach:**

| CSP Concern | Solution |
|-------------|----------|
| `style-src` | Lit uses `adoptedStyleSheets` (constructable stylesheets) which do not require `'unsafe-inline'`. This is the default behavior. |
| `script-src` | Single bundle loaded via `<script src>` -- no eval, no inline scripts. |
| `connect-src` | Customer must allow `wss://<chat-server-host>` in their CSP. Document this. |
| `img-src` | If custom icons via URL: customer must allow the icon origin. Built-in SVG icons avoid this. |

**Key risk:** Lit's `adoptedStyleSheets` approach works in all modern browsers (Chrome 73+, Firefox 101+, Safari 16.4+). If a customer targets older browsers, they would need `style-src 'unsafe-inline'` -- but the project constraint is "last 2 versions" of modern browsers, so this should not be an issue.

**Confidence:** MEDIUM -- Lit's use of constructable stylesheets is well-documented, but CSP interaction specifics should be verified during implementation testing.

## Scalability Considerations

| Concern | Single conversation | Multiple tabs (5 limit) | High-traffic page |
|---------|--------------------|-----------------------|-------------------|
| Memory | Minimal -- messages array grows linearly, capped by session duration | Each tab has own widget instance | Widget is idle until opened, negligible impact |
| DOM nodes | ~50-200 nodes for typical conversation | Independent per tab | Single bubble element until opened |
| WebSocket connections | 1 per widget instance | Hits 5-per-IP limit | Lazy connection prevents waste |
| Bundle size | Target < 50KB gzipped (Lit ~16KB + marked ~8KB + widget code) | Cached after first load | CDN with cache headers |
| Token streaming perf | Lit batches updates per microtask, handles fast token streams | Independent | N/A until opened |

## Suggested Build Order

Dependencies between components dictate implementation order.

```
Phase 1: Foundation
  types.ts          (no dependencies)
  constants.ts      (no dependencies)
  chat-client.ts    (depends on: types, constants)
  chat-client tests

Phase 2: State
  chat-store.ts     (depends on: chat-client, types)
  chat-store tests

Phase 3: Theme + Shared Styles
  theme.ts          (no dependencies)
  shared.ts         (depends on: theme)

Phase 4: Leaf Components (no children, simple rendering)
  message-bubble.ts     (depends on: theme, types; needs marked for agent messages)
  typing-indicator.ts   (depends on: theme)
  status-bar.ts         (depends on: theme)
  chat-input.ts         (depends on: theme)

Phase 5: Container Components
  message-list.ts       (depends on: message-bubble, typing-indicator, status-bar)
  chat-panel.ts         (depends on: message-list, chat-input)
  chat-bubble.ts        (depends on: theme)

Phase 6: Root Component + Integration
  work1-chat-widget.ts  (depends on: everything above)
  index.ts              (depends on: work1-chat-widget)
  Integration tests

Phase 7: Build + Distribution
  vite.config.ts        (UMD + ESM output)
  package.json          (npm metadata, exports field)
  TypeScript declarations
  Dev server + demo page
```

**Rationale:** Bottom-up build order. Each phase produces testable artifacts. Connection layer is tested first because it maps 1:1 to the protocol spec (DRAFT.md) and is the riskiest integration point. State layer follows because it is the bridge between connection and UI -- getting state management right early prevents cascading bugs. Leaf components can be built and tested in isolation before assembly.

## Sources

- Work1 design document: `docs/plans/2026-03-04-chat-widget-design.md` (project-specific, authoritative)
- Work1 protocol spec: `DRAFT.md` (project-specific, authoritative)
- Lit documentation patterns: based on training data for Lit 3.x (MEDIUM confidence -- should verify against lit.dev during implementation)
- CSS custom properties Shadow DOM inheritance: W3C Web Components spec (HIGH confidence -- stable web platform feature)
- Vite library mode: based on training data for Vite 5.x (MEDIUM confidence -- verify config against vitejs.dev during implementation)
