# Phase 9: Control Panel - Research

**Researched:** 2026-03-07
**Domain:** Lit web components, CSS custom properties, playground developer tooling
**Confidence:** HIGH

## Summary

Phase 9 builds a `<playground-controls>` Lit web component that acts as a sidebar control panel in the playground page. It manipulates the `<work1-chat-widget>` element via DOM attributes and CSS custom properties to provide real-time theming, layout, connection switching, and mock scenario triggering.

The implementation is straightforward: no new dependencies are needed. The widget already exposes all necessary extension points (attributes for position/width/height/bubble-icon, CSS custom properties for colors, `_wsConstructor` for mock injection, and `handleNewConversation()` pattern for reconnection). The MockWebSocket class from Phase 8 provides `triggerScenario(name)` with all required scenario types. The control panel simply needs to wire HTML form controls to these existing APIs.

**Primary recommendation:** Build a single `<playground-controls>` Lit component with accordion sections that directly manipulate the widget DOM element. Use native HTML inputs (`<input type="color">`, `<input type="range">`, radio buttons, toggle switches) -- no UI library needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fixed left sidebar, always visible -- widget floats in the remaining right area
- Not collapsible -- dev controls are the purpose of this page
- Accordion sections within the sidebar: Theme, Connection, Scenarios -- all expanded by default, individually collapsible
- Built as a Lit web component (`<playground-controls>`) -- consistent with widget technology
- Color pickers using native `<input type="color">` for each color property
- Controls set CSS custom properties on the widget element (--w1-accent-color, --w1-bg, --w1-text-color, etc.)
- Widget position controlled via toggle switch or radio: Bottom-right / Bottom-left (sets `position` attribute)
- Width and height via text inputs or sliders (sets `width` and `height` attributes)
- Bubble icon via text input (sets `bubble-icon` attribute)
- Reset button per section -- restores all controls in that section to defaults
- Toggle switch for Mock / Real mode
- When Real is selected, a URL input field appears below the toggle
- Switching mode: auto-disconnect, clear all chat messages, auto-reconnect with new mode
- Auto-connect on toggle -- no manual Connect button needed
- Status badge next to connection section header: green dot = connected, yellow = connecting, red = disconnected
- After disconnect scenarios, a 'Reconnect' button appears in the connection section
- Scenario buttons grouped by type: Content (Greeting, Long Markdown) and Error/State (Protocol Error, Connection Rejected, Unexpected Disconnect, Session End)
- Color-coded: content buttons neutral/blue, error buttons red/orange tint
- Buttons disabled when not in mock mode
- Each button calls `MockWebSocket.instance.triggerScenario(name)`

### Claude's Discretion
- Exact sidebar width
- Accordion animation/transition style
- Specific CSS custom property names beyond --w1-accent-color (discover from widget styles)
- Slider vs text input for dimensions
- Exact button styling and spacing
- Lit component internal structure and state management

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CTRL-01 | Developer can change theme colors (primary, background, text) at runtime via control panel | Widget uses 10 CSS custom properties (see full list below); color pickers set these on the widget element |
| CTRL-02 | Developer can change widget position (bottom-left, bottom-right) at runtime | Widget reads `position` attribute; control panel sets `widget.setAttribute('position', value)` |
| CTRL-03 | Developer can adjust widget dimensions (width, height) at runtime | Widget reads `width`/`height` attributes which map to --w1-panel-width/--w1-panel-height via renderAttributeOverrides() |
| CTRL-04 | Developer can set a custom bubble icon at runtime | Widget reads `bubble-icon` attribute; text input sets it |
| CONN-01 | Developer can enter a WebSocket URL to connect to a real backend | Text input for URL; on mode switch to Real, sets `server-url` attribute and triggers reconnect |
| CONN-02 | Developer can toggle between mock and real WebSocket connection | Toggle sets/clears `_wsConstructor`; reconnect cycle: disconnect, clear messages, connect |
| MOCK-06 | Developer can trigger specific scenarios via buttons in control panel | Buttons call `MockWebSocket.instance.triggerScenario(name)` -- API exists from Phase 8 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | ^3.3.0 | Web component framework | Already project dependency; control panel is a Lit component |

