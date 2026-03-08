# Domain Pitfalls

**Domain:** Adding configurable content attributes, connection status indicators, docs site, and npm CI/CD publishing to a Lit Web Component chat widget
**Researched:** 2026-03-07
**Milestone:** v0.3 Customization, Docs & CI/CD

## Scope

This document covers pitfalls specific to v0.3 features being added to the existing widget. Core widget pitfalls (XSS, streaming jank, CSP, Shadow DOM isolation) were addressed in v0.1/v0.2 and remain valid.

---

## Critical Pitfalls

Mistakes that cause rewrites, broken releases, or user-facing bugs that are expensive to fix.

### Pitfall 1: `title` Property Overrides HTMLElement.title, Causing Native Browser Tooltips

**What goes wrong:** The widget already declares `override title: string = 'Chat'` as a `@property()` at line 49 of `work1-chat-widget.ts`. The native `HTMLElement.title` property controls the browser's tooltip popup -- hovering anywhere over the `<work1-chat-widget>` element shows an ugly native tooltip with the chat title text ("Chat" by default). This is invisible during development (developers click, not hover) but immediately noticed by end users.

**Why it happens:** `title` is an inherited property from `HTMLElement`. Lit allows overriding it and the TypeScript `override` keyword is type-correct, but the browser still reads `HTMLElement.title` for native tooltip behavior. The existing code sets the property value which the browser interprets as the element's tooltip text.

**Consequences:** Every customer site shows a browser-native tooltip on hover. Users report it as a bug. Fixing it later by renaming the attribute is a breaking API change for anyone already using `title="..."` in their HTML.

**Prevention:**
- Rename the attribute to `chat-title` (property: `chatTitle`) NOW, before v0.3 ships and before external consumers adopt the `title` attribute. The widget is pre-1.0, so this is the right time.
- For subtitle, use `chat-subtitle` (property: `chatSubtitle`) for naming consistency.
- After renaming, set `this.title = ''` in `connectedCallback()` to clear any residual native tooltip behavior.

**Detection:** Hover over the widget custom element in any browser. If a yellow/white native tooltip appears, the pitfall is active. **This bug exists in the current codebase right now.**

