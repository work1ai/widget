# Phase 13: CI/CD Pipeline - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

GitHub Actions workflows for automated build/test on every push and PR, npm publishing of @work1ai/chat-widget on GitHub Release, and VitePress documentation deployment to GitHub Pages. No new widget features — automates the existing build, test, and publish pipeline.

</domain>

<decisions>
## Implementation Decisions

### Release & versioning flow
- Claude's discretion on version management approach (manual bump vs auto-extract from tag)
- Stable releases only — no pre-release/beta support
- Publish workflow must verify package.json version matches GitHub Release tag (fail on mismatch)
- Publish workflow runs full build + tests before publishing (self-contained, does not rely on separate CI run)

### CI scope & checks
- Coverage thresholds enforced in CI (80% already configured in vitest)
- Node 20 only — no version matrix (widget targets browsers, not Node)
- npm caching enabled via actions/setup-node built-in
- No separate type-check step — build script already starts with `tsc`

### Docs deployment
- Deploy on every push to main branch (no path filtering)
- Separate workflow file (docs.yml) — not a job within CI workflow
- Use modern actions/deploy-pages approach (no gh-pages branch)
- Default github.io URL — no custom domain

### npm publish permissions
- NPM_TOKEN stored as GitHub repository secret
- Publish job uses a GitHub environment named 'npm' with protection rules
- No GitHub Release assets — users get widget from npm/CDN
- Explicit `--access public` flag (scoped packages default to restricted)
- `--provenance` flag for supply chain transparency (CICD-03)

### Workflow file structure
- `ci.yml` — triggers on push + PR, runs build and tests with coverage
- `publish.yml` — triggers on GitHub Release, runs build + test + npm publish
- `docs.yml` — triggers on push to main, builds and deploys VitePress docs

### Claude's Discretion
- Version management approach (manual bump + release vs auto-extract from tag)
- Exact GitHub Actions versions for checkout, setup-node, pages actions
- Workflow job naming and step organization
- Whether to add concurrency groups for docs deployment

</decisions>

<specifics>
## Specific Ideas

- CDN distribution (unpkg + jsdelivr) happens automatically when npm package publishes — no separate CDN workflow needed
- Docs site already includes correct CDN URLs in integration.md (both unpkg and jsdelivr)
- Three separate workflow files keeps concerns cleanly separated

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json` scripts: `build` (tsc + esm + iife + size report), `test` (vitest run), `docs:build` (vitepress build docs)
- `package.json` already has `unpkg` and `jsdelivr` fields pointing to IIFE bundle
- `package.json` has `files: ["dist", "README.md"]` for npm publish scope
- Coverage thresholds already configured in vitest config (80%)

### Established Patterns
- Three Vite configs exist (main ESM, IIFE, playground) + VitePress for docs
- Package scoped as `@work1ai/chat-widget`, currently at version `0.1.0`
- `sideEffects: true` in package.json (Web Component self-registration)

### Integration Points
- `.github/workflows/` directory needs to be created (does not exist yet)
- GitHub Pages needs to be configured in repository settings to use GitHub Actions as source
- NPM_TOKEN secret and 'npm' environment need manual setup in GitHub repository settings
- Docs site lives in `docs/` directory, built with `vitepress build docs`

</code_context>

<deferred>
## Deferred Ideas

- Bundle size monitoring in CI (BUILD-01) — tracked in requirements backlog, not in this phase
- OIDC trusted publishing for npm — requires Node >= 24, deferred per REQUIREMENTS.md

</deferred>

---

*Phase: 13-ci-cd-pipeline*
*Context gathered: 2026-03-08*
