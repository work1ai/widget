---
phase: 8
slug: mock-websocket-server
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.0.0 with happy-dom |
| **Config file** | vite.config.ts |
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
| 08-01-01 | 01 | 1 | MOCK-01 | unit | `npx vitest run src/chat-client.test.ts` | existing | pending |
| 08-01-02 | 01 | 1 | MOCK-01 | unit | `npx vitest run src/chat-store.test.ts` | existing | pending |
| 08-01-03 | 01 | 1 | MOCK-01 | manual | Open playground, type message, observe echo | N/A | pending |
| 08-01-04 | 01 | 1 | MOCK-02 | manual | Open playground, observe greeting on connect | N/A | pending |
| 08-01-05 | 01 | 1 | MOCK-03 | manual | Trigger long-markdown scenario, observe rendering | N/A | pending |
| 08-01-06 | 01 | 1 | MOCK-04 | manual | Trigger error scenarios, observe UI states | N/A | pending |
| 08-01-07 | 01 | 1 | MOCK-05 | manual | Trigger session-end scenario, observe UI state | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Verify existing tests pass after ChatClient.connect() signature change: `npx vitest run src/chat-client.test.ts`
- [ ] Verify existing tests pass after ChatStore.connect() signature change: `npx vitest run src/chat-store.test.ts`

*Existing infrastructure covers all phase requirements. No new test framework setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Echo mode streams "You said: " + user input | MOCK-01 | Playground feature — visual streaming behavior | 1. Run `npm run playground` 2. Open widget 3. Type a message 4. Observe echoed response with visible token streaming |
| Greeting auto-fires on connect | MOCK-02 | Playground feature — visual rendering | 1. Run `npm run playground` 2. Open widget 3. Observe greeting message appears in chat panel |
| Long markdown renders correctly | MOCK-03 | Playground feature — visual rendering of all markdown elements | 1. Run `npm run playground` 2. Call `triggerScenario('long-markdown')` via console 3. Observe headings, lists, code blocks, links render correctly |
| Error scenarios trigger error UI | MOCK-04 | Playground feature — UI state transitions | 1. Run `npm run playground` 2. Call error scenarios via console 3. Observe widget error/disconnected states |
| Session end triggers session-end UI | MOCK-05 | Playground feature — UI state transition | 1. Run `npm run playground` 2. Call `triggerScenario('session-end')` via console 3. Observe widget session-end state |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
