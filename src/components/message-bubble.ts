import { html, type TemplateResult } from 'lit';
import type { ChatMessage } from '../chat-store.types.js';

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

  return html`
    <div class="message message--${message.role} ${groupClass}">
      <div class="message-content">${message.content}</div>
    </div>
  `;
}
