# Phase 12: Documentation Site - Research

**Researched:** 2026-03-08
**Domain:** VitePress static documentation site for Lit web component library
**Confidence:** HIGH

## Summary

This phase builds a VitePress documentation site for the `@work1ai/chat-widget` package, published to GitHub Pages at `https://work1ai.github.io/widget/`. The site has 4 content pages plus a hero landing page, documenting integration (script tag + npm), API reference (attributes + CSS custom properties), theming (colors, position, size with recipes), and connection/events.

VitePress 1.6.x is the stable choice. The critical integration detail is configuring VitePress's `vue.template.compilerOptions.isCustomElement` so Vue does not try to resolve `<work1-chat-widget>` as a Vue component -- this must use VitePress's top-level `vue` config key, NOT re-registering `@vitejs/plugin-vue` in `vite.plugins` (which breaks VitePress internals). Live widget demos can import the Lit component directly since VitePress uses Vite under the hood. The base path must be set to `/widget/` for the `work1ai/widget` repo on GitHub Pages.

**Primary recommendation:** Use VitePress 1.6.x with `vue.template.compilerOptions.isCustomElement` for the `<work1-chat-widget>` custom element; structure docs in a `docs/` directory with 4 markdown pages plus `index.md` hero; deployment workflow deferred to Phase 13 (CICD-04).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- VitePress with hero landing page: tagline, install command, links to guides
- Getting started content lives on the hero/landing page (not a separate page)
- Task-based sidebar: Integration Guide, Theming, API Reference, Events & Connection
- Minimal top navbar: logo/title + GitHub repo link only
- 4 content pages total plus the landing page
- Minimal, focused snippets -- one concept per block, copy-paste ready
- Copy-to-clipboard enabled (VitePress built-in)
- Vanilla HTML/JS only -- no framework-specific examples (React/Vue)
- API reference uses compact table format: Attribute | Type | Default | Description
- 1-2 live widget embeds (Lit component rendered in VitePress)
- Widget renders static/visual only -- no WebSocket connection needed
- Shows UI states: bubble, panel open, header with title/subtitle, sample messages
- Demonstrates appearance and theming without backend dependency
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOCS-01 | Documentation site built with VitePress and published to GitHub Pages | VitePress 1.6.x setup with base `/widget/`, build output in `docs/.vitepress/dist` -- Phase 13 handles actual GH Pages deployment (CICD-04) |
| DOCS-02 | Integration guide covering script tag and npm installation methods | Widget has ESM (`@work1ai/chat-widget`) and IIFE (`unpkg`/`jsdelivr`) distributions; playground shows usage patterns |
| DOCS-03 | API reference documenting all HTML attributes and CSS custom properties | 10 HTML attributes and 11 CSS custom properties cataloged from source; 5 CSS `::part()` selectors documented |
| DOCS-04 | Theming guide with examples for customizing colors, position, and size | CSS custom properties with defaults extracted; position attribute and width/height attributes documented; 3 theme recipes needed |
| DOCS-05 | Connection and event handling documentation | 4 DOM events (`w1-connected`, `w1-disconnected`, `w1-error`, `w1-session-end`), 3 connection states, greeting/reconnection behavior |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitepress | ^1.6.4 | Static site generator | Official Vue/Vite SSG for docs; built-in code highlighting, copy-to-clipboard, responsive theme |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lit | ^3.3.0 | Already a project dependency | Needed at runtime for live widget demos in docs pages |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| VitePress | Starlight (Astro) | User locked VitePress; Starlight would require Astro ecosystem |
| Live demos | Static screenshots | User wants 1-2 live Lit embeds; screenshots lose interactivity |

**Installation:**
```bash
npm add -D vitepress@latest
```

Note: VitePress pulls in Vue 3 as a peer dependency automatically. No need to install Vue separately.

## Architecture Patterns

