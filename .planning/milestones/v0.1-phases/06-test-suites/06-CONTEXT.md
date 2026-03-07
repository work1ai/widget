# Phase 6: Test Suites - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Comprehensive test coverage across all layers: fill gaps in existing ChatClient/ChatStore unit tests, add markdown pipeline unit tests, add component tests for all UI states through the main widget element, and add integration tests for full message flows and lifecycle transitions with mock WebSocket server.

Requirements: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05.

</domain>

<decisions>
## Implementation Decisions

### Test scope & gaps
- Existing ChatClient tests (33 tests) already cover TEST-01 well -- leave as-is, do not expand
- Existing ChatStore tests (16 tests) cover lifecycle/state but are missing token accumulation, typing indicator state, status text, and message_end finalization -- fill these gaps
- New ChatStore tests should verify realistic lifecycle sequences (typing(true) -> token -> token -> message_end = finalized message), not isolated handler calls
- Add dedicated markdown.ts unit tests covering rendering (bold, italic, links, code blocks, inline code, lists), DOMPurify XSS sanitization, and target="_blank" on links (CONT-01 through CONT-04, SEC-04)
- Standard coverage is sufficient -- no stress-testing of edge cases like rapid token bursts, 4096-byte limits, or Unicode

### Component testing approach
- Use happy-dom (already configured) with Lit's own testing utilities for component tests
- Test through the main `<work1-chat-widget>` element -- query its shadow DOM for expected output. Sub-components are implementation details
- Verify DOM output for all 5 UI states per TEST-03: connected (input enabled, no banners), disconnected (input disabled, reconnect button), streaming (streaming bubble visible), error (error message in chat), session ended (disabled + new conversation button)
- Skip CSS theming tests -- happy-dom has no real CSS engine; focus on DOM structure and attribute presence

### Integration test design
- Use vitest-websocket-mock (already in project) to simulate full message flows
- TEST-04 scenario: connect -> send -> stream tokens -> finalize. Verify ChatStore state at each step (messages array, connectionState, inputDisabled)
- TEST-05 scenarios: reconnection flow (connected -> reconnecting -> restored) and session end flow (connected -> session_end -> disabled UI)
- State assertions only (ChatStore.messages, connectionState, inputDisabled) -- DOM rendering is covered by component tests. No DOM assertions in integration tests
- Match TEST-04 and TEST-05 requirements exactly -- no additional error path or multi-exchange scenarios

### Test infrastructure
- Co-locate test files with their source files (e.g., chat-client.test.ts next to chat-client.ts)
- Move existing tests from src/__tests__/ to co-located positions for consistency
- Remove src/__tests__/ directory after migration
- 80% line/branch coverage hard threshold -- fail the test run if coverage drops below
- v8 coverage provider (Vitest default, fast)

### Claude's Discretion
- Lit fixture/helper approach for component test setup
- Exact test file naming for new files (e.g., work1-chat-widget.test.ts vs widget.component.test.ts)
- How to structure integration test file(s)
- vitest.config.ts coverage configuration details
- Any test utility helpers needed for Shadow DOM querying

</decisions>

<specifics>
## Specific Ideas

- Existing tests are a strong foundation -- Phase 6 fills gaps rather than rebuilding
- Component tests render the real widget element and verify shadow DOM content, not internal component APIs
- Integration tests stay at the state layer (ChatStore) and trust component tests to verify rendering
- Co-located tests (foo.test.ts next to foo.ts) is the preferred organization pattern

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/__tests__/chat-client.test.ts` (383 lines): Complete ChatClient unit tests using vitest-websocket-mock. 33 tests covering connection lifecycle, close handling, protocol messages, resilience (CONN-08), sending, and debug mode
- `src/__tests__/chat-store.test.ts` (236 lines): ChatStore unit tests with mocked ChatClient. 16 tests covering constructor, connect, events, send, disconnect, toggleOpen, greeting, session_end, error
- `vitest-websocket-mock`: Already installed and proven to work with the project's Vitest + happy-dom setup
- `vitest.config.ts`: Configured with happy-dom environment and globals: true

### Established Patterns
- ChatClient tests: direct vitest-websocket-mock WS server with server.send() for protocol messages
- ChatStore tests: vi.mock('../chat-client.js') with MockChatClient extending EventTarget, fireClientEvent() helper for dispatching events
- Both test files use describe/it/expect/vi from vitest with beforeEach/afterEach lifecycle

### Integration Points
- `src/chat-client.ts` -- tested, needs co-location move only
- `src/chat-store.ts` -- tested, needs gap tests (token, typing, status, message_end) and co-location move
- `src/markdown.ts` -- untested, needs new unit test file
- `src/work1-chat-widget.ts` -- untested, needs component test file (main entry for all 5 UI state tests)
- `src/components/` -- 7 components tested indirectly through widget element
- `package.json` -- may need @vitest/coverage-v8 dependency for coverage

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 06-test-suites*
*Context gathered: 2026-03-06*