**Confidence:** HIGH -- verified against existing code and [LitElement issue #133](https://github.com/lit/lit-element/issues/133).

---

### Pitfall 2: npm Classic Tokens Revoked -- OIDC Trusted Publishing Now Required

**What goes wrong:** Setting up CI/CD with a traditional `NPM_TOKEN` secret stored as a GitHub repo secret either fails immediately (if using a Classic token, which are all revoked) or creates a recurring maintenance burden (Granular tokens expire every 90 days max).

**Why it happens:** npm permanently deprecated and revoked all Classic Tokens on December 9, 2025. Most GitHub Actions npm publishing tutorials from before late 2025 use the Classic token pattern. Granular tokens still work but require manual rotation every 90 days with mandatory 2FA.

**Consequences:** Publishing breaks silently after token expiry with a "401 Unauthorized" error. Or: OIDC is set up incorrectly and fails on first publish with unhelpful errors.

**Prevention:**
- Use OIDC Trusted Publishing from the start -- it eliminates token management entirely.
- Critical OIDC requirements (all must be met):
  1. `permissions: { id-token: write }` in the GitHub Actions publish job
  2. npm CLI >= 11.5.1 (add `npm install -g npm@latest` step)
  3. `--provenance` flag on `npm publish` command
  4. `repository.url` in `package.json` must exactly match `git+https://github.com/owner/widget.git`
  5. Configure trusted publisher at `npmjs.com/package/@work1ai/chat-widget/access`
  6. `setup-node` must include `registry-url: 'https://registry.npmjs.org'` explicitly (triggers .npmrc write)
- **Bootstrap problem:** First publish must use a Granular token because OIDC requires the package to already exist. Plan this one-time manual step.
- **Fallback option:** If OIDC complexity is blocking, use a Granular token with a calendar reminder for rotation. But OIDC is strictly better long-term.

**Detection:** Set up a dry-run workflow first: `npm publish --dry-run --provenance --access public`. If it fails with auth errors, debug each requirement above sequentially.

**Confidence:** HIGH -- [npm Trusted Publishing docs](https://docs.npmjs.com/trusted-publishers/), [OIDC GA July 2025](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/), [practical gotchas](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/).

---

### Pitfall 3: Publishing a Broken Package That Cannot Be Unpublished After 24 Hours

**What goes wrong:** The npm package publishes with missing `dist/` files, wrong `exports` paths, or missing type declarations. Consumers install the package and get module-not-found errors. After 24 hours, npm blocks unpublish -- the only recourse is `npm deprecate` plus a new version.

**Why it happens:** The current `package.json` has no `prepublishOnly` script. Running `npm publish` without building first ships an empty or stale `dist/`. The `files` field is `["dist", "README.md"]` which is correct, but only if `dist/` contains the right files.

**Consequences:** Broken first impression. The `@work1ai/chat-widget` name is "burned" with a broken version. Consumers who pin `^0.x.0` get the broken version.

**Prevention:**
- Add `"prepublishOnly": "npm run build && npm test"` to `package.json` scripts.
- Add a CI step that runs `npm pack --dry-run` and verifies the tarball includes: `dist/work1-chat-widget.es.js`, `dist/work1-chat-widget.iife.js`, `dist/index.d.ts`.
- Before first real publish, test locally: `npm pack` then install the tarball in a scratch project. Verify `import '@work1ai/chat-widget'` resolves.
- **Scoped package gotcha:** `@work1ai/chat-widget` is a scoped package. Scoped packages are private by default. Must use `--access public` on first publish, or set `"publishConfig": { "access": "public" }` in `package.json`.

**Detection:** `npm pack --dry-run` shows exactly what will be published. If `dist/` is empty or missing key files, the build was skipped.

**Confidence:** HIGH -- verified against current `package.json` (no `prepublishOnly`, no `publishConfig`).

---

### Pitfall 4: Connection Status Indicator Exposes Existing Race Conditions

**What goes wrong:** The connection status dot shows the wrong color during rapid state transitions. Example: open panel -> connecting (yellow) -> server rejects -> user retries -> connecting again. The indicator gets stuck on green or yellow because stale event handlers from a previous ChatClient instance fire and overwrite the current state.

**Why it happens:** In `chat-store.ts`, `connect()` creates a new ChatClient and wires event handlers via `wireClientEvents()`. But the event handlers are closures that reference `this` (the store), not the specific client instance. If client A fires `connected` after client B has been created, the store's `connectionState` is incorrectly set to `connected`. Before v0.3, this race was invisible because there was no visual indicator. The status dot makes it user-facing.

**Consequences:** Users see a green dot when disconnected, or a permanently yellow dot. Trust in the widget is eroded.

**Prevention:**
- Add a connection generation counter to ChatStore. Increment on each `connect()`. Capture the current generation in each event handler closure. If generation has changed when the event fires, ignore it.
- In `disconnect()`, null the client reference BEFORE calling `client.disconnect()` so stale handlers find null.
- Write a test: `store.connect()`, `store.disconnect()`, `store.connect()` in rapid succession -- verify final `connectionState` settles correctly.

**Detection:** Add the status indicator to the dev playground and rapidly click connect/disconnect while watching the dot color.

**Confidence:** MEDIUM -- race is structurally present in the code but may not manifest under normal network conditions.

---

## Moderate Pitfalls

### Pitfall 5: GitHub Pages Base Path Misconfiguration

**What goes wrong:** Docs site deploys to GitHub Pages (green CI check) but all assets return 404. The page is blank or completely unstyled.

**Why it happens:** GitHub Pages serves project sites from `https://user.github.io/repo-name/`, not the root. If VitePress is not configured with `base: '/widget/'`, asset paths resolve to the wrong URL. Additionally, GitHub's default Jekyll processing removes files starting with `_` or `.`, which VitePress uses.

**Prevention:**
- Set `base: '/widget/'` in `.vitepress/config.ts` from the start.
- Add `.nojekyll` file to deployed output (VitePress does this automatically, but verify).
- In repo Settings > Pages, set source to "GitHub Actions" (not "Deploy from a branch").
- Use a separate workflow for docs deployment, not appended to the main CI workflow.

**Detection:** After deployment, check browser Network tab. If assets load from `/assets/` instead of `/widget/assets/`, base path is wrong.

**Confidence:** HIGH -- [VitePress deploy docs](https://vitepress.dev/guide/deploy).

---

### Pitfall 6: Greeting + Connecting State Creates Contradictory UX

**What goes wrong:** Widget shows greeting message ("Hi! How can I help?") immediately on panel open, but the connection status dot shows yellow (connecting). User sees an "agent message" plus a "not connected" indicator simultaneously, creating confusion about whether the agent is ready.

**Why it happens:** The greeting is added in `toggleOpen()` before `connect()` is called. This is intentional for perceived speed. But adding both a greeting AND a visible status indicator in the same milestone surfaces the visual contradiction.

**Prevention:**
- Keep greeting behavior as-is (it provides good perceived speed).
- Style the status dot to be subtle and informational (small dot in header), not alarming (no banner).
- Consider showing "Connecting..." as the subtitle text during the connecting phase, transitioning to the actual subtitle once connected.
- Do NOT delay the greeting until connection -- that defeats the purpose.

**Detection:** Open panel on throttled network ("Slow 3G" in dev tools). Observe whether the greeting + yellow dot feels natural or contradictory.

**Confidence:** MEDIUM -- UX judgment, not a technical bug.

---

### Pitfall 7: Missing `reflect: true` on New Attributes

**What goes wrong:** New attributes like `chat-title` and `chat-subtitle` are added without `reflect: true`. Setting the property via JavaScript (`widget.chatTitle = 'New'`) does not update the HTML attribute, breaking CSS attribute selectors and `getAttribute()`.

**Why it happens:** Lit's default is one-way binding: HTML attribute -> JS property. Without `reflect: true`, changes to the property are not written back to the DOM attribute.

**Prevention:**
- Add `reflect: true` for all content attributes: `chat-title`, `chat-subtitle`, `greeting`.
- If exposing connection status as an attribute, `reflect: true` is essential so CSS like `work1-chat-widget[connection-status="connected"]` works.
- Follow the existing `debug` property pattern which already uses `reflect: true`.

**Detection:** Set property via JS, then call `getAttribute()`. If null or stale, reflection is missing.

**Confidence:** HIGH -- [Lit properties docs](https://lit.dev/docs/components/properties/).

---

### Pitfall 8: Version/Tag Mismatch Causes Failed or Duplicate Publishes

**What goes wrong:** CI publishes to npm but `package.json` version does not match git tag, or same version is published twice. npm rejects with "403 Forbidden."

**Prevention:**
- Trigger publish workflow ONLY on tag push: `on: push: tags: ['v*']`.
- Validate version match in workflow: `if [ "v$(node -p 'require("./package.json").version')" != "$GITHUB_REF_NAME" ]; then exit 1; fi`.
- Document release process: `npm version patch/minor` -> push -> push tags -> CI publishes.

**Detection:** npm publish fails with 403. Compare `npm view @work1ai/chat-widget version` against `package.json`.

**Confidence:** HIGH -- standard CI/CD pattern.

---

### Pitfall 9: Duplicate Greeting on Panel Re-open

**What goes wrong:** User opens panel (greeting appears), closes it, opens again -- greeting appears a second time. Chat has duplicate greetings.

**Why it happens:** If the greeting insertion does not check whether it was already added, each `toggleOpen()` call adds another greeting message.

**Prevention:** The current code already has a `greetingAdded` boolean guard in ChatStore. Verify this guard works correctly when the greeting attribute value changes dynamically (e.g., host page updates `greeting` attribute). If the greeting text changes, should it add a new greeting? Probably not -- the guard should be "greeting was added, period" not "this specific greeting text was added."

**Detection:** Open/close the panel three times. Count greeting messages.

**Confidence:** HIGH -- guard already exists in code but needs verification for attribute-change scenarios.

---

## Minor Pitfalls

### Pitfall 10: Branding Badge Link Implemented as `<span>` Instead of `<a>`

**What goes wrong:** "Powered by work1.ai" badge is a `<span>` with click handler. Not keyboard navigable, screen readers ignore it, right-click "Open in new tab" missing.

**Prevention:** Use `<a href="https://work1.ai" target="_blank" rel="noopener noreferrer">`. The existing "Powered by AI" badge at `chat-header.ts:18` is a `<span>` -- the replacement needs to be an `<a>`.

**Confidence:** HIGH.

---

### Pitfall 11: VitePress and Widget Vite Builds Interfere

**What goes wrong:** VitePress build picks up widget's `vite.config.ts` or vice versa, causing errors.

**Prevention:** Keep VitePress in `docs/` or `site/` with its own `.vitepress/config.ts`. VitePress has its own build pipeline independent of the widget's Vite config. Do not place VitePress files in the project root.

**Confidence:** HIGH.

---

### Pitfall 12: CI Runs Full Build on Docs-Only Changes

**What goes wrong:** Editing markdown in `docs/` triggers full CI (build + test), wasting minutes.

**Prevention:** Add path filters: `paths-ignore: ['docs/**', '*.md', '.planning/**']` on the CI workflow. But DO run docs build on docs changes (separate workflow). CI minutes are free for public repos, so this is low priority.

**Confidence:** HIGH.

---

### Pitfall 13: Bundle Size Regression Not Caught by CI

**What goes wrong:** Adding connection status UI or branding CSS increases bundle size beyond 116 KB IIFE without anyone noticing.

**Prevention:** The status dot should be pure CSS (colored circle, no icon library). Promote `scripts/report-size.cjs` to a CI gate: fail if IIFE > 125 KB. Since CI/CD is being added in v0.3, this is a natural fit.

**Confidence:** HIGH -- `scripts/report-size.cjs` exists but has no CI gate.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Configurable attributes | **P1:** `title` conflicts with HTMLElement.title | Rename to `chat-title` before any consumers adopt it |
| Configurable attributes | **P7:** Missing `reflect: true` | Add reflection for all content attributes |
| Configurable attributes | **P9:** Duplicate greeting on re-open | Verify existing `greetingAdded` guard handles attribute changes |
| Connection status indicator | **P4:** Race conditions in state transitions | Add connection generation counter |
| Connection status indicator | **P6:** Greeting + connecting UX contradiction | Design indicator as subtle, not alarming |
| Connection status indicator | **P13:** Bundle size from status UI | Pure CSS dots only, no icon libraries |
| Branding badge | **P10:** Badge not a real link | Use `<a>` with `target="_blank"` |
| Documentation site | **P5:** GitHub Pages base path | Set `base` to repo name in config |
| Documentation site | **P11:** VitePress/widget build interference | Isolate in `docs/` or `site/` directory |
| CI/CD npm publishing | **P2:** Token deprecation / OIDC setup | Use OIDC Trusted Publishing; plan bootstrap |
| CI/CD npm publishing | **P3:** Broken package on npm | Add `prepublishOnly`, verify with `npm pack`, set `publishConfig.access` |
| CI/CD npm publishing | **P8:** Version/tag mismatch | Trigger on tag push only, validate match |
| CI/CD npm publishing | **P12:** CI runs on docs changes | Add path filters to workflows |

## Integration Gotchas for v0.3

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `chat-title` + `renderHeader()` | Forgetting to pass subtitle to header | Update `renderHeader()` signature to accept title, subtitle, and status; keep it a pure render function |
| Connection status + `ConnectionState` type | Only handling 3 states (connected/connecting/disconnected) | The existing `ConnectionState` type includes `'reconnecting'` -- the status dot needs 4 visual states |
| OIDC + scoped packages | Scoped packages are private by default on npm | Add `"publishConfig": { "access": "public" }` to `package.json` or use `--access public` |
| Docs site + widget playground | Trying to embed live playground in docs | Do not embed -- different build/deploy pipelines. Link to playground or use static code examples |
| Dual CI workflows | Docs and publish both trigger on same event | Docs deploys on push to main (content). Publishing deploys on tag push only (versions) |

## Sources

- [LitElement title/global attribute conflict - Issue #133](https://github.com/lit/lit-element/issues/133) -- HIGH confidence
- [Lit Reactive Properties Documentation](https://lit.dev/docs/components/properties/) -- HIGH confidence
- [HTMLElement.title - MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/title) -- HIGH confidence
- [npm Trusted Publishing Docs](https://docs.npmjs.com/trusted-publishers/) -- HIGH confidence
- [npm OIDC GA Announcement July 2025](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) -- HIGH confidence
- [Trusted Publishing Practical Guide](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/) -- HIGH confidence
- [npm Classic Token Deprecation](https://dev.to/zhangjintao/from-deprecated-npm-classic-tokens-to-oidc-trusted-publishing-a-cicd-troubleshooting-journey-4h8b) -- HIGH confidence
- [VitePress GitHub Pages Deployment](https://vitepress.dev/guide/deploy) -- HIGH confidence
- [npm Provenance with GitHub Actions](https://www.thecandidstartup.org/2026/01/26/bootstrapping-npm-provenance-github-actions.html) -- MEDIUM confidence

---
*Pitfalls research for: Work1 Chat Widget v0.3 (customization, docs, CI/CD)*
*Researched: 2026-03-07*
