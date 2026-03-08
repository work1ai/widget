# Feature Research

**Domain:** Embeddable chat widget -- v0.3 customization, documentation, and CI/CD
**Researched:** 2026-03-07
**Confidence:** HIGH

## Scope

This analysis covers the **v0.3 milestone features only** -- configurable content (title/subtitle/greeting), connection status indicator, branding update, documentation site, and CI/CD for npm publishing. Features already shipped in v0.1/v0.2 are treated as existing infrastructure, not re-analyzed.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that v0.3 must deliver. Without these, the milestone is incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Configurable title via HTML attribute | Every embeddable widget lets you set a header title. Already partially exists (`title` property defaults to "Chat"). | LOW | Property exists on `Work1ChatWidget` and is passed to `renderHeader()`. Current code uses `override title` since `title` is a global HTML attribute. Works but shows browser tooltip on hover -- acceptable tradeoff, standard Lit pattern. |
| Configurable subtitle | Chat widgets universally show a subtitle like "We're online" or "Ask me anything". Microsoft Dynamics, LiveChat, Intercom, Crisp all support this. Adds context beneath the title. | LOW | New `subtitle` string property on widget, passed to `renderHeader()`. Renders as a `<span class="header-subtitle">` below the title. Empty string = hidden (no wasted vertical space). Requires minor header layout change from single-line to stacked title/subtitle. |
| Configurable greeting message | First message shown when user opens chat. Standard pattern across Intercom, Drift, Crisp, and every major chat widget. | LOW | Already wired: `greeting` attribute exists on `Work1ChatWidget` and `ChatStore.toggleOpen(greeting)` adds it as an agent message. `greetingAdded` flag prevents duplicates. Needs verification, testing, and playground integration -- not a new feature build. |
| Connection status indicator (3-state dot) | Users need feedback about whether their messages will be delivered. A colored dot (green/yellow/red) is the universal semaphore for connection state in chat UIs. Without it, users type into a disconnected widget with no visual feedback. | MEDIUM | `ConnectionState` type already has 4 values: `disconnected`, `connecting`, `connected`, `reconnecting`. Map: green = connected, yellow = connecting OR reconnecting, red = disconnected. Render as a small dot (8-10px) in the header next to the title. Requires CSS transitions for smooth state changes. Must be accessible: color alone is insufficient per WCAG -- add `aria-label` with text ("Connected"/"Connecting"/"Disconnected"). |
| "Powered by work1.ai" branding badge with link | Replaces current "Powered by AI" badge. Standard for free/embedded widgets (Intercom, Drift, Crisp all show branding). Links to company site for attribution and marketing. | LOW | Current `renderHeader()` has `<span class="header-badge">Powered by AI</span>`. Replace with "Powered by work1.ai" wrapped in `<a href="https://work1.ai" target="_blank" rel="noopener noreferrer">`. Consider relocating badge from header to panel footer to reduce header clutter now that subtitle + status dot are being added. |
| Documentation site on GitHub Pages | npm packages without docs are not adopted. Users need installation instructions, attribute reference, theming guide, and examples. Required deliverable per milestone spec. | MEDIUM | Static site with: installation (CDN + npm), quick start, attribute/property reference, CSS custom properties list, CSS parts list, event reference, and examples. Content is straightforward -- widget API surface is small (~10 attributes, ~10 CSS vars, ~4 events). |
| GitHub Actions CI/CD for npm publishing | Manual npm publishing is error-prone and blocks releases. Automated publishing on release is industry standard. | MEDIUM | npm deprecated classic tokens December 2025. Trusted publishing with OIDC is now the only path. Workflow needs: lint, test, build, publish with auto-provenance. Trigger on GitHub Release creation. Requires one-time manual setup on npmjs.com to configure trusted publisher. |

### Differentiators (Competitive Advantage)

