# Integration Guide

## Script Tag (CDN)

The simplest way to add the widget -- one line of HTML.

```html
<script src="https://unpkg.com/@work1ai/chat-widget"></script>
<work1-chat-widget server-url="wss://your-server.com/ws"></work1-chat-widget>
```

Also available via jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/@work1ai/chat-widget"></script>
```

The IIFE bundle (~116 KB) is self-contained with all dependencies included.

## npm Package

Install the package:

```bash
npm install @work1ai/chat-widget
```

Import it in your application (the side-effect import registers the custom element):

```js
import '@work1ai/chat-widget';
```

Then use it in your HTML:

```html
<work1-chat-widget server-url="wss://your-server.com/ws"></work1-chat-widget>
```

The ESM bundle externalizes dependencies (`lit`, `marked`, `dompurify`), so they must be available in your bundler's dependency graph.

## Configuration

Common attributes:

```html
<work1-chat-widget
  server-url="wss://your-server.com/ws"
  chat-title="Support"
  chat-subtitle="We usually reply in minutes"
  greeting="Hello! How can I help you today?"
  position="bottom-left"
  primary-color="#7c3aed"
></work1-chat-widget>
```

| Attribute | Description | Default |
|-----------|-------------|---------|
| `server-url` | WebSocket endpoint URL | _(required)_ |
| `chat-title` | Header title text | `"Chat"` |
| `chat-subtitle` | Header subtitle text | `""` |
| `greeting` | Initial greeting message from the agent | `""` |
| `position` | Widget position: `bottom-right` or `bottom-left` | `"bottom-right"` |
| `primary-color` | Accent color for buttons and header | `"#0066FF"` |

See the [API Reference](/api) for the full attribute list and the [Theming guide](/theming) for CSS customization.
