# Phase 11: Connection Status & Branding - Research

**Researched:** 2026-03-08
**Domain:** Lit Web Component UI -- status indicator and branding link
**Confidence:** HIGH

## Summary

Phase 11 adds two small, self-contained features to the existing chat widget: (1) a colored dot in the header that reflects WebSocket connection state, and (2) an updated branding badge that reads "Powered by work1.ai" and links to https://work1.ai.

Both features build on infrastructure that already exists. The `ChatStore` already tracks `connectionState` as a reactive property with values `'disconnected' | 'connecting' | 'connected' | 'reconnecting'`. The header already renders a `<span class="header-badge">Powered by AI</span>`. The work is purely presentational -- no new state management, no new dependencies.

**Primary recommendation:** Implement both features in a single plan. Pass `connectionState` into `renderHeader()`, add a status dot element with color driven by a class map, change the badge to an `<a>` tag, and add corresponding CSS. No new libraries needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONN-01 | Green dot when WebSocket is connected | `connectionState === 'connected'` already tracked in ChatStore; map to `.status-dot--connected` CSS class with green background |
| CONN-02 | Yellow dot when WebSocket is connecting | `connectionState === 'connecting'` already tracked; map to `.status-dot--connecting` CSS class with yellow background |
| CONN-03 | Red dot when WebSocket is disconnected | `connectionState === 'disconnected'` already tracked; map to `.status-dot--disconnected` CSS class with red background |
| BRAND-01 | Badge reads "Powered by work1.ai" | Change static text in `renderHeader()` from "Powered by AI" to "Powered by work1.ai" |
| BRAND-02 | Badge links to https://work1.ai in new tab | Change `<span class="header-badge">` to `<a class="header-badge" href="https://work1.ai" target="_blank" rel="noopener noreferrer">` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Lit | 3.x | Web Component framework | Already used throughout the project |
| lit/directives/class-map | 3.x | Conditional CSS classes | Already imported in chat-panel.ts |

### Supporting

No new libraries needed. This phase uses only existing dependencies.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS class-based dot colors | Inline style binding with color var | Class-based is consistent with existing codebase patterns and more readable |
| `<a>` tag for badge link | `@click` handler with `window.open()` | Native `<a>` is more accessible, supports right-click/middle-click, no JS needed |

## Architecture Patterns

### Current Header Structure
```
chat-header.ts: renderHeader(title, subtitle, onClose) -> TemplateResult
```

### Target Header Structure
```
chat-header.ts: renderHeader(title, subtitle, connectionState, onClose) -> TemplateResult
```

### Pattern 1: Status Dot via Class Map
**What:** Use Lit's `classMap` directive to set the dot color class based on `connectionState`
**When to use:** Whenever mapping discrete state values to CSS classes
**Example:**
```typescript
import { classMap } from 'lit/directives/class-map.js';

const dotClasses = classMap({
  'status-dot': true,
  'status-dot--connected': connectionState === 'connected',
  'status-dot--connecting': connectionState === 'connecting',
  'status-dot--disconnected': connectionState === 'disconnected' || connectionState === 'reconnecting',
});

html`<span class=${dotClasses} aria-label=${statusLabel}></span>`;
```

### Pattern 2: Branding Badge as Link
**What:** Replace `<span>` with `<a>` for the badge, preserving existing styles
**When to use:** When badge needs to be clickable
**Example:**
```typescript
html`<a class="header-badge" href="https://work1.ai" target="_blank" rel="noopener noreferrer">Powered by work1.ai</a>`;
```

### Anti-Patterns to Avoid
- **Inline styles for dot color:** Use CSS classes, not `style="background: green"`. The codebase consistently uses class-based styling.
- **JavaScript-driven navigation for badge:** Use a native `<a>` tag. It is more accessible and handles middle-click, right-click context menu, etc.
- **Separate component for status dot:** A single `<span>` with a class is sufficient. Creating a new Lit component would be over-engineering.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional CSS classes | String concatenation | `classMap` from Lit | Already used in codebase, handles edge cases |

**Key insight:** This phase is small enough that no external solutions are needed beyond what Lit provides.

## Common Pitfalls

### Pitfall 1: Forgetting `reconnecting` State
**What goes wrong:** The `ConnectionState` type includes `'reconnecting'` in addition to `'disconnected'`, `'connecting'`, and `'connected'`. If not handled, the dot shows no color during reconnection.
**Why it happens:** Requirements only mention three states but the type has four.
**How to avoid:** Map `'reconnecting'` to the same visual as `'connecting'` (yellow dot) or `'disconnected'` (red dot). Yellow is more appropriate since reconnection is an active attempt.
**Warning signs:** Status dot disappears or shows wrong color when connection drops and auto-reconnects.

### Pitfall 2: Badge Link Styling in Shadow DOM
**What goes wrong:** Changing `<span>` to `<a>` introduces default browser link styles (blue, underline) that override the existing badge appearance.
**Why it happens:** Shadow DOM still applies browser default styles for `<a>` tags.
**How to avoid:** Add explicit CSS for `.header-badge` as an `<a>` element: `color: inherit; text-decoration: none;`.

