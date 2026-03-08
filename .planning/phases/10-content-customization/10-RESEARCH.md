# Phase 10: Content Customization - Research

**Researched:** 2026-03-07
**Domain:** Lit Web Component HTML attributes, header UI, greeting message timing
**Confidence:** HIGH

## Summary

Phase 10 adds three content customization features to the existing widget: configurable chat title (renaming the attribute from `title` to `chat-title`), a new subtitle line in the header, and a greeting message that displays after WebSocket connection. All four requirements are straightforward Lit property/template changes within the existing architecture.

The most important technical detail is the `title` -> `chat-title` rename (CUST-02). The current code uses `override title: string = 'Chat'` which overrides HTMLElement's native `title` property. This causes the browser to show a tooltip on hover. Renaming the attribute to `chat-title` (with a `chatTitle` property) eliminates the tooltip and is a breaking API change that must be handled carefully.

The greeting timing also needs adjustment. Currently `greeting` is injected on panel open (`toggleOpen`). The requirement says it should display "after WebSocket connects", meaning the greeting should appear after the `connected` event fires, not when the panel opens. This changes the greeting logic from ChatStore's `toggleOpen()` to the `connected` event handler.

**Primary recommendation:** Three focused changes -- rename title attribute, add subtitle to header, move greeting injection to post-connect. All within existing Lit reactive property and template patterns.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CUST-01 | User can configure the chat header title via `chat-title` HTML attribute | Rename `title` property to `chatTitle` with `attribute: 'chat-title'`, update `renderHeader()` call |
| CUST-02 | Existing `title` property renamed to `chat-title` to avoid native browser tooltip conflict | Remove `override title` property, add new `chatTitle` property with `attribute: 'chat-title'`, remove the `override` keyword |
| CUST-03 | User can configure a subtitle below the title via `chat-subtitle` HTML attribute | Add `chatSubtitle` property with `attribute: 'chat-subtitle'`, extend `renderHeader()` signature, add subtitle element + styles |
| CUST-04 | User can configure an initial greeting message via `greeting` attribute that displays as agent message after WebSocket connects (not sent to server) | Move greeting injection from `toggleOpen()` to `connected` event handler in ChatStore; greeting already exists as attribute |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Lit | 3.3.x | Web Component framework | Already in use; `@property` decorator handles HTML attribute reflection |
| TypeScript | 5.9.x | Type safety | Already in use; property types enforce string constraints |

### Supporting
No new libraries needed. All changes are within existing Lit property/template patterns.

## Architecture Patterns

### Current Structure (relevant files)
```
src/
  work1-chat-widget.ts       # Main element: @property declarations, render()
  chat-store.ts              # ReactiveController: greeting logic, connection events
  chat-store.types.ts        # ChatMessage, ConnectionState types
  components/
    chat-header.ts           # renderHeader() function template
  styles/
    panel.styles.ts          # .chat-header, .header-title, .header-badge styles
```

### Pattern 1: Lit Reactive Property with Custom Attribute Name
**What:** Lit's `@property({ attribute: 'chat-title' })` maps a kebab-case HTML attribute to a camelCase JS property. Setting the attribute in HTML triggers reactive updates.
**When to use:** When the HTML attribute name should differ from the JS property name, or when avoiding native property conflicts.
**Example:**
```typescript
// Source: Lit documentation - reactive properties
@property({ attribute: 'chat-title', type: String })
chatTitle: string = 'Chat';
```

### Pattern 2: Conditional Template Rendering
**What:** Use Lit's `nothing` sentinel or conditional expressions to show/hide optional UI elements (like subtitle).
**When to use:** When an element should only render if an attribute is provided.
**Example:**
```typescript
// Source: Existing codebase pattern (renderAttributeOverrides)
${subtitle ? html`<span class="header-subtitle">${subtitle}</span>` : nothing}
```

