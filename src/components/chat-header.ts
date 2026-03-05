import { html, type TemplateResult } from 'lit';
import { closeIcon } from './icons.js';

/**
 * Render the chat panel header with title, badge, and close button.
 *
 * @param title - Configurable header title text
 * @param onClose - Handler called when the close button is clicked
 */
export function renderHeader(
  title: string,
  onClose: () => void,
): TemplateResult {
  return html`
    <header class="chat-header" part="header">
      <span class="header-title">${title}</span>
      <span class="header-badge">Powered by AI</span>
      <button
        class="header-close"
        @click=${onClose}
        aria-label="Close chat"
      >
        ${closeIcon}
      </button>
    </header>
  `;
}