Features that go beyond table stakes and make v0.3 polished.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Custom Elements Manifest (custom-elements.json) | Machine-readable API documentation. Enables IDE autocomplete in VS Code, JetBrains, and documentation tool integration. Most serious web component libraries ship this. Sets work1-chat-widget apart from widgets that only have README docs. | LOW | Use `@custom-elements-manifest/analyzer` with `--litelement` flag. One script in package.json: `"analyze": "cem analyze --litelement"`. Add `custom-elements.json` to `files` array and `"customElements": "./custom-elements.json"` field in package.json. One-time setup, then auto-generates on build. |
| Playground controls for new attributes | v0.2 playground already has runtime controls for colors, position, size, bubble icon, and WebSocket settings. Adding title/subtitle/greeting/status controls makes the playground a live documentation and demo tool. | LOW | Add text inputs for title, subtitle, greeting to existing controls panel. Add connection status simulation via mock scenarios. Leverages existing v0.2 infrastructure directly. |
| Provenance attestations on npm package | npm provenance proves the package was built from a specific commit in a specific repo via a verified CI pipeline. Builds trust with security-conscious adopters. Shows a green checkmark on npmjs.com package page. | LOW | Free with OIDC trusted publishing -- npm CLI auto-generates provenance attestations without the `--provenance` flag. Zero extra configuration. |
| Interactive documentation examples | Live widget demos embedded in documentation pages. Users can see and interact with the widget before installing, not just read code snippets. | MEDIUM | Embed the IIFE bundle in docs pages via `<script>` tag and render live `<work1-chat-widget>` instances with mock mode. VitePress supports custom Vue components that can wrap this. Depends on having a demo/mock endpoint or bundling mock server. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Configurable status dot colors | Developers want to match status colors to their brand palette. | Green/yellow/red is a universal semaphore. Custom colors break user expectations and accessibility patterns. A blue "connected" dot means nothing to users. | Keep green/yellow/red as fixed semantic colors. Allow hiding the dot entirely via a `hide-status` boolean attribute if they do not want it. |
| Rich HTML in title/subtitle | Developers want to embed links, bold text, or images in header text. | XSS risk. Allowing HTML in attributes opens injection vectors on customer sites. Increased complexity for marginal value -- header text is 3-5 words. | Plain text only for title/subtitle. The greeting message already renders through the markdown pipeline (as an agent message bubble), so it gets markdown formatting for free. |
| Auto-generated API docs from source comments | Seems efficient -- write docs once in code, publish everywhere. | Generated docs are consistently terrible for user-facing products. They document implementation, not usage. Users need guides, examples, and context -- not a JSDoc dump of internal methods. | Hand-written documentation with curated examples. Use Custom Elements Manifest for structured metadata (IDE integration), but write the docs site content manually. |
| Semantic versioning automation (semantic-release) | Automatic version bumping from commit messages. Zero-touch releases. | Adds significant complexity (commit message conventions, release plugins, changelog generation, monorepo config). Overkill for a 3-dependency widget with 5 active requirements and < 100 users. | Manual version bump in package.json before creating a GitHub Release. Simple, predictable, zero tooling overhead. CI publishes whatever version is in package.json when a release is tagged. |
| Multi-page documentation with versioning | Versioned docs for each release (v0.1, v0.2, v0.3). | Only one version matters -- the latest. Versioned docs are for libraries with breaking changes across maintained LTS lines. This widget is pre-1.0. | Single unversioned documentation site. Add versioning only if/when 1.0 ships with a SemVer commitment and multiple supported major versions. |
| Storybook for component documentation | Industry standard for component library docs and visual testing. | Storybook is heavy (large dependency tree, complex config). Designed for component libraries with dozens of components. This project has one public custom element (`<work1-chat-widget>`). The existing v0.2 playground already serves the same interactive demo purpose with zero added dependencies. | Keep the dev playground for interactive testing. Use a lightweight SSG for public-facing documentation. |
| Complex multi-job CI pipeline | Separate jobs for lint, typecheck, unit test, integration test, build, publish. | Over-engineering for the current scale. More jobs = more YAML, more failure points, longer feedback loops. The entire build + test runs in under 60 seconds. | Two jobs maximum: quality-gate (build + test) and publish (on release, needs quality-gate). Add complexity only when build times warrant it. |

