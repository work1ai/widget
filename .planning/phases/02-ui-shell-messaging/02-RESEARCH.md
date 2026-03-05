# Phase 2: UI Shell & Messaging - Research

**Researched:** 2026-03-04
**Domain:** Lit 3 Web Components -- chat UI shell, reactive state, message input, scroll behavior
**Confidence:** HIGH

## Summary

Phase 2 builds the complete visual shell and send-side messaging experience on top of the Phase 1 ChatClient. The work breaks into four concerns: (1) a reactive state layer (ChatStore) that bridges ChatClient events to Lit's rendering cycle, (2) the visual shell (floating bubble, slide-up panel, header), (3) message input with byte validation and auto-grow, and (4) a message list with auto-scroll/pause behavior.

All UI lives inside Shadow DOM using Lit 3's `static styles` with `css` tagged templates. No external CSS libraries are needed -- the scope is manageable with plain CSS in shadow scope. The ChatStore should be implemented as a Lit ReactiveController so it integrates cleanly with the host component lifecycle and triggers re-renders via `host.requestUpdate()`.

**Primary recommendation:** Build a ChatStore ReactiveController that owns all chat state (messages, connection status, input state) and wire it into the existing Work1ChatWidget, then decompose the UI into render methods (not separate custom elements) for bubble, panel, header, message-list, and input-area.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Right-aligned user messages (accent color background), left-aligned agent messages (neutral color background)
- Rounded rectangles with subtle drop shadow (12-16px border-radius)
- No timestamps -- conversations are ephemeral
- Consecutive same-sender messages grouped: reduced spacing, pointed tail on last bubble only (iMessage/WhatsApp pattern)
- Character/byte counter appears only near the 4096-byte limit (~200 chars remaining), turns red at limit. Hidden otherwise
- Send button is an icon (arrow/send SVG) inside the input area on the right side. Accent-colored when active, grayed when disabled
- Textarea auto-grows from single line up to 4-5 lines (~120px max), then scrolls internally
- Placeholder text configurable via HTML attribute (`placeholder`), default: "Type a message..."
- Enter sends, Shift+Enter inserts newline (per MSG-02)
- Floating bubble: ~56px circle, accent-colored fill, white chat-bubble SVG icon, subtle shadow. Bottom-right by default (configurable per SHEL-08)
- Panel header: configurable title (default "Chat") on left, "Powered by AI" badge (subtle, always visible per CONT-05), close [X] button on right. Accent-colored background, white text
- Open/close animation: panel slides up from bubble position, 250ms ease-out. Slides back down on close
- Greeting message (CONT-04): configurable text displayed as first agent bubble (plain text) when panel opens. Panel never appears empty
- Auto-scroll to bottom as new messages arrive
- Auto-scroll pauses when user scrolls up (SHEL-07)
- "Scroll to bottom" floating pill with new message count appears when user is scrolled up and new content arrives
- Auto-scroll resumes when user scrolls back to within ~50px of bottom, or clicks scroll-to-bottom button
- Smooth scroll animation for manual actions; instant scroll during active streaming/new messages

