# Phase 12: Documentation Site - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a VitePress documentation site for the @work1ai/chat-widget, published to GitHub Pages. Covers integration guide (script tag + npm), API reference (attributes + CSS properties), theming guide (colors, position, size), and connection/events documentation. No new widget features — documents the existing v0.3 feature set.

</domain>

<decisions>
## Implementation Decisions

### Site structure & navigation
- VitePress with hero landing page: tagline, install command, links to guides
- Getting started content lives on the hero/landing page (not a separate page)
- Task-based sidebar: Integration Guide → Theming → API Reference → Events & Connection
- Minimal top navbar: logo/title + GitHub repo link only
- 4 content pages total plus the landing page

### Code examples
- Minimal, focused snippets — one concept per block, copy-paste ready
- Copy-to-clipboard enabled (VitePress built-in)
- Vanilla HTML/JS only — no framework-specific examples (React/Vue)
- API reference uses compact table format: Attribute | Type | Default | Description

### Visual demos
- 1-2 live widget embeds (Lit component rendered in VitePress)
- Widget renders static/visual only — no WebSocket connection needed
- Shows UI states: bubble, panel open, header with title/subtitle, sample messages
- Demonstrates appearance and theming without backend dependency

### Theming guide
- CSS custom properties reference table (all --w1-* vars with defaults and descriptions)
- ::part() CSS selectors documented with usage examples
- 2-3 pre-built theme recipes: dark mode, brand-color, compact/minimal
- Position (bottom-right/bottom-left) and size (width/height) documented within theming guide
- Themed code examples alongside the reference table

### Claude's Discretion
- Where to place the 1-2 live widget demos (landing page, theming page, or both)
- VitePress theme configuration and color scheme
- Events & Connection page structure and depth
- How to bundle/import Lit widget into VitePress markdown pages

</decisions>

<specifics>
## Specific Ideas

- Hero page should feel like a component library landing — tagline, quick install, then links deeper
- Code blocks should be scan-friendly — developers want to copy-paste, not read paragraphs
- Theme recipes should be copy-paste ready CSS blocks developers can start from

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `work1-chat-widget.ts`: Well-documented @property decorators with JSDoc — source of truth for attribute names, types, defaults
- `src/styles/*.styles.ts`: All CSS custom properties with defaults defined inline (--w1-accent-color, --w1-panel-width, etc.)
- Playground (`vite.config.playground.ts`): Existing dev page that demonstrates widget usage — reference for examples

### Established Patterns
- Three Vite configs already exist (main ESM, IIFE, playground) — docs site will need a fourth or use VitePress's own build
- Widget self-registers as `<work1-chat-widget>` custom element — can be used directly in HTML
- Package published as `@work1ai/chat-widget` on npm with ESM + IIFE distributions

### Integration Points
- `docs/` directory exists but only contains `plans/` — VitePress content goes here or in a new `docs/` structure
- `package.json` will need VitePress dev dependency and docs scripts
- GitHub Pages deployment configured in Phase 13 (CI/CD) — this phase just builds the site

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-documentation-site*
*Context gathered: 2026-03-08*
