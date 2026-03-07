---
phase: 9
slug: control-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^3.0.0 with happy-dom |
| **Config file** | vitest config in vite.config (implicit) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | CTRL-01 | unit | `npx vitest run tests/playground-controls.test.ts -t "theme color" -x` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | CTRL-02 | unit | `npx vitest run tests/playground-controls.test.ts -t "position" -x` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | CTRL-03 | unit | `npx vitest run tests/playground-controls.test.ts -t "dimension" -x` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 1 | CTRL-04 | unit | `npx vitest run tests/playground-controls.test.ts -t "bubble-icon" -x` | ❌ W0 | ⬜ pending |
| 09-01-05 | 01 | 1 | CONN-01 | unit | `npx vitest run tests/playground-controls.test.ts -t "url" -x` | ❌ W0 | ⬜ pending |
| 09-01-06 | 01 | 1 | CONN-02 | unit | `npx vitest run tests/playground-controls.test.ts -t "mode" -x` | ❌ W0 | ⬜ pending |
| 09-01-07 | 01 | 1 | MOCK-06 | unit | `npx vitest run tests/playground-controls.test.ts -t "scenario" -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/playground-controls.test.ts` — unit tests for control panel component
- [ ] Test helpers for creating widget + controls in happy-dom environment

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Color picker visual rendering | CTRL-01 | Requires real browser color picker UI | Open playground, click color input, verify widget updates visually |
| Sidebar layout and accordion animation | CTRL-01 | Visual CSS layout validation | Open playground, verify sidebar is fixed left, accordions expand/collapse |
| Connection status badge color changes | CONN-02 | Visual indicator requires browser rendering | Toggle mock/real mode, verify green/yellow/red dot transitions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
