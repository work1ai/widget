import { css } from 'lit';

/**
 * Root widget and bubble button styles.
 * All colors use CSS custom properties with fallback defaults for Phase 4 theming.
 */
export const widgetStyles = css`
  :host {
    display: block;
    position: fixed;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .bubble-button {
    position: fixed;
    bottom: 16px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background: var(--w1-accent-color, #0066FF);
    color: white;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease;
    padding: 0;
  }

  .bubble-button:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .bubble--right {
    right: 16px;
  }

  .bubble--left {
    left: 16px;
  }

  .bubble--hidden {
    transform: scale(0);
    opacity: 0;
    pointer-events: none;
  }
`;
