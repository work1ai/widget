---
layout: home

hero:
  name: Work1 Chat Widget
  text: Embeddable AI Chat
  tagline: Add a chat widget to any website with one line of HTML
  actions:
    - theme: brand
      text: Get Started
      link: /integration
    - theme: alt
      text: API Reference
      link: /api

features:
  - title: Drop-in Integration
    details: Add via a script tag or install from npm — works with any framework or plain HTML.
  - title: Fully Themeable
    details: Customize colors, fonts, and layout with CSS custom properties and ::part() selectors.
  - title: Real-time Streaming
    details: WebSocket-powered responses with live markdown rendering as the agent types.
---

## Quick Start

Add the widget to any HTML page:

```html
<script src="https://unpkg.com/@work1ai/chat-widget"></script>
<work1-chat-widget server-url="wss://your-server.com/ws"></work1-chat-widget>
```

That's it. See the [Integration Guide](/integration) for npm installation and configuration options.
