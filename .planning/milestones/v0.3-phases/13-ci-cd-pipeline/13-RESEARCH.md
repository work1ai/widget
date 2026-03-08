# Phase 13: CI/CD Pipeline - Research

**Researched:** 2026-03-08
**Domain:** GitHub Actions CI/CD for npm package publishing and static site deployment
**Confidence:** HIGH

## Summary

Phase 13 automates three workflows via GitHub Actions: (1) CI on every push/PR running build and tests, (2) npm publishing with provenance on GitHub Release, and (3) VitePress docs deployment to GitHub Pages. The project has no existing `.github/workflows/` directory, so all three workflow files are greenfield.

Key findings: the default branch is `master` (not `main`) -- all workflow triggers must reference `master`. VitePress `base: '/widget/'` is already correctly configured for the `work1ai/widget` repo on GitHub Pages. npm provenance requires `id-token: write` permission and `registry-url` in `setup-node`. The publish workflow must be self-contained (build + test + publish) per user decision.

**Primary recommendation:** Create three standalone workflow files (ci.yml, publish.yml, docs.yml) using actions/checkout@v4, actions/setup-node@v4 with Node 20 and npm caching, following VitePress official deployment pattern for docs.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Claude's discretion on version management approach (manual bump vs auto-extract from tag)
- Stable releases only -- no pre-release/beta support
- Publish workflow must verify package.json version matches GitHub Release tag (fail on mismatch)
- Publish workflow runs full build + tests before publishing (self-contained, does not rely on separate CI run)
- Coverage thresholds enforced in CI (80% already configured in vitest)
- Node 20 only -- no version matrix (widget targets browsers, not Node)
- npm caching enabled via actions/setup-node built-in
- No separate type-check step -- build script already starts with `tsc`
- Deploy on every push to master branch (no path filtering)
- Separate workflow file (docs.yml) -- not a job within CI workflow
- Use modern actions/deploy-pages approach (no gh-pages branch)
- Default github.io URL -- no custom domain
- NPM_TOKEN stored as GitHub repository secret
- Publish job uses a GitHub environment named 'npm' with protection rules
- No GitHub Release assets -- users get widget from npm/CDN
- Explicit `--access public` flag (scoped packages default to restricted)
- `--provenance` flag for supply chain transparency (CICD-03)
- ci.yml -- triggers on push + PR, runs build and tests with coverage
- publish.yml -- triggers on GitHub Release, runs build + test + npm publish
- docs.yml -- triggers on push to master, builds and deploys VitePress docs

### Claude's Discretion
- Version management approach (manual bump + release vs auto-extract from tag)
- Exact GitHub Actions versions for checkout, setup-node, pages actions
- Workflow job naming and step organization
- Whether to add concurrency groups for docs deployment

### Deferred Ideas (OUT OF SCOPE)
- Bundle size monitoring in CI (BUILD-01) -- tracked in requirements backlog, not in this phase
- OIDC trusted publishing for npm -- requires Node >= 24, deferred per REQUIREMENTS.md
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CICD-01 | GitHub Actions CI workflow runs build and tests on every push and PR | ci.yml workflow with `npm run build` and `npm test` steps, coverage via vitest |
| CICD-02 | GitHub Actions publish workflow publishes @work1ai/chat-widget to npm on GitHub Release | publish.yml triggered by `release: types: [published]`, version verification, npm publish |
| CICD-03 | npm package published with --provenance flag for supply chain transparency | Requires `id-token: write` permission, `registry-url` in setup-node, `--provenance` flag |
| CICD-04 | GitHub Actions workflow deploys documentation site to GitHub Pages | docs.yml using actions/configure-pages, upload-pages-artifact, deploy-pages |
</phase_requirements>

## Standard Stack

### Core
| Action | Version | Purpose | Why Standard |
|--------|---------|---------|--------------|
| actions/checkout | v4 | Repository checkout | Standard, stable, widely used |
| actions/setup-node | v4 | Node.js + npm cache setup | Built-in npm caching, registry-url support |
| actions/configure-pages | v4 | GitHub Pages configuration | Official Pages workflow action |
| actions/upload-pages-artifact | v3 | Upload built site as artifact | Official Pages workflow action |
| actions/deploy-pages | v4 | Deploy artifact to GitHub Pages | Official Pages workflow action |

### Runtime
| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 | Runtime for build/test/publish (LTS) |
| npm | bundled with Node 20 | Package manager, publish with --provenance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| actions/checkout@v4 | @v5 or @v6 | v4 is battle-tested; v5/v6 exist but v4 is stable and widely documented |
| NPM_TOKEN secret | OIDC trusted publishing | OIDC requires Node >= 24 per REQUIREMENTS.md, deferred |

**Note on action versions:** The VitePress official docs reference checkout@v5 and setup-node@v6, but v4 remains the most battle-tested and widely deployed. Either v4 or the latest versions will work. Recommendation: use v4 for stability since this is a new pipeline.

## Architecture Patterns

### Recommended Project Structure
```
.github/
└── workflows/
    ├── ci.yml          # Build + test on push/PR
    ├── publish.yml     # npm publish on GitHub Release
    └── docs.yml        # VitePress deploy to GitHub Pages
```

