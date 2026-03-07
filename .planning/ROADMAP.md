# Roadmap: Work1 Chat Widget

## Milestones

- ✅ **v0.1 Work1 Chat Widget** - Phases 1-6 (shipped 2026-03-07)
- 🚧 **v0.2 Dev Playground** - Phases 7-9 (in progress)

## Phases

<details>
<summary>✅ v0.1 Work1 Chat Widget (Phases 1-6) - SHIPPED 2026-03-07</summary>

- [x] Phase 1: Connection Layer (3/3 plans) - completed 2026-03-04
- [x] Phase 2: UI Shell & Messaging (4/4 plans) - completed 2026-03-04
- [x] Phase 3: Streaming & Content (2/2 plans) - completed 2026-03-04
- [x] Phase 4: Theming & Encapsulation (3/3 plans) - completed 2026-03-05
- [x] Phase 5: Responsive & Distribution (2/2 plans) - completed 2026-03-06
- [x] Phase 6: Test Suites (3/3 plans) - completed 2026-03-06

</details>

### v0.2 Dev Playground (In Progress)

- [ ] **Phase 7: Playground Infrastructure** - Dev page served via Vite with local widget source, excluded from distribution
- [ ] **Phase 8: Mock WebSocket Server** - Client-side mock that simulates backend streaming and protocol scenarios
- [ ] **Phase 9: Control Panel** - Runtime controls for theming, connection, and scenario triggering

## Phase Details

### Phase 7: Playground Infrastructure
**Goal**: Developers have a local playground page for testing the widget without touching production bundles
**Depends on**: Phase 6 (v0.1 complete)
**Requirements**: PLAY-01, PLAY-02, PLAY-03
**Success Criteria** (what must be TRUE):
  1. Running `npm run playground` opens a browser page with the chat widget rendered
  2. Changes to widget source files hot-reload in the playground without manual refresh
  3. Running `npm run build` produces CDN and npm bundles that contain zero playground code
**Plans**: 1 plan

Plans:
- [ ] 07-01-PLAN.md — Vite playground config, HTML page, and bundle exclusion verification

### Phase 8: Mock WebSocket Server
**Goal**: Developers can test widget behavior against simulated backend responses without a real server
**Depends on**: Phase 7
**Requirements**: MOCK-01, MOCK-02, MOCK-03, MOCK-04, MOCK-05
**Success Criteria** (what must be TRUE):
  1. Sending a message in the widget with mock mode active returns an echoed response with visible token-by-token streaming
  2. Mock server delivers a greeting message on connection that renders in the chat panel
  3. Mock server can produce a long markdown response that exercises heading, list, code block, and link rendering
  4. Mock server can simulate error and session-end protocol events that trigger the widget's error and session-end UI states
**Plans**: 2 plans

Plans:
- [ ] 08-01-PLAN.md — WebSocket constructor injection into ChatClient, ChatStore, and widget
- [ ] 08-02-PLAN.md — MockWebSocket class, canned scenarios, and playground wiring

### Phase 9: Control Panel
**Goal**: Developers can interactively configure every widget property and trigger test scenarios from a single control surface
**Depends on**: Phase 8
**Requirements**: CTRL-01, CTRL-02, CTRL-03, CTRL-04, CONN-01, CONN-02, MOCK-06
**Success Criteria** (what must be TRUE):
  1. Changing a theme color in the control panel immediately updates the widget's appearance without page reload
  2. Toggling position, width, height, and bubble icon in the controls reflects instantly on the widget
  3. Entering a WebSocket URL and toggling from mock to real mode connects the widget to a live backend
  4. Clicking a scenario button (greeting, long markdown, error, session end) in the control panel triggers that mock scenario in the chat
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

## Progress

**Execution Order:** 7 -> 8 -> 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Connection Layer | v0.1 | 3/3 | Complete | 2026-03-04 |
| 2. UI Shell & Messaging | v0.1 | 4/4 | Complete | 2026-03-04 |
| 3. Streaming & Content | v0.1 | 2/2 | Complete | 2026-03-04 |
| 4. Theming & Encapsulation | v0.1 | 3/3 | Complete | 2026-03-05 |
| 5. Responsive & Distribution | v0.1 | 2/2 | Complete | 2026-03-06 |
| 6. Test Suites | v0.1 | 3/3 | Complete | 2026-03-06 |
| 7. Playground Infrastructure | v0.2 | 0/1 | Not started | - |
| 8. Mock WebSocket Server | v0.2 | 0/2 | Not started | - |
| 9. Control Panel | v0.2 | 0/? | Not started | - |