---

## Feature Dependencies

```
[renderHeader() refactor]
    unlocks: configurable subtitle
    unlocks: connection status dot
    unlocks: branding badge relocation
    (shared dependency -- do header changes together)

[Configurable subtitle]
    requires: renderHeader() refactor (add subtitle parameter)

[Connection status indicator]
    requires: renderHeader() refactor (add status dot to header layout)
    reads from: ConnectionState in ChatStore (already exists, no changes needed)

[Branding badge update]
    requires: renderHeader() refactor (replace text, add link, optionally relocate)

[Greeting message verification]
    independent: already wired in ChatStore.toggleOpen(greeting)
    just needs: testing and playground integration

[Documentation site]
    enhances: all widget features (documents them for users)
    should follow: widget feature completion (document what actually shipped)
    independent of: CI/CD pipeline

[CI/CD pipeline]
    independent: can be built in parallel with widget features
    requires: npm trusted publisher configuration on npmjs.com (one-time manual step)
    independent of: documentation site

[Custom Elements Manifest]
    enhances: documentation site (structured API reference)
    enhances: npm package (IDE autocomplete for consumers)
    independent: can be added at any time
```

### Dependency Notes

- **Header refactor is the critical shared dependency.** Title, subtitle, status indicator, and branding badge all modify `renderHeader()`. The current signature is `renderHeader(title, onClose)` -- it needs to expand. Refactor to an options object (`HeaderConfig`) to avoid parameter bloat. Do all header changes in one pass to prevent repeated refactoring.
- **Greeting is already implemented.** The `greeting` attribute, `ChatStore.toggleOpen(greeting)` call, and `greetingAdded` dedup flag all exist. This is a testing/verification task, not a feature build. Add playground controls and ensure it renders correctly as an agent message.
- **Documentation should follow features.** Write docs after widget features are complete so documentation reflects the actual API. Do not write docs for features that might change during implementation.
- **CI/CD is fully independent.** Can be developed in parallel with everything else. The only blocking dependency is the npm trusted publisher configuration on npmjs.com, which is a manual one-time step by a package admin.

---

## v0.3 Milestone Definition

### Must Ship (Milestone Exit Criteria)

- [ ] Configurable subtitle attribute -- new property, renders below title in header
- [ ] Connection status dot (green/yellow/red) in header -- maps to existing `ConnectionState`
- [ ] "Powered by work1.ai" badge with link to https://work1.ai -- replaces "Powered by AI"
- [ ] Greeting message verified working + tested -- already wired, needs test coverage
- [ ] Documentation site published on GitHub Pages -- installation, attributes, theming, events
- [ ] GitHub Actions CI/CD pipeline -- build, test, publish to npm on release with OIDC

### Should Ship (Polish)

- [ ] Custom Elements Manifest generation (`custom-elements.json` in npm package)
- [ ] Playground controls for title, subtitle, greeting, and connection status simulation
- [ ] Provenance attestations on published npm package (free with OIDC)

### Defer to Later

- [ ] Interactive live widget demos in documentation pages
- [ ] Bundle size monitoring in CI
- [ ] Automated changelog generation

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Connection status indicator | HIGH | MEDIUM | P1 |
| Configurable subtitle | HIGH | LOW | P1 |
| "Powered by work1.ai" badge | HIGH | LOW | P1 |
| Greeting message verification | MEDIUM | LOW | P1 |
| Documentation site | HIGH | MEDIUM | P1 |
| CI/CD npm publishing | HIGH | MEDIUM | P1 |
| Custom Elements Manifest | MEDIUM | LOW | P2 |
| Playground controls for new attrs | MEDIUM | LOW | P2 |
| Interactive docs demos | LOW | MEDIUM | P3 |
| Bundle size monitoring | MEDIUM | LOW | P3 |