### Recommended Project Structure
```
docs/
├── .vitepress/
│   ├── config.ts          # VitePress configuration
│   └── theme/
│       ├── index.ts        # Theme enhancement (register widget for demos)
│       └── custom.css      # Minor CSS overrides for docs site
├── index.md                # Hero landing page (layout: home)
├── integration.md          # DOCS-02: Script tag + npm guide
├── theming.md              # DOCS-04: CSS custom props, ::part(), recipes
├── api.md                  # DOCS-03: Attributes + CSS properties tables
├── events.md               # DOCS-05: Connection lifecycle + DOM events
└── public/
    └── (logo/favicon if needed)
```

### Pattern 1: VitePress Config with Custom Element Support
**What:** Configure VitePress to treat `<work1-chat-widget>` as a native custom element
**When to use:** Required -- without this, Vue will warn "failed to resolve component"
**Example:**
```typescript
// docs/.vitepress/config.ts
// Source: https://github.com/vuejs/vitepress/issues/3843
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Work1 Chat Widget',
  description: 'Embeddable AI chat widget documentation',
  base: '/widget/',

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'work1-chat-widget'
      }
    }
  },

  themeConfig: {
    nav: [
      { text: 'GitHub', link: 'https://github.com/work1ai/widget' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Integration', link: '/integration' },
          { text: 'Theming', link: '/theming' },
          { text: 'API Reference', link: '/api' },
          { text: 'Events & Connection', link: '/events' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/work1ai/widget' }
    ]
  }
})
```

### Pattern 2: Hero Landing Page
**What:** Frontmatter-driven hero page with tagline and quick-start install
**When to use:** The `index.md` file
**Example:**
```markdown
---
layout: home
hero:
  name: Work1 Chat Widget
  text: Embeddable AI Chat
  tagline: Add a chat widget to any website with one line of HTML
  actions:
    - theme: brand
      text: Get Started
      link: /integration
    - theme: alt
      text: API Reference
      link: /api
features:
  - title: Drop-in Integration
    details: Script tag or npm -- works with any framework or plain HTML
  - title: Fully Themeable
    details: CSS custom properties and ::part() selectors for complete control
  - title: Real-time Streaming
    details: WebSocket-powered with typing indicators and markdown rendering
---
```

### Pattern 3: Embedding Live Lit Widget in Markdown
**What:** Import and render the widget component directly in VitePress markdown using `<script setup>` and `onMounted`
**When to use:** For 1-2 live demo sections
**Example:**
```markdown
<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  // Dynamic import to avoid SSR issues -- Lit needs DOM
  await import('@work1ai/chat-widget')
})
</script>

<div style="position: relative; height: 500px; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
  <work1-chat-widget
    chat-title="Demo Widget"
    chat-subtitle="Try it out"
    position="bottom-right"
    primary-color="#6366f1"
  ></work1-chat-widget>
</div>
```

**Key detail:** The widget must be imported dynamically inside `onMounted` because Lit accesses the DOM at import time and VitePress SSR/SSG runs in Node.js where `window`/`document` are not available. This is the standard pattern for any browser-only library in VitePress.

### Pattern 4: Importing Widget Source for Demos (Dev Mode)
**What:** Use relative import from source during docs dev, published package for production
**When to use:** Since the widget source lives in the same repo
**Example:**
```typescript
// docs/.vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Widget self-registers via side effect import
    // Dynamic import handled per-page in <script setup> to avoid SSR issues
  }
}
```

In the VitePress config, add a Vite alias so `@work1ai/chat-widget` resolves to the local source:
```typescript
// Inside defineConfig
vite: {
  resolve: {
    alias: {
      '@work1ai/chat-widget': new URL('../src/index.ts', import.meta.url).pathname
    }
  }
}
```

