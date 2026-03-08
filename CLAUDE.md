# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

@work1ai/chat-widget — an embeddable Lit-based Web Component chat widget that connects to a Work1 Agent Chat backend over WebSocket. Distributed as both ESM (npm) and IIFE (CDN script tag) bundles.

## Commands

```bash
# Development
npm run dev                # Vite dev server
npm run playground         # Dev server with mock WebSocket (port 5180)

# Build
npm run build              # Full build: tsc + ESM + IIFE + size report

# Test
npm test                   # Vitest (single run)
npm run test:watch         # Vitest watch mode
npx vitest run src/chat-client.test.ts   # Run a single test file

# Docs
npm run docs:dev           # VitePress dev server
npm run docs:build         # Build docs site
```

## Architecture

```
ChatClient (WebSocket protocol) → ChatStore (reactive state) → Work1ChatWidget (Web Component)
                                                                    ├── chat-panel
                                                                    │   ├── chat-header
                                                                    │   ├── message-list → message-bubble
                                                                    │   └── input-area
                                                                    └── bubble-button
```

- **ChatClient** (`src/chat-client.ts`) — EventTarget-based WebSocket client implementing the v0.1.0 chat protocol. Dispatches typed events (connected, token, typing, message_end, status, etc.).
- **ChatStore** (`src/chat-store.ts`) — Lit ReactiveController bridging ChatClient events to component state. Single source of truth for messages, connection state, and panel open/close.
- **Work1ChatWidget** (`src/work1-chat-widget.ts`) — Main `<work1-chat-widget>` custom element. Orchestrates UI components, exposes HTML attributes and `w1-*` DOM events.
- **UI Components** (`src/components/`) — Lit sub-components: bubble-button, chat-header, chat-panel, input-area, message-list, message-bubble, icons.
- **Styles** (`src/styles/`) — Lit `css` tagged templates. CSS custom properties prefixed `--w1-` for theming.

## Key Conventions

- **Naming:** attributes kebab-case (`server-url`), properties camelCase (`serverUrl`), CSS props `--w1-*`, events `w1-*`, files kebab-case
- **Lit patterns:** `@customElement`, `@property({ attribute: 'kebab-name' })`, `@state()` for internal state, ReactiveController for ChatStore
- **Security:** DOMPurify sanitizes all markdown output. No inline styles or eval.
- **Events cross Shadow DOM:** widget events use `composed: true, bubbles: true`

## Testing

- Vitest + happy-dom environment, globals enabled
- Coverage thresholds: 80% lines, 80% branches
- Tests co-located in `src/*.test.ts` (plus `tests/` for E2E)
- Test helpers: `createWidget()`, `fireOnClient()`, `openAndConnect()` — see existing tests for patterns
- ChatClient is mocked via `vi.mock()` in widget/store tests

## Build Outputs

- `dist/work1-chat-widget.es.js` — ESM (externalizes lit, marked, dompurify)
- `dist/work1-chat-widget.iife.js` — IIFE (self-contained, all deps bundled)
- `dist/index.d.ts` — TypeScript declarations
- Build configs: `vite.config.ts` (ESM), `vite.config.iife.ts` (IIFE), `vite.config.playground.ts` (dev)

## CI/CD

- **ci.yml** — Build + test on push/PR to master (Node 20)
- **docs.yml** — Deploy VitePress to GitHub Pages on push to master
- **publish.yml** — npm publish on GitHub release (validates version matches tag)
