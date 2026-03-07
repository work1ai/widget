# Phase 3: Streaming & Content - Research

**Researched:** 2026-03-04
**Domain:** Streaming markdown rendering, real-time token accumulation, error UX in Lit web components
**Confidence:** HIGH

## Summary

This phase wires the remaining ChatClient events (token, typing, message_end, status) through ChatStore into the UI, adds markdown rendering for agent messages via `marked` + `DOMPurify`, and implements error/status presentation patterns. The codebase is well-prepared: ChatClient already dispatches all needed events with typed details, ChatStore has a TODO placeholder at line 152, and ChatMessage already has a `streaming?: boolean` field.

The core technical challenge is incremental markdown rendering during streaming. The approach is straightforward: on each token event, append to a content string and re-parse the full accumulated string with `marked.parse()`. This is the standard pattern used by ChatGPT/Claude UIs. For the message sizes in a chat widget (typically under 10KB), full re-parse on each token is performant and avoids the complexity of incremental parsers. The sanitized HTML is rendered via Lit's `unsafeHTML` directive.

**Primary recommendation:** Use `marked` (v17.x) for markdown parsing and `dompurify` (v3.x) for sanitization. Render with Lit's `unsafeHTML` directive. Handle target="_blank" links via marked's custom renderer, not DOMPurify hooks. Keep streaming state management in ChatStore with simple string concatenation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Blinking cursor (pipe/block character) at end of streaming text while tokens are arriving -- ChatGPT/Claude pattern
- Typing indicator (animated dots) renders as a temporary agent bubble; when first token arrives, dots are replaced by streaming text in the same bubble position (in-place replacement, no layout shift)
- Markdown is rendered incrementally as tokens arrive -- parsed on every token append, not deferred to message_end
- If user sends a message while agent is streaming, current streaming bubble finalizes as-is (incomplete content preserved), user message appears below, agent may start a new response
- Only agent messages render markdown; user messages stay plain text
- No syntax highlighting for code blocks -- monospace font with distinct background only
- No copy-to-clipboard button on code blocks
- Code blocks get a max-height (~200-300px) with internal scrolling (vertical + horizontal for wide lines)
- Supported markdown: bold, italic, links, code blocks, inline code, lists
- All markdown output sanitized via DOMPurify
- Links open in new tab with target="_blank"
- Status events display as small italic text below the typing dots or streaming bubble -- like a subtitle, not a chat message
- Only the latest status text is shown; new status replaces previous (no stacking)
- Status text has a subtle ellipsis pulse animation
- Status auto-clears on next token or message_end
- Reconnecting banner stays separate from status indicators
- Error messages appear as centered colored system messages in the chat flow (subtle red/warning background strip)
- Fatal errors (connection lost, session end) show a persistent "Start new conversation" button at the bottom, replacing the disabled input area
- Connection rejected (code 1008) retry button reconnects to the same server-url
- Message-too-large: prevent sending only (already implemented in Phase 2)
- Recoverable vs fatal errors: same visual style, distinction is behavioral