### Anti-Patterns to Avoid
- **Re-registering @vitejs/plugin-vue in vite.plugins:** VitePress already registers it internally. Adding it again causes "missing template/script" errors on VitePress internal components. Use the top-level `vue` key instead.
- **Top-level Lit imports in markdown:** Causes SSR build failure. Always use dynamic `import()` inside `onMounted`.
- **Using `isCustomElement: tag => tag.includes('-')` too broadly:** This would prevent any hyphenated Vue component from resolving. Target only `work1-chat-widget` specifically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code syntax highlighting | Custom Prism/Shiki setup | VitePress built-in (Shiki) | VitePress includes Shiki with 100+ languages, code groups, line highlighting |
| Copy-to-clipboard on code blocks | Custom clipboard button | VitePress built-in | Enabled by default on all code blocks |
| Mobile-responsive layout | Custom responsive CSS | VitePress default theme | Default theme is already responsive with sidebar hamburger |
| Search | Custom search implementation | VitePress built-in local search | `themeConfig.search: { provider: 'local' }` adds full-text search |
| Dark mode toggle | Custom theme switcher | VitePress built-in | Appearance toggle built into default theme |

**Key insight:** VitePress's default theme handles almost all docs-site UX needs. Focus effort on content and the 1-2 live widget demos, not site infrastructure.

## Common Pitfalls

### Pitfall 1: SSR Hydration Mismatch with Custom Elements
**What goes wrong:** VitePress pre-renders pages as static HTML (SSG). Custom elements that manipulate DOM on import cause hydration mismatches.
**Why it happens:** Lit components register themselves (`customElements.define`) on import, which fails in Node.js SSR context.
**How to avoid:** Always use dynamic `import()` inside Vue's `onMounted()` hook in markdown `<script setup>` blocks. Never import Lit at the top level of a markdown file.
**Warning signs:** Build errors mentioning `document is not defined` or `customElements is not defined`.

### Pitfall 2: Forgetting the base Path
**What goes wrong:** All assets, links, and images 404 on GitHub Pages.
**Why it happens:** GitHub Pages serves from `https://work1ai.github.io/widget/` but VitePress defaults to `/`.
**How to avoid:** Set `base: '/widget/'` in VitePress config. All internal links and images will automatically prepend this.
**Warning signs:** Site works in `docs:dev` but breaks when deployed.

### Pitfall 3: Widget Position Fixed vs. Docs Layout
**What goes wrong:** The widget uses `position: fixed` which overlaps the docs site content and navigation.
**Why it happens:** The widget is designed to float over host pages, but in a docs demo it collides with VitePress chrome.
**How to avoid:** Wrap demo widgets in a `position: relative` container with explicit height. The widget's fixed positioning will be constrained to the container.
**Warning signs:** Widget bubble appearing over the sidebar or obscuring nav.

### Pitfall 4: CSS Custom Property Documentation Drift
**What goes wrong:** Docs list different properties/defaults than the actual source code.
**Why it happens:** Manual documentation diverges from code over time.
**How to avoid:** Extract CSS custom property names and defaults directly from style source files when writing docs. Reference the canonical list below.
**Warning signs:** Users report that documented properties have no effect.

## Code Examples

### Complete CSS Custom Properties Catalog (from source)

Extracted from `src/styles/*.styles.ts` -- this is the canonical list for DOCS-03 and DOCS-04:

| CSS Custom Property | Default | Used In | Description |
|---------------------|---------|---------|-------------|
| `--w1-accent-color` | `#0066FF` | bubble, header, input focus, send button, user message, scroll pill, new-conversation button | Primary brand/accent color |
| `--w1-panel-width` | `380px` | panel | Chat panel width |
| `--w1-panel-height` | `560px` | panel | Chat panel height |
| `--w1-panel-bg` | `#ffffff` | panel | Panel background color |
| `--w1-border-color` | `#e5e5e5` | input wrapper, input field | Border color for input area |
| `--w1-input-bg` | `#ffffff` | input wrapper | Input area background |
| `--w1-input-field-bg` | `#f8f8f8` | textarea | Text input field background |
| `--w1-user-bg` | `var(--w1-accent-color, #0066FF)` | user message | User message bubble background |
| `--w1-agent-bg` | `#f0f0f0` | agent message | Agent message bubble background |
| `--w1-agent-color` | `#1a1a1a` | agent message, typing dots, streaming cursor | Agent message text color |
| `--w1-error-color` | `#dc3545` | byte counter (over limit) | Error state text color |
| `--w1-error-bg` | `#fef2f2` | error message | Error message background |

