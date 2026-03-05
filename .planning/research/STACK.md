# Technology Stack

**Project:** Work1 Chat Widget
**Researched:** 2026-03-04

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Lit | 3.3.2 | Web Component rendering with Shadow DOM | The standard library for building Web Components. Tiny runtime (~5KB gzipped), native Shadow DOM encapsulation, reactive properties, and decorators. No framework lock-in — the output is a standard custom element. | HIGH |
| TypeScript | 5.9.x | Type safety and developer experience | Required by project constraints. Lit has first-class TypeScript support with typed reactive properties and decorator support. Use 5.9.x for latest features. | HIGH |

### Build Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite | 6.4.x | Build tool, dev server, library bundling | Vite 6 is the recommended stable branch (LTS). Vite 7 (7.3.1) is current latest but very new. Use Vite 6 for stability — it has mature library mode support for ESM and IIFE/UMD output. Fast HMR dev server works well with Lit. | MEDIUM |
| vite-plugin-dts | 4.5.x | TypeScript declaration generation | Generates `.d.ts` files alongside ESM output for npm consumers. Peer-depends on vite and typescript with no version constraints — works with Vite 6. | HIGH |

**Important note on Vite and UMD:** Vite's library mode uses Rollup under the hood. As of Vite 5+, the `umd` format in library mode requires specifying `build.lib.name` for the global variable. For CDN `<script>` tag usage, IIFE format is actually preferable to UMD because:

1. IIFE is simpler and lighter — no module loader detection overhead
2. Web Components self-register via `customElements.define()` — there is no exported module to consume via AMD/CommonJS
3. The widget auto-registers on script load, so IIFE behavior (execute immediately) is exactly what we want

**Recommendation:** Use `formats: ['es', 'iife']` instead of `['es', 'umd']`. The IIFE bundle is the CDN script tag artifact. The ESM bundle is the npm package artifact.

### Markdown Rendering

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| marked | 17.0.4 | Markdown to HTML conversion | Lightweight (~40KB), fast, well-maintained, extensible via plugins. Supports all needed features: bold, italic, links, code blocks, inline code, lists. v17 is current stable. Synchronous API by default, which is ideal for real-time streaming token rendering. | HIGH |
| DOMPurify | 3.3.1 | HTML sanitization (XSS prevention) | The industry standard for HTML sanitization. Must sanitize marked's HTML output before inserting into DOM. Critical for security — agent messages could contain malicious content. CSP-compatible when configured correctly. | HIGH |

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | 4.0.x | Unit and component testing | Fast, Vite-native test runner. Shares Vite config, so no duplicate build configuration. Jest-compatible API. Design doc already specifies Vitest. | HIGH |
| @open-wc/testing | 4.0.0 | Web Component test utilities | Provides `fixture()`, `html` tagged template literals, and assertion helpers specifically for testing custom elements. The standard testing library for Web Components. Works with any test runner. | MEDIUM |
| happy-dom | 20.x | DOM environment for unit tests | Faster than jsdom for Web Component testing. Supports Shadow DOM, custom elements, and MutationObserver. Use for ChatClient and ChatStore unit tests that don't need a real browser. | MEDIUM |
| Playwright | 1.58.x | Integration/E2E testing | For full integration tests with real browser rendering. Tests the complete widget with a mock WebSocket server. Verifies Shadow DOM rendering, CSS custom properties, and real user interactions. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| marked-highlight | 2.2.3 | Code syntax highlighting in markdown | Only if code block highlighting is desired. Pairs with marked to add syntax highlighting via a highlight function. Can be deferred — not needed for MVP. | MEDIUM |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| **React/Preact inside the widget** | Adds framework dependency, increases bundle size, defeats the purpose of framework-agnostic Web Components. Lit is purpose-built for this. |
| **markdown-it** (v14.1.1) | Heavier than marked (~100KB vs ~40KB), plugin ecosystem is more complex. marked is sufficient for the subset of markdown needed (bold, italic, links, code, lists). |
| **Stencil** | Adds a compiler layer on top of Web Components. Lit is lighter and more direct — we write standard Web Component code, not a framework abstraction. |
| **socket.io-client** | The backend uses raw WebSocket, not Socket.IO. Using socket.io-client would add ~45KB for protocol features we don't need. Use the native `WebSocket` API directly. |
| **jsdom** (for testing) | Historically poor Shadow DOM and custom element support. happy-dom is faster and has better Web Component support. Use jsdom only as a fallback. |
| **Vite 7.x** | Too new (released recently). Vite 6.x is the stable, well-documented choice. Upgrade to 7 after it matures. |
| **Any state management library** (Redux, MobX, etc.) | Overkill for a chat widget. Lit's reactive properties + a simple reactive controller pattern (ChatStore) handle all state needs with zero dependencies. |
| **Tailwind CSS / CSS frameworks** | Cannot use utility-class CSS frameworks inside Shadow DOM without complexity. Use plain CSS with custom properties — this is what Shadow DOM is designed for. |
| **sanitize-html** | Server-side focused, much heavier than DOMPurify. DOMPurify is browser-native and purpose-built for client-side sanitization. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Framework | Lit 3.3.2 | Stencil 4.x | Stencil adds a compilation step and framework abstraction. Lit produces standard Web Components with less magic. |
| Framework | Lit 3.3.2 | Vanilla JS | Lit saves significant boilerplate for reactive properties, Shadow DOM templates, and lifecycle. The ~5KB cost is worth it. |
| Markdown | marked 17.x | markdown-it 14.x | marked is lighter, faster, and sufficient for our subset. markdown-it's plugin ecosystem is overkill. |
| Markdown | marked 17.x | micromark | Lower-level, requires more assembly. marked is batteries-included for our use case. |
| Sanitizer | DOMPurify 3.3.x | Sanitizer API (native) | The browser-native Sanitizer API is not yet widely supported. DOMPurify is the proven, universal solution. |
| Build | Vite 6.x | Rollup (direct) | Vite wraps Rollup with a superior dev server and simpler config. No reason to use Rollup directly. |
| Build | Vite 6.x | esbuild | esbuild lacks Rollup's mature plugin ecosystem needed for library mode output. |
| Testing | Vitest 4.x | Jest | Jest requires separate config from Vite. Vitest shares the Vite pipeline — zero additional build config. |
| Testing | Vitest + happy-dom | @web/test-runner 0.20.x | @web/test-runner runs tests in a real browser (good for WC), but Vitest + happy-dom is faster for unit tests. Use Playwright for real-browser integration tests instead. |
| WebSocket | Native WebSocket API | ws (npm) | ws is a Node.js package. Browsers have a native WebSocket API — no library needed. |

