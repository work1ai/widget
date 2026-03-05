import { html, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { ChatMessage } from '../chat-store.types.js';
import { renderMarkdown } from '../markdown.js';

/**
 * Determine grouping position of a message within consecutive same-sender runs.
 * Used to apply iMessage-style visual grouping (reduced spacing, tail on last only).
 */
export function shouldGroup(
  messages: ChatMessage[],
  index: number,
): { isFirstInGroup: boolean; isLastInGroup: boolean } {
  const current = messages[index];
  const prev = index > 0 ? messages[index - 1] : null;
  const next = index < messages.length - 1 ? messages[index + 1] : null;

  return {
    isFirstInGroup: !prev || prev.role !== current.role,
    isLastInGroup: !next || next.role !== current.role,
  };
}

/**
 * Render a single message bubble with appropriate grouping classes.
 * System messages render as centered, unstyled text.
 */
export function renderMessageBubble(
  message: ChatMessage,
  grouping: { isFirstInGroup: boolean; isLastInGroup: boolean },
): TemplateResult {
  const { isFirstInGroup, isLastInGroup } = grouping;

  let groupClass: string;
  if (isFirstInGroup && isLastInGroup) {
    groupClass = 'message--solo';
  } else if (isFirstInGroup) {
    groupClass = 'message--first';
  } else if (isLastInGroup) {
    groupClass = 'message--last';
  } else {
    groupClass = 'message--middle';
  }

  if (message.role === 'agent') {
    return html`
      <div class="message message--agent ${groupClass}">
        <div class="message-content markdown-content">
          ${unsafeHTML(renderMarkdown(message.content))}${message.streaming ? html`<span class="streaming-cursor"></span>` : ''}
        </div>
      </div>
    `;
  }

  if (message.role === 'system') {
    return html`
      <div class="message message--system message--error ${groupClass}">
        <div class="message-content">${message.content}</div>
      </div>
    `;
  }

  return html`
    <div class="message message--user ${groupClass}">
      <div class="message-content">${message.content}</div>
    </div>
  `;
}