### Complete HTML Attributes Catalog (from source)

Extracted from `src/work1-chat-widget.ts` `@property` decorators:

| Attribute | Property | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `server-url` | `serverUrl` | `String` | `''` | WebSocket server URL; connection initiates on first panel open |
| `debug` | `debug` | `Boolean` | `false` | Enable debug logging on ChatClient |
| `chat-title` | `chatTitle` | `String` | `'Chat'` | Header title text |
| `chat-subtitle` | `chatSubtitle` | `String` | `''` | Subtitle below header title |
| `placeholder` | `placeholder` | `String` | `'Type a message...'` | Input field placeholder text |
| `greeting` | `greeting` | `String` | `''` | Greeting message shown as first agent bubble on connect |
| `position` | `position` | `String` | `'bottom-right'` | Panel position: `'bottom-right'` or `'bottom-left'` |
| `width` | `width` | `String` | `''` | Panel width override (CSS value, e.g. `'400px'`) |
| `height` | `height` | `String` | `''` | Panel height override (CSS value, e.g. `'600px'`) |
| `primary-color` | `primaryColor` | `String` | `''` | Accent color override (CSS color value) |
| `bubble-icon` | `bubbleIcon` | `String` | `''` | Lucide icon name for bubble (e.g. `'help-circle'`) |

### CSS ::part() Selectors (from source)

From `src/styles/widget.styles.ts` JSDoc and template:

| Part | Element | Description |
|------|---------|-------------|
| `bubble` | `.bubble-button` | Floating action button |
| `panel` | `.chat-panel` | Chat panel container |
| `header` | `.chat-header` | Panel header bar |
| `message-list` | `.message-area` | Scrollable message area |
| `input` | `.input-wrapper` | Input area wrapper |

### DOM Events Catalog (from source)

From `src/work1-chat-widget.ts` JSDoc and `updated()`:

| Event | Bubbles | Composed | Detail | When |
|-------|---------|----------|--------|------|
| `w1-connected` | Yes | Yes | `{ session_id: string }` | WebSocket connects successfully |
| `w1-disconnected` | Yes | Yes | `{ code: number, reason: string }` | WebSocket disconnects or is rejected |
| `w1-error` | Yes | Yes | `{ content: string }` | Server sends an error message |
| `w1-session-end` | Yes | Yes | `{ reason: string, content: string }` | Server ends the session |

### Connection States

