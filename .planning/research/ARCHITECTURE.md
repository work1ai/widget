# Architecture Patterns

**Domain:** Embeddable chat widget - v0.3 feature integration
**Researched:** 2026-03-07
**Focus:** How configurable content attributes, connection status indicator, branding update, docs site, and CI/CD integrate with the existing three-layer Lit architecture

## Existing Architecture (Baseline)

```
HTML Attributes (server-url, title, greeting, position, ...)
          |
          v
+---------------------------+
| Work1ChatWidget (LitElement) |  <-- Orchestrator. Owns properties, delegates rendering.
|  - @property() attributes    |      Render functions are imported, not child components.
|  - private store = ChatStore |
+---------------------------+
          |
          v
+---------------------------+
| ChatStore (ReactiveController) |  <-- State owner. Messages, connectionState, isOpen.
|  - messages: ChatMessage[]     |      Calls host.requestUpdate() on every mutation.
|  - connectionState             |
|  - private client: ChatClient  |
+---------------------------+
          |
          v
+---------------------------+
| ChatClient (EventTarget)     |  <-- WebSocket protocol. Emits typed CustomEvents.
|  - connect() / disconnect()  |      No Lit dependency. Pure protocol layer.
|  - send()                    |
+---------------------------+

Render functions (stateless):
  renderHeader(title, onClose) -> TemplateResult
  renderBubble(onClick, position, hidden, iconName) -> TemplateResult
  renderPanel(isOpen, position, content) -> TemplateResult
  renderInputArea({disabled, placeholder, onSend, ...}) -> TemplateResult
  renderMessageList(messages, scrollManager, ...) -> TemplateResult
```

Key architectural fact: The UI layer uses **render functions**, not child custom elements. All rendering happens inside Work1ChatWidget's single shadow root. New UI additions must follow this same pattern.

## Recommended Architecture for v0.3 Features

### Overview of Changes

No new layers. No new custom elements. All v0.3 widget features integrate into the existing three layers through targeted modifications. The docs site and CI/CD are separate concerns with no widget code dependencies.

```
LAYER           | MODIFICATION                        | NEW FILES
----------------|-------------------------------------|------------------
ChatClient      | None                                | None
ChatStore       | connectionState already tracked     | None
Work1ChatWidget | Add subtitle property, pass         | None (modify existing)
                | subtitle + connectionState to       |
                | renderHeader                        |
renderHeader()  | Add subtitle, status dot, branding  | Modify chat-header.ts
Styles          | Status dot + subtitle + branding    | Modify panel.styles.ts
Docs site       | Separate concern, not in widget src | site/ directory (new)
CI/CD           | Separate concern                    | .github/workflows/ (new)
```

### Feature 1: Configurable Title, Subtitle, Greeting

#### What Already Exists

- `title` property: Already a `@property({ type: String })` on Work1ChatWidget, defaults to `'Chat'`. Already passed to `renderHeader(this.title, ...)`.
- `greeting` property: Already a `@property({ type: String })` on Work1ChatWidget, defaults to `''`. Already handled by `ChatStore.toggleOpen(greeting)` which injects an agent message on first open.

Both title and greeting are **fully implemented**. The only new attribute needed is `subtitle`.

#### What Needs to Change

**New property on Work1ChatWidget:**
```typescript
@property({ type: String })
subtitle: string = '';
```

**Modified renderHeader to accept subtitle and connectionState (see Feature 2).**

#### Data Flow

```
<work1-chat-widget title="Support" subtitle="We're here to help" greeting="Hello!">
        |                    |                          |
        v                    v                          v
  @property title     @property subtitle          @property greeting
        |                    |                          |
        +-----> renderHeader(title, subtitle, ...)      |
                                                        v
                                           ChatStore.toggleOpen(greeting)
                                                        |
                                           Injects agent ChatMessage on first open
                                           (already implemented)
```

No store changes. No client changes. Pure attribute-to-render-function plumbing.

#### Integration Complexity: LOW

Title and greeting already implemented. Subtitle requires one new property and one renderHeader parameter.

### Feature 2: Connection Status Indicator (3-State Dot)

#### What Already Exists

- `ChatStore.connectionState`: Already tracked as `ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'`. Already triggers `host.requestUpdate()` on every transition.
- `Work1ChatWidget.updated()`: Already watches `this.store.connectionState` for DOM event dispatching.

The reactive data flow for connection state already exists end-to-end. The status dot is purely a rendering addition.

#### What Needs to Change

**Map 4-state ConnectionState to 3-color dot:**

| ConnectionState | Dot Color | CSS Class | Rationale |
|----------------|-----------|-----------|-----------|
| `connected` | Green | `status-dot--green` | Active, healthy |
| `connecting` / `reconnecting` | Yellow | `status-dot--yellow` | In progress, transient |
| `disconnected` | Red | `status-dot--red` | No connection |

