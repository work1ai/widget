# Phase 6: Test Suites - Research

**Researched:** 2026-03-06
**Domain:** Vitest testing for Lit web components (unit, component, integration)
**Confidence:** HIGH

## Summary

Phase 6 fills testing gaps in an already well-tested project. The existing 43 tests (33 ChatClient + 16 ChatStore -- note: 6 tests share describes, Vitest counts them differently) use Vitest 3.x with happy-dom and vitest-websocket-mock. The established patterns are solid and should be extended, not replaced.

The main work involves: (1) migrating existing tests to co-located positions, (2) adding ChatStore gap tests for token accumulation, typing, status, and message_end sequences, (3) adding markdown.ts unit tests, (4) adding component tests that render the real `<work1-chat-widget>` element and query its shadow DOM, and (5) adding integration tests that drive full message flows through ChatStore with vitest-websocket-mock. Coverage enforcement at 80% requires installing `@vitest/coverage-v8`.

**Primary recommendation:** Extend proven patterns -- MockChatClient with fireClientEvent for store tests, vitest-websocket-mock WS server for integration tests, and plain `document.createElement` + `updateComplete` + `shadowRoot.querySelector` for component tests (no @open-wc/testing needed).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Existing ChatClient tests (33 tests) already cover TEST-01 well -- leave as-is, do not expand
- Existing ChatStore tests (16 tests) cover lifecycle/state but are missing token accumulation, typing indicator state, status text, and message_end finalization -- fill these gaps
- New ChatStore tests should verify realistic lifecycle sequences (typing(true) -> token -> token -> message_end = finalized message), not isolated handler calls
- Add dedicated markdown.ts unit tests covering rendering (bold, italic, links, code blocks, inline code, lists), DOMPurify XSS sanitization, and target="_blank" on links (CONT-01 through CONT-04, SEC-04)
- Standard coverage is sufficient -- no stress-testing of edge cases like rapid token bursts, 4096-byte limits, or Unicode
- Use happy-dom (already configured) with Lit's own testing utilities for component tests
- Test through the main `<work1-chat-widget>` element -- query its shadow DOM for expected output. Sub-components are implementation details
- Verify DOM output for all 5 UI states per TEST-03: connected (input enabled, no banners), disconnected (input disabled, reconnect button), streaming (streaming bubble visible), error (error message in chat), session ended (disabled + new conversation button)
- Skip CSS theming tests -- happy-dom has no real CSS engine; focus on DOM structure and attribute presence
- Use vitest-websocket-mock (already in project) to simulate full message flows
- TEST-04 scenario: connect -> send -> stream tokens -> finalize. Verify ChatStore state at each step (messages array, connectionState, inputDisabled)
- TEST-05 scenarios: reconnection flow (connected -> reconnecting -> restored) and session end flow (connected -> session_end -> disabled UI)
- State assertions only (ChatStore.messages, connectionState, inputDisabled) -- DOM rendering is covered by component tests. No DOM assertions in integration tests
- Match TEST-04 and TEST-05 requirements exactly -- no additional error path or multi-exchange scenarios
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Unit tests for ChatClient -- WebSocket event parsing, state transitions, message validation | Already complete (33 tests). Move to co-located position only |
| TEST-02 | Unit tests for ChatStore -- state mutations for each event type, token accumulation | Gap tests needed: token accumulation sequence, typing indicator, status text, message_end finalization |
| TEST-03 | Component tests -- verify DOM output for each UI state | New work1-chat-widget.test.ts with shadow DOM queries for 5 UI states |
| TEST-04 | Integration tests -- full message flow with mock WebSocket server | New integration test using vitest-websocket-mock driving ChatStore through connect->send->stream->finalize |
| TEST-05 | Integration tests -- reconnection flow and session end flow | Same integration test file with reconnection and session_end scenarios |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^3.0.0 | Test runner | Already configured, pinned for vitest-websocket-mock compat |
| happy-dom | ^20.8.3 | DOM environment | Already configured, fast, supports Shadow DOM basics |
| vitest-websocket-mock | ^0.5.0 | Mock WebSocket server | Already proven in ChatClient tests, drives integration tests |
| @vitest/coverage-v8 | ^3.0.0 | Coverage provider | Needed for 80% threshold enforcement, must match vitest major |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lit | ^3.3.0 | Component framework | Already a dependency, provides updateComplete for test sync |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| happy-dom | @web/test-runner | Real browser but slower, overkill for this scope |
| Plain DOM APIs | @open-wc/testing | Adds fixture() helper but another dependency; createElement + updateComplete is sufficient |
| v8 coverage | istanbul | istanbul is slower; v8 is the Vitest default |

