# @work1ai/chat-widget

Embeddable chat widget Web Component. Drop a single HTML tag into any page to add a live chat panel backed by a WebSocket server.

Ships as two bundles:

- **CDN (IIFE)** -- self-contained, no dependencies required at runtime
- **npm (ESM)** -- tree-shakeable, externalizes `lit`, `marked`, `dompurify`

## Quick Start -- CDN

Add one script tag. The element `<work1-chat-widget>` auto-registers.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Chat Demo</title>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/@work1ai/chat-widget/dist/work1-chat-widget.iife.js"></script>
  <work1-chat-widget
    server-url="wss://your-server.example.com/ws"
    title="Support"
    greeting="Hi! How can I help you today?"
  ></work1-chat-widget>
</body>
</html>
```

The IIFE bundle includes all dependencies (Lit, Marked, DOMPurify). No additional scripts needed.

## Quick Start -- npm

```bash
npm install @work1ai/chat-widget
```

```typescript
import '@work1ai/chat-widget';
```

Then use the element in your HTML or template:

```html
<work1-chat-widget
  server-url="wss://your-server.example.com/ws"
  title="Support"
></work1-chat-widget>
```

The ESM build externalizes `lit`, `marked`, and `dompurify`. Install them as peer dependencies if your project does not already include them:

```bash
npm install lit marked dompurify
```

## Attributes

All attributes are optional except `server-url` (required for a working connection).

| Attribute       | Type      | Default             | Description                                                                 |
| --------------- | --------- | ------------------- | --------------------------------------------------------------------------- |
| `server-url`    | `string`  | `""`                | WebSocket server URL. Connection starts on first panel open.                |
| `debug`         | `boolean` | `false`             | Enable debug logging on the underlying ChatClient.                          |
| `title`         | `string`  | `"Chat"`            | Header title text displayed in the panel header bar.                        |
| `placeholder`   | `string`  | `"Type a message..."` | Placeholder text shown in the input textarea.                             |
| `greeting`      | `string`  | `""`                | Greeting message shown as the first agent bubble when the panel opens.      |
| `position`      | `string`  | `"bottom-right"`    | Panel and bubble position. Accepts `"bottom-right"` or `"bottom-left"`.     |
| `width`         | `string`  | `"380px"`           | Panel width override. Any valid CSS value (e.g. `"400px"`, `"25rem"`).      |
| `height`        | `string`  | `"560px"`           | Panel height override. Any valid CSS value (e.g. `"600px"`, `"80vh"`).      |
| `primary-color` | `string`  | `"#0066FF"`         | Accent color override. Maps to `--w1-accent-color`. CSS custom properties take precedence. |
| `bubble-icon`   | `string`  | `""`                | Lucide icon name for the bubble button (e.g. `"help-circle"`, `"bot"`). A named slot `<span slot="bubble-icon">` takes precedence. |

Boolean attributes are set by presence: `<work1-chat-widget debug>`.

## CSS Custom Properties

Style the widget from the outside using CSS custom properties on the element or any ancestor.

```css
work1-chat-widget {
  --w1-accent-color: #7c3aed;
  --w1-panel-bg: #fafafa;
  --w1-agent-bg: #e8e8e8;
}
```

| Property              | Default                  | Description                                      |
| --------------------- | ------------------------ | ------------------------------------------------ |
| `--w1-accent-color`   | `#0066FF`                | Primary accent color: bubble, header, send button, scroll pill, user bubble fallback, focused input border, new-conversation button |
| `--w1-panel-bg`       | `#ffffff`                | Panel background color                           |
| `--w1-panel-width`    | `380px`                  | Panel width (overridden on mobile)               |
| `--w1-panel-height`   | `560px`                  | Panel height (overridden on mobile)              |
| `--w1-border-color`   | `#e5e5e5`                | Input area border and textarea border            |
| `--w1-input-bg`       | `#ffffff`                | Input wrapper background                         |
| `--w1-input-field-bg` | `#f8f8f8`                | Textarea field background                        |
| `--w1-error-color`    | `#dc3545`                | Byte counter over-limit text color               |
| `--w1-error-bg`       | `#fef2f2`                | Error system message background                  |
| `--w1-user-bg`        | `var(--w1-accent-color)` | User message bubble background (falls back to accent) |
| `--w1-agent-bg`       | `#f0f0f0`                | Agent message bubble background                  |
| `--w1-agent-color`    | `#1a1a1a`                | Agent message text color, typing dots, streaming cursor |

