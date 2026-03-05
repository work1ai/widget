import { html, type TemplateResult } from 'lit';
import { chatBubbleIcon, getLucideIcon } from './icons.js';

/**
 * Render the floating bubble button.
 *
 * @param onClick - Handler called when the bubble is clicked
 * @param position - 'right' or 'left' for placement
 * @param hidden - Whether the bubble should be hidden (panel is open)
 * @param iconName - Optional Lucide icon name to show instead of default bubble icon
 */
export function renderBubble(
  onClick: () => void,
  position: string,
  hidden: boolean = false,
  iconName: string = '',
): TemplateResult {
  const lucideIcon = iconName ? getLucideIcon(iconName) : null;
  const fallbackIcon = lucideIcon ?? chatBubbleIcon;

  return html`
    <button
      class="bubble-button bubble--${position}${hidden ? ' bubble--hidden' : ''}"
      part="bubble"
      aria-label="Open chat"
      @click=${onClick}
    >
      <slot name="bubble-icon">
        ${fallbackIcon}
      </slot>
    </button>
  `;
}
