# Phase 4: Theming & Encapsulation - Research

**Researched:** 2026-03-04
**Domain:** CSS Custom Properties, Shadow DOM theming, Web Component encapsulation, CSP compliance
**Confidence:** HIGH

## Summary

Phase 4 formalizes and hardens the widget's theming API and security posture. The codebase already has a strong foundation: Shadow DOM via Lit, CSS custom properties with `var()` fallbacks throughout all 5 style files, 5 `part` attributes on key elements, no inline `style=""` attributes anywhere, and DOMPurify sanitization on markdown. The work is consolidation and normalization, not greenfield.

The existing ~15 CSS custom properties need auditing and normalizing into a clean `--w1-{component}-{property}` naming convention. The `--w1-accent-color` cascade (already used in 6 places) needs to be extended to cover all accent-colored elements consistently. A `primary-color` HTML attribute needs to be added following the existing dynamic `<style>` pattern from width/height overrides. Lucide icons will be hand-inlined as `svg` tagged template literals (no runtime dependency) for the bubble-icon feature.

**Primary recommendation:** Audit and consolidate existing CSS vars first, then layer on the `primary-color` attribute, bubble-icon feature, and security hardening -- all leveraging patterns already established in the codebase.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Colors only -- no font, spacing, or radius vars exposed
- Consolidate existing ~15 vars into clean `--w1-{component}-{property}` naming pattern
- Audit and normalize: remove redundant vars (e.g., --w1-input-field-bg vs --w1-input-bg), document final list as public API
- `--w1-accent-color` cascades to user bubbles, send button, links, new-conversation button -- set once, applies everywhere
- Individual component vars (--w1-user-bg, --w1-agent-bg, etc.) override the cascade
- No built-in dark mode -- customers set CSS vars themselves to create dark themes
- Add `primary-color` attribute (joins existing width, height, position)
- Attributes set CSS custom properties on `:host` at low specificity -- natural cascade means customer CSS vars override attribute values
- Extend existing dynamic `<style>` pattern from Phase 2 (width/height) to include primary-color -> --w1-accent-color
- Keep current 5 parts: header, panel, bubble, message-list, input
- No additional parts for message bubbles, send button, or close button in v1
- "Powered by AI" badge is NOT exposed as a part -- stays fixed and unstyled
- `bubble-icon` attribute accepts Lucide icon names (e.g., "message-circle", "help-circle", "headphones")
- Bundle 3-5 common Lucide icons as inline SVGs (~1-2KB impact): message-circle (default), help-circle, headphones, bot, sparkles
- `<slot name="bubble-icon">` available for fully custom HTML (customer's own SVG/img)
- Slot takes precedence over attribute when both provided
- Bubble icon only -- no header logo attribute in v1

### Claude's Discretion
- Exact list of CSS custom properties to consolidate (audit existing and normalize)
- Which 3-5 Lucide icons to bundle (suggestions above are starting point)
- CSP compliance implementation details
- Shadow DOM isolation hardening approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| THEM-01 | Widget exposes CSS custom properties for colors, fonts, sizes, border-radius | CSS var audit findings; consolidated naming convention; colors-only scope per user decision |
| THEM-02 | HTML attributes (primary-color, width, height, position) set default CSS custom property values | Existing dynamic `<style>` pattern (lines 152-157 of work1-chat-widget.ts); extend to primary-color |
| THEM-03 | CSS custom properties override attribute values when both are set | Natural CSS cascade -- `:host` style has low specificity, external CSS vars override automatically |
| THEM-04 | Widget exposes `::part()` selectors for deep styling of individual components | 5 parts already in place (header, panel, bubble, message-list, input); document as public API |
| THEM-05 | Custom bubble icon support via bubble-icon attribute (URL or built-in name) | Lucide inline SVG map pattern; slot fallback; icon registry in icons.ts |
| SEC-01 | All widget DOM and styles are inside Shadow DOM -- no leaking to host page | Already active via Lit; verify no light DOM leaks |
| SEC-02 | Host page CSS does not affect widget rendering | Shadow DOM provides this; verify no inherited property leaks |
| SEC-03 | Widget is CSP-compatible -- no inline styles via style="", no eval(), no inline scripts | No inline style="" found; dynamic `<style>` element is CSP-safe; Lit uses no eval() |
| SEC-04 | Markdown output is sanitized to prevent XSS from agent responses | DOMPurify already configured with strict allowlist in markdown.ts |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | ^3.3.0 | Web Component framework | Already in use; provides Shadow DOM, CSS tagged templates, reactive properties |
| dompurify | ^3.3.1 | XSS sanitization | Already in use; industry standard for HTML sanitization |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | - | - | No new dependencies needed for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline Lucide SVGs | `lucide` npm package | Would add ~200KB unpacked dependency for 5 icons; inline SVGs are ~1-2KB total |
| Hand-written icon SVGs | Lucide icon set | Lucide provides professionally designed, consistent stroke-based icons |

**Installation:**
```bash
# No new packages needed -- all tools already in place
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── styles/
│   ├── widget.styles.ts      # Root + bubble styles (audit vars)
│   ├── panel.styles.ts        # Panel + header styles (audit vars)
│   ├── messages.styles.ts     # Message bubble styles (audit vars)
│   ├── input.styles.ts        # Input area styles (audit vars)
│   └── streaming.styles.ts    # Streaming/typing styles (audit vars)
├── components/
│   ├── icons.ts               # Expand with Lucide icon map
│   ├── bubble-button.ts       # Add bubble-icon attribute + slot support
│   └── ...
├── markdown.ts                # Already has DOMPurify -- verify config
└── work1-chat-widget.ts       # Add primary-color property, extend dynamic style
```

### Pattern 1: CSS Custom Property Cascade with Accent Color
**What:** A single `--w1-accent-color` cascades to all accent-colored elements. Individual component vars override the cascade.
**When to use:** All accent-colored elements (user bubbles, send button, header, scroll pill, new-conversation button).
**Example:**
```typescript
// Source: Existing pattern in codebase, formalized
// In each style file, accent-colored elements use:
background: var(--w1-user-bg, var(--w1-accent-color, #0066FF));
// This means:
// 1. --w1-user-bg wins if set (component-level override)
// 2. --w1-accent-color wins if set (global accent)
// 3. #0066FF is the hardcoded fallback
```

### Pattern 2: HTML Attribute to CSS Custom Property via Dynamic Style
**What:** HTML attributes map to CSS custom properties on `:host` via a dynamic `<style>` element.
**When to use:** For the `primary-color` attribute (extending existing width/height pattern).
**Example:**
```typescript
// Source: Existing pattern at work1-chat-widget.ts:152-157
private renderAttributeOverrides() {
  const rules: string[] = [];
  if (this.width) rules.push(`--w1-panel-width: ${this.width}`);
  if (this.height) rules.push(`--w1-panel-height: ${this.height}`);
  if (this.primaryColor) rules.push(`--w1-accent-color: ${this.primaryColor}`);
  if (!rules.length) return nothing;
  return html`<style>:host { ${rules.join('; ')} }</style>`;
}
```

### Pattern 3: Lucide Icon Registry as Inline SVG Map
**What:** Bundle a small set of Lucide icons as Lit `svg` tagged template literals in a lookup map.
**When to use:** For the `bubble-icon` attribute feature.
**Example:**
```typescript
// Source: Pattern based on existing icons.ts approach
import { svg, type SVGTemplateResult } from 'lit';

// Lucide icons use stroke-based rendering (24x24 viewBox)
const lucideIcons: Record<string, SVGTemplateResult> = {
  'message-circle': svg`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg>`,
  'help-circle': svg`...`,
  'headphones': svg`...`,
  'bot': svg`...`,
  'sparkles': svg`...`,
};

export function getLucideIcon(name: string): SVGTemplateResult | null {
  return lucideIcons[name] ?? null;
}
```

### Pattern 4: Slot with Attribute Fallback
**What:** Named slot for fully custom icon HTML, with attribute-driven Lucide icon as fallback.
**When to use:** For bubble-icon customization.
**Example:**
```typescript
// In bubble-button.ts render:
html`
  <button class="bubble-button" part="bubble" @click=${onClick}>
    <slot name="bubble-icon">
      ${this.getIconFromAttribute(iconName)}
    </slot>
  </button>
`;
// Slot content (if provided by customer) automatically replaces the fallback
```

### Anti-Patterns to Avoid
- **Using inline `style=""` attributes:** Violates CSP. Use CSS custom properties or dynamic `<style>` elements instead. The existing codebase correctly avoids this -- keep it that way.
- **Exposing too many CSS custom properties:** Only expose color vars. Do not expose font, spacing, or radius vars per user decision.
- **Adding `part` attributes to everything:** Keep the current 5 parts. More parts = more API surface to maintain.
- **Using `:host` with high specificity:** Keep `:host` rules at base specificity so customer CSS custom properties naturally override attribute-driven values.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG icons | Custom icon drawing | Lucide SVG paths (hand-inlined) | Professional design, consistent stroke width, MIT licensed |
| XSS sanitization | Custom regex/string sanitizer | DOMPurify (already in use) | Edge cases in HTML parsing are endless; DOMPurify handles them all |
| Style encapsulation | Manual style scoping | Shadow DOM (already via Lit) | Browser-native isolation, no runtime cost |
| CSS property inheritance | Manual property forwarding | CSS custom properties with `var()` fallbacks | Native cascade handles override ordering automatically |

**Key insight:** This phase is about formalizing what already exists, not building new infrastructure. The codebase has the right patterns -- the work is auditing, normalizing, and documenting.

## Common Pitfalls

### Pitfall 1: CSS Custom Property Naming Inconsistency
**What goes wrong:** Properties named inconsistently (`--w1-input-field-bg` vs `--w1-input-bg`) confuse customers and create a messy public API.
**Why it happens:** Properties were added ad-hoc during Phase 2-3 development.
**How to avoid:** Audit ALL existing vars, create a definitive naming convention, normalize before documenting.
**Warning signs:** Multiple vars that control the same visual property; vars that don't follow `--w1-{component}-{property}` pattern.

### Pitfall 2: Accent Color Not Cascading to All Elements
**What goes wrong:** Customer sets `--w1-accent-color` but some elements (scroll pill, new-conversation button) still show the default blue.
**Why it happens:** Some elements use `--w1-accent-color` directly while others use a different var or hardcoded color.
**How to avoid:** Grep for all `#0066FF` and `#0066ff` occurrences and ensure they all go through `var(--w1-accent-color, #0066FF)`.
**Warning signs:** Any hardcoded hex color in style files that should respond to accent color.

### Pitfall 3: Lucide Icons Rendering as White-on-White
**What goes wrong:** Lucide icons use `stroke="currentColor"` with `fill="none"`, but existing chat bubble icon uses `fill="white"`. If the bubble button background is white, stroke icons are invisible.
**Why it happens:** Style difference between the existing fill-based icon and Lucide's stroke-based icons.
**How to avoid:** Set `color: white` on the bubble button (already done) so `currentColor` renders white strokes. Verify contrast on all accent colors.
**Warning signs:** Icons that disappear on certain background colors.

### Pitfall 4: Dynamic Style Element Creating CSP Violations
**What goes wrong:** The dynamic `<style>` element pattern (for attribute-to-CSS-var mapping) could theoretically trigger CSP `style-src` violations.
**Why it happens:** Some strict CSP policies block dynamically created `<style>` elements.
**How to avoid:** Lit's `adoptedStyleSheets` (used for static styles) is CSP-safe. Dynamic `<style>` elements inside Shadow DOM are generally CSP-safe because they're in an isolated DOM tree. However, very strict CSPs with `style-src 'none'` could block them. Document this limitation.
**Warning signs:** Console errors mentioning "Refused to apply inline style" in customer sites with strict CSP.

### Pitfall 5: Slot Not Taking Precedence Over Attribute
**What goes wrong:** Customer provides both a `bubble-icon` attribute and `<slot name="bubble-icon">` content, but the attribute-driven icon shows instead of the slot.
**Why it happens:** Implementation renders both or checks attribute before slot.
**How to avoid:** Use the browser's native slot mechanism -- `<slot>` automatically replaces fallback content when light DOM content is projected. Put the attribute-driven icon as the slot's fallback content.
**Warning signs:** Both icons rendering, or attribute icon overriding slot content.

### Pitfall 6: Inherited CSS Properties Leaking Through Shadow DOM
**What goes wrong:** Host page sets `font-family`, `color`, `line-height`, `font-size` etc. and these affect widget internals.
**Why it happens:** CSS inherited properties pass through Shadow DOM boundaries. Shadow DOM blocks non-inherited properties but NOT inherited ones.
**How to avoid:** Set explicit values for inherited properties on `:host` -- `font-family`, `font-size`, `line-height`, `color`, `letter-spacing`, `word-spacing`, `text-align`, `text-transform` should all have explicit defaults. The existing `:host` already sets `font-family`.
**Warning signs:** Widget text rendering differently on different host pages.

## Code Examples

### Current CSS Custom Properties Audit

Complete inventory of existing `--w1-*` vars found in the codebase:

```
# Accent/brand colors (used in 6 places):
--w1-accent-color       # #0066FF - bubble bg, header bg, user msg bg, send btn, scroll pill, new-conv btn, input focus

# Panel:
--w1-panel-width        # 380px
--w1-panel-height       # 560px
--w1-panel-bg           # #ffffff

# Messages:
--w1-agent-bg           # #f0f0f0
--w1-agent-color        # #1a1a1a (also used for streaming cursor, typing dots)
--w1-system-color       # #888 (system messages, status text)

# Input:
--w1-border-color       # #e5e5e5 (input wrapper border, textarea border)
--w1-input-bg           # #ffffff (input wrapper bg)
--w1-input-field-bg     # #f8f8f8 (textarea bg) <-- REDUNDANT, normalize
--w1-input-disabled-bg  # #f0f0f0

# Utility:
--w1-disabled-color     # #ccc (disabled send button)
--w1-muted-color        # #999 (byte counter)
--w1-error-color        # #dc3545 / #991b1b (byte counter over + error msg text)
--w1-error-bg           # #fef2f2 (error msg background)

TOTAL: 15 unique custom properties
```

### Recommended Consolidated Property List (Colors Only)

```
# Primary accent (set once, cascades everywhere):
--w1-accent-color       # Brand/accent color (default: #0066FF)

# Panel:
--w1-panel-bg           # Panel background (default: #ffffff)

# Messages:
--w1-user-bg            # User bubble bg (default: inherits --w1-accent-color)
--w1-agent-bg           # Agent bubble bg (default: #f0f0f0)
--w1-agent-color        # Agent bubble text color (default: #1a1a1a)

# Input:
--w1-input-bg           # Input area background (default: #ffffff)
--w1-input-field-bg     # Textarea background (default: #f8f8f8) [KEEP - distinct from wrapper]
--w1-border-color       # Borders (default: #e5e5e5)

# Semantic:
--w1-error-color        # Error text (default: #dc3545)
--w1-error-bg           # Error background (default: #fef2f2)

# Drop these -- too granular for v1 public API:
# --w1-system-color     -> hardcode or derive from --w1-agent-color
# --w1-disabled-color   -> hardcode
# --w1-muted-color      -> hardcode
# --w1-input-disabled-bg -> hardcode
# --w1-panel-width      -> keep but attribute-only, not public CSS var
# --w1-panel-height     -> keep but attribute-only, not public CSS var
```

### Dynamic Style Pattern Extension
```typescript
// Source: Extending existing work1-chat-widget.ts:152-157
@property({ attribute: 'primary-color' })
primaryColor: string = '';

private renderAttributeOverrides() {
  const rules: string[] = [];
  if (this.width) rules.push(`--w1-panel-width: ${this.width}`);
  if (this.height) rules.push(`--w1-panel-height: ${this.height}`);
  if (this.primaryColor) rules.push(`--w1-accent-color: ${this.primaryColor}`);
  if (!rules.length) return nothing;
  return html`<style>:host { ${rules.join('; ')} }</style>`;
}
```

### Accent Color Cascade Pattern
```typescript
// In messages.styles.ts -- user bubbles cascade from accent:
.message--user {
  background: var(--w1-user-bg, var(--w1-accent-color, #0066FF));
  color: white;
}

// This enables:
// 1. Set --w1-accent-color once -> all accent elements change
// 2. Set --w1-user-bg specifically -> only user bubbles change
```

### Bubble Icon with Slot Fallback
```typescript
// In bubble-button.ts
import { getLucideIcon } from './icons.js';

export function renderBubble(
  onClick: () => void,
  position: string,
  hidden: boolean = false,
  iconName: string = '',
): TemplateResult {
  const lucideIcon = iconName ? getLucideIcon(iconName) : null;
  const fallbackIcon = lucideIcon ?? chatBubbleIcon;

  return html`
    <button
      class="bubble-button bubble--${position}${hidden ? ' bubble--hidden' : ''}"
      part="bubble"
      aria-label="Open chat"
      @click=${onClick}
    >
      <slot name="bubble-icon">
        ${fallbackIcon}
      </slot>
    </button>
  `;
}
```

### Shadow DOM Inherited Property Reset
```typescript
// In widget.styles.ts -- harden against inherited properties leaking in
:host {
  display: block;
  position: fixed;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.45;
  color: #1a1a1a;
  letter-spacing: normal;
  word-spacing: normal;
  text-align: left;
  text-transform: none;
  -webkit-font-smoothing: antialiased;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS Modules / BEM scoping | Shadow DOM native encapsulation | Web Components standard | True isolation, no naming conflicts |
| JS-based theme objects | CSS custom properties | CSS Level 4 (widely supported) | No JS overhead, natural cascade |
| Inline `style=""` for overrides | Dynamic `<style>` elements in shadow root | CSP awareness | CSP-compatible, maintainable |
| External icon fonts (FontAwesome) | Inline SVG icons | Performance/bundle focus | No network requests, tree-shakeable |

**Deprecated/outdated:**
- `/deep/` and `::shadow` CSS selectors: Removed from browsers. Use `::part()` instead.
- `<style scoped>`: Never implemented widely. Shadow DOM replaces this.

## Open Questions

1. **Exact Lucide SVG path data for bundled icons**
   - What we know: `message-circle` path data was fetched successfully from GitHub raw. The other 4 icons (help-circle, headphones, bot, sparkles) need their SVG paths extracted from the Lucide repository.
   - What's unclear: Exact `d` attributes for 4 of 5 icons.
   - Recommendation: During implementation, fetch from `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/{name}.svg` or copy from the Lucide npm package source. This is a LOW-risk item -- the SVG data is static and well-documented.

2. **Dynamic `<style>` CSP edge cases**
   - What we know: Dynamic `<style>` in Shadow DOM is generally CSP-safe. Lit's `adoptedStyleSheets` is fully CSP-safe.
   - What's unclear: Whether extremely strict CSPs (`style-src 'none'`) would block dynamic `<style>` elements inside Shadow DOM.
   - Recommendation: Document as a known limitation. The vast majority of real-world CSP policies allow `style-src 'self'` or `'unsafe-inline'` which permits this pattern. If needed in future, Lit's `adoptedStyleSheets` can replace the dynamic `<style>` approach.

3. **Should --w1-panel-width and --w1-panel-height be public CSS vars?**
   - What we know: They exist and work. The user decision says "colors only" for exposed vars.
   - What's unclear: Whether width/height should remain as internal-only vars (set only via attributes) or be documented as public API.
   - Recommendation: Keep them as implementation detail -- customers use `width` and `height` HTML attributes. Don't document as public CSS API per the "colors only" decision.

## Sources

### Primary (HIGH confidence)
- Codebase audit -- all 5 style files, work1-chat-widget.ts, icons.ts, bubble-button.ts, markdown.ts
- [Lit Styles documentation](https://lit.dev/docs/components/styles/) -- CSS custom properties, :host, inheritable styles
- [Lit Shadow DOM documentation](https://lit.dev/docs/components/shadow-dom/) -- encapsulation, slots
- [Lucide GitHub repository](https://github.com/lucide-icons/lucide) -- icon SVG source files
- [Lucide message-circle raw SVG](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/message-circle.svg) -- verified path data

### Secondary (MEDIUM confidence)
- [Lit cheat sheet](https://lit.dev/articles/lit-cheat-sheet/) -- patterns and best practices
- [Web Components 2025 article](https://markaicode.com/web-components-2025-shadow-dom-lit-browser-compatibility/) -- current state of Shadow DOM and browser support

### Tertiary (LOW confidence)
- Lucide icon SVG paths for help-circle, headphones, bot, sparkles -- training data knowledge, needs verification during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all tools already in codebase
- Architecture: HIGH -- extending established patterns (dynamic `<style>`, CSS vars, Shadow DOM)
- Pitfalls: HIGH -- based on direct codebase audit and well-documented CSS/Web Component behavior
- Lucide icon data: LOW for 4 of 5 icons -- path data from training, needs verification

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable domain -- CSS and Web Components standards)
