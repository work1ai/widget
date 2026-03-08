---
phase: 10
slug: content-customization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x with happy-dom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | CUST-01 | unit | `npx vitest run src/work1-chat-widget.test.ts -t "chat-title"` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | CUST-02 | unit | `npx vitest run src/work1-chat-widget.test.ts -t "tooltip"` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | CUST-03 | unit | `npx vitest run src/work1-chat-widget.test.ts -t "subtitle"` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 1 | CUST-04 | unit | `npx vitest run src/chat-store.test.ts -t "greeting"` | ⚠️ needs update | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add new tests in `src/work1-chat-widget.test.ts` for `chat-title` attribute, `chat-subtitle` attribute, and tooltip absence
- [ ] Update existing greeting tests in `src/chat-store.test.ts` to test post-connect timing instead of toggle-open timing

*Existing test infrastructure (Vitest + happy-dom) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No native browser tooltip on hover | CUST-02 | Browser tooltip behavior can't be fully verified in happy-dom | Open widget in browser, hover over element, confirm no tooltip appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
