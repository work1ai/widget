# Phase 5: Responsive & Distribution - Research

**Researched:** 2026-03-05
**Domain:** Mobile responsive CSS, npm package distribution, CDN bundling
**Confidence:** HIGH

## Summary

Phase 5 has two independent workstreams: (1) making the chat panel responsive on mobile devices with full-screen layout and virtual keyboard handling, and (2) preparing the package for distribution via CDN script tag and npm with TypeScript declarations. Both build on existing infrastructure -- the Vite config already produces ES + IIFE outputs, and the panel already uses CSS custom properties for sizing.

The responsive work is primarily CSS with one JS enhancement (visualViewport API for virtual keyboard). The distribution work is Vite config adjustments and package.json field setup. Neither workstream requires new dependencies.

**Primary recommendation:** Use CSS `@media` queries inside Shadow DOM for mobile layout, `dvh` units with `visualViewport` fallback for keyboard handling, and Vite's `rollupOptions.external` to keep ESM lean while IIFE stays self-contained.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full-screen panel at 480px viewport width breakpoint (standard mobile portrait)
- Bubble button hidden (CSS) when panel is open in full-screen mobile mode; close button in header is the only dismiss mechanism
- Use visualViewport API to detect virtual keyboard and resize panel so input stays visible above keyboard
- Apply env(safe-area-inset-*) padding for notch and home indicator on modern phones
- Package name: `@work1ai/chat-widget` (scoped under @work1ai org)
- Single entry point: `import '@work1ai/chat-widget'` registers element and exports ChatClient, ChatStore, types
- `files` whitelist in package.json: `["dist", "README.md"]` -- lean published package
- Comprehensive README with all attributes, CSS custom properties, DOM events, and usage examples (CDN + npm)
- lit, marked, dompurify stay as regular dependencies (not bundled into ESM) for deduplication
- Serve from unpkg.com/@work1ai/chat-widget or cdn.jsdelivr.net -- no self-hosted CDN infra
- IIFE bundle auto-registers `<work1-chat-widget>` custom element on load -- zero setup for CDN users
- No window globals exposed beyond the custom element registration
- No SRI hashes for v1
- No hard size limit -- monitor informally
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RESP-01 | Chat panel adapts to narrow viewports (full-width/full-height on mobile) | CSS @media query at 480px breakpoint, panel goes position:fixed inset:0 with dvh units, safe-area-inset padding |
| RESP-02 | Input area is touch-friendly on mobile devices | Minimum 44px touch targets, font-size >= 16px to prevent iOS zoom, visualViewport keyboard handling |
| DIST-01 | Widget available as CDN script tag that registers custom element | IIFE build already works; needs rollupOptions to bundle all deps into IIFE |
| DIST-02 | Widget available as npm package with ESM import | ESM build with external deps; package.json exports field configuration |
| DIST-03 | npm package includes TypeScript type declarations | vite-plugin-dts already configured; add types field to exports map |
| DIST-04 | CDN bundle is self-contained (all dependencies bundled) | Vite rollupOptions.external must NOT apply to IIFE build; use function-form external |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | ^6.0.0 | Build tool -- library mode for ES + IIFE | Already configured, handles dual-format builds |
| vite-plugin-dts | ^4.5.0 | TypeScript declaration generation | Already configured, emits .d.ts files to dist/ |
| lit | ^3.3.0 | Web component framework | Shadow DOM CSS scoping makes @media queries safe |

### No New Dependencies Needed

All responsive work is pure CSS + minimal JS (visualViewport API). All distribution work is build configuration. No new packages required.

## Architecture Patterns

### Responsive CSS in Shadow DOM

Shadow DOM @media queries work identically to light DOM -- they query the viewport, not the shadow host. This means standard responsive CSS patterns apply directly.

```css
/* Inside Shadow DOM -- queries viewport width, not host width */
@media (max-width: 480px) {
  .chat-panel {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    border-radius: 0;
    bottom: 0;
  }
}
```

**Key insight:** `env(safe-area-inset-*)` values are viewport-level environment variables, not inherited CSS properties. They work inside Shadow DOM without any special handling.

### Vite Dual-Build Strategy

The critical challenge: ESM build should externalize lit/marked/dompurify (for dedup in npm consumers), but IIFE build must bundle everything (self-contained for CDN). Current vite.config.ts has NO externals, which means both builds are fully bundled.