**Installation:**
```bash
npm install -D @vitest/coverage-v8@^3.0.0
```

## Architecture Patterns

### Recommended Test File Layout (Co-located)
```
src/
  chat-client.ts
  chat-client.test.ts          # Moved from src/__tests__/
  chat-store.ts
  chat-store.test.ts           # Moved from src/__tests__/ + gap tests added
  chat-store.types.ts
  markdown.ts
  markdown.test.ts             # NEW
  work1-chat-widget.ts
  work1-chat-widget.test.ts    # NEW - component tests
  integration.test.ts           # NEW - integration tests (TEST-04, TEST-05)
```

### Pattern 1: Lit Component Test Fixture (No Library Needed)
**What:** Create, mount, and query a Lit element using standard DOM APIs
**When to use:** All component tests for `<work1-chat-widget>`
**Example:**
```typescript
// Source: Lit docs + happy-dom testing pattern
function createWidget(attrs: Record<string, string> = {}): Work1ChatWidget {
  const el = document.createElement('work1-chat-widget') as Work1ChatWidget;
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  document.body.appendChild(el);
  return el;
}

// In test:
let widget: Work1ChatWidget;

beforeEach(async () => {
  widget = createWidget({ 'server-url': 'ws://localhost:1234' });
  await widget.updateComplete;
});

afterEach(() => {
  widget.remove();
});

// Query shadow DOM:
const textarea = widget.shadowRoot!.querySelector('.input-textarea') as HTMLTextAreaElement;
expect(textarea.disabled).toBe(true);
```

### Pattern 2: ChatStore Gap Tests (Realistic Sequences)
**What:** Test multi-event sequences rather than isolated handler calls
**When to use:** TOKEN-02 gap tests for token accumulation, typing, status, message_end
**Example:**
```typescript
// Realistic streaming sequence
it('typing -> token -> token -> message_end produces finalized message', () => {
  store.connect('ws://test', false);
  fireClientEvent(store, 'connected', { session_id: 'abc' });

  fireClientEvent(store, 'typing', { active: true });
  expect(store.typingActive).toBe(true);

  fireClientEvent(store, 'token', { content: 'Hello' });
  expect(store.typingActive).toBe(false); // cleared by token
  expect(store.messages).toHaveLength(1);
  expect(store.messages[0].streaming).toBe(true);
  expect(store.messages[0].content).toBe('Hello');

  fireClientEvent(store, 'token', { content: ' world' });
  expect(store.messages[0].content).toBe('Hello world');

  fireClientEvent(store, 'message_end');
  expect(store.messages[0].streaming).toBe(false);
  expect(store.typingActive).toBe(false);
});
```

### Pattern 3: Integration Test with vitest-websocket-mock
**What:** Full ChatStore + real ChatClient + mock WS server
**When to use:** TEST-04 and TEST-05 integration scenarios
**Example:**
```typescript
import WS from 'vitest-websocket-mock';
import { ChatStore } from './chat-store.js';

// Integration tests do NOT mock ChatClient -- they use the real one
let server: WS;
let store: ChatStore;
let host: ReactiveControllerHost;

beforeEach(() => {
  server = new WS('ws://localhost:1234');
  host = createMockHost();
  store = new ChatStore(host);
});

afterEach(() => {
  store.disconnect();
  WS.clean();
});

it('full message flow: connect -> send -> stream -> finalize', async () => {
  store.connect('ws://localhost:1234', false);
  await server.connected;

  server.send(JSON.stringify({ type: 'connected', session_id: 'test-123' }));
  expect(store.connectionState).toBe('connected');

  store.send('Hello');
  await expect(server).toReceiveMessage(
    JSON.stringify({ type: 'message', content: 'Hello' })
  );
  expect(store.messages).toHaveLength(1); // user message

  server.send(JSON.stringify({ type: 'token', content: 'Hi' }));
  server.send(JSON.stringify({ type: 'token', content: ' there' }));
  server.send(JSON.stringify({ type: 'message_end' }));

  expect(store.messages).toHaveLength(2); // user + agent
  expect(store.messages[1].content).toBe('Hi there');
  expect(store.messages[1].streaming).toBe(false);
});
```