### Claude's Discretion
- Markdown library configuration and DOMPurify setup details
- Typing indicator dot animation implementation
- Blinking cursor animation CSS
- Exact colors, spacing, and typography for status indicators and error messages
- How ChatStore manages streaming state internally (token accumulation approach)
- Code block background color and border styling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRM-01 | Widget accumulates token event content into a streaming message bubble | ChatStore token listener appends to streaming message content, re-renders via requestUpdate |
| STRM-02 | Widget shows typing indicator (animated dots) on typing active=true | ChatStore sets typingActive flag, message-list renders typing bubble when true |
| STRM-03 | Widget hides typing indicator on typing active=false | ChatStore clears typingActive flag |
| STRM-04 | Widget finalizes streaming content into complete agent message on message_end | ChatStore sets streaming=false on current message, clears streaming state |
| STRM-05 | Widget displays status events as transient system indicators | ChatStore stores latest statusText, rendered as subtitle below active bubble |
| STRM-06 | Status indicators auto-clear on next token or message_end | Token and message_end handlers clear statusText |
| CONT-01 | Agent messages render markdown (bold, italic, links, code blocks, inline code, lists) | marked.parse() with custom renderer for links, rendered via unsafeHTML |
| CONT-02 | All rendered markdown sanitized via DOMPurify | DOMPurify.sanitize() wraps marked output, ADD_ATTR: ['target'] config |
| CONT-03 | Links in agent messages open in new tab (target="_blank") | Custom marked renderer adds target="_blank" rel="noopener" to links |
| CONT-04 | Configurable greeting message displays as first agent message | Already implemented in Phase 2 (ChatStore.toggleOpen) -- verify markdown renders |
| CONT-05 | "Powered by AI" badge always visible in header | Already implemented in Phase 2 (chat-header.ts) -- verify presence |
| ERR-01 | Connection rejected (code 1008) shows "Unable to connect" with retry button | Error system message with action button, reconnect handler |
| ERR-02 | Error events display as system messages in chat | ChatStore error handler already calls addSystemMessage -- enhance styling |
| ERR-03 | Fatal errors transition to disconnected state | ChatStore already sets connectionState='disconnected' on rejected/session_end |
| ERR-04 | Message too large shows inline validation preventing send | Already implemented in Phase 2 (input-area.ts) -- verify behavior |
| ERR-05 | Recoverable errors keep input enabled | Error handler does NOT set inputDisabled=true for non-fatal errors |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| marked | ^17.0.4 | Markdown to HTML parsing | Most popular markdown parser for browser, 11K+ dependents, fast, extensible renderer API |
| dompurify | ^3.3.1 | HTML sanitization (XSS prevention) | Industry standard XSS sanitizer, 30M+ weekly downloads, Shadow DOM aware |

### Supporting (already installed)
| Library | Version | Purpose |
|---------|---------|---------|
| lit | ^3.3.0 | Web component framework (unsafeHTML directive for rendered markdown) |
| lit/directives/unsafe-html.js | (bundled) | Render sanitized HTML strings in Lit templates |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| marked | markdown-it | markdown-it is more configurable but larger bundle, marked is faster and sufficient for our subset |
| Full re-parse per token | Incremental parser (incremark) | Incremental parsers are O(n) vs O(n^2) but add complexity; chat messages are small enough that full re-parse is fine |
| DOMPurify | sanitize-html | sanitize-html is server-oriented, DOMPurify is browser-native and Shadow DOM aware |

**Installation:**
```bash
npm install marked dompurify
npm install -D @types/dompurify
```

Note: `marked` ships its own TypeScript types. `dompurify` needs `@types/dompurify` for type definitions.

## Architecture Patterns

### New/Modified Files
```
src/
├── chat-store.ts           # ADD: token/typing/message_end/status listeners, streaming state
├── chat-store.types.ts     # ADD: statusText field, typingActive to store state (not ChatMessage)
├── components/
│   ├── message-bubble.ts   # MODIFY: markdown rendering branch for agent messages
│   ├── message-list.ts     # MODIFY: typing indicator, status text below messages
│   └── input-area.ts       # MODIFY: "Start new conversation" button for fatal errors
├── markdown.ts             # NEW: marked + DOMPurify setup, single parse+sanitize function
├── styles/
│   ├── messages.styles.ts  # MODIFY: markdown content styles, code blocks, error styles
│   └── streaming.styles.ts # NEW: typing dots, blinking cursor, status text, error animations
```

### Pattern 1: Centralized Markdown Pipeline
**What:** Single module (`markdown.ts`) that configures `marked` and `DOMPurify` once, exports a `renderMarkdown(raw: string): string` function.
**When to use:** Every time agent message content needs rendering.
**Example:**
```typescript
// src/markdown.ts
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

const marked = new Marked({
  gfm: true,
  breaks: true,  // Single newlines become <br> (chat-friendly)
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener">${text}</a>`;
    },
  },
});

// Allow target attribute through DOMPurify
const purifyConfig = {
  ADD_ATTR: ['target'],
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'a', 'code', 'pre',
    'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'title'],
};

export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw) as string;
  return DOMPurify.sanitize(html, purifyConfig);
}
```

### Pattern 2: ChatStore Streaming State
**What:** ChatStore manages streaming as internal state fields, not separate messages.
**When to use:** Token accumulation and typing indicator state.
**Example:**
```typescript
// In ChatStore:
private streamingMessageId: string | null = null;
private streamingContent = '';
statusText = '';       // Reactive -- shown in UI
typingActive = false;  // Reactive -- controls typing indicator