**Solution:** Use a function-form `external` that checks the output format, combined with `output` array for format-specific globals.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ include: ['src'] }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Work1ChatWidget',
      formats: ['es', 'iife'],
      fileName: (format) => `work1-chat-widget.${format}.js`,
    },
    rollupOptions: {
      // Only externalize for ESM; IIFE bundles everything
      external: (id, parent, isResolved) => {
        // For IIFE builds, never externalize
        // Rollup calls this once per module -- we check if it's a dep
        const deps = ['lit', 'marked', 'dompurify'];
        return deps.some(dep => id === dep || id.startsWith(dep + '/'));
      },
      output: {
        // No globals needed for ESM; IIFE has no externals
      },
    },
  },
});
```

**Important caveat:** Rollup's `external` function does not receive the output format. The function is called once per resolved module, not per output. To achieve format-specific externalization, you need **two separate Vite builds** or a custom plugin.

**Recommended approach: Two build passes.**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const sharedLib = {
  entry: 'src/index.ts',
  name: 'Work1ChatWidget',
};

export default defineConfig(({ mode }) => {
  // Single config works if we accept separate build commands
  // OR use a simpler approach: since current IIFE already bundles everything,
  // just add external for the ES output only
  return {
    plugins: [
      dts({ include: ['src'] }),
    ],
    build: {
      lib: {
        ...sharedLib,
        formats: ['es', 'iife'],
        fileName: (format) => `work1-chat-widget.${format}.js`,
      },
      rollupOptions: {
        // Externals apply to ALL formats in a single build
        // For dual builds with different externals, use two vite build calls
      },
    },
  };
});
```

**Simplest correct approach:** Two build scripts in package.json.

```json
{
  "scripts": {
    "build:esm": "vite build --config vite.config.esm.ts",
    "build:iife": "vite build --config vite.config.iife.ts",
    "build": "tsc && npm run build:esm && npm run build:iife"
  }
}
```

Or a single config with `build.rollupOptions.output` as an array -- but Vite library mode does not support output arrays when using `build.lib.formats`. The formats option generates the outputs internally.

**Pragmatic solution:** Keep a single vite.config.ts, accept that IIFE bundles everything (already true), and add `rollupOptions.external` for ESM only by using Vite's library mode with separate format builds:

```typescript
// vite.config.ts -- simplest working approach
export default defineConfig({
  plugins: [dts({ include: ['src'] })],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Work1ChatWidget',
      formats: ['es', 'iife'],
      fileName: (format) => `work1-chat-widget.${format}.js`,
    },
    rollupOptions: {
      external: ['lit', 'lit/decorators.js', 'lit/directives/repeat.js',
                  'marked', 'dompurify'],
    },
  },
});
```

**Wait -- this externalizes for IIFE too.** The IIFE must NOT have externals or it will fail at runtime. This confirms the need for two build passes or a Rollup plugin approach.

**Final recommended pattern: Two Vite configs.**

### package.json Exports Configuration

For an ESM-only package with TypeScript types (no CJS needed since `"type": "module"`):

```json
{
  "name": "@work1ai/chat-widget",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/work1-chat-widget.es.js",
  "module": "./dist/work1-chat-widget.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/work1-chat-widget.es.js"
    }
  },
  "files": ["dist", "README.md"],
  "unpkg": "./dist/work1-chat-widget.iife.js",
  "jsdelivr": "./dist/work1-chat-widget.iife.js"
}
```

**Key fields explained:**
- `exports."."` -- primary entry point with conditions (types must come first)
- `main` / `module` -- legacy fallback for older bundlers that don't read exports
- `types` -- legacy TypeScript resolution fallback
- `unpkg` / `jsdelivr` -- tells these CDNs which file to serve for bare package URLs
- `files` -- whitelist of published files (keeps package lean)

### Anti-Patterns to Avoid
- **Including `src/` in published package:** Only `dist/` and `README.md` go in `files`
- **Using `"default"` condition without `"import"`:** For ESM-only packages, use `"import"` condition
- **Forgetting `types` condition in exports:** TypeScript won't find declarations without it
- **Setting font-size below 16px on mobile inputs:** iOS Safari auto-zooms on focus for inputs with font-size < 16px

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile keyboard detection | JS resize polling or MutationObserver hacks | `100dvh` + `visualViewport` resize event | dvh units handle most cases natively; visualViewport covers edge cases |
| Bundle size reporting | Complex webpack-analyzer setup | Simple Node.js script with `fs.statSync` + `zlib.gzipSync` | Only need two numbers: raw and gzipped size |
| CDN hosting | Self-hosted CDN, S3 + CloudFront | unpkg.com / cdn.jsdelivr.net | Free, automatic from npm publish, versioned URLs |
| TypeScript declarations | Manual .d.ts authoring | vite-plugin-dts (already installed) | Auto-generates from source, stays in sync |

