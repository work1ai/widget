import { css } from 'lit';

/**
 * Panel and header styles with CSS custom properties for theming.
 * All colors and sizes use var() with fallback defaults.
 */
export const panelStyles = css`
  .chat-panel {
    position: fixed;
    bottom: 80px;
    width: var(--w1-panel-width, 380px);
    height: var(--w1-panel-height, 560px);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--w1-panel-bg, #ffffff);
    transform: translateY(20px) scale(0.95);
    opacity: 0;
    pointer-events: none;
    transition: transform 250ms ease-out, opacity 250ms ease-out;
  }

  .chat-panel--open {
    transform: translateY(0) scale(1);
    opacity: 1;
    pointer-events: auto;
  }

  .chat-panel--right {
    right: 16px;
  }

  .chat-panel--left {
    left: 16px;
  }

  .chat-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: var(--w1-accent-color, #0066FF);
    color: white;
    flex-shrink: 0;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    flex: 1;
  }

  .header-badge {
    font-size: 11px;
    opacity: 0.75;
    margin-right: 12px;
  }

  .header-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    opacity: 0.8;
  }

  .header-close:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.15);
  }

  @media (max-width: 480px) {
    .chat-panel {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100vh;
      height: 100dvh;
      border-radius: 0;
      box-shadow: none;
      bottom: 0;
      right: 0;
      left: 0;
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    .chat-panel--right,
    .chat-panel--left {
      right: 0;
      left: 0;
    }

    .header-close {
      min-width: 44px;
      min-height: 44px;
    }
  }
`;