## Vite Library Mode Configuration

This is a critical configuration detail. The design doc calls for UMD + ESM output.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ rollupTypes: true }), // Bundle .d.ts into single file
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Work1ChatWidget',       // Global var for IIFE
      formats: ['es', 'iife'],       // ESM for npm, IIFE for CDN
      fileName: (format) => {
        if (format === 'es') return 'work1-chat-widget.es.js';
        return 'work1-chat-widget.js'; // IIFE for <script> tag
      },
    },
    rollupOptions: {
      // No externals — bundle everything for the CDN artifact
    },
    minify: 'terser',                // Better minification than esbuild default
    target: 'es2021',                // Modern browsers only
  },
});
```

**Key points:**
- `formats: ['es', 'iife']` — IIFE instead of UMD (see rationale above)
- No externals — the CDN bundle must be fully self-contained
- `rollupTypes: true` in dts plugin bundles all `.d.ts` into one file for clean npm distribution
- `target: 'es2021'` — project targets last 2 versions of modern browsers, no IE11

## Installation

```bash
# Core dependencies
npm install lit marked dompurify

# Type definitions (DOMPurify ships without built-in types)
npm install -D @types/dompurify

# Build tooling
npm install -D vite vite-plugin-dts typescript terser

# Testing
npm install -D vitest @open-wc/testing happy-dom @playwright/test
```

**Total production dependencies: 3** (lit, marked, dompurify)
**Estimated CDN bundle size: ~60-80KB gzipped** (Lit ~5KB + marked ~12KB + DOMPurify ~8KB + widget code ~15-25KB + overhead)

## Version Pinning Strategy

Pin exact major versions in `package.json` using `^` (caret) ranges:

```json
{
  "dependencies": {
    "lit": "^3.3.2",
    "marked": "^17.0.4",
    "dompurify": "^3.3.1"
  }
}
```

These are all semver-stable libraries. Caret ranges allow patch and minor updates. Lock exact versions via `package-lock.json`.

## Sources

- npm registry (queried 2026-03-04): lit@3.3.2, marked@17.0.4, dompurify@3.3.1, vite@7.3.1 (latest), vite@6.4.1 (previous LTS), vitest@4.0.18, typescript@5.9.3, vite-plugin-dts@4.5.4, @open-wc/testing@4.0.0, happy-dom@20.8.3, @playwright/test@1.58.2
- Vite dist-tags: latest=7.3.1, previous=5.4.21, beta=8.0.0-beta.16
- Project design document: `/docs/plans/2026-03-04-chat-widget-design.md`
- WebSocket protocol: `/DRAFT.md` (chat-server v0.1.0)

## Confidence Notes

| Area | Confidence | Reasoning |
|------|------------|-----------|
| Lit | HIGH | Versions verified via npm. Lit 3 is the established standard for Web Components. |
| marked + DOMPurify | HIGH | Versions verified via npm. Well-established libraries, widely used together. |
| Vite library mode | MEDIUM | Versions verified. IIFE vs UMD recommendation based on training data knowledge of Vite 6 library mode. The exact config should be validated during implementation. |
| Vitest + happy-dom | MEDIUM | Versions verified. happy-dom's Shadow DOM support quality should be validated early — may need to fall back to @vitest/browser or Playwright for component tests if Shadow DOM behavior is incomplete. |
| @open-wc/testing | MEDIUM | Version verified (4.0.0). Training data suggests good Vitest compatibility, but integration should be validated early in the project. |
| Bundle size estimate | LOW | Based on training data knowledge of individual library sizes. Actual bundle size depends on tree-shaking effectiveness and widget code size. Measure after first build. |
