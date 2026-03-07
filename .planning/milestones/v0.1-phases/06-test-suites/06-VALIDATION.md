---
phase: 6
slug: test-suites
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (3.2.4 installed) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | TEST-01 | unit | `npx vitest run src/chat-client.test.ts` | Needs move | ⬜ pending |
| 06-01-02 | 01 | 1 | TEST-02 | unit | `npx vitest run src/chat-store.test.ts` | Needs move + gaps | ⬜ pending |
| 06-01-03 | 01 | 1 | CONT-01..04, SEC-04 | unit | `npx vitest run src/markdown.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | TEST-03 | component | `npx vitest run src/work1-chat-widget.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | TEST-04, TEST-05 | integration | `npx vitest run src/integration.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D @vitest/coverage-v8@^3.0.0` — coverage provider
- [ ] Update `vitest.config.ts` with coverage thresholds (80% lines/branches)
- [ ] `src/markdown.test.ts` — stubs for CONT-01..04, SEC-04
- [ ] `src/work1-chat-widget.test.ts` — stubs for TEST-03 (5 UI states)
- [ ] `src/integration.test.ts` — stubs for TEST-04, TEST-05

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CSS theming renders correctly | THEME-* | happy-dom has no real CSS engine | Visual inspection in browser |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
