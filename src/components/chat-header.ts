import { html, nothing, type TemplateResult } from 'lit';
import { closeIcon } from './icons.js';

/**
 * Render the chat panel header with title, optional subtitle, badge, and close button.
 *
 * @param title - Configurable header title text
 * @param subtitle - Optional subtitle text displayed below the title
 * @param onClose - Handler called when the close button is clicked
 */
export function renderHeader(
  title: string,
  subtitle: string,
  onClose: () => void,
): TemplateResult {
  return html`
    <header class="chat-header" part="header">
      <div class="header-title-group">
        <span class="header-title">${title}</span>
        ${subtitle ? html`<span class="header-subtitle">${subtitle}</span>` : nothing}
      </div>
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
