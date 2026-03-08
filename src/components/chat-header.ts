import { html, nothing, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import type { ConnectionState } from '../chat-store.types.js';
import { closeIcon } from './icons.js';

/** Human-readable label for each connection state (used as aria-label). */
const stateLabel: Record<ConnectionState, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
};

/**
 * Render the chat panel header with title, optional subtitle, status dot, badge, and close button.
 *
 * @param title - Configurable header title text
 * @param subtitle - Optional subtitle text displayed below the title
 * @param connectionState - Current WebSocket connection state
 * @param onClose - Handler called when the close button is clicked
 */
export function renderHeader(
  title: string,
  subtitle: string,
  connectionState: ConnectionState,
  onClose: () => void,
): TemplateResult {
  const dotClasses = {
    'status-dot': true,
    'status-dot--connected': connectionState === 'connected',
    'status-dot--connecting':
      connectionState === 'connecting' || connectionState === 'reconnecting',
    'status-dot--disconnected': connectionState === 'disconnected',
  };

  return html`
    <header class="chat-header" part="header">
      <div class="header-title-group">
        <span class="header-title"
          ><span
            class=${classMap(dotClasses)}
            aria-label=${stateLabel[connectionState]}
          ></span>${title}</span
        >
        ${subtitle ? html`<span class="header-subtitle">${subtitle}</span>` : nothing}
      </div>
      <a
        class="header-badge"
        href="https://work1.ai"
        target="_blank"
        rel="noopener noreferrer"
        >Powered by work1.ai</a
      >
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