**Priority key:**
- P1: Must ship for v0.3 milestone completion
- P2: Should ship, adds polish and developer experience
- P3: Nice to have, defer if timeline is tight

---

## Implementation Notes

### Header Refactor Strategy

Current `renderHeader()` signature:
```typescript
renderHeader(title: string, onClose: () => void): TemplateResult
```

Proposed expanded signature:
```typescript
interface HeaderConfig {
  title: string;
  subtitle: string;
  connectionState: ConnectionState;
  onClose: () => void;
}
renderHeader(config: HeaderConfig): TemplateResult
```

This avoids positional parameter bloat and is forward-compatible for adding more header features later (e.g., agent avatar, unread count).

### Connection Status Dot Specification

| ConnectionState value | Dot color | aria-label | CSS class |
|----------------------|-----------|------------|-----------|
| `connected` | Green (#22c55e) | "Connected" | `.status-dot--connected` |
| `connecting` | Yellow (#eab308) | "Connecting" | `.status-dot--connecting` |
| `reconnecting` | Yellow (#eab308) | "Reconnecting" | `.status-dot--reconnecting` |
| `disconnected` | Red (#ef4444) | "Disconnected" | `.status-dot--disconnected` |

- Size: 8px diameter circle
- Position: inline next to title text, vertically centered
- Transition: `background-color 300ms ease` for smooth state changes
- Optional pulse animation on `connecting`/`reconnecting` states to indicate activity

### Branding Badge Placement Decision

With subtitle and status dot being added to the header, the header is getting crowded. Two options:

1. **Keep in header** (simpler): Badge stays right-aligned in header row. Risk of visual clutter with title + subtitle + dot + badge + close button.
2. **Move to panel footer** (cleaner): Badge renders below the input area as a small footer line. Frees header space. More common pattern in competitor widgets (Intercom, Crisp both put branding at bottom).

Recommendation: **Move to panel footer.** The header should focus on title, subtitle, status, and close. Branding is secondary information that belongs at the periphery.

### Documentation Site Technology

Use **VitePress** because:
- Built on Vite (same build tool as the widget -- team already knows Vite config patterns)
- Excellent GitHub Pages deployment with a built-in GitHub Actions workflow template
- Markdown-first with optional Vue component embedding for live demos later
- Beautiful default theme needs zero customization to look professional
- Lighter weight than Docusaurus (no React dependency, faster builds)
- Active maintenance by the Vue.js team

Documentation structure:
```
docs/
  .vitepress/config.ts
  index.md              (hero page with install snippet)
  guide/
    installation.md     (CDN script tag + npm install)
    quick-start.md      (minimal working example)
    attributes.md       (title, subtitle, greeting, position, etc.)
    theming.md          (CSS custom properties + CSS parts reference)
    events.md           (w1-connected, w1-disconnected, etc.)
  examples/
    basic.md            (minimal setup)
    themed.md           (custom colors and branding)
    framework.md        (React, Vue, Angular integration)
```

### CI/CD Pipeline Architecture

```
Trigger: GitHub Release published (tag pattern: v*)

Job 1: quality-gate
  - actions/checkout@v4
  - actions/setup-node@v4 (Node 20)
  - npm ci
  - npm run build
  - npm test
  - npm audit --audit-level=moderate

Job 2: publish (needs: quality-gate, environment: npm)
  permissions:
    id-token: write    # OIDC for trusted publishing
    contents: read
  - actions/checkout@v4
  - actions/setup-node@v4 (Node 20, registry-url: 'https://registry.npmjs.org')
  - npm ci
  - npm run build
  - npm publish        # No NODE_AUTH_TOKEN needed, OIDC handles auth
                       # Provenance attestations auto-generated
```

**Setup requirement:** A package admin must configure the trusted publisher on npmjs.com before the first CI publish. Settings: org = repo owner, repo = widget, workflow = exact filename (e.g., `publish.yml`), environment = `npm`.

### Greeting Message -- What Already Works

From code review of `work1-chat-widget.ts` and `chat-store.ts`:
- `greeting` property is declared with `@property({ type: String })`
- `handleOpen()` calls `this.store.toggleOpen(this.greeting)`
- `ChatStore.toggleOpen(greeting)` adds the greeting as an agent message with `greetingAdded` dedup flag
- The greeting renders as a normal agent message bubble with markdown support

What needs verification:
- Does it render correctly in the message list? (visual check)
- Does the `greetingAdded` flag persist across close/reopen? (it should -- flag is on ChatStore instance)
- Is there test coverage for greeting display?
- Is there a playground control to set the greeting at runtime?

---

## Competitor Feature Analysis (v0.3-specific features)

| Feature | Intercom | Crisp | Drift | Our v0.3 Approach |
|---------|----------|-------|-------|--------------------|
| Configurable title | JS config object | Settings panel | JS config | HTML attribute `title` (framework-agnostic, no JS required) |
| Subtitle / tagline | "We typically reply in..." | Agent online status | "Online" / "Away" | HTML attribute `subtitle`, developer-controlled plain text |
| Connection status | Implicit (shows agent availability) | Green dot on agent avatar | "Online" text label | Explicit 3-state dot in header with aria-label for accessibility |
| Greeting message | Rules engine with triggers and targeting | Auto-message with delay | Playbook-driven sequences | Simple `greeting` attribute, appears once on first panel open |
| Branding badge | "We run on Intercom" (paid plans remove it) | "Powered by Crisp" (paid removes) | Drift logo | "Powered by work1.ai" with link, not removable |
| Documentation | Extensive developer docs site | API reference docs | Developer hub | VitePress site on GitHub Pages |
| npm package | No (script tag only) | No (script tag only) | No (script tag only) | Both CDN and npm -- genuine differentiator |
| CI/CD publishing | Internal (not open source) | Internal | Internal | GitHub Actions with OIDC trusted publishing + provenance |

**Key v0.3 insight:** Most competitor widgets do not publish as npm packages or provide machine-readable API manifests. The combination of npm distribution + Custom Elements Manifest + public documentation site positions work1-chat-widget as a developer-first tool rather than a marketing-first widget. This is a meaningful differentiator for the developer audience.

---

## Sources

- [npm Trusted Publishing docs](https://docs.npmjs.com/trusted-publishers/) -- OIDC setup, classic token deprecation (HIGH confidence)
- [npm Provenance Statements](https://docs.npmjs.com/generating-provenance-statements/) -- automatic with trusted publishing (HIGH confidence)
- [GitHub blog: npm trusted publishing GA (July 2025)](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) -- confirms OIDC is generally available (HIGH confidence)
- [Custom Elements Manifest analyzer](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/) -- `@custom-elements-manifest/analyzer` with Lit support (HIGH confidence)
- [Custom Elements Manifest spec](https://github.com/webcomponents/custom-elements-manifest) -- file format for describing custom elements (HIGH confidence)
- [VitePress](https://vitepress.dev/) -- Vite-powered static site generator (HIGH confidence)
- [VitePress GitHub Pages deployment guide](https://vitepress.dev/guide/deploy) -- built-in deployment workflow (HIGH confidence)
- [Chat UI Design Patterns 2025](https://bricxlabs.com/blogs/message-screen-ui-deisgn) -- status indicator best practices (MEDIUM confidence)
- [status-indicator web component](https://github.com/tnhu/status-indicator) -- reference implementation for colored status dots (MEDIUM confidence)
- Existing codebase: `chat-header.ts`, `work1-chat-widget.ts`, `chat-store.ts`, `chat-store.types.ts` (HIGH confidence -- primary source)

---
*Feature research for: work1-chat-widget v0.3 customization, docs, and CI/CD*
*Researched: 2026-03-07*
