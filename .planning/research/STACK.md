# Technology Stack

**Project:** Work1 Chat Widget v0.3 - Customization, Docs & CI/CD
**Researched:** 2026-03-07

## Existing Stack (DO NOT CHANGE)

Already validated in v0.1/v0.2 -- not re-researched:

| Technology | Version | Purpose |
|------------|---------|---------|
| Lit | ^3.3.0 | Web Component framework |
| TypeScript | ^5.7.0 | Type safety |
| Vite | ^6.0.0 | Build tooling |
| marked | ^17.0.4 | Markdown rendering |
| DOMPurify | ^3.3.1 | XSS sanitization |
| Vitest | ^3.0.0 | Unit testing |
| happy-dom | ^20.8.3 | DOM testing environment |

## New Stack Additions for v0.3

### Documentation Site Generator

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| VitePress | ^1.6.4 | Documentation site | Shares Vite tooling with widget, zero-config Markdown, built-in search, dark mode, GitHub Pages deploy workflow provided officially |

**Why VitePress over alternatives:**

- **Over Starlight (Astro):** VitePress shares the Vite build pipeline already in use. Adding Astro would introduce an entirely separate framework and build system. VitePress is purpose-built for documentation and stays simple. The widget is not an Astro project, so Starlight's component island architecture adds no value.
- **Over Docusaurus:** Docusaurus is React-based, adding 40+ MB of React dependencies to a Lit project. Its versioning and i18n features are overkill for a single-package widget library. VitePress produces faster sites with smaller bundles.
- **Over plain Markdown/GitHub wiki:** No search, no theming, no structured navigation. Professional docs site matters for developer adoption of the widget.

**VitePress integration points:**
- Lives in a `site/` directory (separate from the existing `docs/plans/` which contains milestone plans). This avoids confusion between internal planning documents and the public documentation site.
- Uses `vitepress` as a devDependency only -- not bundled into widget distribution.
- Build output goes to `site/.vitepress/dist/`.
- Shares the same Node.js and npm toolchain.
- `base` config must be set to `/<repo-name>/` for GitHub Pages subdirectory deployment.
- Add `docs:dev`, `docs:build`, `docs:preview` scripts to package.json.

**Confidence:** HIGH -- VitePress 1.x is stable (1.6.4 released ~7 months ago), widely used, officially recommended by Vue/Vite team. No breaking changes expected before 2.0 (currently alpha).

### GitHub Actions CI/CD

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| GitHub Actions | N/A (platform) | CI/CD pipeline | Already using GitHub for hosting; native integration, free for public repos |
| actions/checkout | v5 | Repository checkout | Standard action, latest stable |
| actions/setup-node | v4 | Node.js environment | Configures Node + npm registry URL + .npmrc |
| actions/upload-pages-artifact | v3 | GitHub Pages deployment artifact | Official action for Pages deployment |
| actions/deploy-pages | v4 | GitHub Pages deployment | Official action for Pages deployment |

**npm Publishing approach: Token-based with provenance (not OIDC trusted publishing)**

Use the traditional `NODE_AUTH_TOKEN` secret approach with `--provenance --access public` flags. Reasoning:

- **OIDC trusted publishing requires npm >= 11.5.1 or Node >= 24.** The project currently targets Node 20.x (LTS). Upgrading to Node 24 solely for OIDC is premature and may introduce compatibility issues with the existing toolchain.
- **Token-based publishing is well-established** and the GitHub official docs still show it as the primary approach. An npm granular access token scoped to the `@work1ai/chat-widget` package provides sufficient security.
- **Migration path:** When the project moves to Node 24 LTS, switch to OIDC trusted publishing by removing the token and configuring the trusted publisher on npmjs.com.

**CI/CD workflow structure (three workflows):**

1. **`ci.yml`** -- Runs on every push and PR to `master`:
   - Checkout, setup Node 20.x, `npm ci`
   - `npm run build` (TypeScript + Vite ESM + IIFE)
   - `npm test` (Vitest)
   - Validates package can be packed (`npm pack --dry-run`)

2. **`publish.yml`** -- Runs on GitHub Release `published` event:
   - Same build + test steps as CI
   - `npm publish --provenance --access public` with `NODE_AUTH_TOKEN` secret
   - Requires `permissions: { contents: read, id-token: write }` for provenance attestation

3. **`docs.yml`** -- Runs on push to `master` when `site/**` files change:
   - Checkout, setup Node 20.x, `npm ci`
   - Build VitePress: `npm run docs:build`
   - Upload artifact via `actions/upload-pages-artifact`
   - Deploy via `actions/deploy-pages`
   - Requires `permissions: { contents: read, pages: write, id-token: write }`

**Confidence:** HIGH -- GitHub Actions patterns for npm publishing are extremely well-documented. The workflow structures are standard.

### Connection Status Indicator

**No new dependencies needed.** The connection status indicator is a pure UI feature using existing stack:

| What | Implementation | Why No New Deps |
|------|---------------|-----------------|
| Status dot (green/yellow/red) | CSS with Lit reactive properties | Simple colored circle via CSS `background-color` + `border-radius` |
| Connection state tracking | Already exists in `ChatClient` WebSocket lifecycle | `onopen`, `onclose`, `onerror` events already handled |
| State propagation to UI | `ChatStore` ReactiveController already manages state | Add a `connectionStatus` property to the store |