| State | Status Dot Color | Meaning |
|-------|-----------------|---------|
| `connected` | Green (#22c55e) | WebSocket is open and ready |
| `connecting` / `reconnecting` | Yellow (#eab308) | WebSocket is establishing or re-establishing |
| `disconnected` | Red (#ef4444) | WebSocket is closed |

### npm Scripts to Add

```json
{
  "docs:dev": "vitepress dev docs",
  "docs:build": "vitepress build docs",
  "docs:preview": "vitepress preview docs"
}
```

### Theme Recipe Examples (for DOCS-04)

**Dark Mode:**
```css
work1-chat-widget {
  --w1-panel-bg: #1e1e2e;
  --w1-agent-bg: #2a2a3e;
  --w1-agent-color: #e0e0e0;
  --w1-input-bg: #1e1e2e;
  --w1-input-field-bg: #2a2a3e;
  --w1-border-color: #3a3a4e;
  --w1-accent-color: #818cf8;
}
```

**Brand Color (purple):**
```css
work1-chat-widget {
  --w1-accent-color: #7c3aed;
}
```

**Compact/Minimal:**
```css
work1-chat-widget {
  --w1-panel-width: 320px;
  --w1-panel-height: 420px;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| VuePress | VitePress 1.x | 2024 (VitePress 1.0 stable) | Vite-powered, faster builds, Vue 3 |
| VitePress 0.x | VitePress 1.6.x | 2024 | Stable API, built-in search, improved SSG |
| Manual GH Pages deploy | GitHub Actions with Pages artifact | 2023 | Official `actions/deploy-pages@v4` action |

**Deprecated/outdated:**
- VuePress: Superseded by VitePress; do not use
- VitePress alpha/beta (0.x): Stable 1.x is available
- VitePress 2.0 alpha: Exists but not stable; use 1.6.x

## Open Questions

1. **Widget demo container strategy**
   - What we know: Widget uses `position: fixed` which escapes normal flow
   - What's unclear: Whether a `position: relative` wrapper fully constrains the fixed-position widget in all browsers
   - Recommendation: Test during implementation; may need an `<iframe>` fallback if containment fails, but the relative-position container approach is the first choice

2. **Vite alias for local source vs. built package**
   - What we know: Can alias `@work1ai/chat-widget` to `../src/index.ts` for dev
   - What's unclear: Whether VitePress SSG build handles Lit's decorators and TypeScript correctly through the alias
   - Recommendation: Use the alias approach; VitePress uses Vite which handles TS/decorators natively. Fall back to importing from `../dist/` (pre-built) if issues arise.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (existing project framework) |
| Config file | `vitest.config.ts` or inline in `vite.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCS-01 | VitePress site builds without errors | smoke | `npm run docs:build` | N/A -- build command |
| DOCS-02 | Integration page exists with code examples | manual-only | Visual review of built site | N/A -- content review |
| DOCS-03 | API reference lists all attributes and CSS properties | manual-only | Visual review; count against catalog above | N/A -- content review |
| DOCS-04 | Theming guide with recipes and visual examples | manual-only | Visual review of built site | N/A -- content review |
| DOCS-05 | Events/connection page documents all 4 events and 3 states | manual-only | Visual review; count against catalog above | N/A -- content review |

### Sampling Rate
- **Per task commit:** `npm run docs:build` (verifies site builds)
- **Per wave merge:** `npm run docs:build && npm run docs:preview` (build + visual check)
- **Phase gate:** Successful `docs:build` + all pages render correctly in `docs:preview`

### Wave 0 Gaps
- [ ] VitePress installed as devDependency
- [ ] `docs/.vitepress/config.ts` created with base path and custom element config
- [ ] `docs:dev`, `docs:build`, `docs:preview` scripts added to package.json

## Sources

### Primary (HIGH confidence)
- [VitePress official docs](https://vitepress.dev/guide/getting-started) - Installation, project structure, configuration
- [VitePress deployment guide](https://vitepress.dev/guide/deploy) - GitHub Pages base path and Actions workflow
- [VitePress site config reference](https://vitepress.dev/reference/site-config) - `vue`, `vite`, `base`, `srcDir` options
- [VitePress issue #3843](https://github.com/vuejs/vitepress/issues/3843) - Confirmed: use top-level `vue` key for `isCustomElement`, not `vite.plugins`
- [VitePress home page reference](https://vitepress.dev/reference/default-theme-home-page) - Hero frontmatter format
- [VitePress sidebar reference](https://vitepress.dev/reference/default-theme-sidebar) - Sidebar configuration format
- Project source: `src/work1-chat-widget.ts` - All attributes, events, JSDoc
- Project source: `src/styles/*.styles.ts` - All CSS custom properties with defaults

### Secondary (MEDIUM confidence)
- [npm: vitepress](https://www.npmjs.com/package/vitepress) - Version 1.6.4 confirmed as latest stable

### Tertiary (LOW confidence)
- Widget demo containment strategy (position: relative wrapper) - needs runtime validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - VitePress is the user-locked choice; version verified on npm
- Architecture: HIGH - VitePress project structure is well-documented; custom element config verified via GitHub issue
- Pitfalls: HIGH - SSR/custom element pitfall verified via official issue tracker; base path is standard VitePress concern
- Content catalog: HIGH - All attributes, CSS properties, events extracted directly from source code

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (VitePress 1.x is stable; unlikely to change significantly)
