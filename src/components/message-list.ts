import { html, type TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import type { ReactiveControllerHost } from 'lit';
import type { ChatMessage } from '../chat-store.types.js';
import { shouldGroup, renderMessageBubble } from './message-bubble.js';

/**
 * ScrollManager tracks whether the user is at the bottom of the message area.
 * Uses IntersectionObserver on a zero-height sentinel element at the bottom.
 *
 * When the sentinel is visible (user scrolled to bottom), auto-scroll is active.
 * When hidden (user scrolled up), new messages increment unreadCount and show a pill.
 */
export class ScrollManager {
  isAtBottom = true;
  unreadCount = 0;

  private observer: IntersectionObserver | null = null;
  private sentinel: HTMLElement | null = null;
  private host: ReactiveControllerHost | null = null;

  /**
   * Initialize the IntersectionObserver watching the sentinel element.
   * Must be called after first render when DOM elements are available.
   */
  setup(
    container: HTMLElement,
    sentinel: HTMLElement,
    host: ReactiveControllerHost,
  ): void {
    this.sentinel = sentinel;
    this.host = host;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.isAtBottom = true;
            this.unreadCount = 0;
            this.host?.requestUpdate();
          } else {
            this.isAtBottom = false;
          }
        }
      },
      { root: container, threshold: 0.1 },
    );

    this.observer.observe(sentinel);
  }

  /**
   * Disconnect the observer and release references.
   */
  destroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.sentinel = null;
    this.host = null;
  }

  /**
   * Called when a new message is added to the store.
   * If at bottom, scroll sentinel into view (instant). Otherwise bump unread count.
   */
  onNewMessage(): void {
    if (this.isAtBottom) {
      this.sentinel?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    } else {
      this.unreadCount++;
      this.host?.requestUpdate();
    }
  }

  /**
   * Smoothly scroll to the bottom and reset unread count.
   * Called when user clicks the scroll-to-bottom pill.
   */
  scrollToBottom(): void {
    this.sentinel?.scrollIntoView({ behavior: 'smooth' });
    this.unreadCount = 0;
  }
}

/**
 * Render the message list with grouped bubbles and optional scroll-to-bottom pill.
 *
 * Uses the `repeat` directive with message.id as key for stable DOM identity,
 * preventing scroll position loss on re-render.
 */
export function renderMessageList(
  messages: ChatMessage[],
  scrollManager: ScrollManager,
  onScrollToBottom: () => void,
  typingActive: boolean = false,
  statusText: string = '',
): TemplateResult {
  const hasStreamingMessage = messages.some(m => m.streaming);

  return html`
    ${repeat(
      messages,
      (msg) => msg.id,
      (msg, index) => {
        const grouping = shouldGroup(messages, index);
        return renderMessageBubble(msg, grouping);
      },
    )}
    ${typingActive && !hasStreamingMessage ? html`
      <div class="message message--agent message--solo">
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
        ${statusText ? html`<div class="status-text">${statusText}</div>` : ''}
      </div>
    ` : ''}
    ${!typingActive && statusText ? html`
      <div class="status-text">${statusText}</div>
    ` : ''}
    <div class="scroll-sentinel"></div>
    ${scrollManager.unreadCount > 0 && !scrollManager.isAtBottom
      ? html`
          <button class="scroll-pill" @click=${onScrollToBottom}>
            ${scrollManager.unreadCount} new
            message${scrollManager.unreadCount > 1 ? 's' : ''}
          </button>
        `
      : ''}
  `;
}