### Pattern 1: CI Workflow (ci.yml)
**What:** Runs build and tests with coverage on every push and PR to catch regressions
**When to use:** Every code change
**Example:**
```yaml
# Source: Standard GitHub Actions pattern
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm test -- --coverage
```

### Pattern 2: Publish Workflow (publish.yml)
**What:** Self-contained build + test + publish triggered by GitHub Release creation
**When to use:** When maintainer creates a GitHub Release
**Critical requirements:**
- `id-token: write` permission for provenance
- `registry-url: https://registry.npmjs.org/` in setup-node (REQUIRED even though it is the default -- provenance breaks without it)
- GitHub environment `npm` with protection rules
- Version mismatch check between tag and package.json
**Example:**
```yaml
# Source: npm provenance docs + GitHub Actions patterns
name: Publish

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      # Version verification step
      - name: Verify version matches tag
        run: |
          PACKAGE_VERSION=$(node -p "require('./package.json').version")
          TAG_VERSION="${GITHUB_REF_NAME#v}"
          if [ "$PACKAGE_VERSION" != "$TAG_VERSION" ]; then
            echo "::error::package.json version ($PACKAGE_VERSION) does not match tag ($TAG_VERSION)"
            exit 1
          fi
      - run: npm run build
      - run: npm test
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Pattern 3: Docs Workflow (docs.yml)
**What:** Build VitePress docs and deploy to GitHub Pages using modern actions approach
**When to use:** Every push to master (no path filtering per user decision)
**Example:**
```yaml
# Source: VitePress official deployment guide
name: Deploy Docs

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - uses: actions/configure-pages@v4
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Anti-Patterns to Avoid
- **Using `main` instead of `master`:** This repo's default branch is `master` -- all triggers must use `master`
- **Relying on CI workflow for publish checks:** Publish workflow must be self-contained (build + test) per user decision
- **Omitting `registry-url` from setup-node:** Provenance generation silently fails without explicit `registry-url: https://registry.npmjs.org/`
- **Using `npm install` instead of `npm ci`:** CI should always use `npm ci` for reproducible installs
- **Setting provenance in .npmrc:** Use `--provenance` flag or `NPM_CONFIG_PROVENANCE=true` env var in workflow, not committed .npmrc

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pages deployment | Custom git push to gh-pages branch | actions/deploy-pages@v4 | Handles permissions, caching, atomic deploys |
| npm provenance | Manual OIDC token fetching | `npm publish --provenance` | npm CLI handles all Sigstore/Fulcio integration |
| Version extraction from tag | Complex shell parsing | `${GITHUB_REF_NAME#v}` | Simple parameter expansion strips leading 'v' |
| npm caching | actions/cache with manual key | setup-node `cache: npm` | Built-in, handles lockfile hashing automatically |

**Key insight:** GitHub Actions has mature, maintained actions for every step in this pipeline. Custom scripts should be limited to version verification logic only.

## Common Pitfalls

### Pitfall 1: Missing registry-url for Provenance
**What goes wrong:** `npm publish --provenance` silently fails or produces no provenance attestation
**Why it happens:** The OIDC token request requires the registry URL to be explicitly configured in setup-node
**How to avoid:** Always include `registry-url: https://registry.npmjs.org/` in setup-node step
**Warning signs:** Published package shows no provenance badge on npmjs.com

### Pitfall 2: Branch Name Mismatch
**What goes wrong:** Workflows never trigger
**Why it happens:** Default templates use `main` but this repo uses `master`
**How to avoid:** Verify branch name with `git branch -r` before writing workflows
**Warning signs:** Pushes to master don't trigger any workflow runs

### Pitfall 3: Scoped Package Access
**What goes wrong:** `npm publish` fails with 402 error for scoped package
**Why it happens:** Scoped packages (`@work1ai/chat-widget`) default to `restricted` (paid feature)
**How to avoid:** Always include `--access public` flag
**Warning signs:** First publish attempt fails with payment required error

### Pitfall 4: Version Tag Mismatch
**What goes wrong:** Published npm version doesn't match the GitHub Release tag
**Why it happens:** Developer forgets to bump package.json before creating release
**How to avoid:** Version verification step that compares package.json version with tag, failing early
**Warning signs:** npm version history doesn't match GitHub releases