### Claude's Discretion
- ChatStore reactive state layer design (between ChatClient and UI components)
- Component decomposition (how to split bubble, panel, input, message list)
- CSS architecture within Shadow DOM
- SVG icon design for bubble and send button
- Exact spacing, typography, and color values (will be themeable in Phase 4)
- Disabled state visual treatment for input when disconnected

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MSG-01 | User can type and send messages via text input with send button | Input area architecture, ChatStore.send() method, textarea + send button pattern |
| MSG-02 | Enter to send, Shift+Enter for newline | Keyboard event handling in textarea, keydown handler pattern |
| MSG-03 | Widget sends `{"type":"message","content":"..."}` JSON to server | ChatClient.send() already implements this -- ChatStore wraps it |
| MSG-04 | 4096 byte limit client-side with inline validation | TextEncoder.encode().length for UTF-8 byte counting |
| MSG-05 | Send button and input disabled when no active WebSocket connection | ChatStore.connected reactive property drives disabled state |
| MSG-06 | User messages appear immediately in chat as user bubbles | ChatStore.addUserMessage() adds to messages array, triggers re-render |
| SHEL-01 | Floating circular bubble button (bottom-right by default) | CSS fixed positioning, `position` attribute for left/right |
| SHEL-02 | Click bubble to open chat panel with slide-up animation | CSS transitions on panel, `isOpen` state toggle |
| SHEL-03 | Close chat panel via close button in header | Header close button dispatches close, returns to bubble |
| SHEL-04 | Header with configurable title and "Powered by AI" badge | `title` attribute, static badge text |
| SHEL-05 | Scrollable message area | overflow-y: auto on message container |
| SHEL-06 | Auto-scroll to newest content | scrollTop = scrollHeight after message append |
| SHEL-07 | Auto-scroll pauses when user scrolls up | Sentinel element + IntersectionObserver pattern |
| SHEL-08 | Panel position configurable: bottom-right or bottom-left | `position` attribute maps to CSS custom property or class |
| SHEL-09 | Panel width and height configurable via attributes | `width` and `height` attributes map to CSS properties |
| SHEL-10 | Open/close animations are smooth CSS transitions (200-300ms) | CSS transform + opacity transition, 250ms ease-out |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | ^3.3.0 (installed: 3.3.2) | Component framework | Already in project, provides reactive rendering + Shadow DOM |
| lit/decorators.js | (bundled with lit) | @property, @state, @customElement | Established pattern from Phase 1 |
| lit/directives/class-map.js | (bundled with lit) | Conditional CSS classes | Cleaner than ternary in templates |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TextEncoder (browser built-in) | N/A | UTF-8 byte counting | MSG-04 byte limit validation |
| IntersectionObserver (browser built-in) | N/A | Scroll position detection | SHEL-07 auto-scroll pause |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ReactiveController for state | Separate state class with events | Controller integrates with Lit lifecycle natively -- no manual subscription cleanup |
| Render methods on host | Separate custom elements per component | Separate elements add complexity (cross-shadow communication, slot management) -- render methods share state trivially |
| IntersectionObserver for scroll | scroll event + scrollTop math | IntersectionObserver is more performant (no scroll event spam), cleaner threshold detection |

**Installation:**
```bash
# No new packages needed -- everything is built-in or already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  chat-client.ts           # (existing) WebSocket protocol client
  chat-client.types.ts     # (existing) Protocol types
  chat-store.ts            # NEW: ReactiveController state layer
  chat-store.types.ts      # NEW: Message/state types for UI
  work1-chat-widget.ts     # MODIFY: Expand with full UI render
  components/              # NEW: Render helpers (pure functions)
    bubble-button.ts       #   Floating bubble render
    chat-panel.ts          #   Panel container render
    chat-header.ts         #   Header bar render
    message-list.ts        #   Message list + scroll logic
    message-bubble.ts      #   Individual message bubble render
    input-area.ts          #   Textarea + send button render
    icons.ts               #   SVG icon templates (inline lit html)
  styles/                  # NEW: Scoped CSS modules
    widget.styles.ts       #   Root widget styles
    panel.styles.ts        #   Panel/header styles
    messages.styles.ts     #   Message bubble styles
    input.styles.ts        #   Input area styles
  index.ts                 # (existing) Barrel exports
```

### Pattern 1: ChatStore as ReactiveController

**What:** A single ReactiveController that owns all chat state and bridges ChatClient events to Lit rendering.
**When to use:** Always -- this is the central state management pattern for the widget.