## CSS `::part()` Selectors

The widget exposes Shadow DOM parts for targeted styling:

```css
work1-chat-widget::part(bubble) {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

work1-chat-widget::part(panel) {
  border-radius: 16px;
}

work1-chat-widget::part(header) {
  padding: 16px 20px;
}

work1-chat-widget::part(message-list) {
  background: #f5f5f5;
}

work1-chat-widget::part(input) {
  border-top: 2px solid #ddd;
}
```

| Part            | Element                                |
| --------------- | -------------------------------------- |
| `bubble`        | Floating action button                 |
| `panel`         | Chat panel container                   |
| `header`        | Panel header bar                       |
| `message-list`  | Scrollable message area                |
| `input`         | Input area wrapper (textarea + button) |

## DOM Events

The widget dispatches Custom Events that bubble and cross Shadow DOM boundaries (`composed: true`).

```javascript
const widget = document.querySelector('work1-chat-widget');

widget.addEventListener('w1-connected', (e) => {
  console.log('Connected:', e.detail.session_id);
});

widget.addEventListener('w1-disconnected', (e) => {
  console.log('Disconnected:', e.detail.code, e.detail.reason);
});

widget.addEventListener('w1-error', (e) => {
  console.error('Error:', e.detail.content);
});

widget.addEventListener('w1-session-end', (e) => {
  console.log('Session ended:', e.detail.reason, e.detail.content);
});
```

| Event              | Detail Shape                                  | When                              |
| ------------------ | --------------------------------------------- | --------------------------------- |
| `w1-connected`     | `{ session_id: string \| null }`              | WebSocket connects successfully   |
| `w1-disconnected`  | `{ code: number, reason: string }`            | WebSocket disconnects or rejected |
| `w1-error`         | `{ content: string }`                         | Server sends an error message     |
| `w1-session-end`   | `{ reason: string, content: string }`         | Server ends the session           |

## JavaScript API

The npm package exports the element class and underlying modules for programmatic use:

```typescript
import { ChatClient, ChatStore, Work1ChatWidget } from '@work1ai/chat-widget';
import type { ServerMessage, ClientMessage, ChatMessage, ConnectionState } from '@work1ai/chat-widget';

// Use ChatClient directly for low-level WebSocket control
const client = new ChatClient('wss://server.example.com/ws');
client.addEventListener('message', (e) => {
  console.log('Server message:', e.detail);
});
client.connect();

// Or use the widget element imperatively
const widget = document.createElement('work1-chat-widget') as Work1ChatWidget;
widget.setAttribute('server-url', 'wss://server.example.com/ws');
document.body.appendChild(widget);
```

## Responsive Behavior

The widget automatically adapts to small screens:

- **Full-screen on mobile (<480px viewport width):** The chat panel fills the entire viewport with `inset: 0`, no border radius, no box shadow.
- **Dynamic viewport height:** Uses `100dvh` to account for mobile browser chrome (address bar, toolbar).
- **Safe area insets:** Respects `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for notched devices (iPhone, etc.).
- **Touch targets:** Close and send buttons expand to minimum 44x44px on mobile for accessibility.
- **Input font size:** Bumped to 16px on mobile to prevent iOS auto-zoom on focus.

For notched devices, add `viewport-fit=cover` to your viewport meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

Without `viewport-fit=cover`, the `env(safe-area-inset-*)` values will be zero and content may be obscured by the notch or home indicator.

## Browser Support

Built targeting ES2021. Tested in modern evergreen browsers:

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

Requires native Custom Elements v1 and Shadow DOM support (all of the above).

## Bundle Sizes

| Format | Raw      | Gzip     |
| ------ | -------- | -------- |
| IIFE   | 113.8 KB | 36.2 KB  |
| ESM    | 36.1 KB  | 9.4 KB   |

ESM is smaller because `lit`, `marked`, and `dompurify` are externalized (provided by your bundler or node_modules).

## License

MIT
