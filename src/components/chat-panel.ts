import { html, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

/**
 * Render the chat panel container with open/close and position classes.
 *
 * @param isOpen - Whether the panel is visible
 * @param position - 'right' or 'left' for placement
 * @param content - Inner content (header + message list + input area)
 */
export function renderPanel(
  isOpen: boolean,
  position: string,
  content: TemplateResult,
): TemplateResult {
  const classes = classMap({
    'chat-panel': true,
    'chat-panel--open': isOpen,
    'chat-panel--right': position === 'right',
    'chat-panel--left': position === 'left',
  });

  return html`
    <div class=${classes} part="panel" aria-hidden=${!isOpen}>
      ${content}
    </div>
  `;
}