```typescript
// Source: Lit docs (https://lit.dev/docs/composition/controllers/)
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ChatClient } from './chat-client.js';
import { ChatMessage, ConnectionState } from './chat-store.types.js';

export class ChatStore implements ReactiveController {
  host: ReactiveControllerHost;

  private client: ChatClient | null = null;

  // Reactive state -- mutations call host.requestUpdate()
  messages: ChatMessage[] = [];
  connectionState: ConnectionState = 'disconnected';
  isOpen: boolean = false;
  inputDisabled: boolean = true;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    // Setup when element enters DOM
  }

  hostDisconnected(): void {
    // Cleanup when element leaves DOM
    this.disconnect();
  }

  connect(url: string, debug: boolean): void {
    this.client = new ChatClient({ debug });
    this.wireClientEvents();
    this.client.connect(url);
    this.connectionState = 'connecting';
    this.host.requestUpdate();
  }

  disconnect(): void {
    this.client?.disconnect();
    this.client = null;
    this.connectionState = 'disconnected';
    this.inputDisabled = true;
    this.host.requestUpdate();
  }

  send(content: string): void {
    if (!this.client?.connected) return;
    this.client.send(content);
    this.messages = [...this.messages, {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }];
    this.host.requestUpdate();
  }

  private wireClientEvents(): void {
    if (!this.client) return;

    this.client.addEventListener('connected', (e) => {
      this.connectionState = 'connected';
      this.inputDisabled = false;
      this.host.requestUpdate();
    });

    this.client.addEventListener('disconnected', () => {
      this.connectionState = 'disconnected';
      this.inputDisabled = true;
      this.host.requestUpdate();
    });

    // ... wire other events (token, typing, etc.) for Phase 3
  }
}
```

### Pattern 2: Render Helper Functions (Not Separate Elements)

**What:** Pure functions that return `TemplateResult` for each UI section, called from the host's `render()` method.
**When to use:** When components share state and don't need independent lifecycle.

```typescript
// src/components/chat-header.ts
import { html, TemplateResult } from 'lit';

export function renderHeader(
  title: string,
  onClose: () => void,
): TemplateResult {
  return html`
    <header class="chat-header" part="header">
      <span class="header-title">${title}</span>
      <span class="header-badge">Powered by AI</span>
      <button
        class="header-close"
        @click=${onClose}
        aria-label="Close chat"
      >
        ${closeIcon}
      </button>
    </header>
  `;
}
```

```typescript
// In work1-chat-widget.ts render():
protected render() {
  if (!this.store.isOpen) {
    return renderBubble(() => this.store.isOpen = true);
  }
  return html`
    ${renderHeader(this.title, () => this.handleClose())}
    ${renderMessageList(this.store.messages)}
    ${renderInputArea({
      disabled: this.store.inputDisabled,
      placeholder: this.placeholder,
      onSend: (msg) => this.store.send(msg),
    })}
  `;
}
```

### Pattern 3: CSS Styles as Separate Modules

**What:** `css` tagged template literals exported from dedicated `.styles.ts` files, composed via array spread in `static styles`.
**When to use:** Always -- keeps styles organized and the main component file focused on logic.

```typescript
// src/styles/panel.styles.ts
import { css } from 'lit';

export const panelStyles = css`
  .chat-panel {
    position: fixed;
    bottom: 80px;
    right: 16px;
    width: var(--w1-panel-width, 380px);
    height: var(--w1-panel-height, 560px);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
  }
`;

// In work1-chat-widget.ts:
import { panelStyles } from './styles/panel.styles.js';
import { messageStyles } from './styles/messages.styles.js';
import { inputStyles } from './styles/input.styles.js';

static styles = [panelStyles, messageStyles, inputStyles];
```

### Pattern 4: Auto-Growing Textarea with CSS Grid

**What:** CSS grid trick where a hidden `::after` pseudo-element mirrors the textarea content, naturally expanding the container.
**When to use:** For the message input (MSG-01).

```typescript
// Source: https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
// Adapted for Lit Shadow DOM

// In input.styles.ts:
export const inputStyles = css`
  .input-grow-wrap {
    display: grid;
  }
  .input-grow-wrap::after {
    content: attr(data-replicated-value) " ";
    white-space: pre-wrap;
    word-wrap: break-word;
    visibility: hidden;
    grid-area: 1 / 1 / 2 / 2;
    font: inherit;
    padding: 10px 40px 10px 12px;
    max-height: 120px;
    overflow: hidden;
  }
  .input-grow-wrap > textarea {
    grid-area: 1 / 1 / 2 / 2;
    resize: none;
    overflow-y: auto;
    font: inherit;
    padding: 10px 40px 10px 12px;
    max-height: 120px;
    border: none;
    outline: none;
  }
`;

// In input-area.ts render:
// Update data-replicated-value on input event to sync the mirror
```

### Pattern 5: Scroll Sentinel with IntersectionObserver

