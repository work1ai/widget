# Events & Connection

The widget communicates with your page through DOM events and manages its WebSocket connection automatically. This page covers the connection lifecycle, available events, and how to listen for them.

## Connection Lifecycle

The widget uses a **lazy connection** strategy: the WebSocket connection is not created when the page loads. Instead, it initiates only when the user opens the chat panel for the first time.

```
Page loads → User clicks bubble → WebSocket connects → Chat ready
```

Once connected, the connection persists across panel open/close toggles. A new connection is only created if the user starts a new conversation after disconnection.

### Connection States

The widget header displays a colored status dot indicating the current connection state:

| State | Status Dot | Meaning |
|-------|-----------|---------|
| Connected | Green (`#22c55e`) | WebSocket is open and ready |
| Connecting / Reconnecting | Yellow (`#eab308`) | Establishing or re-establishing connection |
| Disconnected | Red (`#ef4444`) | WebSocket is closed |

### Greeting Behavior

When the `greeting` attribute is set, the greeting message appears as the first agent bubble after the WebSocket connects. This message is displayed locally and is **not** sent to the server. It resets when the user starts a new conversation.

```html
<work1-chat-widget
  server-url="wss://api.example.com/ws"
  greeting="Hi! How can I help you today?"
></work1-chat-widget>
```

## DOM Events

All widget events are standard [CustomEvents](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) that **bubble** and are **composed** (they cross the shadow DOM boundary). This means you can listen for them on the widget element or any ancestor.

| Event | Detail | When |
|-------|--------|------|
| `w1-connected` | `{ session_id: string }` | WebSocket connects successfully |
| `w1-disconnected` | `{ code: number, reason: string }` | WebSocket disconnects or is rejected |
| `w1-error` | `{ content: string }` | Server sends an error message |
| `w1-session-end` | `{ reason: string, content: string }` | Server ends the session |

## Listening for Events

Listen for widget events from the host page using standard `addEventListener`:

```javascript
const widget = document.querySelector('work1-chat-widget');

widget.addEventListener('w1-connected', (event) => {
  console.log('Connected! Session:', event.detail.session_id);
});

widget.addEventListener('w1-disconnected', (event) => {
  console.log('Disconnected:', event.detail.reason);
});

widget.addEventListener('w1-error', (event) => {
  console.error('Error:', event.detail.content);
});

widget.addEventListener('w1-session-end', (event) => {
  console.log('Session ended:', event.detail.reason);
});
```

### Example: Connection Status Banner

Show a banner in your page when the widget loses connection:

```javascript
const widget = document.querySelector('work1-chat-widget');
const banner = document.getElementById('status-banner');

widget.addEventListener('w1-connected', () => {
  banner.hidden = true;
});

widget.addEventListener('w1-disconnected', () => {
  banner.hidden = false;
  banner.textContent = 'Chat disconnected. Please try again.';
});
```

## Server URL Configuration

The `server-url` attribute specifies the WebSocket endpoint. The connection only initiates when the user opens the chat panel for the first time.

```html
<work1-chat-widget
  server-url="wss://api.example.com/ws"
></work1-chat-widget>
```

If `server-url` is not set, the widget renders the UI but does not attempt to connect.

## Debug Mode

Enable the `debug` attribute to log all WebSocket frames to the browser console. This is useful during development to inspect the message protocol.

```html
<work1-chat-widget
  server-url="wss://api.example.com/ws"
  debug
></work1-chat-widget>
```

With debug mode enabled, the console shows entries like:

```
[work1-widget] connected session=abc123
[work1-widget] typing active=true
[work1-widget] token (15 chars)
[work1-widget] message_end
```
