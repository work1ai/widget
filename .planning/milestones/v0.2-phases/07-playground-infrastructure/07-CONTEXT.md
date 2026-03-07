# Phase 7: Playground Infrastructure - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Developers have a local playground page for testing the widget without touching production bundles. Running `npm run playground` opens a browser page with the chat widget rendered. Changes to widget source files hot-reload in the playground. Running `npm run build` produces CDN and npm bundles that contain zero playground code.

</domain>

<decisions>
## Implementation Decisions

### Dev server setup
- Separate Vite config: `vite.config.playground.ts` — keeps library configs (`vite.config.ts`, `vite.config.iife.ts`) untouched
- New npm script: `npm run playground` = `vite --config vite.config.playground.ts`
- Dedicated `playground/` directory at project root for all playground files (HTML entry, any playground-specific code)
- Auto-open browser on launch (`server.open: true`)
- Fixed port 5180 to avoid conflicts with default Vite port 5173

### Playground page layout
- Blank page with just the widget — clean white/light background
- Light background only, no dark mode for the page itself
- Widget instantiated via `<w1-chat-widget>` HTML tag in markup (mirrors customer usage)
- No surrounding site chrome or fake content
- Phase 9 will add control panel later — no placeholder needed now

### Bundle exclusion strategy
- Trust existing config: `files: ["dist", "README.md"]` in package.json excludes `playground/` from npm
- Vite build configs use `src/index.ts` entry — playground code never enters the build graph
- No extra verification test needed — config is sufficient
- Playground-specific deps (if any) go in devDependencies naturally

### Hot reload behavior
- Full page reload on source changes (Vite default with Lit Web Components)
- No attempt at HMR state preservation — acceptable for dev tool
- No special CSS hot-injection — Lit styles live in JS, so all changes trigger full reload
- Vite default error overlay for compile errors — no custom indicators

### Claude's Discretion
- Page title/header text (minimal or none)
- Exact Vite config options beyond what's specified
- Any TypeScript path aliases or import setup for playground

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/index.ts`: Public API barrel export — playground HTML imports from local source
- `src/work1-chat-widget.ts`: Web Component with `<w1-chat-widget>` tag — used directly in playground HTML

### Established Patterns
- Two separate Vite configs already exist (ESM: `vite.config.ts`, IIFE: `vite.config.iife.ts`) — adding a third for playground is consistent
- Package uses `"type": "module"` — playground config will be ESM too

### Integration Points
- `package.json` scripts: New `playground` script alongside existing `dev`, `build`, `test`
- Vite dev server: Playground config serves `playground/index.html` as entry point
- Widget source: `playground/index.html` imports `src/index.ts` (or the widget component directly)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-playground-infrastructure*
*Context gathered: 2026-03-07*