**What:** A zero-height sentinel `<div>` at the bottom of the message list. IntersectionObserver watches it to determine if user is "at bottom."
**When to use:** For SHEL-06/SHEL-07 auto-scroll behavior.

```typescript
// In message-list component logic:
private scrollObserver: IntersectionObserver | null = null;
private isAtBottom: boolean = true;
private unreadCount: number = 0;

setupScrollObserver(container: HTMLElement, sentinel: HTMLElement): void {
  this.scrollObserver = new IntersectionObserver(
    ([entry]) => {
      this.isAtBottom = entry.isIntersecting;
      if (this.isAtBottom) {
        this.unreadCount = 0;
        this.host.requestUpdate();
      }
    },
    { root: container, threshold: 0.1 }
  );
  this.scrollObserver.observe(sentinel);
}

// When new message arrives:
onNewMessage(): void {
  if (this.isAtBottom) {
    // Instant scroll to bottom
    sentinel.scrollIntoView({ behavior: 'instant' });
  } else {
    this.unreadCount++;
    this.host.requestUpdate(); // Show "N new messages" pill
  }
}

// Scroll-to-bottom button click:
scrollToBottom(): void {
  sentinel.scrollIntoView({ behavior: 'smooth' });
}
```

### Anti-Patterns to Avoid
- **Separate custom elements for each UI piece:** Creates cross-shadow-DOM communication complexity. Message list, input, header all need shared state -- render functions are simpler.
- **scroll event listener without debounce/threshold:** Use IntersectionObserver instead; scroll events fire too frequently and cause jank.
- **Storing messages in DOM:** Keep messages in ChatStore array, render declaratively. Never parse DOM to determine state.
- **Using `style=""` attribute for dynamic styles:** Violates CSP (SEC-03). Use CSS custom properties or class toggling instead.
- **Inline SVGs as raw HTML strings:** Use Lit `svg` tagged template or embed in `html` template for proper escaping.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UTF-8 byte counting | Manual char-code math | `new TextEncoder().encode(str).length` | Handles multi-byte chars (emoji, CJK) correctly; browser-native, fast |
| Scroll position detection | scroll event + scrollTop arithmetic | IntersectionObserver with sentinel element | No scroll event spam, works correctly with dynamic content heights |
| Reactive state synchronization | Custom event wiring between components | Lit ReactiveController with `host.requestUpdate()` | Integrates with Lit's batched update cycle, automatic cleanup via lifecycle |
| Auto-growing textarea | JS-driven height calculation on every keystroke | CSS grid mirror trick (`::after` pseudo-element) | Pure CSS solution, no layout thrashing from JS measurements |
| Unique message IDs | Incrementing counter | `crypto.randomUUID()` | Browser-native, zero collision risk, no global state |

**Key insight:** This phase has zero external dependencies to add. Everything needed (TextEncoder, IntersectionObserver, crypto.randomUUID, CSS grid) is built into modern browsers. Lit 3 provides everything else.

## Common Pitfalls

### Pitfall 1: TextEncoder Byte Count vs String Length
**What goes wrong:** Using `string.length` instead of `TextEncoder.encode(string).length` for the 4096-byte limit. A single emoji can be 4+ bytes but `.length` reports 2 (surrogate pair).
**Why it happens:** Developers conflate characters with bytes.
**How to avoid:** Always use `new TextEncoder().encode(str).length` for MSG-04. Cache a single TextEncoder instance -- creating one per keystroke is wasteful.
**Warning signs:** Limit works for ASCII but fails with emoji or CJK text.

### Pitfall 2: Scroll Position Lost on Re-render
**What goes wrong:** Lit re-render resets scroll position or causes visible jump in message list.
**Why it happens:** If the message list container is replaced (not updated), the browser resets scrollTop to 0.
**How to avoid:** Use keyed rendering (`repeat` directive with message ID) so Lit updates existing DOM nodes rather than replacing the container. Never replace the scroll container element itself.
**Warning signs:** Messages visibly jump when new content arrives.

### Pitfall 3: Animation on First Render
**What goes wrong:** The panel's slide-up animation plays when the component first renders (before user clicks bubble).
**Why it happens:** CSS transitions trigger on initial property values.
**How to avoid:** Use a CSS class (`panel--open`) added after first render. Or use `will-change` and only apply transition after the panel has been rendered at least once. Alternatively, render the panel only when `isOpen` is true (conditional rendering avoids the problem entirely).
**Warning signs:** Panel briefly flashes or slides on page load.