// token handler:
this.client.addEventListener('token', ((e: CustomEvent<{ content: string }>) => {
  this.typingActive = false;  // First token replaces typing indicator
  this.statusText = '';       // STRM-06: clear status on token

  if (!this.streamingMessageId) {
    // Create new streaming message
    const id = crypto.randomUUID();
    this.streamingMessageId = id;
    this.streamingContent = e.detail.content;
    this.messages = [...this.messages, {
      id,
      role: 'agent',
      content: this.streamingContent,
      timestamp: Date.now(),
      streaming: true,
    }];
  } else {
    // Append to existing streaming message
    this.streamingContent += e.detail.content;
    this.messages = this.messages.map(m =>
      m.id === this.streamingMessageId
        ? { ...m, content: this.streamingContent }
        : m
    );
  }
  this.host.requestUpdate();
}) as EventListener);

// message_end handler:
this.client.addEventListener('message_end', () => {
  if (this.streamingMessageId) {
    this.messages = this.messages.map(m =>
      m.id === this.streamingMessageId
        ? { ...m, streaming: false }
        : m
    );
    this.streamingMessageId = null;
    this.streamingContent = '';
  }
  this.typingActive = false;
  this.statusText = '';  // STRM-06
  this.host.requestUpdate();
});
```

### Pattern 3: Conditional Rendering in Message Bubble
**What:** Agent messages render through markdown pipeline; user/system messages render as plain text.
**Example:**
```typescript
// In renderMessageBubble:
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderMarkdown } from '../markdown.js';

// Inside the template:
const content = message.role === 'agent'
  ? html`<div class="message-content markdown-content">
      ${unsafeHTML(renderMarkdown(message.content))}
      ${message.streaming ? html`<span class="streaming-cursor"></span>` : ''}
    </div>`
  : html`<div class="message-content">${message.content}</div>`;
