# Requirements: Work1 Chat Widget

**Defined:** 2026-03-07
**Core Value:** The widget must reliably connect to the chat backend and stream agent responses in real time

## v0.3 Requirements

Requirements for v0.3 Customization, Docs & CI/CD. Each maps to roadmap phases.

### Content Customization

- [x] **CUST-01**: User can configure the chat header title via `chat-title` HTML attribute
- [x] **CUST-02**: Existing `title` property renamed to `chat-title` to avoid native browser tooltip conflict
- [x] **CUST-03**: User can configure a subtitle below the title via `chat-subtitle` HTML attribute
- [x] **CUST-04**: User can configure an initial greeting message via `greeting` attribute that displays as an agent message after WebSocket connects (not sent to server)

### Connection Feedback

- [x] **CONN-01**: User sees a green dot in the title bar when WebSocket is connected
- [x] **CONN-02**: User sees a yellow dot in the title bar when WebSocket is connecting
- [x] **CONN-03**: User sees a red dot in the title bar when WebSocket is disconnected

### Branding

- [x] **BRAND-01**: Badge reads "Powered by work1.ai" instead of "Powered by AI"
- [x] **BRAND-02**: Badge text links to https://work1.ai and opens in a new tab

### Documentation

- [ ] **DOCS-01**: Documentation site built with VitePress and published to GitHub Pages
- [ ] **DOCS-02**: Integration guide covering script tag and npm installation methods
- [ ] **DOCS-03**: API reference documenting all HTML attributes and CSS custom properties
- [ ] **DOCS-04**: Theming guide with examples for customizing colors, position, and size
- [ ] **DOCS-05**: Connection and event handling documentation

### CI/CD

- [ ] **CICD-01**: GitHub Actions CI workflow runs build and tests on every push and PR
- [ ] **CICD-02**: GitHub Actions publish workflow publishes @work1ai/chat-widget to npm on GitHub Release
- [ ] **CICD-03**: npm package published with --provenance flag for supply chain transparency
- [ ] **CICD-04**: GitHub Actions workflow deploys documentation site to GitHub Pages

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Accessibility

- **A11Y-01**: WCAG 2.1 AA keyboard navigation and focus trapping
- **A11Y-02**: ARIA labels and roles for all interactive elements
- **A11Y-03**: Color contrast compliance

### UX Enhancements

- **UX-01**: Copy message content button on agent messages
- **UX-02**: Health check polling — hide bubble when service degraded
- **UX-03**: Pre-chat tooltip on bubble
- **UX-04**: Internationalization / externalized string constants

### Tech Debt

- **FIX-01**: Expose sessionId to host page via ChatStore
- **FIX-02**: Implement setupDOMEventForwarding() for w1-error and w1-session-end events

### Build

- **BUILD-01**: Bundle size monitoring in CI

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| npm OIDC trusted publishing | Requires Node >= 24; defer until Node 24 LTS adoption |
| Custom message rendering (cards, carousels) | Protocol only supports text |
| Client-side reconnection logic | Server handles agent reconnection |
| Message persistence | Conversations are ephemeral by design |
| Mobile native SDKs | Web only |
| Pre-chat forms | Adds friction, protocol has no user identity concept |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CUST-01 | Phase 10 | Complete |
| CUST-02 | Phase 10 | Complete |
| CUST-03 | Phase 10 | Complete |
| CUST-04 | Phase 10 | Complete |
| CONN-01 | Phase 11 | Complete |
| CONN-02 | Phase 11 | Complete |
| CONN-03 | Phase 11 | Complete |
| BRAND-01 | Phase 11 | Complete |
| BRAND-02 | Phase 11 | Complete |
| DOCS-01 | Phase 12 | Pending |
| DOCS-02 | Phase 12 | Pending |
| DOCS-03 | Phase 12 | Pending |
| DOCS-04 | Phase 12 | Pending |
| DOCS-05 | Phase 12 | Pending |
| CICD-01 | Phase 13 | Pending |
| CICD-02 | Phase 13 | Pending |
| CICD-03 | Phase 13 | Pending |
| CICD-04 | Phase 13 | Pending |

**Coverage:**
- v0.3 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after roadmap creation*