### Pitfall 4: Event Listener Leaks on ChatClient
**What goes wrong:** Opening and closing the panel multiple times creates duplicate event listeners on ChatClient.
**Why it happens:** Each `openConnection()` call creates a new ChatClient and adds listeners, but if the old client's listeners aren't cleaned up (or the client isn't properly nulled), events double-fire.
**How to avoid:** ChatStore should own the ChatClient lifecycle. `disconnect()` must null the client reference. Use `hostDisconnected()` for cleanup.
**Warning signs:** Messages appear twice, state changes fire multiple times.

### Pitfall 5: CSS Custom Properties vs Hard-Coded Values
**What goes wrong:** Hard-coding colors/sizes now makes Phase 4 (theming) a painful rewrite.
**Why it happens:** "We'll fix it later" mentality.
**How to avoid:** Use CSS custom properties from day one with sensible defaults: `var(--w1-accent-color, #0066FF)`. Phase 4 just documents and expands them.
**Warning signs:** Any color/size that appears as a literal value without a custom property fallback.

### Pitfall 6: Shadow DOM and `part` Attribute Planning
**What goes wrong:** Not adding `part` attributes now means Phase 4 `::part()` theming requires touching every template.
**Why it happens:** `part` attributes seem premature in Phase 2.
**How to avoid:** Add `part="header"`, `part="message-list"`, `part="input"`, `part="bubble"` to key container elements now. Zero runtime cost, saves Phase 4 rework.
**Warning signs:** None until Phase 4 -- this is preventive.

## Code Examples

### UTF-8 Byte Counting with Cached Encoder
```typescript
// Source: MDN TextEncoder API
const encoder = new TextEncoder();

export function getByteLength(str: string): number {
  return encoder.encode(str).length;
}

// Usage in input validation:
const BYTE_LIMIT = 4096;
const WARNING_THRESHOLD = BYTE_LIMIT - 200; // ~200 bytes remaining

function validateInput(value: string): {
  bytes: number;
  overLimit: boolean;
  showCounter: boolean;
} {
  const bytes = getByteLength(value);
  return {
    bytes,
    overLimit: bytes > BYTE_LIMIT,
    showCounter: bytes >= WARNING_THRESHOLD,
  };
}
```

### Enter-to-Send, Shift+Enter for Newline
```typescript
// Keyboard handler for textarea
private handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const textarea = e.target as HTMLTextAreaElement;
    const content = textarea.value.trim();
    if (content && !this.store.inputDisabled && !this.isOverLimit) {
      this.store.send(content);
      textarea.value = '';
      // Reset grow-wrap mirror
      this.updateMirror('');
    }
  }
  // Shift+Enter: default behavior inserts newline -- no code needed
}
```

### Panel Open/Close with CSS Transition
```typescript
// CSS:
const panelStyles = css`
  .chat-panel {
    position: fixed;
    bottom: 80px;
    right: 16px;
    transform: translateY(20px) scale(0.95);
    opacity: 0;
    pointer-events: none;
    transition: transform 250ms ease-out, opacity 250ms ease-out;
  }
  .chat-panel--open {
    transform: translateY(0) scale(1);
    opacity: 1;
    pointer-events: auto;
  }
`;

// Template (always render both, toggle class):
protected render() {
  return html`
    <button
      class="bubble-button ${this.store.isOpen ? 'bubble--hidden' : ''}"
      part="bubble"
      @click=${() => this.openPanel()}
      aria-label="Open chat"
    >
      ${chatBubbleIcon}
    </button>
    <div
      class="chat-panel ${this.store.isOpen ? 'chat-panel--open' : ''}"
      part="panel"
    >
      ${renderHeader(this.title, () => this.closePanel())}
      ${renderMessageList(this.store.messages, this.store.isAtBottom)}
      ${renderInputArea({ ... })}
    </div>
  `;
}
```

### Message Type Definitions
```typescript
// src/chat-store.types.ts
export type MessageRole = 'user' | 'agent' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  /** True while agent message is still streaming (Phase 3) */
  streaming?: boolean;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';
```

### Message Grouping Logic
```typescript
// Determine if consecutive messages from same sender should be grouped
export function shouldGroup(
  messages: ChatMessage[],
  index: number,
): { isFirstInGroup: boolean; isLastInGroup: boolean } {
  const msg = messages[index];
  const prev = index > 0 ? messages[index - 1] : null;
  const next = index < messages.length - 1 ? messages[index + 1] : null;

  return {
    isFirstInGroup: !prev || prev.role !== msg.role,
    isLastInGroup: !next || next.role !== msg.role,
  };
}

// CSS classes based on grouping:
// .message--first: full top border-radius, normal top margin
// .message--middle: reduced border-radius on grouped side, tight margin
// .message--last: pointed tail (border-radius trick or CSS triangle), tight margin
// .message--solo: both first and last (full styling)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LitElement `@property` for all state | `@state` for internal state, `@property` for attributes | Lit 2+ | Internal state (messages, isOpen) uses `@state` -- not reflected to attributes |
| Manual event subscription cleanup | ReactiveController `hostDisconnected()` | Lit 2+ | Automatic cleanup when element removed from DOM |
| `element.scrollTop = element.scrollHeight` | IntersectionObserver with sentinel | Modern browsers | No scroll event listeners, cleaner pause/resume logic |
| JS-measured textarea resize | CSS grid mirror trick | 2020+ | No layout thrashing, works in Shadow DOM |
| `field-sizing: content` on textarea | Not yet -- limited browser support | Chrome 123+ only | Cannot use yet; Firefox/Safari don't support |

**Deprecated/outdated:**
- `@property` for internal-only state: Use `@state` instead -- avoids unnecessary attribute reflection
- Manual scroll event debouncing: IntersectionObserver handles this natively

## Open Questions

1. **Greeting message as first agent bubble**
   - What we know: CONT-04 specifies a configurable greeting displayed as first agent message when panel opens
   - What's unclear: Should greeting be added to ChatStore.messages array (and thus persist across open/close), or rendered separately?
   - Recommendation: Add to messages array on first open. If panel is closed and reopened, greeting is already there. This avoids special-casing in the message list renderer.

2. **Panel render strategy: conditional vs always-in-DOM**
   - What we know: CSS transitions require the element to exist in DOM to animate
   - What's unclear: Does keeping the panel always in DOM cause accessibility issues (screen readers see hidden panel)?
   - Recommendation: Always render the panel in DOM with `aria-hidden` when closed. This allows CSS transitions to work. Toggle `aria-hidden` and `pointer-events` on open/close.

3. **Connection lifecycle tied to panel open/close**
   - What we know: CONTEXT.md says "panel open/close should trigger openConnection()/closeConnection()"
   - What's unclear: Should connection persist across panel close/reopen, or disconnect each time?
   - Recommendation: Connect on first open, keep connected while panel is closed (user may reopen). Disconnect only on explicit `closeConnection()` or `hostDisconnected()`. This preserves conversation state across panel toggles.

## Sources

### Primary (HIGH confidence)
- Lit 3 ReactiveController docs (https://lit.dev/docs/composition/controllers/) - Controller API, lifecycle, host.requestUpdate()
- Lit 3 Styles docs (https://lit.dev/docs/components/styles/) - css tagged template, static styles, Shadow DOM scoping
- MDN TextEncoder (https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) - UTF-8 byte encoding
- MDN IntersectionObserver (https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - Scroll detection

### Secondary (MEDIUM confidence)
- CSS-Tricks auto-growing textarea (https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/) - CSS grid mirror technique
- Existing project code (src/chat-client.ts, src/work1-chat-widget.ts) - Established patterns

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Lit 3.3.2 already installed, no new dependencies needed
- Architecture: HIGH - ReactiveController is Lit's prescribed state pattern; render helpers are standard Lit composition
- Pitfalls: HIGH - Based on known DOM/CSS/Shadow DOM behaviors documented in official specs
- Scroll behavior: MEDIUM - IntersectionObserver sentinel pattern is well-established but exact threshold tuning may need iteration

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- Lit 3 is mature, no breaking changes expected)