```

### Pattern 4: Typing Indicator as Virtual Element
**What:** Typing indicator renders at the end of the message list (not as a message in the array). It visually occupies the position where the streaming bubble will appear.
**Why:** Prevents layout shift when first token arrives. The typing dots are rendered in-place, then replaced by the streaming message bubble at the same position.
**Example:**
```typescript
// In renderMessageList, after messages:
${store.typingActive ? html`
  <div class="message message--agent message--solo">
    <div class="typing-indicator">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
    ${store.statusText ? html`
      <div class="status-text">${store.statusText}</div>
    ` : ''}
  </div>
` : ''}
${!store.typingActive && store.statusText ? html`
  <div class="status-text">${store.statusText}</div>
` : ''}
```

### Pattern 5: Error Classification
**What:** Errors split into fatal (disable input, show action button) and recoverable (keep input enabled).
**How to classify:**
- Fatal: `rejected` (code 1008), `disconnected` (unexpected close), `session_end` -- these already set `connectionState='disconnected'` and `inputDisabled=true`
- Recoverable: `error` events from server -- these should NOT disable input
**The distinction:** The existing `error` handler in ChatStore already adds a system message without disabling input. Fatal scenarios already disable input via the `rejected`/`disconnected`/`session_end` handlers.

### Anti-Patterns to Avoid
- **Storing streaming content only in the message array:** Keep a separate `streamingContent` string in ChatStore. Reconstructing from the message array on each token is error-prone.
- **Rendering markdown for user messages:** User messages are plain text. Running them through marked would incorrectly format things like asterisks and underscores.
- **Using innerHTML directly:** Always use Lit's `unsafeHTML` directive, which integrates with Lit's rendering pipeline and avoids CSP issues with `innerHTML`.
- **Mutating message objects in place:** The project uses immutable array updates (`this.messages = [...this.messages]` or `.map()`). In-place mutation won't trigger Lit re-renders.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown parsing | Custom regex-based parser | `marked` | Markdown spec is deceptively complex; edge cases in nested formatting, escaping, list continuation |
| HTML sanitization | Allowlist-based string replace | `DOMPurify` | XSS vectors are numerous and evolving; DOMPurify handles mutation-based attacks, SVG injection, etc. |
| Incremental markdown parser | Custom diff-and-patch renderer | Full re-parse with `marked.parse()` | Chat messages are small (< 10KB); re-parse is fast enough; incremental adds significant complexity |

**Key insight:** The temptation in streaming markdown is to build an incremental parser that only re-renders changed portions. For chat widget message sizes, this is premature optimization. Full re-parse with `marked.parse()` on each token is what ChatGPT and Claude do, and it works well up to very large responses.

## Common Pitfalls

### Pitfall 1: Incomplete Markdown Artifacts During Streaming
**What goes wrong:** Partial tokens create malformed markdown (e.g., `**bol` renders as literal asterisks, then jumps to bold when `d**` arrives).
**Why it happens:** Markdown parser sees incomplete formatting tokens.
**How to avoid:** This is expected behavior and matches ChatGPT/Claude UX. The user decided to parse on every token. The visual "flicker" of partial formatting is acceptable and familiar.
**Warning signs:** Only problematic for code fences (triple backticks). A half-opened code fence will swallow subsequent content until closed.

### Pitfall 2: DOMPurify Stripping target="_blank"
**What goes wrong:** `target` attribute removed by DOMPurify's default config.
**Why it happens:** DOMPurify's default allowlist doesn't include `target`.
**How to avoid:** Use `ADD_ATTR: ['target']` in DOMPurify config. Also add `target` to `ALLOWED_ATTR`.
**Warning signs:** Links render but open in same window.

### Pitfall 3: Layout Shift on Typing-to-Streaming Transition
**What goes wrong:** Typing indicator disappears and streaming bubble appears at a different position, causing content to jump.
**Why it happens:** Typing indicator and streaming message are separate DOM elements.
**How to avoid:** User decision: typing indicator renders as a temporary agent bubble at the end of the message list. When first token arrives, `typingActive` becomes false and a new streaming message appears at the same position. Since both are agent bubbles with the same alignment, the transition is smooth.
**Warning signs:** Noticeable jump when first token arrives.

### Pitfall 4: Streaming Message Not Triggering Auto-Scroll
**What goes wrong:** As tokens accumulate, the message grows but the scroll doesn't follow.
**Why it happens:** ScrollManager.onNewMessage() is only called when message count changes, not when an existing message's content grows.
**How to avoid:** In the widget's `updated()` lifecycle, also check if any message is currently streaming and call `scrollManager.onNewMessage()` to keep scrolling to bottom during streaming.
**Warning signs:** User has to manually scroll during streaming.

### Pitfall 5: Multiple Concurrent Streams
**What goes wrong:** If user sends a message during streaming, the old stream's subsequent tokens get appended to the wrong message.
**Why it happens:** Server might interleave events from the old response with the new one.
**How to avoid:** User decided: when user sends during streaming, finalize current streaming message as-is. This means: on `send()`, if `streamingMessageId` is set, finalize it (set `streaming: false`), clear streaming state, then add user message.
**Warning signs:** Garbled content in messages, tokens appearing in wrong bubbles.

### Pitfall 6: CSP Issues with Inline Styles
**What goes wrong:** `marked` generates HTML that may include inline `style` attributes. SEC-03 requires CSP compatibility (no inline styles via `style=""`).
**Why it happens:** Default marked output doesn't add inline styles, but some extensions or custom content could.
**How to avoid:** DOMPurify's `ALLOWED_ATTR` list should NOT include `style`. The `ALLOWED_TAGS` and `ALLOWED_ATTR` lists in the purify config keep only safe attributes. All styling is done via CSS classes in the shadow DOM stylesheet.
**Warning signs:** Content renders but styles don't apply, or CSP violations in console.

## Code Examples

### Markdown Pipeline Setup
```typescript
// src/markdown.ts
// Source: marked.js.org/using_pro + cure53/DOMPurify README
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

const marked = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener">${text}</a>`;
    },
  },
});

const PURIFY_CONFIG = {
  ADD_ATTR: ['target'],
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'a', 'code', 'pre',
    'ul', 'ol', 'li', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'title'],
};

export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw) as string;
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}
```

### Typing Indicator Animation CSS
```css
/* Typing dots animation */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--w1-agent-color, #888);
  animation: typing-bounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* Blinking cursor at end of streaming text */