### Supporting
No additional libraries needed. Native HTML form elements provide all required controls.

| Element | Purpose | When to Use |
|---------|---------|-------------|
| `<input type="color">` | Color pickers | Theme color controls |
| `<input type="range">` | Dimension sliders | Width/height controls |
| `<input type="text">` | URL/icon inputs | Connection URL, bubble icon |
| `<input type="radio">` | Position toggle | Bottom-right/bottom-left |
| `<button>` | Scenario triggers, reset | Scenario buttons, section reset |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native color input | Third-party color picker | Not needed -- native picker is sufficient for dev tooling |
| Custom toggle | Lit checkbox | CSS-styled checkbox as toggle is simpler, no extra components |

## Architecture Patterns

### Recommended Project Structure
```
playground/
├── index.html           # Layout with sidebar + widget (MODIFY)
├── controls.ts          # <playground-controls> Lit component (NEW)
├── mock-ws.ts           # MockWebSocket class (EXISTS)
└── scenarios.ts         # Canned scenario content (EXISTS)
```

### Pattern 1: Direct DOM Manipulation of Widget Element
**What:** The control panel holds a reference to the `<work1-chat-widget>` DOM element and manipulates it directly via attributes, CSS custom properties, and public properties.
**When to use:** Always -- this is the primary interaction pattern.
**Example:**
```typescript
// Reference to widget element
private widgetEl: Work1ChatWidget | null = null;

// Theme: set CSS custom property directly on widget element
private onColorChange(prop: string, value: string) {
  this.widgetEl?.style.setProperty(prop, value);
}

// Layout: set attribute on widget element
private onPositionChange(pos: string) {
  this.widgetEl?.setAttribute('position', pos);
}

// Dimensions: set attribute (renderAttributeOverrides maps to CSS var)
private onWidthChange(value: string) {
  this.widgetEl?.setAttribute('width', value);
}
```

### Pattern 2: Connection Mode Switching
**What:** Toggle between mock and real WebSocket by manipulating `_wsConstructor` and triggering reconnect.
**When to use:** CONN-01, CONN-02 implementation.
**Example:**
```typescript
private switchMode(mode: 'mock' | 'real') {
  const widget = this.widgetEl!;

  // 1. Disconnect current connection
  // Access store indirectly through widget's handleNewConversation pattern
  // or call disconnect + reconnect

  // 2. Set constructor based on mode
  if (mode === 'mock') {
    widget._wsConstructor = MockWebSocket;
    widget.setAttribute('server-url', 'ws://mock');
  } else {
    widget._wsConstructor = undefined; // Use native WebSocket
    widget.setAttribute('server-url', this.realUrl);
  }

  // 3. Trigger reconnection (clears messages + connects)
  // Widget's handleNewConversation() does: disconnect, clear messages, connect
  (widget as any).handleNewConversation();
}
```

### Pattern 3: Connection State Observation
**What:** Listen to widget's w1-connected/w1-disconnected events to update status badge.
**When to use:** Status badge display.
**Example:**
```typescript
connectedCallback() {
  super.connectedCallback();
  this.widgetEl?.addEventListener('w1-connected', () => {
    this.connectionStatus = 'connected';
  });
  this.widgetEl?.addEventListener('w1-disconnected', () => {
    this.connectionStatus = 'disconnected';
  });
}
```

### Pattern 4: Accordion Sections
**What:** Collapsible sections using native `<details>/<summary>` or Lit reactive state.
**When to use:** Theme, Connection, Scenarios section organization.
**Recommendation:** Use `<details open>` for semantic, zero-JS accordions. All open by default.
```html
<details open>
  <summary>Theme</summary>
  <!-- controls -->
</details>
```

