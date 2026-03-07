---
phase: 01-connection-layer
plan: 02
subsystem: infra
tags: [typescript, websocket, eventtarget, protocol-client, vitest, tdd]

# Dependency graph
requires:
  - phase: 01-connection-layer/01
    provides: Protocol types (ServerMessage, ChatClientEventMap, TypedEventTarget, isServerMessage)
provides:
  - ChatClient EventTarget subclass implementing full chat-server v0.1.0 protocol
  - Typed event dispatch for all 8 server message types plus rejected/disconnected
  - Debug logging with parsed summaries
  - send() method for client-to-server messages
affects: [01-connection-layer, 02-state-layer]

# Tech tracking
tech-stack:
  added: [happy-dom@16.x]
  patterns: [typed-eventtarget-subclass, websocket-lifecycle-management, lenient-message-validation, debug-logging]

key-files:
  created:
    - src/chat-client.ts
    - src/__tests__/chat-client.test.ts
  modified:
    - src/index.ts
    - vitest.config.ts
    - package.json

key-decisions:
  - "Switched from jsdom to happy-dom for test environment due to ESM compatibility issues with jsdom"
  - "session_start messages are parsed and validated but NOT dispatched as public events (per user decision)"
  - "disconnect() removes onclose/onmessage handlers before closing to prevent spurious event dispatch"

patterns-established:
  - "ChatClient extends TypedEventTarget cast of EventTarget for compile-time event type safety"
  - "handleMessage: JSON.parse with try/catch -> isServerMessage guard -> switch dispatch"
  - "Warnings always log (regardless of debug flag); debug logs only when debug=true"
  - "Close code 1008 = rejected, non-1000 = disconnected, 1000 = silent (no event)"

requirements-completed: [CONN-01, CONN-02, CONN-03, CONN-04, CONN-05, CONN-06, CONN-07, CONN-08]

# Metrics
duration: 2min
completed: 2026-03-05
---

# Phase 1 Plan 2: ChatClient - WebSocket Protocol Client Summary

**ChatClient EventTarget subclass with TDD-driven implementation covering all 8 protocol message types, close code handling, resilience, and debug logging**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T02:47:27Z
- **Completed:** 2026-03-05T02:49:45Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 5

## Accomplishments
- ChatClient class implementing full chat-server v0.1.0 protocol with typed event dispatch
- 28 comprehensive tests covering connection lifecycle, all message types, close codes, resilience, sending, and debug mode
- TDD workflow: tests written first (RED), then implementation (GREEN) -- all 28 pass
- ChatClient exported from index.ts barrel for public API consumption

## Task Commits

Each task was committed atomically:

1. **TDD RED: Failing tests for ChatClient** - `a10f68d` (test)
2. **TDD GREEN: ChatClient implementation passing all tests** - `73b48a3` (feat)

_Note: No refactor commit needed -- implementation is minimal and clean._

## Files Created/Modified
- `src/chat-client.ts` - ChatClient class (193 lines): EventTarget subclass, WebSocket lifecycle, message parsing, debug logging
- `src/__tests__/chat-client.test.ts` - Comprehensive tests (383 lines): 28 tests across 6 describe blocks
- `src/index.ts` - Added ChatClient export to barrel
- `vitest.config.ts` - Switched from jsdom to happy-dom environment
- `package.json` - Added jsdom and happy-dom dev dependencies

## Decisions Made
- Switched from jsdom to happy-dom for vitest environment -- jsdom had ESM require() compatibility issues with @exodus/bytes package
- disconnect() nulls onclose/onmessage handlers before closing to prevent handleClose from firing spurious events on intentional disconnect
- session_start messages validated and parsed but not dispatched as events -- follows user decision that connected is the public readiness signal

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched jsdom to happy-dom for test environment**
- **Found during:** TDD RED (test setup)
- **Issue:** jsdom failed with ERR_REQUIRE_ESM from html-encoding-sniffer requiring @exodus/bytes as ESM
- **Fix:** Installed happy-dom, changed vitest.config.ts environment to happy-dom
- **Files modified:** vitest.config.ts, package.json
- **Verification:** All 28 tests pass with happy-dom
- **Committed in:** a10f68d (RED commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test environment change necessary for ESM compatibility. No scope creep.

## Issues Encountered
None beyond the jsdom ESM issue (documented as deviation above).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ChatClient is fully implemented and tested, ready for ChatStore consumption in Phase 2
- All 8 protocol requirements (CONN-01 through CONN-08) satisfied
- Plan 03 (Lit element shell) can build on ChatClient for widget integration

---
*Phase: 01-connection-layer*
*Completed: 2026-03-05*