## Common Pitfalls

### Pitfall 1: iOS Safari Input Zoom
**What goes wrong:** When a user taps the text input on iOS, Safari auto-zooms the page if the input font-size is less than 16px.
**Why it happens:** iOS Safari has a "helpful" feature that zooms in on small text inputs.
**How to avoid:** Ensure `.input-textarea` has `font-size: 16px` (currently 14px -- must be bumped on mobile).
**Warning signs:** Page zooms in when tapping input on iPhone.

### Pitfall 2: 100vh vs dvh on Mobile
**What goes wrong:** `height: 100vh` includes the area behind browser chrome (URL bar, toolbar), so content overflows on mobile.
**Why it happens:** `vh` was defined before mobile browsers with dynamic toolbars existed.
**How to avoid:** Use `100dvh` (dynamic viewport height) which adjusts as browser chrome appears/disappears. Fallback to `100vh` for older browsers.
**Warning signs:** Panel extends behind the browser's bottom toolbar on mobile Safari.

### Pitfall 3: Rollup External Applies to All Outputs
**What goes wrong:** Setting `rollupOptions.external` externalizes deps from both ESM AND IIFE builds, causing IIFE to have undefined references.
**Why it happens:** Rollup's external config is per-build, not per-output-format.
**How to avoid:** Use two separate build passes with different configs -- one for ESM (with externals) and one for IIFE (no externals).
**Warning signs:** IIFE bundle throws ReferenceError for lit/marked/dompurify at runtime.

### Pitfall 4: Safe-Area Insets Without viewport-fit=cover
**What goes wrong:** `env(safe-area-inset-*)` values are all 0px even on notched devices.
**Why it happens:** The viewport meta tag must include `viewport-fit=cover` for insets to have non-zero values. Without it, the browser letterboxes content within the safe area.
**How to avoid:** Document in README that users on notched devices should add `<meta name="viewport" content="..., viewport-fit=cover">`. The widget itself cannot set this.
**Warning signs:** Panel content appears behind the notch on iPhone X+.

### Pitfall 5: Custom Element Double Registration
**What goes wrong:** If both CDN script and npm import are loaded, `customElements.define` throws.
**Why it happens:** Custom element names are globally unique; re-registration is an error.
**How to avoid:** Guard registration: `if (!customElements.get('work1-chat-widget')) { customElements.define(...) }`. Lit's `@customElement` decorator already does this internally since Lit 3.
**Warning signs:** Console error "has already been defined as a custom element".

## Code Examples

### Mobile Full-Screen Panel CSS
```css
/* Source: CSS @media queries work in Shadow DOM */
@media (max-width: 480px) {
  .chat-panel {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    height: 100vh; /* fallback for older browsers */
    border-radius: 0;
    box-shadow: none;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .bubble-button.bubble--hidden-mobile {
    transform: scale(0);
    opacity: 0;
    pointer-events: none;
  }
}
```

Note: Order matters for the height declarations. Place `100dvh` AFTER `100vh` so browsers that support dvh override the vh fallback.

### VisualViewport Keyboard Handler
```typescript
// Source: MDN VisualViewport API + DEV Community pattern
private setupKeyboardHandler(): void {
  if (!window.visualViewport) return;

  const onResize = () => {
    const vv = window.visualViewport!;
    // When keyboard is open, visualViewport.height < window.innerHeight
    const keyboardHeight = window.innerHeight - vv.height;

    if (keyboardHeight > 100) {
      // Keyboard is likely visible -- shrink panel
      const panel = this.renderRoot.querySelector('.chat-panel') as HTMLElement;
      if (panel) {
        panel.style.height = `${vv.height}px`;
      }
    } else {
      // Keyboard dismissed -- restore
      const panel = this.renderRoot.querySelector('.chat-panel') as HTMLElement;
      if (panel) {
        panel.style.height = '';
      }
    }
  };

  window.visualViewport.addEventListener('resize', onResize);
  // Store reference for cleanup in disconnectedCallback
}
```

### Vite Config -- ESM Build (with externals)
```typescript
// vite.config.esm.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ include: ['src'] })],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'work1-chat-widget.es.js',
    },
    rollupOptions: {
      external: [
        'lit',
        /^lit\//,
        'marked',
        'dompurify',
      ],
    },
    emptyOutDir: true,
  },
});
```