### Anti-Patterns to Avoid
- **Modifying widget internals:** Never reach into shadow DOM or private properties. Use only public attributes, CSS custom properties, `_wsConstructor`, and DOM events.
- **Rebuilding widget element:** Don't remove/re-add the widget to change settings. Set attributes/properties on the existing element.
- **Polling for state:** Don't poll `store.connectionState`. Listen for w1-connected/w1-disconnected events dispatched by the widget.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color picker | Custom color picker component | `<input type="color">` | Native picker is feature-complete for dev tooling |
| Toggle switch | Complex toggle component | CSS-styled `<input type="checkbox">` | 10 lines of CSS achieves the visual |
| Accordion | Custom collapsible component | `<details>/<summary>` elements | Native, accessible, zero JS |
| Form state management | Reactive form library | Lit `@state()` decorators | Simple enough for direct state |

**Key insight:** This is developer tooling, not user-facing UI. Native HTML elements with minimal styling are preferred over polished custom components.

## Common Pitfalls

### Pitfall 1: CSS Custom Properties on Wrong Target
**What goes wrong:** Setting `--w1-accent-color` on the control panel or on `document.body` instead of on the widget element itself.
**Why it happens:** CSS custom properties inherit, so setting on a parent can work, but the widget's shadow DOM styles use `var()` with fallbacks that resolve on the `:host` element.
**How to avoid:** Always call `widgetEl.style.setProperty('--w1-accent-color', value)` on the widget element directly.
**Warning signs:** Color changes don't take effect, or affect all elements on the page.

### Pitfall 2: handleNewConversation() Is Private
**What goes wrong:** Trying to call `widget.handleNewConversation()` from the control panel but TypeScript rejects it as private.
**Why it happens:** The method exists on the widget class but is called from a `private` context.
**How to avoid:** Either: (a) cast to `any` for playground-only code, (b) use `widget.store` access (also private), or (c) replicate the pattern: call disconnect on the store, clear messages, call connect. The simplest approach for playground code is to expose a public method or cast since this is dev tooling. Alternatively, manipulate via the existing "New Conversation" button mechanism or directly call the sequence: set attributes, remove old widget, append new one (least recommended).
**Recommended approach:** Add a thin public reconnect method on the widget, or use `(widget as any).handleNewConversation()` since this is playground-only code not shipped to production.

### Pitfall 3: MockWebSocket.instance Is Null After Disconnect
**What goes wrong:** After a disconnect scenario (error-rejected, error-disconnect, session-end), `MockWebSocket.instance` still references the old closed instance. Triggering a new scenario on it fails silently.
**Why it happens:** `triggerScenario` checks `readyState !== OPEN` for streaming but not for emit/close scenarios. After disconnect, the instance is CLOSED.
**How to avoid:** Disable scenario buttons when not connected (already planned). After reconnect, `MockWebSocket.instance` is refreshed because the constructor sets `MockWebSocket.instance = this`.

### Pitfall 4: Color Input Returns Hex Without Hash Context
**What goes wrong:** `<input type="color">` always returns a 7-character hex string like `#ff0000`. This is fine for CSS custom properties but the widget's `primary-color` attribute also expects a CSS color value.
**Why it happens:** Non-issue actually -- hex is valid CSS color. Just be aware the value is always lowercase hex.
**How to avoid:** Use the value directly. No conversion needed.

### Pitfall 5: Widget Position Attribute vs CSS
**What goes wrong:** Setting `position` attribute to `bottom-left` but the widget doesn't move.
**Why it happens:** The `position` attribute only controls CSS class selection (`.bubble--right` vs `.bubble--left` and `.chat-panel--right` vs `.chat-panel--left`). It works correctly as long as the attribute value matches expected strings.
**How to avoid:** Use exact strings: `'bottom-right'` or `'bottom-left'`.

