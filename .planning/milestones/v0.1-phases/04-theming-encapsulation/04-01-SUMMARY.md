---
phase: 04-theming-encapsulation
plan: 01
subsystem: ui
tags: [css-custom-properties, theming, shadow-dom, lit, web-components]

requires:
  - phase: 02-ui-shell-messaging
    provides: Widget element with panel, bubble, input, message styles
  - phase: 03-streaming-content
    provides: Streaming styles with new-conversation button

provides:
  - Normalized CSS custom property API (10 public color vars)
  - Accent color cascade via --w1-accent-color
  - primary-color HTML attribute mapped to --w1-accent-color
  - --w1-user-bg override for user bubble color
  - :host inherited property resets for Shadow DOM isolation

affects: [04-theming-encapsulation, 05-distribution]

tech-stack:
  added: []
  patterns: [accent-cascade-via-css-vars, attribute-to-css-var-mapping, inherited-property-reset]

key-files:
  created: []
  modified:
    - src/styles/widget.styles.ts
    - src/styles/panel.styles.ts
    - src/styles/messages.styles.ts
    - src/styles/input.styles.ts
    - src/styles/streaming.styles.ts
    - src/work1-chat-widget.ts

key-decisions:
  - "User bubble uses --w1-user-bg with --w1-accent-color fallback for granular override"
  - "Removed --w1-system-color, --w1-disabled-color, --w1-muted-color, --w1-input-disabled-bg as public API -- hardcoded inline"
  - "primary-color attribute uses same dynamic style pattern as width/height (renderAttributeOverrides)"

patterns-established:
  - "Accent cascade: all accent elements use var(--w1-accent-color, #0066FF) directly"
  - "Attribute-to-CSS: HTML attributes map to --w1-* vars via renderAttributeOverrides()"
  - "Host hardening: :host resets inherited properties to prevent host page CSS leaking"

requirements-completed: [THEM-01, THEM-02, THEM-03]

duration: 1min
completed: 2026-03-05
---

# Phase 4 Plan 1: CSS Custom Properties and Primary Color Attribute Summary

**Normalized 10 public CSS custom properties with accent cascade and primary-color HTML attribute for one-line branding**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-05T05:14:58Z
- **Completed:** 2026-03-05T05:16:15Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Normalized all 5 style files to use consistent --w1-* CSS custom property naming with 10 public color vars
- Implemented accent color cascade so --w1-accent-color flows to bubble, header, user bubbles, send button, scroll pill, new-conversation button, and focus border
- Added primary-color HTML attribute that maps to --w1-accent-color for zero-CSS branding
- Added :host inherited property resets (font-size, line-height, color, letter-spacing, etc.) for Shadow DOM isolation

## Task Commits

Each task was committed atomically:

1. **Task 1: Normalize CSS custom properties and implement accent cascade** - `4a779b1` (feat)
2. **Task 2: Add primary-color attribute with CSS custom property mapping** - `90eb888` (feat)

## Files Created/Modified
- `src/styles/widget.styles.ts` - Added :host inherited property resets
- `src/styles/panel.styles.ts` - No changes needed (already using accent var correctly)
- `src/styles/messages.styles.ts` - User bubble uses --w1-user-bg cascade, removed --w1-system-color
- `src/styles/input.styles.ts` - Removed --w1-input-disabled-bg, --w1-disabled-color, --w1-muted-color (hardcoded)
- `src/styles/streaming.styles.ts` - Removed --w1-system-color from status text (hardcoded)
- `src/work1-chat-widget.ts` - Added primaryColor property, renamed to renderAttributeOverrides

## Decisions Made
- User bubble uses `var(--w1-user-bg, var(--w1-accent-color, #0066FF))` so --w1-user-bg overrides accent when set
- Removed 4 granular vars (system-color, disabled-color, muted-color, input-disabled-bg) from public API -- hardcoded inline since these are not branding-relevant
- Reused existing renderWidthHeightOverrides pattern (renamed to renderAttributeOverrides) for primary-color mapping

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSS custom property API is formalized and ready for documentation in plan 04-02
- primary-color attribute enables zero-CSS branding for CDN consumers
- Accent cascade verified across all 7 accent-colored elements

---
*Phase: 04-theming-encapsulation*
*Completed: 2026-03-05*
