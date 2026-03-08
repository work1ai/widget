# Research Summary: Work1 Chat Widget v0.3

**Domain:** Embeddable AI chat widget -- customization, documentation site, CI/CD
**Researched:** 2026-03-07
**Overall confidence:** HIGH

## Executive Summary

The v0.3 milestone adds five capabilities to the existing widget: configurable title/subtitle/greeting message, connection status indicator, branding badge, a public documentation site, and CI/CD for npm publishing. Research confirms that four of these five features require zero new production dependencies -- they are straightforward Lit component patterns using the existing stack. The only new tooling needed is VitePress (devDependency) for the documentation site and GitHub Actions workflow files for CI/CD.

VitePress 1.6.4 is the recommended documentation generator because it shares the Vite build pipeline already in use, requires minimal configuration, and includes built-in search, dark mode, and an officially documented GitHub Pages deployment workflow. Alternatives (Docusaurus, Starlight) were evaluated and rejected: Docusaurus adds React as a dependency, and Starlight introduces the Astro framework -- both are unnecessary overhead for a Lit-based project.

For CI/CD, three GitHub Actions workflows cover the requirements: a CI workflow (build + test on every push/PR), a publish workflow (npm publish on GitHub Release), and a docs workflow (VitePress build + GitHub Pages deploy). npm publishing uses token-based authentication with `--provenance` attestation rather than the newer OIDC trusted publishing, because OIDC requires Node >= 24 or npm >= 11.5.1 and the project currently targets Node 20.x LTS.

The connection status indicator, configurable title/subtitle/greeting, and branding badge are all pure UI features that map directly to existing Lit reactive property patterns and CSS. No new libraries, no architectural changes -- just new `@property()` declarations and template additions to existing components.

## Key Findings

**Stack:** Add only VitePress + Vue as devDependencies. Zero new production dependencies.
**Architecture:** No architectural changes needed. New features integrate into existing component tree.
**Critical pitfall:** VitePress `base` path misconfiguration will cause broken links on GitHub Pages. GitHub Actions npm publish requires `id-token: write` permission even for token-based provenance.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Content Customization** - Add title/subtitle/greeting attributes and connection status indicator
   - Addresses: Configurable text content, connection state visibility
   - Rationale: Pure Lit component work with no external dependencies. Low risk, high impact. Can be shipped and tested immediately.

2. **Branding Update** - Replace "Powered by AI" badge with "Powered by work1.ai" link
   - Addresses: Branding requirement
   - Rationale: Simple HTML/CSS change. Quick win, minimal risk.

3. **Documentation Site** - Set up VitePress, write docs, configure GitHub Pages deployment
   - Addresses: Public documentation for widget consumers
   - Rationale: Requires installing VitePress, creating site structure, writing content. More effort but independent of widget code changes.

4. **CI/CD Pipeline** - GitHub Actions for build/test, npm publish, and docs deploy
   - Addresses: Automated testing, npm publishing, docs deployment
   - Rationale: Depends on having docs to deploy (Phase 3). npm publish workflow should be set up after the widget features are complete.

**Phase ordering rationale:**
- Widget features (Phases 1-2) first because they change the widget codebase and need testing before the CI pipeline gates on them.
- Docs site (Phase 3) after widget features because docs should describe the final v0.3 feature set.
- CI/CD (Phase 4) last because it automates processes that should be validated manually first. The docs workflow depends on the docs site existing.

**Research flags for phases:**
- Phase 1 (Content Customization): Standard Lit patterns, unlikely to need research. Connection status maps directly to existing WebSocket lifecycle events.
- Phase 3 (Docs Site): VitePress setup is well-documented, but the `base` path configuration for GitHub Pages and the exact VitePress config structure should be verified during implementation.
- Phase 4 (CI/CD): npm publish workflow is standard, but `--provenance` flag requirements and `id-token: write` permission should be tested before the first real publish.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (VitePress) | HIGH | Stable 1.x release, well-documented, official GitHub Pages workflow |
| Stack (GitHub Actions) | HIGH | Official GitHub documentation, standard patterns |
| Features (title/subtitle/greeting) | HIGH | Standard Lit @property() patterns, already used in widget |
| Features (connection status) | HIGH | Maps directly to existing WebSocket lifecycle in ChatClient |
| Features (branding) | HIGH | Simple HTML/CSS change |
| Architecture | HIGH | No changes needed -- features plug into existing structure |
| Pitfalls | HIGH | Well-understood GitHub Actions and VitePress gotchas |

## Gaps to Address

- VitePress site structure (sidebar, navigation) should be designed during Phase 3 planning, not researched further now.
- npm trusted publishing (OIDC) is deferred to a future milestone when the project upgrades to Node 24 LTS.
- Bundle size impact of v0.3 features is negligible (status dot + text attributes + branding link add < 1KB), so no bundle analysis needed.

## Sources

- [VitePress official site](https://vitepress.dev/) -- v1.6.4 stable
- [VitePress deploy guide](https://vitepress.dev/guide/deploy) -- GitHub Pages workflow
- [GitHub Docs: Publishing Node.js packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
- [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) -- deferred, requires Node 24
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements/)

---
*Research completed: 2026-03-07*
*Ready for roadmap: yes*