## Code Examples

### Complete CSS Custom Property Map
Discovered from the widget's style files -- these are ALL the `--w1-*` properties the control panel can target:

```typescript
// Source: grep across src/styles/*.ts
const CSS_CUSTOM_PROPERTIES = {
  // Accent / Primary
  '--w1-accent-color':    { default: '#0066FF', label: 'Accent Color',     type: 'color' },

  // Panel
  '--w1-panel-bg':        { default: '#ffffff', label: 'Panel Background', type: 'color' },
  '--w1-panel-width':     { default: '380px',   label: 'Panel Width',      type: 'dimension' },
  '--w1-panel-height':    { default: '560px',   label: 'Panel Height',     type: 'dimension' },

  // Messages
  '--w1-user-bg':         { default: '#0066FF', label: 'User Bubble BG',   type: 'color' },  // falls back to accent
  '--w1-agent-bg':        { default: '#f0f0f0', label: 'Agent Bubble BG',  type: 'color' },
  '--w1-agent-color':     { default: '#1a1a1a', label: 'Agent Text Color', type: 'color' },

  // Input
  '--w1-border-color':    { default: '#e5e5e5', label: 'Border Color',     type: 'color' },
  '--w1-input-bg':        { default: '#ffffff', label: 'Input Area BG',    type: 'color' },
  '--w1-input-field-bg':  { default: '#f8f8f8', label: 'Input Field BG',   type: 'color' },

  // Error / Status
  '--w1-error-color':     { default: '#dc3545', label: 'Error Text Color', type: 'color' },
  '--w1-error-bg':        { default: '#fef2f2', label: 'Error BG',         type: 'color' },
};
```

### Scenario Button Configuration
```typescript
// Source: playground/mock-ws.ts triggerScenario() switch cases
const SCENARIOS = {
  content: [
    { name: 'greeting',          label: 'Greeting',               color: 'neutral' },
    { name: 'long-markdown',     label: 'Long Markdown',          color: 'neutral' },
  ],
  errors: [
    { name: 'error-protocol',    label: 'Protocol Error',         color: 'danger' },
    { name: 'error-rejected',    label: 'Connection Rejected',    color: 'danger' },
    { name: 'error-disconnect',  label: 'Unexpected Disconnect',  color: 'danger' },
    { name: 'session-end',       label: 'Session End',            color: 'warning' },
  ],
};
```

### Sidebar Layout Pattern
```html
<!-- playground/index.html structure -->
<body>
  <div class="playground-layout">
    <aside class="playground-sidebar">
      <playground-controls></playground-controls>
    </aside>
    <main class="playground-main">
      <work1-chat-widget></work1-chat-widget>
    </main>
  </div>
</body>
```

```css
.playground-layout {
  display: flex;
  height: 100vh;
}
.playground-sidebar {
  width: 320px;        /* Claude's discretion: 300-360px reasonable */
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid #e5e5e5;
  background: #fafafa;
}
.playground-main {
  flex: 1;
  position: relative;  /* Widget uses position: fixed, so this is just the visual area */
}
```

### Toggle Switch CSS Pattern
```css
/* Pure CSS toggle switch from checkbox */
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  inset: 0;
  background: #ccc;
  border-radius: 24px;
  cursor: pointer;
  transition: background 200ms;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 200ms;
}
input:checked + .toggle-slider {
  background: #0066FF;
}
input:checked + .toggle-slider::before {
  transform: translateX(20px);
}
```

