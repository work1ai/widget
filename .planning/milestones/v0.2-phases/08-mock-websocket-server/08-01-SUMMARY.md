---
phase: 08-mock-websocket-server
plan: 01
subsystem: api
tags: [websocket, dependency-injection, lit, reactive-controller]

# Dependency graph
requires:
  - phase: 07-playground-infrastructure
    provides: playground shell and dev server
provides:
  - WebSocket constructor injection in ChatClient.connect()
  - WebSocket option pass-through in ChatStore.connect()
  - _wsConstructor property on widget for playground injection
affects: [08-02-mock-websocket-server, playground]

# Tech tracking
tech-stack:
  added: []
  patterns: [constructor-injection for WebSocket, options-object parameter pattern]

key-files:
  created: []
  modified:
    - src/chat-client.ts
    - src/chat-store.ts
    - src/work1-chat-widget.ts
    - src/chat-store.test.ts

key-decisions:
  - "Used options object pattern ({ WebSocket?: WebSocketConstructor }) for forward-compatible extensibility"
  - "Widget uses inline type annotation instead of importing WebSocketConstructor to avoid coupling"

patterns-established:
  - "Options object for connect() methods: enables adding future options without breaking signatures"
  - "Underscore-prefixed _wsConstructor: internal-use property convention for playground-only features"

requirements-completed: [MOCK-01]

# Metrics
duration: 2min
completed: 2026-03-07
---

# Phase 8 Plan 1: WebSocket Constructor Injection Summary

**Backward-compatible WebSocket constructor injection across ChatClient/ChatStore/Widget chain using options-object pattern**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T17:09:30Z
- **Completed:** 2026-03-07T17:11:05Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- ChatClient.connect() accepts optional WebSocket constructor via options object
- ChatStore.connect() passes WebSocket constructor through to ChatClient
- Widget exposes _wsConstructor property that flows through handleOpen() and handleNewConversation()
- All 65 existing tests pass, TypeScript compiles cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Add WebSocket constructor injection to ChatClient and ChatStore** - `8e3c008` (feat)
2. **Task 2: Add _wsConstructor property to widget and thread through to store.connect()** - `8f577e4` (feat)

## Files Created/Modified
- `src/chat-client.ts` - Added WebSocketConstructor type and optional options parameter to connect()
- `src/chat-store.ts` - Imported WebSocketConstructor, added options pass-through in connect()
- `src/work1-chat-widget.ts` - Added _wsConstructor property, threaded through both connect call sites
- `src/chat-store.test.ts` - Updated assertion to match new connect() call signature

## Decisions Made
- Used options object pattern `{ WebSocket?: WebSocketConstructor }` rather than positional parameter for forward compatibility
- Widget uses inline type `new (url: string) => WebSocket` instead of importing WebSocketConstructor to avoid coupling widget to ChatClient internals

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated chat-store test assertion for new connect() signature**
- **Found during:** Task 1 (ChatClient/ChatStore injection)
- **Issue:** Existing test asserted `client.connect('ws://test')` but store now passes options object
- **Fix:** Updated assertion to `client.connect('ws://test', { WebSocket: undefined })`
- **Files modified:** src/chat-store.test.ts
- **Verification:** All 47 client/store tests pass
- **Committed in:** 8e3c008 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary test update for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- WebSocket injection chain complete and tested
- Ready for 08-02: MockWebSocket class and playground integration that uses _wsConstructor

## Self-Check: PASSED

All 4 files verified present. Both task commits (8e3c008, 8f577e4) verified in git log.

---
*Phase: 08-mock-websocket-server*
*Completed: 2026-03-07*
