# Phase 9: Control Panel - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Runtime controls for theming, connection settings, and mock scenario triggering within the playground page. Developers can interactively configure every widget property and trigger test scenarios from a single control surface. The control panel lives in the playground only — no production code changes.

</domain>

<decisions>
## Implementation Decisions

### Panel layout & placement
- Fixed left sidebar, always visible — widget floats in the remaining right area
- Not collapsible — dev controls are the purpose of this page
- Accordion sections within the sidebar: Theme, Connection, Scenarios — all expanded by default, individually collapsible
- Built as a Lit web component (`<playground-controls>`) — consistent with widget technology

### Theme controls
- Color pickers using native `<input type="color">` for each color property
- Controls set CSS custom properties on the widget element (--w1-accent-color, --w1-bg, --w1-text-color, etc.) — not just attribute-driven
- Widget position controlled via toggle switch or radio: Bottom-right / Bottom-left (sets `position` attribute)
- Width and height via text inputs or sliders (sets `width` and `height` attributes)
- Bubble icon via text input (sets `bubble-icon` attribute)
- Reset button per section — restores all controls in that section to defaults

### Connection switching
- Toggle switch for Mock / Real mode
- When Real is selected, a URL input field appears below the toggle
- Switching mode: auto-disconnect, clear all chat messages, auto-reconnect with new mode
- Auto-connect on toggle — no manual Connect button needed (switching to mock auto-connects with MockWebSocket; switching to real auto-connects if URL is filled)
- Status badge next to connection section header: green dot = connected, yellow = connecting, red = disconnected
- After disconnect scenarios, a 'Reconnect' button appears in the connection section for quick recovery

### Scenario trigger buttons
- Grouped by type:
  - Content Scenarios: Greeting, Long Markdown
  - Error / State Scenarios: Protocol Error, Connection Rejected, Unexpected Disconnect, Session End
- Color-coded: content buttons in neutral/blue, error buttons in red/orange tint
- Buttons disabled when not in mock mode (scenarios only work with MockWebSocket)
- Each button calls `MockWebSocket.instance.triggerScenario(name)` — API already exists from Phase 8

### Claude's Discretion
- Exact sidebar width
- Accordion animation/transition style
- Specific CSS custom property names beyond --w1-accent-color (discover from widget styles)
- Slider vs text input for dimensions
- Exact button styling and spacing
- Lit component internal structure and state management

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `playground/mock-ws.ts`: MockWebSocket class with `triggerScenario(name)` method and static `instance` property — control panel calls this directly
- `playground/scenarios.ts`: Canned scenario content (greeting, long markdown, error, session end)
- `src/work1-chat-widget.ts`: Widget exposes attributes (`position`, `width`, `height`, `primary-color`, `bubble-icon`, `server-url`, `debug`) and `_wsConstructor` for mock injection
- `src/styles/widget.styles.ts`: CSS custom properties defined here — control panel needs to discover and target these

### Established Patterns
- Widget uses `renderAttributeOverrides()` to map attributes to CSS custom properties (--w1-accent-color, --w1-panel-width, --w1-panel-height)
- Three-layer architecture: ChatClient → ChatStore → UI — control panel operates at the widget element level (attributes + CSS vars)
- `_wsConstructor` property on widget element is how playground injects MockWebSocket

### Integration Points
- `playground/index.html`: Currently bare — will add sidebar layout and `<playground-controls>` component alongside `<work1-chat-widget>`
- `window.MockWebSocket`: Already exposed globally from Phase 8 — control panel accesses via `MockWebSocket.instance`
- Widget element: Control panel sets attributes and CSS custom properties directly on the `<work1-chat-widget>` DOM element
- `store.connect()` / `store.disconnect()`: Called indirectly through widget's `handleNewConversation()` pattern — control panel may need to trigger reconnection

</code_context>

<specifics>
## Specific Ideas

- Storybook-like left sidebar feel — clean, organized, developer-friendly
- Color-coded error scenario buttons make destructive actions visually obvious
- Status badge provides instant connection state feedback without checking the widget
- Reconnect button in control panel after disconnect scenarios avoids having to interact with the widget's own UI to recover

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-control-panel*
*Context gathered: 2026-03-07*