### Pattern 3: Greeting Injection on Connected Event
**What:** Move greeting message creation from `toggleOpen()` to the `connected` event handler inside `wireClientEvents()`.
**When to use:** When the greeting should appear after WebSocket connects rather than on panel open.
**Example:**
```typescript
// In ChatStore.wireClientEvents():
this.client.addEventListener('connected', () => {
  this.connectionState = 'connected';
  this.inputDisabled = false;
  // Inject greeting here instead of in toggleOpen()
  if (this.pendingGreeting && !this.greetingAdded) {
    this.greetingAdded = true;
    this.messages = [...this.messages, {
      id: crypto.randomUUID(),
      role: 'agent',
      content: this.pendingGreeting,
      timestamp: Date.now(),
    }];
  }
  this.host.requestUpdate();
});
```

### Anti-Patterns to Avoid
- **Keeping `override title`:** The `override` keyword on `title` overrides HTMLElement.title, which the browser uses for tooltips. Must be removed entirely, not just renamed.
- **Sending greeting to server:** The greeting is a local-only agent message. It must never be sent via `this.client.send()`.
- **Greeting on every reconnect:** The `greetingAdded` flag must persist across reconnections. If the user disconnects and reconnects (new conversation), the flag should be reset. But during normal reconnection (server-initiated), it should not add a duplicate greeting.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Attribute reflection | Manual `attributeChangedCallback` | Lit `@property({ attribute: 'chat-title' })` | Lit handles conversion, observation, and re-render |
| Tooltip suppression | `removeAttribute('title')` hacks | Rename property away from `title` | Clean fix; `chat-title` is not a native HTML attribute |
| Conditional rendering | `display: none` CSS | Lit `nothing` sentinel | No DOM node created at all when subtitle is empty |

## Common Pitfalls

### Pitfall 1: Native Title Tooltip Leaking
**What goes wrong:** If the old `title` property is still declared with `override`, the browser renders a tooltip on hover showing the title text.
**Why it happens:** `HTMLElement.title` is a standard DOM property that browsers use for tooltip rendering.
**How to avoid:** Remove the `override title` declaration entirely. Use a new property name `chatTitle` with `attribute: 'chat-title'`.
**Warning signs:** Hovering over any part of the widget shows a browser tooltip.

### Pitfall 2: Greeting Displays Before Connection
**What goes wrong:** If greeting is injected on panel open (current behavior), users see an agent message before the WebSocket connects.
**Why it happens:** Current code adds greeting in `toggleOpen()` which fires before `connect()`.
**How to avoid:** Store the greeting text in ChatStore, inject it in the `connected` event handler.
**Warning signs:** Greeting appears immediately on panel open before the connecting state.

### Pitfall 3: Breaking Change Without Test Updates
**What goes wrong:** Existing tests reference `title` attribute. After rename, tests still pass because `title` falls through to HTMLElement.title, but the header shows default "Chat" instead.
**Why it happens:** `title` is a valid HTMLElement property -- setting it doesn't throw an error, it just doesn't reach the widget's render.
**How to avoid:** Update all tests and playground references from `title` to `chat-title`. Search for all `title` references.
**Warning signs:** Tests pass but widget displays "Chat" instead of the configured title.

### Pitfall 4: Greeting Duplicated on New Conversation
**What goes wrong:** When user clicks "Start new conversation", `handleNewConversation()` calls `disconnect()` then `connect()`. If `greetingAdded` isn't reset, no greeting appears on the new conversation.
**Why it happens:** The flag persists but messages are cleared.
**How to avoid:** Reset `greetingAdded` in `disconnect()` or when messages are cleared for new conversation. The greeting should re-appear in a new conversation.
**Warning signs:** First conversation has greeting, subsequent ones don't.

## Code Examples

### Current renderHeader Signature
```typescript
// Source: src/components/chat-header.ts
export function renderHeader(
  title: string,
  onClose: () => void,
): TemplateResult
```

### Updated renderHeader (target implementation)
```typescript
export function renderHeader(
  title: string,
  subtitle: string,
  onClose: () => void,
): TemplateResult {
  return html`
    <header class="chat-header" part="header">
      <div class="header-title-group">
        <span class="header-title">${title}</span>
        ${subtitle ? html`<span class="header-subtitle">${subtitle}</span>` : nothing}
      </div>
      <span class="header-badge">Powered by AI</span>
      <button class="header-close" @click=${onClose} aria-label="Close chat">
        ${closeIcon}
      </button>
    </header>
  `;
}
```