### Anti-Patterns to Avoid
- **Testing sub-components directly:** The decision is to test through `<work1-chat-widget>` only. Never import `renderBubble`, `renderHeader`, etc. in tests.
- **DOM assertions in integration tests:** Integration tests check ChatStore state only. DOM rendering is the component tests' job.
- **Isolated event handler tests for ChatStore gaps:** New ChatStore tests should use realistic sequences (typing -> token -> message_end), not single event dispatches.
- **Expanding ChatClient tests:** The 33 existing tests are sufficient per user decision. Do not add more.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket mocking | Custom WebSocket stub | vitest-websocket-mock WS class | Already proven, handles connect/close/send/receive lifecycle |
| Coverage collection | Manual tracking | @vitest/coverage-v8 with thresholds | Standard tooling, enforces 80% automatically |
| Component test sync | setTimeout waits | `await el.updateComplete` | Lit's built-in promise resolves after render cycle |
| Shadow DOM queries | Custom traversal helpers | `el.shadowRoot!.querySelector()` | Standard DOM API, works in happy-dom |

**Key insight:** The project already has all testing infrastructure except coverage. No new test frameworks or helper libraries are needed.

## Common Pitfalls

### Pitfall 1: Happy-DOM Shadow DOM Limitations
**What goes wrong:** `customElements.define` may silently fail or shadow DOM queries return null in happy-dom
**Why it happens:** Happy-dom's web component support is functional but not 100% spec-compliant
**How to avoid:** Import the component file (which triggers `@customElement` registration) before `createElement`. Always null-check `shadowRoot`. Use `await updateComplete` before querying.
**Warning signs:** `widget.shadowRoot` is null, or `querySelector` returns null for elements that should exist

### Pitfall 2: Vitest-Websocket-Mock Timing
**What goes wrong:** Assertions run before server messages are processed by ChatClient/ChatStore
**Why it happens:** WebSocket message handlers are async in the event loop
**How to avoid:** Use `await server.connected` before sending. For message processing, use `vi.waitFor()` or `await new Promise(r => setTimeout(r, 0))` to flush the microtask queue after server.send()
**Warning signs:** Tests pass sometimes but fail intermittently; store state not updated when checked

### Pitfall 3: Coverage Provider Version Mismatch
**What goes wrong:** `@vitest/coverage-v8` fails to load or produces errors
**Why it happens:** The coverage package major version must match the vitest major version
**How to avoid:** Install `@vitest/coverage-v8@^3.0.0` to match `vitest@^3.0.0`
**Warning signs:** "Cannot find module @vitest/coverage-v8" or version conflict errors

### Pitfall 4: Test File Migration Breaking Imports
**What goes wrong:** Moving tests from `src/__tests__/` to `src/` changes relative import paths
**Why it happens:** `../chat-client.js` becomes `./chat-client.js` when co-located
**How to avoid:** Update all relative imports when moving files. Run tests after each file move.
**Warning signs:** "Cannot find module" errors after migration

### Pitfall 5: Custom Element Double Registration
**What goes wrong:** "Failed to execute 'define' on 'CustomElementRegistry': the name has already been used" error
**Why it happens:** Multiple test files import the widget, each triggering `@customElement('work1-chat-widget')`
**How to avoid:** Custom element registration is idempotent if the same class is registered. Ensure only one import path resolves to the component. If needed, guard: `if (!customElements.get('work1-chat-widget')) { ... }`
**Warning signs:** Registration errors in test console output

## Code Examples

### Vitest Coverage Configuration
```typescript
// vitest.config.ts - updated with coverage
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.types.ts'],
      reporter: ['text', 'text-summary'],
      thresholds: {
        lines: 80,
        branches: 80,
      },
    },
  },
});
```

### Markdown Unit Test Pattern
```typescript
// src/markdown.test.ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown.js';

describe('renderMarkdown', () => {
  it('renders bold text', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });

  it('renders links with target="_blank"', () => {
    const html = renderMarkdown('[link](https://example.com)');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('sanitizes script tags (XSS)', () => {
    const html = renderMarkdown('<script>alert("xss")</script>');
    expect(html).not.toContain('<script>');
  });
});
```

