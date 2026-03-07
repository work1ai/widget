# Requirements: Work1 Chat Widget

**Defined:** 2026-03-07
**Core Value:** The widget must reliably connect to the chat backend and stream agent responses in real time

## v0.2 Requirements

Requirements for Dev Playground milestone. Each maps to roadmap phases.

### Playground Infrastructure

- [x] **PLAY-01**: Developer can launch playground via `npm run playground` using Vite dev server
- [x] **PLAY-02**: Playground page loads the widget from local source (not built bundle)
- [x] **PLAY-03**: Playground files are excluded from CDN and npm distribution bundles

### Visual Controls

- [ ] **CTRL-01**: Developer can change theme colors (primary, background, text) at runtime via control panel
- [ ] **CTRL-02**: Developer can change widget position (bottom-left, bottom-right) at runtime
- [ ] **CTRL-03**: Developer can adjust widget dimensions (width, height) at runtime
- [ ] **CTRL-04**: Developer can set a custom bubble icon at runtime

### Connection

- [ ] **CONN-01**: Developer can enter a WebSocket URL to connect to a real backend
- [ ] **CONN-02**: Developer can toggle between mock and real WebSocket connection

### Mock WebSocket

- [x] **MOCK-01**: Mock server echoes user messages back with simulated streaming tokens
- [ ] **MOCK-02**: Mock server supports canned greeting scenario
- [ ] **MOCK-03**: Mock server supports canned long markdown response scenario
- [ ] **MOCK-04**: Mock server supports canned error state scenarios
- [ ] **MOCK-05**: Mock server supports canned session end scenario
- [ ] **MOCK-06**: Developer can trigger specific scenarios via buttons in the control panel

## Future Requirements

Deferred to subsequent milestones. Not in current roadmap.

### Accessibility

- **A11Y-01**: WCAG 2.1 AA keyboard navigation and focus trapping
- **A11Y-02**: ARIA labels and roles on all interactive elements
- **A11Y-03**: Color contrast compliance

### Features

- **FEAT-01**: Copy message content button on agent messages
- **FEAT-02**: Health check polling — hide bubble when service degraded
- **FEAT-03**: Pre-chat tooltip on bubble
- **FEAT-04**: Internationalization / externalized string constants

### CI/DX

- **CIDX-01**: Bundle size monitoring in CI

### Bug Fixes

- **FIX-01**: Expose sessionId to host page via ChatStore
- **FIX-02**: Implement setupDOMEventForwarding() for w1-error and w1-session-end events

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automated visual regression testing | Adds complexity beyond dev tooling goal |
| Storybook integration | Custom playground is simpler and more tailored |
| Shared/hosted playground | Dev-only, local use |
| Performance benchmarking tools | Not needed for configuration testing |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAY-01 | Phase 7 | Complete |
| PLAY-02 | Phase 7 | Complete |
| PLAY-03 | Phase 7 | Complete |
| CTRL-01 | Phase 9 | Pending |
| CTRL-02 | Phase 9 | Pending |
| CTRL-03 | Phase 9 | Pending |
| CTRL-04 | Phase 9 | Pending |
| CONN-01 | Phase 9 | Pending |
| CONN-02 | Phase 9 | Pending |
| MOCK-01 | Phase 8 | Complete |
| MOCK-02 | Phase 8 | Pending |
| MOCK-03 | Phase 8 | Pending |
| MOCK-04 | Phase 8 | Pending |
| MOCK-05 | Phase 8 | Pending |
| MOCK-06 | Phase 9 | Pending |

**Coverage:**
- v0.2 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after roadmap creation*
