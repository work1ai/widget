import { html, type TemplateResult } from 'lit';
import { chatBubbleIcon } from './icons.js';

/**
 * Render the floating bubble button.
 *
 * @param onClick - Handler called when the bubble is clicked
 * @param position - 'right' or 'left' for placement
 * @param hidden - Whether the bubble should be hidden (panel is open)
 */
export function renderBubble(
  onClick: () => void,
  position: string,
  hidden: boolean = false,
): TemplateResult {
  return html`
    <button
      class="bubble-button bubble--${position}${hidden ? ' bubble--hidden' : ''}"
      part="bubble"
      aria-label="Open chat"
      @click=${onClick}
    >
      ${chatBubbleIcon}
    </button>
  `;
}