### Vite Config -- IIFE Build (self-contained)
```typescript
// vite.config.iife.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Work1ChatWidget',
      formats: ['iife'],
      fileName: () => 'work1-chat-widget.iife.js',
    },
    // No external -- everything bundled
    emptyOutDir: false, // Don't clear ESM output
  },
});
```

### Post-Build Size Reporter
```javascript
// scripts/report-size.cjs
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const file = path.join(__dirname, '..', 'dist', 'work1-chat-widget.iife.js');
const raw = fs.statSync(file).size;
const gzipped = zlib.gzipSync(fs.readFileSync(file)).length;

console.log(`\nIIFE bundle size:`);
console.log(`  Raw:    ${(raw / 1024).toFixed(1)} KB`);
console.log(`  Gzip:   ${(gzipped / 1024).toFixed(1)} KB\n`);
```

### package.json Distribution Fields
```json
{
  "name": "@work1ai/chat-widget",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/work1-chat-widget.es.js",
  "module": "./dist/work1-chat-widget.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/work1-chat-widget.es.js"
    }
  },
  "unpkg": "./dist/work1-chat-widget.iife.js",
  "jsdelivr": "./dist/work1-chat-widget.iife.js",
  "files": ["dist", "README.md"],
  "sideEffects": true
}
```

Note: `sideEffects: true` is correct because importing the package registers a custom element (a side effect).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` for full-screen mobile | `100dvh` (dynamic viewport height) | 2023 -- baseline across browsers | Handles mobile browser chrome correctly |
| JS visualViewport polling for keyboard | `100dvh` + `interactiveWidget` viewport meta | 2023-2024 | CSS-first approach, JS fallback for edge cases |
| `main` + `module` in package.json | `exports` field with conditions | Node 16+ / TS 5+ | Authoritative entry point resolution |
| UMD for universal bundles | IIFE for browser-only, ESM for npm | 2022+ | Web Components self-register; no need for AMD/CJS in CDN |

## Open Questions

1. **Single vs dual Vite config for ESM/IIFE**
   - What we know: Rollup external applies to all outputs; you can't differentiate per format in a single build
   - What's unclear: Whether a Rollup plugin could intercept per-format or if two builds is the only clean path
   - Recommendation: Use two build scripts (simpler, explicit, no hacks). Alternatively, keep single config with no externals for now -- npm consumers get a slightly larger bundle but it works. Two configs is the clean solution.

2. **visualViewport vs dvh sufficiency**
   - What we know: `100dvh` handles keyboard in modern browsers; visualViewport gives programmatic control
   - What's unclear: Whether dvh alone covers all mobile browsers the widget targets
   - Recommendation: Use dvh as primary, add visualViewport listener as enhancement for older browsers and edge cases. The user decision explicitly asks for visualViewport, so include it.

3. **Lit @customElement double-registration guard**
   - What we know: Lit 3's `@customElement` decorator calls `customElements.define` which throws on re-registration
   - What's unclear: Whether Lit 3 has built-in guard or if it throws
   - Recommendation: Verify Lit 3 behavior; if it throws, add a manual guard before the decorator or in the IIFE entry point.

## Sources

### Primary (HIGH confidence)
- [MDN VisualViewport API](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) -- properties, events, browser support
- [Vite Build Options](https://vite.dev/config/build-options) -- library mode config, formats, fileName
- [MDN CSS env()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) -- safe-area-inset variables

### Secondary (MEDIUM confidence)
- [Package.json exports guide](https://hirok.io/posts/package-json-exports) -- exports field structure, types condition
- [DEV Community -- VisualViewport keyboard fix](https://dev.to/franciscomoretti/fix-mobile-keyboard-overlap-with-visualviewport-3a4a) -- dvh approach, practical patterns
- [Vite GitHub Discussion #6198](https://github.com/vitejs/vite/discussions/6198) -- library mode external deps management

### Tertiary (LOW confidence)
- visualViewport + dvh combined approach for all edge cases -- needs mobile device testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new deps, building on existing Vite + Lit setup
- Architecture (responsive): HIGH -- CSS @media in Shadow DOM is well-documented; dvh and env() have baseline support
- Architecture (distribution): HIGH -- Vite library mode is mature; package.json exports is standardized
- Pitfalls: HIGH -- iOS input zoom, vh vs dvh, external-per-format are well-known issues
- visualViewport implementation: MEDIUM -- API is stable but mobile browser edge cases vary

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable domain, no fast-moving deps)
