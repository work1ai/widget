---
phase: 11
slug: connection-status-branding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (happy-dom environment) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | CONN-01 | unit | `npx vitest run src/work1-chat-widget.test.ts -t "connected.*status-dot"` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | CONN-02 | unit | `npx vitest run src/work1-chat-widget.test.ts -t "connecting.*status-dot"` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | CONN-03 | unit | `npx vitest run src/work1-chat-widget.test.ts -t "disconnected.*status-dot"` | ❌ W0 | ⬜ pending |
| 11-01-04 | 01 | 1 | BRAND-01 | unit | `npx vitest run src/work1-chat-widget.test.ts -t "Powered by work1"` | ❌ W0 | ⬜ pending |
| 11-01-05 | 01 | 1 | BRAND-02 | unit | `npx vitest run src/work1-chat-widget.test.ts -t "work1.ai.*link"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add connection status dot tests to `src/work1-chat-widget.test.ts`
- [ ] Add branding badge tests to `src/work1-chat-widget.test.ts`

*Existing infrastructure covers framework needs. Only test cases need to be added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual dot color accuracy | CONN-01, CONN-02, CONN-03 | CSS color rendering varies | Inspect dot element in browser devtools, verify computed background-color matches spec |
| Badge link opens in new tab | BRAND-02 | `target="_blank"` behavior requires real browser | Click badge link, verify new tab opens to https://work1.ai |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
