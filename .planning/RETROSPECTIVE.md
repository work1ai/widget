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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v0.1 | 6 | 17 | Initial delivery — established bottom-up architecture pattern |

### Cumulative Quality

| Milestone | Tests | Coverage | LOC |
|-----------|-------|----------|-----|
| v0.1 | 65 | 80%+ | 3,085 |

### Top Lessons (Verified Across Milestones)

1. (Awaiting second milestone for cross-validation)
