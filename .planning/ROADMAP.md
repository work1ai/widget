# Roadmap: Work1 Chat Widget

## Overview

Build an embeddable AI chat widget from the bottom up: WebSocket connection layer first, then reactive state and UI shell, then streaming and content rendering, then theming and security hardening, then responsive layout and distribution packaging, and finally comprehensive test suites that verify everything works end-to-end.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Connection Layer** - WebSocket client with full protocol support and project scaffolding
- [ ] **Phase 2: UI Shell & Messaging** - Floating bubble, chat panel, message input, and send/receive flow
- [ ] **Phase 3: Streaming & Content** - Token streaming, markdown rendering, error handling, and status indicators
- [ ] **Phase 4: Theming & Encapsulation** - CSS custom properties, CSS parts, Shadow DOM isolation, and XSS prevention
- [ ] **Phase 5: Responsive & Distribution** - Mobile layout, CDN bundle, npm package, and TypeScript declarations
- [ ] **Phase 6: Test Suites** - Unit, component, and integration tests across all layers

## Phase Details

### Phase 1: Connection Layer
**Goal**: A working WebSocket client that implements the full chat-server v0.1.0 protocol, built on a properly configured TypeScript/Vite project
**Depends on**: Nothing (first phase)
**Requirements**: CONN-01, CONN-02, CONN-03, CONN-04, CONN-05, CONN-06, CONN-07, CONN-08
**Success Criteria** (what must be TRUE):
  1. ChatClient connects to a WebSocket endpoint and receives a session_id from the connected event
  2. ChatClient correctly parses and emits typed events for all 8 server message types (connected, token, typing, message_end, status, reconnecting, session_end, error)
  3. ChatClient handles connection rejection (close code 1008), unexpected close, and reconnecting/restored lifecycle
  4. ChatClient silently ignores unknown or malformed message types without crashing
  5. Vite project builds TypeScript successfully and produces a bundle
**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md -- Project scaffolding and protocol type definitions
- [ ] 01-02-PLAN.md -- ChatClient implementation with TDD
- [ ] 01-03-PLAN.md -- Widget element shell and build verification

### Phase 2: UI Shell & Messaging
**Goal**: Users can open a chat panel, type messages, and see them appear in the conversation -- the complete send-side experience with visual shell
**Depends on**: Phase 1
**Requirements**: MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, SHEL-01, SHEL-02, SHEL-03, SHEL-04, SHEL-05, SHEL-06, SHEL-07, SHEL-08, SHEL-09, SHEL-10
**Success Criteria** (what must be TRUE):
  1. User can click a floating bubble button to open a chat panel with smooth animation
  2. User can type a message, press Enter to send, and see it appear immediately as a user bubble
  3. User can press Shift+Enter to insert a newline without sending
  4. Message input enforces 4096 byte limit with inline validation and disables when disconnected
  5. Chat panel auto-scrolls to newest content but pauses auto-scroll when user scrolls up
**Plans:** 4 plans

Plans:
- [ ] 02-01-PLAN.md -- ChatStore ReactiveController and UI types
- [ ] 02-02-PLAN.md -- Visual shell (bubble, panel, header, animations)
- [ ] 02-03-PLAN.md -- Message list with bubbles, grouping, and scroll management
- [ ] 02-04-PLAN.md -- Input area with auto-grow, byte validation, and send flow

### Phase 3: Streaming & Content
**Goal**: Agent responses stream in token-by-token with typing indicators, render as sanitized markdown, and errors surface clearly to the user
**Depends on**: Phase 2
**Requirements**: STRM-01, STRM-02, STRM-03, STRM-04, STRM-05, STRM-06, CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, ERR-01, ERR-02, ERR-03, ERR-04, ERR-05
**Success Criteria** (what must be TRUE):
  1. Agent response tokens appear in real time, accumulating into a streaming message bubble that finalizes on message_end
  2. Typing indicator (animated dots) appears and disappears based on server typing events
  3. Agent messages render markdown (bold, italic, links, code blocks, lists) with all output sanitized via DOMPurify
  4. Status events display as transient indicators (e.g., "Looking up details...") that auto-clear on next token or message_end
  5. Connection errors, session ends, and message-too-large all produce clear, appropriate UI feedback
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Theming & Encapsulation
**Goal**: Customers can deeply customize the widget's appearance without breaking encapsulation, and the widget is secure against XSS and style leaking
**Depends on**: Phase 3
**Requirements**: THEM-01, THEM-02, THEM-03, THEM-04, THEM-05, SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. Customer can set primary-color, width, height, position via HTML attributes and see the widget reflect those values
  2. Customer can override any attribute-set value using CSS custom properties, and custom properties take precedence
  3. Customer can use ::part() selectors to style individual internal components
  4. Host page CSS does not leak into the widget, and widget CSS does not leak out
  5. Widget works under strict Content-Security-Policy (no inline styles, no eval, no inline scripts)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Responsive & Distribution
**Goal**: Widget works on mobile devices and is available as both a CDN script tag and an npm package with TypeScript support
**Depends on**: Phase 4
**Requirements**: RESP-01, RESP-02, DIST-01, DIST-02, DIST-03, DIST-04
**Success Criteria** (what must be TRUE):
  1. Chat panel goes full-width and full-height on narrow viewports (mobile)
  2. Input area is touch-friendly and usable on mobile devices
  3. A single script tag loads the widget from CDN and registers the custom element -- no other dependencies needed
  4. npm package exports ESM with TypeScript type declarations
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Test Suites
**Goal**: Comprehensive test coverage validates that the connection layer, state management, UI components, and full message flows all work correctly
**Depends on**: Phase 5
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. Unit tests verify ChatClient handles all WebSocket event types, state transitions, and message validation
  2. Unit tests verify ChatStore state mutations for each event type including token accumulation
  3. Component tests verify correct DOM output for each UI state (connected, disconnected, streaming, error, session ended)
  4. Integration tests verify a complete message flow (connect, send, stream tokens, finalize) with a mock WebSocket server
  5. Integration tests verify reconnection flow and session end flow produce correct UI transitions
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Connection Layer | 0/3 | Planning complete | - |
| 2. UI Shell & Messaging | 0/4 | Planning complete | - |
| 3. Streaming & Content | 0/0 | Not started | - |
| 4. Theming & Encapsulation | 0/0 | Not started | - |
| 5. Responsive & Distribution | 0/0 | Not started | - |
| 6. Test Suites | 0/0 | Not started | - |
