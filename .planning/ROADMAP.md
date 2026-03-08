# Roadmap: Work1 Chat Widget

## Milestones

- ✅ **v0.1 Work1 Chat Widget** — Phases 1-6 (shipped 2026-03-07)
- ✅ **v0.2 Dev Playground** — Phases 7-9 (shipped 2026-03-07)
- 🚧 **v0.3 Customization, Docs & CI/CD** — Phases 10-13 (in progress)

## Phases

<details>
<summary>✅ v0.1 Work1 Chat Widget (Phases 1-6) — SHIPPED 2026-03-07</summary>

- [x] Phase 1: Connection Layer (3/3 plans) — completed 2026-03-04
- [x] Phase 2: UI Shell & Messaging (4/4 plans) — completed 2026-03-04
- [x] Phase 3: Streaming & Content (2/2 plans) — completed 2026-03-04
- [x] Phase 4: Theming & Encapsulation (3/3 plans) — completed 2026-03-05
- [x] Phase 5: Responsive & Distribution (2/2 plans) — completed 2026-03-06
- [x] Phase 6: Test Suites (3/3 plans) — completed 2026-03-06

</details>

<details>
<summary>✅ v0.2 Dev Playground (Phases 7-9) — SHIPPED 2026-03-07</summary>

- [x] Phase 7: Playground Infrastructure (1/1 plan) — completed 2026-03-07
- [x] Phase 8: Mock WebSocket Server (2/2 plans) — completed 2026-03-07
- [x] Phase 9: Control Panel (2/2 plans) — completed 2026-03-07

</details>

### 🚧 v0.3 Customization, Docs & CI/CD (In Progress)

**Milestone Goal:** Add content customization (title, subtitle, greeting), connection status feedback, updated branding, a documentation site, and CI/CD for npm publishing.

- [x] **Phase 10: Content Customization** - Configurable chat title, subtitle, and greeting message via HTML attributes (completed 2026-03-08)
- [x] **Phase 11: Connection Status & Branding** - Connection state indicator in title bar and updated branding badge (completed 2026-03-08)
- [x] **Phase 12: Documentation Site** - VitePress documentation published to GitHub Pages (completed 2026-03-08)
- [x] **Phase 13: CI/CD Pipeline** - GitHub Actions for build/test, npm publish, and docs deployment (completed 2026-03-08)

## Phase Details

### Phase 10: Content Customization
**Goal**: Users can personalize the chat widget text content through HTML attributes
**Depends on**: Phase 9 (existing widget codebase)
**Requirements**: CUST-01, CUST-02, CUST-03, CUST-04
**Success Criteria** (what must be TRUE):
  1. Setting `chat-title="Support"` on the widget element changes the visible header title to "Support"
  2. The native browser tooltip no longer appears on hover over the widget (title property renamed to chat-title)
  3. Setting `chat-subtitle="We usually reply in minutes"` displays subtitle text below the title in the header
  4. Setting `greeting="Hello! How can I help?"` displays that text as the first agent message after WebSocket connects, without sending it to the server
**Plans:** 1/1 plans complete
Plans:
- [ ] 10-01-PLAN.md — Rename title to chat-title, add subtitle, move greeting to post-connect

### Phase 11: Connection Status & Branding
**Goal**: Users see real-time connection state feedback and updated work1.ai branding
**Depends on**: Phase 10
**Requirements**: CONN-01, CONN-02, CONN-03, BRAND-01, BRAND-02
**Success Criteria** (what must be TRUE):
  1. A green dot appears in the title bar when WebSocket is connected and ready
  2. A yellow dot appears in the title bar while WebSocket is connecting
  3. A red dot appears in the title bar when WebSocket is disconnected or connection fails
  4. The badge at the bottom of the chat panel reads "Powered by work1.ai" and clicking it opens https://work1.ai in a new tab
**Plans:** 1/1 plans complete
Plans:
- [ ] 11-01-PLAN.md — Add connection status dot to header and update branding badge link

### Phase 12: Documentation Site
**Goal**: Widget consumers can find complete usage documentation on a public site
**Depends on**: Phase 11 (docs describe final v0.3 feature set)
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05
**Success Criteria** (what must be TRUE):
  1. A VitePress site is accessible at the project's GitHub Pages URL
  2. The integration guide explains both script tag and npm installation with working code examples
  3. The API reference lists every HTML attribute and CSS custom property with descriptions and defaults
  4. The theming guide shows how to customize colors, position, and size with visual examples
  5. The connection/events page documents WebSocket lifecycle and DOM events the host page can listen for
**Plans:** 3/3 plans complete
Plans:
- [ ] 12-01-PLAN.md — VitePress infrastructure, landing page, and integration guide
- [ ] 12-02-PLAN.md — API reference and theming guide with live demo
- [ ] 12-03-PLAN.md — Events & connection page and visual site verification

### Phase 13: CI/CD Pipeline
**Goal**: Widget builds, tests, publishes, and deploys docs automatically via GitHub Actions
**Depends on**: Phase 12 (docs site must exist for docs deployment workflow)
**Requirements**: CICD-01, CICD-02, CICD-03, CICD-04
**Success Criteria** (what must be TRUE):
  1. Every push and pull request triggers a CI workflow that runs build and tests, blocking merge on failure
  2. Creating a GitHub Release triggers npm publish of @work1ai/chat-widget with the release version
  3. Published npm packages include provenance attestation (--provenance flag)
  4. Documentation site automatically deploys to GitHub Pages when docs content changes
**Plans:** 1/1 plans complete
Plans:
- [ ] 13-01-PLAN.md — CI, npm publish, and docs deployment GitHub Actions workflows

## Progress

**Execution Order:**
Phases execute in numeric order: 10 -> 11 -> 12 -> 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Connection Layer | v0.1 | 3/3 | Complete | 2026-03-04 |
| 2. UI Shell & Messaging | v0.1 | 4/4 | Complete | 2026-03-04 |
| 3. Streaming & Content | v0.1 | 2/2 | Complete | 2026-03-04 |
| 4. Theming & Encapsulation | v0.1 | 3/3 | Complete | 2026-03-05 |
| 5. Responsive & Distribution | v0.1 | 2/2 | Complete | 2026-03-06 |
| 6. Test Suites | v0.1 | 3/3 | Complete | 2026-03-06 |
| 7. Playground Infrastructure | v0.2 | 1/1 | Complete | 2026-03-07 |
| 8. Mock WebSocket Server | v0.2 | 2/2 | Complete | 2026-03-07 |
| 9. Control Panel | v0.2 | 2/2 | Complete | 2026-03-07 |
| 10. Content Customization | v0.3 | 1/1 | Complete | 2026-03-08 |
| 11. Connection Status & Branding | v0.3 | 1/1 | Complete | 2026-03-08 |
| 12. Documentation Site | v0.3 | 3/3 | Complete | 2026-03-08 |
| 13. CI/CD Pipeline | 1/1 | Complete    | 2026-03-08 | - |