The three states map directly to existing WebSocket lifecycle:
- **green (connected):** WebSocket `onopen` fired, actively connected
- **yellow (connecting):** WebSocket created but `onopen` not yet fired
- **red (disconnected):** WebSocket `onclose`/`onerror` fired, or never connected

**Confidence:** HIGH -- Purely internal state management and CSS. No external libraries needed.

### Configurable Title/Subtitle/Greeting

**No new dependencies needed.** Pure Lit component attributes:

| What | Implementation |
|------|---------------|
| `chat-title` attribute | Lit `@property()` with default value |
| `chat-subtitle` attribute | Lit `@property()` with default value |
| `greeting-message` attribute | Lit `@property()`, rendered as first message on open |

Standard Lit reactive properties reflected from HTML attributes. The existing theming system (CSS custom properties + `::part()`) already supports visual customization.

**Confidence:** HIGH -- Standard Lit patterns, already used throughout the widget.

### Branding Badge

**No new dependencies needed.** A "Powered by work1.ai" text link at the bottom of the chat panel, styled with existing CSS architecture.

**Confidence:** HIGH -- Simple HTML/CSS addition.

## Complete New Dependencies Summary

### Production Dependencies

**None.** All new features (status indicator, title/subtitle/greeting, branding) use existing Lit + CSS capabilities.

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vitepress | ^1.6.4 | Documentation site generator |
| vue | ^3.5.0 | Peer dependency required by VitePress |

### Installation

```bash
npm install -D vitepress vue
```

**Note:** Vue is a required peer dependency of VitePress. It will NOT be bundled into the widget distribution -- it is devDependencies only, used solely for building the docs site.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Docs generator | VitePress | Starlight (Astro) | Introduces separate framework; no shared tooling with Vite config |
| Docs generator | VitePress | Docusaurus | React dependency bloat; overkill features (versioning, i18n) |
| Docs generator | VitePress | GitHub Wiki | No search, no theming, unprofessional for developer tools |
| npm auth | Token + provenance | OIDC trusted publishing | Requires Node >= 24 or npm >= 11.5.1; premature upgrade |
| Status indicator | CSS dot | External status library | Over-engineered for a colored circle |
| CI/CD | GitHub Actions | CircleCI / Travis | Already on GitHub; no reason for external CI |

## Configuration Files Needed

| File | Purpose |
|------|---------|
| `site/.vitepress/config.ts` | VitePress site configuration (nav, sidebar, base path) |
| `.github/workflows/ci.yml` | CI pipeline (build + test on push/PR) |
| `.github/workflows/publish.yml` | npm publish on GitHub Release |
| `.github/workflows/docs.yml` | VitePress build + GitHub Pages deploy |

## What NOT to Add

- **No Storybook** -- Already have a custom playground (v0.2). Storybook is overkill for a single-component widget.
- **No semantic-release / changesets** -- Premature automation. Manual version bumps + GitHub Releases are fine at this stage.
- **No Turborepo / Nx** -- Single package, not a monorepo.
- **No additional linting tools** -- Out of scope for v0.3.
- **No Playwright / Cypress** -- E2E testing is not in v0.3 scope.
- **No WebSocket reconnection library** -- Server handles reconnection (explicit project constraint).

## Sources

- [VitePress official site](https://vitepress.dev/) -- Version 1.6.4 stable
- [VitePress deployment guide](https://vitepress.dev/guide/deploy) -- GitHub Pages workflow with actions/deploy-pages@v4
- [GitHub Docs: Publishing Node.js packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages) -- npm publish workflow with provenance
- [npm Trusted Publishing docs](https://docs.npmjs.com/trusted-publishers/) -- OIDC setup (deferred to Node 24)
- [npm Provenance docs](https://docs.npmjs.com/generating-provenance-statements/) -- --provenance flag requirements
- [npm Trusted Publishing setup guide](https://remarkablemark.org/blog/2025/12/19/npm-trusted-publishing/) -- Node 24 / npm 11.5.1 requirement confirmed
- [GitHub blog: npm trusted publishing GA](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) -- GA announcement July 2025
- [Starlight vs Docusaurus comparison](https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/) -- Docs generator comparison
- [Documentation Generator Comparison 2025](https://okidoki.dev/documentation-generator-comparison) -- VitePress vs Docusaurus vs alternatives

## Confidence Notes

| Area | Confidence | Reasoning |
|------|------------|-----------|
| VitePress choice | HIGH | Stable 1.x release, shares Vite toolchain, official deployment guides verified |
| GitHub Actions workflows | HIGH | Official GitHub documentation verified, standard patterns |
| npm publishing approach | HIGH | Token + provenance is well-documented; OIDC deferral justified by Node version constraint |
| Connection status (no deps) | HIGH | Pure CSS + existing Lit reactive properties + existing WebSocket lifecycle |
| Title/subtitle/greeting (no deps) | HIGH | Standard Lit @property() patterns already in use |
| VitePress version (1.6.4) | MEDIUM | Version from npm search results, not directly verified on npm registry |