.streaming-cursor::after {
  content: '\u258C';  /* Left half block character */
  animation: cursor-blink 1s step-end infinite;
  color: var(--w1-agent-color, #1a1a1a);
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

### Markdown Content Styles
```css
/* Styles for rendered markdown inside agent bubbles */
.markdown-content p { margin: 0 0 8px 0; }
.markdown-content p:last-child { margin-bottom: 0; }
.markdown-content strong { font-weight: 600; }
.markdown-content a { color: inherit; text-decoration: underline; }
.markdown-content ul, .markdown-content ol { margin: 4px 0; padding-left: 20px; }
.markdown-content li { margin: 2px 0; }

/* Code blocks */
.markdown-content pre {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 10px 12px;
  overflow: auto;
  max-height: 250px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.4;
  margin: 6px 0;
}

/* Inline code */
.markdown-content code:not(pre code) {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  padding: 1px 4px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

/* Status text subtitle */
.status-text {
  font-size: 11px;
  font-style: italic;
  color: var(--w1-system-color, #888);
  padding: 2px 14px;
  animation: ellipsis-pulse 2s ease-in-out infinite;
}

@keyframes ellipsis-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Error system messages */
.message--error {
  align-self: stretch;
  background: var(--w1-error-bg, #fef2f2);
  color: var(--w1-error-color, #991b1b);
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  padding: 8px 16px;
  margin: 8px 0;
}
```

### Using unsafeHTML in Lit Template
```typescript
// Source: lit.dev/docs/templates/directives/
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderMarkdown } from '../markdown.js';

// In template:
html`${unsafeHTML(renderMarkdown(message.content))}`
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `marked(string)` global function | `new Marked()` instance creation | marked v5+ | Avoids global state pollution, safer for multiple configs |
| `renderer.link(href, title, text)` | `renderer.link({ href, title, tokens })` | marked v13 | Token-based API, use `this.parser.parseInline(tokens)` for text |
| DOMPurify v2 `createDOMPurify(window)` | DOMPurify v3 direct import | DOMPurify v3.0 | Simpler API, `import DOMPurify from 'dompurify'` works directly |
| `target="_blank"` needs `rel="noopener"` | Modern browsers auto-imply `rel="noopener"` | Chrome 88+ / 2021 | Still good practice to add explicitly for clarity |

**Deprecated/outdated:**
- `marked.setOptions()`: Use `marked.use()` instead (v5+)
- `new marked.Renderer()`: Use renderer object in `marked.use()` instead
- `marked.parse()` with callback: Synchronous by default, async only via `marked.use({ async: true })`

## Open Questions

1. **marked v17 `parse()` return type**
   - What we know: marked.parse() returns `string` in sync mode, `Promise<string>` with `async: true`
   - What's unclear: Whether v17 introduced any breaking changes to the return type
   - Recommendation: Use sync mode (no async needed for our use case), cast return as `string`

2. **DOMPurify types in ESM context**
   - What we know: `@types/dompurify` provides types, DOMPurify v3 has improved ESM support
   - What's unclear: Whether `@types/dompurify` is current for v3.3.1
   - Recommendation: Install `@types/dompurify`, fall back to manual typing if needed

3. **Scroll behavior during streaming**
   - What we know: ScrollManager triggers on new message count changes
   - What's unclear: Best mechanism to trigger scroll on content growth within existing message
   - Recommendation: In `updated()`, if a streaming message exists and `isAtBottom`, scroll sentinel into view

## Sources

### Primary (HIGH confidence)
- [marked official docs](https://marked.js.org/) - API, renderer, configuration
- [marked using_pro](https://marked.js.org/using_pro) - Custom renderer API, link function signature
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify) - Sanitize API, ADD_ATTR config, Shadow DOM support
- [Lit directives](https://lit.dev/docs/templates/directives/) - unsafeHTML directive usage

### Secondary (MEDIUM confidence)
- [marked GitHub releases](https://github.com/markedjs/marked/releases) - v17.0.4 confirmed latest
- [marked issue #3657](https://github.com/markedjs/marked/issues/3657) - Streaming markdown handling (no built-in incremental parsing)
- [DOMPurify issue #317](https://github.com/cure53/DOMPurify/issues/317) - target="_blank" configuration pattern
- [Stefan Judis](https://www.stefanjudis.com/today-i-learned/target-blank-implies-rel-noopener/) - Modern browsers auto-imply rel=noopener

### Tertiary (LOW confidence)
- marked v17 specific breaking changes -- could not access full changelog, verify during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - marked and DOMPurify are well-established, APIs verified via official docs
- Architecture: HIGH - Patterns follow existing codebase conventions (ReactiveController, immutable updates, functional render helpers)
- Pitfalls: HIGH - Common issues well-documented in library issue trackers and community

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable libraries, unlikely to change significantly)
