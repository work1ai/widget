# API Reference

Complete reference for all HTML attributes, CSS custom properties, and CSS `::part()` selectors exposed by `<work1-chat-widget>`.

## HTML Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `server-url` | String | `""` | WebSocket server URL. Connection is initiated on first panel open. |
| `debug` | Boolean | `false` | Enable debug logging on the underlying chat client. |
| `chat-title` | String | `"Chat"` | Header title text. |
| `chat-subtitle` | String | `""` | Subtitle displayed below the header title. |
| `placeholder` | String | `"Type a message..."` | Input field placeholder text. |
| `greeting` | String | `""` | Greeting message displayed as first agent bubble on panel open. |
| `position` | String | `"bottom-right"` | Panel position: `bottom-right` or `bottom-left`. |
| `width` | String | `""` | Panel width override (CSS value, e.g. `400px`). |
| `height` | String | `""` | Panel height override (CSS value, e.g. `600px`). |
| `primary-color` | String | `""` | Accent color override (CSS color value, e.g. `#7c3aed`). Maps to `--w1-accent-color`. |
| `bubble-icon` | String | `""` | Lucide icon name for the bubble button (e.g. `help-circle`, `bot`). |

### Usage

```html
<work1-chat-widget
  server-url="wss://your-server.com/ws"
  chat-title="Support"
  chat-subtitle="We usually reply in minutes"
  greeting="Hello! How can I help?"
  position="bottom-right"
  primary-color="#7c3aed"
></work1-chat-widget>
```

## CSS Custom Properties

All visual aspects of the widget can be customized through CSS custom properties. Set them on the `work1-chat-widget` element.

| Property | Default | Description |
|----------|---------|-------------|
| `--w1-accent-color` | `#0066FF` | Primary accent color used for the header, bubble button, send button, user message background, and focus ring. |
| `--w1-panel-width` | `380px` | Chat panel width. |
| `--w1-panel-height` | `560px` | Chat panel height. |
| `--w1-panel-bg` | `#ffffff` | Chat panel background color. |
| `--w1-border-color` | `#e5e5e5` | Border color for the input area and input field. |
| `--w1-input-bg` | `#ffffff` | Input area wrapper background. |
| `--w1-input-field-bg` | `#f8f8f8` | Input textarea background. |
| `--w1-user-bg` | `var(--w1-accent-color, #0066FF)` | User message bubble background. |
| `--w1-agent-bg` | `#f0f0f0` | Agent message bubble background. |
| `--w1-agent-color` | `#1a1a1a` | Agent message text color. |
| `--w1-error-color` | `#dc3545` | Error text color (byte counter overflow, error messages). |
| `--w1-error-bg` | `#fef2f2` | Error message bubble background. |

### Usage

```css
work1-chat-widget {
  --w1-accent-color: #7c3aed;
  --w1-panel-bg: #fafafa;
}
```

## CSS `::part()` Selectors

The widget exposes internal elements via the CSS `::part()` API, giving you full CSS access to shadow DOM internals.

| Part | Element | Description |
|------|---------|-------------|
| `bubble` | Button | The floating action button that opens the chat panel. |
| `panel` | Container | The chat panel container (card with header, messages, input). |
| `header` | Header bar | The colored header bar with title, subtitle, and close button. |
| `message-list` | Scrollable area | The scrollable message area containing chat bubbles. |
| `input` | Input wrapper | The input area with textarea and send button. |

### Usage

```css
work1-chat-widget::part(header) {
  border-bottom: 2px solid #0066FF;
}

work1-chat-widget::part(bubble) {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}
```

---

For theming recipes and customization patterns, see the [Theming guide](/theming).