**Combined renderHeader signature (subtitle + connectionState + branding):**
```typescript
import type { ConnectionState } from '../chat-store.types.js';

export function renderHeader(
  title: string,
  subtitle: string,
  connectionState: ConnectionState,
  onClose: () => void,
): TemplateResult {
  const dotColor = connectionState === 'connected' ? 'green'
    : connectionState === 'disconnected' ? 'red'
    : 'yellow';

  return html`
    <header class="chat-header" part="header">
      <span class="status-dot status-dot--${dotColor}"
            aria-label="Connection status: ${connectionState}"></span>
      <div class="header-text">
        <span class="header-title">${title}</span>
        ${subtitle ? html`<span class="header-subtitle">${subtitle}</span>` : nothing}
      </div>
      <a class="header-badge"
         href="https://work1.ai"
         target="_blank"
         rel="noopener noreferrer">Powered by work1.ai</a>
      <button class="header-close" @click=${onClose} aria-label="Close chat">
        ${closeIcon}
      </button>
    </header>
  `;
}
```

#### Data Flow

```
WebSocket events
      |
      v
ChatClient --event--> ChatStore.connectionState (already exists)
                              |
                              v
                       host.requestUpdate() (already happens)
                              |
                              v
                       Work1ChatWidget.render()
                              |
                              v
                       renderHeader(title, subtitle, this.store.connectionState, onClose)
                              |
                              v
                       <span class="status-dot status-dot--green">
```

No new state. No new events. The reactive data flow already exists end-to-end.

#### Style Addition (panel.styles.ts)

```css
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: 8px;
}
.status-dot--green  { background: #22c55e; }
.status-dot--yellow { background: #eab308; }
.status-dot--red    { background: #ef4444; }

.header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header-subtitle {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 400;
}
```

#### Integration Complexity: LOW

### Feature 3: "Powered by work1.ai" Branding Badge

#### What Already Exists

- `header-badge` element: Currently renders "Powered by AI" as a `<span>`.

#### What Needs to Change

Replace static span with anchor tag (shown in renderHeader template above):
```html
<!-- Before -->
<span class="header-badge">Powered by AI</span>

<!-- After -->
<a class="header-badge"
   href="https://work1.ai"
   target="_blank"
   rel="noopener noreferrer">Powered by work1.ai</a>
```

#### Integration Complexity: TRIVIAL

### Feature 4: Documentation Site (VitePress on GitHub Pages)

#### Architecture Decision: VitePress Static Site Generator

Use VitePress 1.6.4 for the documentation site. While the docs are currently small (5-8 pages), VitePress provides built-in search, dark mode, navigation structure, and mobile responsiveness out of the box -- all features that would require significant effort to implement with hand-crafted HTML. The development cost of VitePress setup is ~30 minutes vs ~4+ hours for equivalent static HTML with search and responsive design.

**Directory structure:**
```
site/
  index.md                    # Landing page + quick start
  getting-started.md          # Installation (CDN vs npm)
  guide/
    configuration.md          # Attributes reference
    theming.md                # CSS custom properties + parts
    csp.md                    # CSP requirements
  .vitepress/
    config.ts                 # Site configuration
```

The `site/` directory is separate from `docs/` which contains internal planning documents (`docs/plans/`). This prevents internal plans from being published to the public docs site.

**VitePress config essentials:**
```typescript
// site/.vitepress/config.ts
import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Work1 Chat Widget',
  description: 'Embeddable AI chat widget documentation',
  base: '/<repo-name>/',  // CRITICAL for GitHub Pages
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Theming', link: '/guide/theming' },
          { text: 'CSP Requirements', link: '/guide/csp' },
        ],
      },
    ],
  },
});
```

**GitHub Pages deployment via GitHub Actions:**
```yaml
# .github/workflows/docs.yml
name: Deploy Docs
on:
  push:
    branches: [master]
    paths: ['site/**']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx vitepress build site
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site/.vitepress/dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Prerequisite:** Enable GitHub Pages in repo Settings > Pages > Source: "GitHub Actions".

#### Integration Complexity: MEDIUM (separate concern, but requires VitePress setup and content writing)

### Feature 5: GitHub Actions CI/CD for npm Publishing

#### Architecture: Three Workflows

**Workflow 1: CI (on every push and PR)**
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [master]
    paths-ignore: ['site/**', '*.md', '.planning/**']
  pull_request:
    branches: [master]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm test
```

