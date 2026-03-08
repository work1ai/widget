# Theming

The widget provides three layers of customization, from simplest to most powerful:

1. **HTML attributes** -- set `primary-color`, `position`, `width`, `height` directly in markup
2. **CSS custom properties** -- fine-grained control over all colors and sizes via `--w1-*` variables
3. **CSS `::part()` selectors** -- full CSS access to internal shadow DOM elements

## Quick Customization

The fastest way to customize the widget is through HTML attributes:

```html
<work1-chat-widget
  primary-color="#7c3aed"
  position="bottom-left"
  width="400px"
  height="600px"
></work1-chat-widget>
```

| Attribute | Effect |
|-----------|--------|
| `primary-color` | Sets the accent color for the header, bubble, and user messages. |
| `position` | `bottom-right` (default) or `bottom-left`. |
| `width` | Overrides the panel width (e.g. `400px`). |
| `height` | Overrides the panel height (e.g. `600px`). |

These attributes map to CSS custom properties internally, so CSS custom properties set externally will take precedence via the natural cascade.

## CSS Custom Properties

For fine-grained control, set `--w1-*` custom properties on the widget element:

```css
work1-chat-widget {
  --w1-accent-color: #7c3aed;
  --w1-panel-bg: #fafafa;
}
```

| Property | Default | Description |
|----------|---------|-------------|
| `--w1-accent-color` | `#0066FF` | Primary accent color (header, bubble, send button, user messages, focus ring). |
| `--w1-panel-width` | `380px` | Chat panel width. |
| `--w1-panel-height` | `560px` | Chat panel height. |
| `--w1-panel-bg` | `#ffffff` | Chat panel background. |
| `--w1-border-color` | `#e5e5e5` | Input area and field border color. |
| `--w1-input-bg` | `#ffffff` | Input area wrapper background. |
| `--w1-input-field-bg` | `#f8f8f8` | Input textarea background. |
| `--w1-user-bg` | `var(--w1-accent-color, #0066FF)` | User message bubble background. |
| `--w1-agent-bg` | `#f0f0f0` | Agent message bubble background. |
| `--w1-agent-color` | `#1a1a1a` | Agent message text color. |
| `--w1-error-color` | `#dc3545` | Error text color. |
| `--w1-error-bg` | `#fef2f2` | Error message background. |

## `::part()` Selectors

The widget exports named parts on its shadow DOM elements, letting you apply any CSS directly:

```css
work1-chat-widget::part(header) {
  border-bottom: 2px solid #0066FF;
}

work1-chat-widget::part(bubble) {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

work1-chat-widget::part(panel) {
  border-radius: 16px;
}
```

Available parts: `bubble`, `panel`, `header`, `message-list`, `input`. See the [API Reference](/api#css-part-selectors) for the full list with descriptions.

## Theme Recipes

Copy-paste these CSS blocks to quickly restyle the widget.

### Dark Mode

```css
work1-chat-widget {
  --w1-panel-bg: #1e1e2e;
  --w1-agent-bg: #2a2a3e;
  --w1-agent-color: #e0e0e0;
  --w1-input-bg: #1e1e2e;
  --w1-input-field-bg: #2a2a3e;
  --w1-border-color: #3a3a4e;
  --w1-accent-color: #818cf8;
}
```

### Brand Color

```css
work1-chat-widget {
  --w1-accent-color: #7c3aed;
}
```

### Compact

```css
work1-chat-widget {
  --w1-panel-width: 320px;
  --w1-panel-height: 420px;
}
```

## Live Demo

<script setup>
import { onMounted, ref } from 'vue'

const loaded = ref(false)

onMounted(async () => {
  await import('@work1ai/chat-widget')
  loaded.value = true
})
</script>

<div v-if="loaded" style="position: relative; height: 500px; border: 1px solid var(--vp-c-divider); border-radius: 12px; overflow: hidden;">
  <work1-chat-widget
    chat-title="Demo Widget"
    chat-subtitle="Try it out"
    primary-color="#6366f1"
    style="position: absolute; inset: 0; z-index: 1;"
  ></work1-chat-widget>
</div>

::: tip
This is a visual demo -- the widget renders its full UI (bubble, panel, messages) without a WebSocket connection. Click the bubble to open the panel and see the themed interface.
:::