### Pitfall 3: Accessibility of Status Dot
**What goes wrong:** A purely visual dot conveys no information to screen readers.
**Why it happens:** Decorative elements are invisible to assistive technology by default.
**How to avoid:** Add `aria-label` to the dot element (e.g., "Connected", "Connecting", "Disconnected"). Alternatively use `role="status"` with `aria-live="polite"` so state changes are announced.

### Pitfall 4: Badge Link Security
**What goes wrong:** Opening external links without `rel="noopener noreferrer"` can expose the parent page to `window.opener` attacks.
**Why it happens:** Easy to forget `rel` attribute on external links.
**How to avoid:** Always include `rel="noopener noreferrer"` on links with `target="_blank"`.

## Code Examples

### Existing: renderHeader signature (chat-header.ts)
```typescript
export function renderHeader(
  title: string,
  subtitle: string,
  onClose: () => void,
): TemplateResult
```

### Existing: Header call site (work1-chat-widget.ts, line 150)
```typescript
renderHeader(this.chatTitle, this.chatSubtitle, () => this.handleClose())
```

### Existing: ConnectionState type (chat-store.types.ts)
```typescript
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';
```

### Existing: connectionState in ChatStore (chat-store.ts)
```typescript
connectionState: ConnectionState = 'disconnected';
```
The store already updates this reactively on every connection event (`connected`, `disconnected`, `rejected`, `reconnecting`), and calls `host.requestUpdate()` each time.

### Target: Updated renderHeader
```typescript
import { classMap } from 'lit/directives/class-map.js';
import type { ConnectionState } from '../chat-store.types.js';

export function renderHeader(
  title: string,
  subtitle: string,
  connectionState: ConnectionState,
  onClose: () => void,
): TemplateResult {
  const dotClasses = classMap({
    'status-dot': true,
    'status-dot--connected': connectionState === 'connected',
    'status-dot--connecting': connectionState === 'connecting' || connectionState === 'reconnecting',
    'status-dot--disconnected': connectionState === 'disconnected',
  });

  const statusLabels: Record<ConnectionState, string> = {
    connected: 'Connected',
    connecting: 'Connecting',
    reconnecting: 'Reconnecting',
    disconnected: 'Disconnected',
  };

  return html`
    <header class="chat-header" part="header">
      <div class="header-title-group">
        <span class="header-title">
          <span class=${dotClasses} aria-label=${statusLabels[connectionState]}></span>
          ${title}
        </span>
        ${subtitle ? html`<span class="header-subtitle">${subtitle}</span>` : nothing}
      </div>
      <a class="header-badge" href="https://work1.ai" target="_blank" rel="noopener noreferrer">Powered by work1.ai</a>
      <button class="header-close" @click=${onClose} aria-label="Close chat">
        ${closeIcon}
      </button>
    </header>
  `;
}
```

### Target: Status Dot CSS (in panel.styles.ts)
```css
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
  flex-shrink: 0;
}

.status-dot--connected {
  background-color: #22c55e; /* green */
}

.status-dot--connecting {
  background-color: #eab308; /* yellow */
}

.status-dot--disconnected {
  background-color: #ef4444; /* red */
}
```

### Target: Badge Link CSS Override (in panel.styles.ts)
```css
a.header-badge {
  color: inherit;
  text-decoration: none;
}

a.header-badge:hover {
  text-decoration: underline;
}
```

### Target: Updated Call Site (work1-chat-widget.ts)
```typescript
renderHeader(this.chatTitle, this.chatSubtitle, this.store.connectionState, () => this.handleClose())
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static "Powered by AI" text | Will become "Powered by work1.ai" link | Phase 11 | Branding update |
| No connection feedback | Status dot in header | Phase 11 | User sees connection state |

## Open Questions

None. This phase is well-defined with clear requirements and all necessary infrastructure already in place.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (happy-dom environment) |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONN-01 | Green dot when connected | unit | `npx vitest run src/work1-chat-widget.test.ts -t "connected.*status-dot"` | Will add to existing test file |
| CONN-02 | Yellow dot when connecting | unit | `npx vitest run src/work1-chat-widget.test.ts -t "connecting.*status-dot"` | Will add to existing test file |
| CONN-03 | Red dot when disconnected | unit | `npx vitest run src/work1-chat-widget.test.ts -t "disconnected.*status-dot"` | Will add to existing test file |
| BRAND-01 | Badge reads "Powered by work1.ai" | unit | `npx vitest run src/work1-chat-widget.test.ts -t "Powered by work1"` | Will add to existing test file |
| BRAND-02 | Badge links to https://work1.ai | unit | `npx vitest run src/work1-chat-widget.test.ts -t "work1.ai.*link"` | Will add to existing test file |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. Tests will be added to the existing `work1-chat-widget.test.ts` file.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `src/components/chat-header.ts`, `src/chat-store.ts`, `src/chat-store.types.ts`, `src/work1-chat-widget.ts`, `src/styles/panel.styles.ts`
- Lit documentation on `classMap` directive (already used in `chat-panel.ts`)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, uses existing Lit patterns
- Architecture: HIGH - Minimal changes to existing function signatures, clear mapping from state to UI
- Pitfalls: HIGH - Standard web development concerns (link styling, accessibility, security attributes)

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable -- no external dependencies to shift)