### Component Test - Querying Shadow DOM for UI States
```typescript
// src/work1-chat-widget.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './work1-chat-widget.js'; // triggers custom element registration

describe('work1-chat-widget component', () => {
  let widget: HTMLElement;

  beforeEach(async () => {
    widget = document.createElement('work1-chat-widget');
    document.body.appendChild(widget);
    await (widget as any).updateComplete;
  });

  afterEach(() => {
    widget.remove();
  });

  it('renders with input disabled in initial (disconnected) state', async () => {
    const textarea = widget.shadowRoot!.querySelector('.input-textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.disabled).toBe(true);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @web/test-runner for Lit | Vitest + happy-dom | 2024 | Faster, simpler config, same Vitest toolchain as non-component tests |
| @open-wc/testing fixtures | Plain DOM APIs + updateComplete | 2024 | One less dependency, Lit's updateComplete is sufficient |
| istanbul coverage | v8 coverage | vitest 1.x+ | Faster, no instrumentation overhead |
| Separate __tests__ dirs | Co-located *.test.ts files | Convention shift | Better discoverability, easier import paths |

## Open Questions

1. **Happy-DOM custom element completeness**
   - What we know: Happy-dom supports basic Shadow DOM and custom elements. The existing Vitest config already uses it.
   - What's unclear: Whether all Lit reactive update cycles (requestUpdate -> updateComplete) work identically to real browsers in happy-dom
   - Recommendation: Try it first. If specific component tests fail due to happy-dom limitations, mark those as manual-only and document the gap.

2. **Integration test event timing**
   - What we know: vitest-websocket-mock works well for ChatClient tests. Integration tests add ChatStore as a middle layer.
   - What's unclear: Whether `server.send()` events propagate through ChatClient -> ChatStore synchronously or need microtask flushing
   - Recommendation: Use `vi.waitFor()` wrapper for assertions that depend on multi-layer event propagation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (3.2.4 installed) |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | ChatClient WebSocket events, state, validation | unit | `npx vitest run src/chat-client.test.ts` | Needs move from src/__tests__/ |
| TEST-02 | ChatStore state mutations, token accumulation | unit | `npx vitest run src/chat-store.test.ts` | Needs move + gap tests |
| TEST-03 | DOM output for 5 UI states | component | `npx vitest run src/work1-chat-widget.test.ts` | Wave 0 |
| TEST-04 | Full message flow integration | integration | `npx vitest run src/integration.test.ts` | Wave 0 |
| TEST-05 | Reconnection + session end flows | integration | `npx vitest run src/integration.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green + 80% line/branch coverage before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `npm install -D @vitest/coverage-v8@^3.0.0` -- coverage provider not yet installed
- [ ] Update `vitest.config.ts` with coverage thresholds configuration
- [ ] `src/markdown.test.ts` -- covers markdown rendering + XSS sanitization
- [ ] `src/work1-chat-widget.test.ts` -- covers TEST-03 (5 UI states)
- [ ] `src/integration.test.ts` -- covers TEST-04 and TEST-05

## Sources

### Primary (HIGH confidence)
- Vitest coverage configuration: https://vitest.dev/config/coverage
- Existing test files: src/__tests__/chat-client.test.ts, src/__tests__/chat-store.test.ts (established patterns)
- Project source: src/chat-store.ts, src/markdown.ts, src/work1-chat-widget.ts (code to test)

### Secondary (MEDIUM confidence)
- Lit testing docs: https://lit.dev/docs/tools/testing/ -- recommends real browser but acknowledges vitest+happy-dom works
- Vitest + Lit + happy-dom StackBlitz: https://stackblitz.com/edit/vitest-dev-vitest-h59qer -- confirms createElement + updateComplete pattern

### Tertiary (LOW confidence)
- Happy-dom Shadow DOM completeness: inferred from test suite passing, not officially documented spec compliance level

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed except @vitest/coverage-v8
- Architecture: HIGH - extending proven existing test patterns, not inventing new ones
- Pitfalls: MEDIUM - happy-dom Shadow DOM edge cases may surface during implementation
- Code examples: HIGH - derived from existing test patterns in the codebase

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable stack, no fast-moving dependencies)
