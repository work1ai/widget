# Phase 5: Responsive & Distribution - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Widget works on mobile devices (full-screen panel on narrow viewports, touch-friendly input) and ships as both a CDN script tag and an npm package with TypeScript declarations. Requirements: RESP-01, RESP-02, DIST-01, DIST-02, DIST-03, DIST-04.

</domain>

<decisions>
## Implementation Decisions

### Mobile layout
- Full-screen panel at 480px viewport width breakpoint (standard mobile portrait)
- Bubble button hidden (CSS) when panel is open in full-screen mobile mode; close button in header is the only dismiss mechanism
- Use visualViewport API to detect virtual keyboard and resize panel so input stays visible above keyboard
- Apply env(safe-area-inset-*) padding for notch and home indicator on modern phones

### npm package shape
- Package name: `@work1ai/chat-widget` (scoped under @work1ai org)
- Single entry point: `import '@work1ai/chat-widget'` registers element and exports ChatClient, ChatStore, types
- `files` whitelist in package.json: `["dist", "README.md"]` — lean published package
- Comprehensive README with all attributes, CSS custom properties, DOM events, and usage examples (CDN + npm)
- lit, marked, dompurify stay as regular dependencies (not bundled into ESM) for deduplication

### CDN integration
- Serve from unpkg.com/@work1ai/chat-widget or cdn.jsdelivr.net — no self-hosted CDN infra needed
- IIFE bundle auto-registers `<work1-chat-widget>` custom element on load — zero setup for CDN users
- No window globals exposed beyond the custom element registration
- No SRI hashes for v1 — versioned URLs from unpkg/jsdelivr are sufficient

### Bundle strategy
- No hard size limit — trust current deps are reasonable, monitor informally
- CDN IIFE bundle is fully self-contained: Lit + marked + DOMPurify + widget code all bundled
- npm ESM package keeps deps as regular dependencies (standard dedup behavior)
- Post-build script prints raw and gzipped sizes of the IIFE bundle for feedback

### Claude's Discretion
- Exact visualViewport API implementation details
- CSS media query structure for responsive breakpoint
- Vite config adjustments for npm vs CDN builds (if any needed beyond current config)
- package.json exports/main/module/types field configuration
- README structure and content depth
- Post-build size reporting script implementation

</decisions>

<specifics>
## Specific Ideas

- User emphasized "COMPREHENSIVE README" — full documentation, not a quick-start stub
- Package name specifically `@work1ai/chat-widget` (not @work1 — the org is work1ai)
- Current Vite config already has `formats: ['es', 'iife']` and `vite-plugin-dts` — build infrastructure is partially in place

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vite.config.ts` — Already configured with es + iife formats and vite-plugin-dts for declarations
- `tsconfig.json` — declaration: true, declarationMap: true already set
- `src/index.ts` — Barrel export with all public types and classes
- `src/styles/panel.styles.ts` — Panel CSS using --w1-panel-width and --w1-panel-height custom properties
- `src/styles/widget.styles.ts` — Widget root styles with position and bubble styling

### Established Patterns
- CSS custom properties with fallback defaults: `var(--w1-panel-width, 380px)` pattern
- Dynamic `<style>` element on `:host` for attribute-to-CSS-var mapping
- Shadow DOM encapsulation via Lit — responsive CSS can safely use @media queries inside shadow root
- Bubble hidden via CSS transform scale(0) when panel is open — can extend for mobile full-screen

### Integration Points
- `package.json` — Needs main, module, types, exports, files fields for npm readiness
- `vite.config.ts` — May need rollupOptions.external for ESM build to keep deps external
- `src/styles/panel.styles.ts` — Add @media query for mobile full-screen
- `src/styles/widget.styles.ts` — Add mobile bubble visibility and safe-area insets
- `src/work1-chat-widget.ts` — May need visualViewport listener for keyboard handling

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-responsive-distribution*
*Context gathered: 2026-03-05*
