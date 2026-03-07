# Phase 4: Theming & Encapsulation - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Customers can deeply customize the widget's appearance via CSS custom properties, HTML attributes, and ::part() selectors without breaking Shadow DOM encapsulation. Widget is secure against XSS and style leaking. No new features — this phase formalizes and hardens what exists.

</domain>

<decisions>
## Implementation Decisions

### CSS Custom Property API
- Colors only — no font, spacing, or radius vars exposed
- Consolidate existing ~15 vars into clean `--w1-{component}-{property}` naming pattern
- Audit and normalize: remove redundant vars (e.g., --w1-input-field-bg vs --w1-input-bg), document final list as public API
- `--w1-accent-color` cascades to user bubbles, send button, links, new-conversation button — set once, applies everywhere
- Individual component vars (--w1-user-bg, --w1-agent-bg, etc.) override the cascade
- No built-in dark mode — customers set CSS vars themselves to create dark themes

### HTML Attribute Mapping
- Add `primary-color` attribute (joins existing width, height, position)
- Attributes set CSS custom properties on `:host` at low specificity — natural cascade means customer CSS vars override attribute values
- Extend existing dynamic `<style>` pattern from Phase 2 (width/height) to include primary-color → --w1-accent-color

### ::part() Exposure
- Keep current 5 parts: header, panel, bubble, message-list, input
- No additional parts for message bubbles, send button, or close button in v1
- "Powered by AI" badge is NOT exposed as a part — stays fixed and unstyled

### Custom Bubble Icon
- `bubble-icon` attribute accepts Lucide icon names (e.g., "message-circle", "help-circle", "headphones")
- Bundle 3-5 common Lucide icons as inline SVGs (~1-2KB impact): message-circle (default), help-circle, headphones, bot, sparkles
- `<slot name="bubble-icon">` available for fully custom HTML (customer's own SVG/img)
- Slot takes precedence over attribute when both provided
- Bubble icon only — no header logo attribute in v1

### Claude's Discretion
- Exact list of CSS custom properties to consolidate (audit existing and normalize)
- Which 3-5 Lucide icons to bundle (suggestions above are starting point)
- CSP compliance implementation details
- Shadow DOM isolation hardening approach

</decisions>

<specifics>
## Specific Ideas

- Primary color should feel like a "brand color" input — set once and the widget feels branded
- Lucide icons chosen because they're clean, consistent, and widely recognized in dev tools

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/styles/*.styles.ts` — 5 style files already using `--w1-*` CSS custom properties throughout
- `src/components/icons.ts` — existing SVG icon module (chat bubble icon)
- `src/components/bubble-button.ts` — has `part="bubble"`, renders current icon

### Established Patterns
- CSS custom properties with fallback defaults: `var(--w1-accent-color, #0066FF)` pattern used everywhere
- Dynamic `<style>` element on `:host` for attribute-to-CSS-var mapping (work1-chat-widget.ts:155-157)
- Shadow DOM already active via Lit Web Components — all components render in shadow root
- No inline `style=""` attributes found anywhere — CSP-friendly baseline

### Integration Points
- `work1-chat-widget.ts` — main component where attribute properties are defined and dynamic style injected
- `src/styles/` — all 5 style files need CSS var audit/normalization
- `src/components/bubble-button.ts` — where bubble-icon attribute and slot would be wired
- `src/markdown.ts` — DOMPurify already handles XSS sanitization (SEC-04 partially done)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-theming-encapsulation*
*Context gathered: 2026-03-04*