### Property Declaration Changes
```typescript
// REMOVE:
@property({ type: String })
override title: string = 'Chat';

// ADD:
@property({ attribute: 'chat-title', type: String })
chatTitle: string = 'Chat';

@property({ attribute: 'chat-subtitle', type: String })
chatSubtitle: string = '';
```

### Updated render() Call
```typescript
${renderHeader(this.chatTitle, this.chatSubtitle, () => this.handleClose())}
```

### Subtitle Styles
```css
.header-title-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.header-subtitle {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}
```

### ChatStore Greeting Changes
```typescript
// Store greeting text for post-connect injection
private pendingGreeting = '';

// Called from widget's handleOpen
setGreeting(greeting: string): void {
  this.pendingGreeting = greeting;
}

// In wireClientEvents, connected handler:
if (this.pendingGreeting && !this.greetingAdded) {
  this.greetingAdded = true;
  this.messages = [...this.messages, {
    id: crypto.randomUUID(),
    role: 'agent',
    content: this.pendingGreeting,
    timestamp: Date.now(),
  }];
}

// In disconnect (for new conversation reset):
// Reset greetingAdded so new conversations get the greeting again
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `override title` on HTMLElement | Custom attribute name (`chat-title`) | This phase | Eliminates native tooltip conflict |
| Greeting on panel open | Greeting on WebSocket connect | This phase | Better UX -- greeting matches agent availability |

## Open Questions

1. **Should greeting re-appear on "New Conversation"?**
   - What we know: Current `handleNewConversation()` clears messages and reconnects. `greetingAdded` flag would block re-display.
   - What's unclear: The requirement says "after WebSocket connects" which implies yes.
   - Recommendation: Reset `greetingAdded` when starting a new conversation. The greeting should appear in each fresh conversation.

2. **Should `toggleOpen` still receive the greeting parameter?**
   - What we know: Current API passes greeting through `toggleOpen(this.greeting)`.
   - What's unclear: Whether to keep this API or store the greeting differently.
   - Recommendation: Store greeting on ChatStore directly (e.g. `this.store.greeting = this.greeting` in `connectedCallback` or via a setter), remove it from `toggleOpen()` parameter. Simpler API.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x with happy-dom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CUST-01 | Setting `chat-title="Support"` changes visible header title | unit | `npx vitest run src/work1-chat-widget.test.ts -t "chat-title"` | Needs new test |
| CUST-02 | No native browser tooltip on hover (title property not set) | unit | `npx vitest run src/work1-chat-widget.test.ts -t "tooltip"` | Needs new test |
| CUST-03 | Setting `chat-subtitle` displays subtitle text below title | unit | `npx vitest run src/work1-chat-widget.test.ts -t "subtitle"` | Needs new test |
| CUST-04 | Greeting displays as agent message after WebSocket connects, not sent to server | unit | `npx vitest run src/chat-store.test.ts -t "greeting"` | Existing tests need update |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Update existing greeting tests in `src/chat-store.test.ts` to test post-connect timing instead of toggle-open timing
- [ ] Add new tests in `src/work1-chat-widget.test.ts` for `chat-title`, `chat-subtitle`, and tooltip absence
- [ ] No new framework or fixture files needed -- existing test infrastructure is sufficient

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/work1-chat-widget.ts` -- current property declarations, render method, handleOpen/handleClose
- Codebase inspection: `src/components/chat-header.ts` -- current renderHeader signature and template
- Codebase inspection: `src/chat-store.ts` -- current greeting logic in toggleOpen(), wireClientEvents()
- Codebase inspection: `src/styles/panel.styles.ts` -- current header styles
- Codebase inspection: `src/work1-chat-widget.test.ts` -- existing test patterns
- Codebase inspection: `src/chat-store.test.ts` -- existing greeting tests

### Secondary (MEDIUM confidence)
- Lit documentation: `@property` decorator `attribute` option for custom attribute names (well-established pattern)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all Lit patterns well-established
- Architecture: HIGH - changes are within existing files and patterns
- Pitfalls: HIGH - identified from direct codebase analysis (title override, greeting timing, test breakage)

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable -- no external dependencies changing)
