---
phase: 02-ui-shell-messaging
plan: 02
subsystem: ui
tags: [lit, web-components, css-custom-properties, shadow-dom, animation]

# Dependency graph
requires:
  - phase: 02-ui-shell-messaging
    provides: ChatStore ReactiveController with messages, connection state, open/close
provides:
  - Floating bubble button with open/close toggle
  - Chat panel with 250ms slide-up/down animation
  - Header with configurable title, "Powered by AI" badge, close button
  - CSS custom property theming foundation (--w1-accent-color, --w1-panel-width, etc.)
  - SVG icon templates (chatBubbleIcon, closeIcon, sendIcon)
affects: [02-03, 02-04, 04-theming]

# Tech tracking
tech-stack:
  added: [lit/directives/class-map]
  patterns: [render helper functions, CSS custom properties with fallback defaults, part attributes for ::part theming]

key-files:
  created:
    - src/components/icons.ts
    - src/components/bubble-button.ts
    - src/components/chat-header.ts
    - src/components/chat-panel.ts
    - src/styles/widget.styles.ts
    - src/styles/panel.styles.ts
  modified:
    - src/work1-chat-widget.ts

key-decisions:
  - "Bubble hidden via CSS transform scale(0) when panel is open -- smooth transition, no DOM removal"
  - "Width/height overrides use dynamic <style> element setting CSS custom properties on :host"
  - "DOM event forwarding uses updated() lifecycle to observe ChatStore connection state transitions"

patterns-established:
  - "Render helper pattern: pure functions returning TemplateResult, imported by widget"
  - "CSS custom property convention: --w1-* prefix with sensible fallback defaults"
  - "Part attribute convention: bubble, panel, header, message-list, input for ::part theming"

requirements-completed: [SHEL-01, SHEL-02, SHEL-03, SHEL-04, SHEL-08, SHEL-09, SHEL-10]

# Metrics
duration: 2min
completed: 2026-03-05
---

# Phase 2 Plan 2: Visual Shell Summary

**Floating bubble button, slide-up chat panel, and header bar with configurable title/badge/close using Lit render helpers and CSS custom properties**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T03:58:57Z
- **Completed:** 2026-03-05T04:00:45Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Six render helper and style files providing the complete visual shell component library
- Work1ChatWidget fully wired with ChatStore, bubble, panel, and header rendering
- All CSS colors and sizes use custom properties with fallback defaults for Phase 4 theming
- Panel position (bottom-right/bottom-left) and dimensions (width/height) configurable via attributes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create render helpers and styles** - `67da0d8` (feat)
2. **Task 2: Wire shell into Work1ChatWidget** - `4b53123` (feat)

## Files Created/Modified
- `src/components/icons.ts` - SVG icon templates (chat bubble, close, send) using Lit svg literal
- `src/components/bubble-button.ts` - Floating bubble button render function with position/hidden support
- `src/components/chat-header.ts` - Chat header render function with title, badge, close button
- `src/components/chat-panel.ts` - Chat panel container with classMap for open/close/position
- `src/styles/widget.styles.ts` - Root widget and bubble styles with CSS custom properties
- `src/styles/panel.styles.ts` - Panel, header, and animation styles with CSS custom properties
- `src/work1-chat-widget.ts` - Rewritten to integrate ChatStore, render helpers, and new attributes

## Decisions Made
- Bubble uses CSS transform scale(0) + opacity 0 to hide when panel opens (smooth transition, no DOM removal)
- Width/height attribute overrides inject a dynamic `<style>` element setting CSS custom properties on `:host`
- DOM event forwarding observes ChatStore connection state transitions in `updated()` lifecycle
- Lazy connection strategy: ChatStore.connect() called only on first panel open when server-url is set

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added hidden parameter to renderBubble**
- **Found during:** Task 1 (bubble-button.ts)
- **Issue:** Plan specified `bubble--hidden` class for hiding bubble when panel is open, but renderBubble signature only had onClick and position
- **Fix:** Added `hidden` boolean parameter to renderBubble, applied `bubble--hidden` class conditionally
- **Files modified:** src/components/bubble-button.ts
- **Verification:** TypeScript compiles, class applied correctly in widget render
- **Committed in:** 67da0d8 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for correct bubble hide/show behavior. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Visual shell is complete and ready for message list rendering (Plan 03)
- Input area placeholder divs are in place for Plan 04
- All part attributes set for Phase 4 ::part() theming
- sendIcon already created in icons.ts for Plan 04 input area

---
*Phase: 02-ui-shell-messaging*
*Completed: 2026-03-05*
