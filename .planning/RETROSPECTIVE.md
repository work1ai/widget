# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v0.1 — Work1 Chat Widget

**Shipped:** 2026-03-07
**Phases:** 6 | **Plans:** 17

### What Was Built
- Full WebSocket chat client implementing chat-server v0.1.0 protocol (8 event types)
- Reactive UI: floating bubble, slide-up panel, message list with scroll management, auto-grow input
- Real-time token streaming with markdown rendering (marked + DOMPurify sanitization)
- Deep theming system: 10 CSS custom properties, ::part() selectors, HTML attributes, custom bubble icons
- Mobile responsive layout with visualViewport keyboard handling
- Dual-format distribution: IIFE (116 KB) + ESM (36 KB) with TypeScript declarations
- 65 tests: unit (ChatClient, ChatStore, markdown), component (5 UI states), integration (message flow, reconnection)

### What Worked
- Bottom-up architecture (connection -> state -> UI -> theming -> distribution -> tests) kept each phase focused with clear dependencies
- Three-layer separation (ChatClient/ChatStore/UI) made unit testing straightforward
- Parallel plan execution within phases accelerated delivery
- IIFE vs UMD decision early avoided late-stage bundling issues
- Co-located test files kept test-to-source mapping obvious

### What Was Inefficient
- setupDOMEventForwarding() left as empty stub from Phase 2 — "Phase 3 will add" comment never addressed
- sessionId getter returning null — integration gap between ChatClient and ChatStore not caught until audit
- Nyquist VALIDATION.md not maintained across phases (only partial in Phase 6)
- Some phase progress tracking in ROADMAP.md got out of sync (phases 1-4 showed unchecked despite completion)

### Patterns Established
- ReactiveController pattern for bridging WebSocket events to Lit rendering
- Sentinel-based IntersectionObserver for scroll management (no scroll event listeners)
- Dynamic style element for attribute-to-CSS-custom-property mapping
- Two separate Vite configs for ESM/IIFE builds (Rollup external limitation)
- vi.waitFor() for async state assertions in integration tests

### Key Lessons
1. Integration gaps between layers (ChatClient -> ChatStore -> DOM events) need explicit verification, not just per-layer unit tests
2. "Phase N will add" comments become permanent tech debt — address stubs in the phase that creates them or create explicit follow-up items
3. happy-dom works better than jsdom for Lit/Web Component testing (ESM compatibility)
4. DOMPurify ALLOWED_TAGS needs explicit span/div for markdown output — default is too restrictive

### Cost Observations
- Sessions: ~15 across 3 days
- Notable: Entire v0.1 (6 phases, 17 plans, 3,085 LOC) completed in 3 calendar days

---

## Milestone: v0.2 — Dev Playground

**Shipped:** 2026-03-07
**Phases:** 3 | **Plans:** 5

### What Was Built
- Vite dev playground on port 5180 with hot reload, fully excluded from production bundles
- WebSocket constructor injection across ChatClient/ChatStore/Widget chain for mock/real switching
- MockWebSocket class with token-by-token streaming (40ms delay) and 6 triggerable scenarios
- Playground control panel Lit component with 10-color theme picker, mock/real toggle, scenario buttons
- 14 unit tests for playground controls covering all 7 requirement IDs

### What Worked
- Options object pattern for connect() made WebSocket injection backward-compatible with zero test breakage beyond one assertion update
- Reuse of three-layer architecture meant mock injection only needed 3 files modified
- Separate Vite config pattern (established in v0.1) made playground config trivial
- Quick milestone — 5 plans completed in 11 minutes total execution time

### What Was Inefficient
- Phase 7 showed as "Not started" in ROADMAP.md progress table despite being complete — roadmap tracking got out of sync again (same issue as v0.1)
- Nyquist VALIDATION.md still incomplete — partial for phases 8-9, missing for phase 7
- controls.ts uses `(widget as any)` cast for private method access — type safety gap

### Patterns Established
- Constructor injection pattern for swapping WebSocket implementations at runtime
- MockWebSocket.instance singleton for console + UI scenario triggering
- Playground test pattern: mock widget as plain div with spied DOM methods
- Playground controls as external Lit component manipulating widget via setAttribute/style.setProperty

### Key Lessons
1. ROADMAP.md progress table needs automatic sync — manual tracking falls behind consistently
2. Nyquist validation needs to be part of plan execution, not a separate step — it keeps getting skipped
3. Constructor injection (options object pattern) is the cleanest approach for runtime implementation swapping
4. Playground code can live outside src/ and still import from it cleanly via Vite resolution

### Cost Observations
- Sessions: ~3
- Notable: Entire v0.2 (3 phases, 5 plans, 10 tasks) completed in 1 day with 11 min total execution

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v0.1 | 6 | 17 | Initial delivery — established bottom-up architecture pattern |
| v0.2 | 3 | 5 | Dev tooling — reused v0.1 architecture for playground and mock system |

### Cumulative Quality

| Milestone | Tests | Coverage | LOC |
|-----------|-------|----------|-----|
| v0.1 | 65 | 80%+ | 3,085 |
| v0.2 | 79 | 80%+ | 4,191 |

### Top Lessons (Verified Across Milestones)

1. ROADMAP.md progress table falls out of sync — happened in both v0.1 and v0.2. Consider automating or removing manual table.
2. Nyquist VALIDATION.md consistently skipped — incomplete in both milestones. Needs workflow integration or explicit decision to drop.
3. Bottom-up architecture enables fast iteration — v0.1 patterns (three-layer, separate configs) directly accelerated v0.2.