### Connection State Badge
```typescript
// Status indicator dot
private renderStatusBadge() {
  const colors = {
    connected: '#22c55e',     // green
    connecting: '#eab308',    // yellow
    reconnecting: '#eab308',  // yellow
    disconnected: '#ef4444',  // red
  };
  const color = colors[this.connectionStatus] || colors.disconnected;
  return html`<span class="status-dot" style="background:${color}"></span>`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Storybook for component dev | Custom playground page | v0.2 decision | Simpler, more tailored to widget needs |
| Console-based scenario triggering | UI control panel (this phase) | Phase 9 | Much better developer experience |
| Manual URL editing for backend switching | Toggle + URL input | Phase 9 | Instant mode switching |

## Open Questions

1. **Accessing widget's private handleNewConversation()**
   - What we know: The method is private on the class, but accessible via `(widget as any)` in JS
   - What's unclear: Whether to cast to any or add a public method
   - Recommendation: Use `(widget as any).handleNewConversation()` in playground code -- it's dev-only, never shipped. Adding a public API method for this is overkill for the playground.

2. **Connection state observation mechanism**
   - What we know: Widget dispatches `w1-connected` and `w1-disconnected` DOM events. ConnectionState includes 'connecting' and 'reconnecting'.
   - What's unclear: No DOM event for 'connecting' state -- only 'connected' and 'disconnected' are dispatched.
   - Recommendation: Set `connectionStatus = 'connecting'` immediately when initiating connect from the control panel. Listen for w1-connected/w1-disconnected to update to final state. This covers the practical case since the control panel initiates the action and knows when it starts.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^3.0.0 with happy-dom |
| Config file | vitest config in vite.config (implicit) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CTRL-01 | Color picker changes update widget CSS custom properties | unit | `npx vitest run tests/playground-controls.test.ts -t "theme color" -x` | No - Wave 0 |
| CTRL-02 | Position toggle updates widget position attribute | unit | `npx vitest run tests/playground-controls.test.ts -t "position" -x` | No - Wave 0 |
| CTRL-03 | Dimension inputs update widget width/height attributes | unit | `npx vitest run tests/playground-controls.test.ts -t "dimension" -x` | No - Wave 0 |
| CTRL-04 | Bubble icon input updates widget bubble-icon attribute | unit | `npx vitest run tests/playground-controls.test.ts -t "bubble-icon" -x` | No - Wave 0 |
| CONN-01 | URL input stores WebSocket URL for real mode | unit | `npx vitest run tests/playground-controls.test.ts -t "url" -x` | No - Wave 0 |
| CONN-02 | Mode toggle switches between mock/real WebSocket | unit | `npx vitest run tests/playground-controls.test.ts -t "mode" -x` | No - Wave 0 |
| MOCK-06 | Scenario buttons call triggerScenario on MockWebSocket | unit | `npx vitest run tests/playground-controls.test.ts -t "scenario" -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `tests/playground-controls.test.ts` -- unit tests for control panel component
- [ ] Test helpers for creating widget + controls in happy-dom environment

Note: Playground controls are dev-only UI. Testing the DOM manipulation (setAttribute, setProperty) is straightforward in happy-dom. Full integration testing (visual rendering, color picker interaction) is manual-only since it requires a real browser.

## Sources

### Primary (HIGH confidence)
- Source code analysis: `src/work1-chat-widget.ts` -- widget attributes, `_wsConstructor`, `handleNewConversation()`
- Source code analysis: `src/styles/*.ts` -- all 12 CSS custom properties discovered via grep
- Source code analysis: `playground/mock-ws.ts` -- `triggerScenario()` API, 6 scenario names
- Source code analysis: `src/chat-store.ts` -- `connect()`, `disconnect()`, `connectionState` types

### Secondary (MEDIUM confidence)
- Lit documentation (from training data) -- `@customElement`, `@state()`, `@property()`, reactive update patterns
- Native HTML elements -- `<input type="color">`, `<details>/<summary>` browser support is universal in modern browsers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Lit already in use, no new dependencies
- Architecture: HIGH -- all integration points verified in source code
- Pitfalls: HIGH -- identified from reading actual widget implementation
- CSS properties: HIGH -- exhaustive grep of all style files

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable -- no external dependencies involved)