**Workflow 2: Publish (on GitHub Release published)**
```yaml
# .github/workflows/publish.yml
name: Publish to npm
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Publishing flow:**
1. Bump version in package.json
2. Commit and push to master
3. Create a GitHub Release (which creates a tag)
4. Release `published` event triggers the publish workflow
5. Workflow builds, tests, then publishes with provenance

**Why Release-triggered (not tag-triggered):**
- Releases are created through GitHub UI with release notes, making the process more deliberate
- Tags can be pushed accidentally; Releases require explicit action
- Release notes serve as changelog entries

#### Integration Complexity: LOW (separate concern, YAML files only)

## Component Boundaries (Updated for v0.3)

| Component | Responsibility | v0.3 Changes |
|-----------|---------------|--------------|
| `ChatClient` | WebSocket protocol, event emission | **None** |
| `ChatStore` | State management (messages, connectionState, isOpen) | **None** (connectionState already exists and is reactive) |
| `Work1ChatWidget` | Property declarations, orchestration, render dispatch | **Add `subtitle` property. Pass subtitle + connectionState to renderHeader.** |
| `renderHeader()` | Header bar rendering | **Add subtitle, status dot, branding link** |
| `panel.styles.ts` | Panel and header CSS | **Add status dot styles, subtitle styles, branding hover styles** |
| `site/` | Documentation site | **New directory, entirely separate concern** |
| `.github/workflows/` | CI/CD pipelines | **New directory, entirely separate concern** |

## Data Flow (Complete, Post-v0.3)

```
HTML Attributes
  |
  |-- server-url -----> store.connect(url)
  |-- title ----------> renderHeader(title, ...)
  |-- subtitle -------> renderHeader(..., subtitle, ...)         [NEW]
  |-- greeting -------> store.toggleOpen(greeting)               [EXISTING]
  |-- placeholder ----> renderInputArea({placeholder})
  |-- position -------> renderBubble(position), renderPanel(position)
  |-- width/height ---> renderAttributeOverrides() -> CSS vars
  |-- primary-color --> renderAttributeOverrides() -> CSS vars
  |-- bubble-icon ----> renderBubble(iconName)
  |-- debug ----------> store.connect(url, debug)

Store State (reactive, all existing)
  |
  |-- messages -------> renderMessageList(messages)
  |-- isOpen ---------> renderBubble(hidden), renderPanel(isOpen)
  |-- connectionState -> renderHeader(..., connectionState, ...)  [NEW USAGE]
  |                      updated() -> w1-connected/w1-disconnected events [EXISTING]
  |-- inputDisabled --> renderInputArea({disabled})
  |-- typingActive ---> renderMessageList(..., typingActive)
  |-- statusText -----> renderMessageList(..., statusText)
```

## Patterns to Follow

### Pattern 1: Attribute-to-Render-Function Plumbing
**What:** New configurable content goes through `@property()` on Work1ChatWidget, passed as argument to a stateless render function.
**When:** Any new attribute-driven content (subtitle in v0.3).
**Why:** Consistent with existing architecture. No state management needed for static content.

### Pattern 2: Store State Consumed by Render Functions
**What:** Reactive state lives in ChatStore, render functions receive it as parameters, never mutate it.
**When:** Any UI that reflects connection state (status dot).
**Why:** Unidirectional data flow. Store mutates, calls requestUpdate(), widget re-renders, render functions receive new values.

### Pattern 3: Separate Concerns for Non-Widget Features
**What:** Docs site and CI/CD are separate directories, not integrated into the widget build.
**When:** Any feature that does not ship inside the widget bundle.
**Why:** Widget bundle size is critical (116KB IIFE). Documentation and CI are build-time/deploy-time concerns.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Creating Child Custom Elements for Small UI Additions
**What:** Defining a new `<w1-status-dot>` custom element for the connection indicator.
**Why bad:** The existing architecture uses render functions, not child elements. Mixing patterns creates inconsistency.
**Instead:** Add to `renderHeader()` as inline HTML.

### Anti-Pattern 2: Duplicating ConnectionState in the Widget
**What:** Adding `@state() private connectionState` to Work1ChatWidget that mirrors `this.store.connectionState`.
**Why bad:** Redundant state. ChatStore already owns connectionState and triggers re-renders.
**Instead:** Read `this.store.connectionState` directly in render().

### Anti-Pattern 3: npm Publish from master Branch Push
**What:** Triggering npm publish on every push to master.
**Why bad:** Every merge publishes a new version. No control over releases.
**Instead:** Trigger on GitHub Release `published` event only.

### Anti-Pattern 4: Skipping Build/Test in Publish Workflow
**What:** Assuming CI already passed and skipping build/test in the publish workflow.
**Why bad:** GitHub Release can be created manually, bypassing CI.
**Instead:** Always build and test in the publish workflow.

## Scalability Considerations

| Concern | Current (v0.3) | Future Growth |
|---------|----------------|---------------|
| renderHeader params | 4 params (title, subtitle, connectionState, onClose) | If exceeding 5-6 params, refactor to options object |
| Attribute count | ~12 attributes on widget | Lit handles many attributes well; consider grouping at 20+ |
| Docs site | VitePress, ~5 pages | Scales naturally with VitePress sidebar/nav |
| CI pipeline | 3 workflows | Add matrix testing, bundle size check, deploy preview as needed |

## Sources

- Existing codebase analysis (HIGH confidence -- direct code inspection)
- Lit ReactiveController pattern (HIGH confidence -- matches verified implementation)
- [VitePress deploy guide](https://vitepress.dev/guide/deploy) -- GitHub Pages workflow
- [GitHub Docs: Publishing Node.js packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages) -- publish workflow
- [npm Provenance docs](https://docs.npmjs.com/generating-provenance-statements/) -- id-token requirement

---
*Architecture research for: Work1 Chat Widget v0.3*
*Researched: 2026-03-07*