### Pitfall 5: Docs Build Failure Due to Widget Import
**What goes wrong:** VitePress build fails in CI because it tries to resolve `@work1ai/chat-widget` alias
**Why it happens:** VitePress config uses a Vite alias pointing to `../../src/index.ts` which requires the full dependency tree
**How to avoid:** Ensure `npm ci` installs all deps (already handled since it's the same package); the alias resolves to local source files so it works with full install
**Warning signs:** Build fails with module resolution errors in CI but works locally

### Pitfall 6: Pages Not Configured in Repo Settings
**What goes wrong:** deploy-pages action fails with "Pages not enabled" error
**Why it happens:** GitHub Pages source must be set to "GitHub Actions" in repo settings before first deployment
**How to avoid:** Document manual setup step: Settings > Pages > Source = "GitHub Actions"
**Warning signs:** First docs deployment fails despite correct workflow

## Code Examples

### Version Verification Script
```bash
# Source: Common GitHub Actions pattern
PACKAGE_VERSION=$(node -p "require('./package.json').version")
TAG_VERSION="${GITHUB_REF_NAME#v}"
if [ "$PACKAGE_VERSION" != "$TAG_VERSION" ]; then
  echo "::error::package.json version ($PACKAGE_VERSION) does not match tag ($TAG_VERSION)"
  exit 1
fi
```

### Release Flow (Manual)
```bash
# 1. Update version in package.json
npm version 0.2.0 --no-git-tag-version

# 2. Commit and push
git add package.json package-lock.json
git commit -m "chore: bump version to 0.2.0"
git push origin master

# 3. Create GitHub Release with tag v0.2.0
# - publish.yml triggers automatically
# - Verifies package.json version matches tag
# - Builds, tests, publishes to npm with provenance
```

### Concurrency Group for Docs (Recommended)
```yaml
# Prevents overlapping deployments
concurrency:
  group: pages
  cancel-in-progress: false  # Don't cancel in-progress deployments
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| gh-pages branch deployment | actions/deploy-pages (artifact-based) | 2023 | No branch pollution, atomic deploys |
| Manual npm auth setup | setup-node registry-url + NODE_AUTH_TOKEN | 2022 | Simpler, more secure |
| No provenance | npm publish --provenance | 2023 | Supply chain transparency, Sigstore integration |
| actions/checkout@v3 | actions/checkout@v4 | 2023 | Node 20 runtime, faster |
| NPM_TOKEN only | OIDC trusted publishing | 2025 | Eliminates long-lived secrets (deferred for this project) |

**Deprecated/outdated:**
- `peaceiris/actions-gh-pages`: Replaced by official actions/deploy-pages
- Publishing to gh-pages branch: Replaced by artifact-based deployment
- `actions/checkout@v3`: Uses deprecated Node 16 runtime

## Open Questions

1. **Concurrency groups for docs deployment**
   - What we know: VitePress official docs recommend `concurrency: { group: pages, cancel-in-progress: false }`
   - What's unclear: Whether user wants this (marked as Claude's discretion)
   - Recommendation: Include concurrency group -- it prevents overlapping deployments with no downside

2. **Version management approach**
   - What we know: User marked this as Claude's discretion. Options are (a) manual bump in package.json + create release, or (b) auto-extract version from tag and inject at publish time
   - What's unclear: Which approach the user prefers
   - Recommendation: Manual bump + verification. Simpler, more explicit, standard for small packages. The verification step catches mismatches. Auto-extraction adds complexity for minimal benefit.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x with happy-dom |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CICD-01 | CI workflow triggers on push/PR, runs build+test | manual-only | Validate YAML syntax + push to trigger | N/A (workflow files) |
| CICD-02 | Publish workflow publishes on GitHub Release | manual-only | Create test release or dry-run | N/A (workflow files) |
| CICD-03 | Provenance flag included in publish command | manual-only | Inspect published package on npmjs.com | N/A (workflow files) |
| CICD-04 | Docs deploy to GitHub Pages on push | manual-only | Push to master and verify Pages URL | N/A (workflow files) |

**Note:** CI/CD workflow files are infrastructure-as-code. They cannot be unit tested locally. Validation is done by: (1) YAML lint/syntax check, (2) verifying workflow triggers fire on push, (3) confirming published package has provenance badge.

### Sampling Rate
- **Per task commit:** Verify YAML is valid with `npx yaml-lint` or manual review
- **Per wave merge:** Push to master, verify CI runs green
- **Phase gate:** All three workflows trigger and complete successfully

### Wave 0 Gaps
- [ ] `.github/workflows/` directory -- needs creation
- [ ] Manual repo setup: GitHub Pages source set to "GitHub Actions"
- [ ] Manual repo setup: NPM_TOKEN secret added
- [ ] Manual repo setup: 'npm' environment created with protection rules

## Sources

### Primary (HIGH confidence)
- [VitePress official deploy guide](https://vitepress.dev/guide/deploy) - Complete workflow YAML for GitHub Pages deployment
- [npm provenance docs](https://docs.npmjs.com/generating-provenance-statements/) - Provenance requirements and permissions
- [Bootstrapping NPM Provenance](https://www.thecandidstartup.org/2024/06/24/bootstrapping-npm-provenance-github-actions.html) - Practical workflow example with registry-url requirement

### Secondary (MEDIUM confidence)
- [actions/setup-node](https://github.com/actions/setup-node) - npm caching, registry-url configuration
- [npm trusted publishing changelog](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) - OIDC status (deferred)

### Tertiary (LOW confidence)
- None -- all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official GitHub Actions and VitePress docs verified
- Architecture: HIGH - Three-workflow pattern is standard, well-documented
- Pitfalls: HIGH - registry-url requirement and scoped package access are well-known gotchas with clear documentation

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, actions versions change slowly)
