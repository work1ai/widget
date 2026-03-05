import { css } from 'lit';

/**
 * Message bubble and list styles with CSS custom properties for theming.
 * Supports iMessage-style grouping (first/middle/last/solo) and scroll pill.
 */
export const messageStyles = css`
  /* ---- Message area (scrollable container) ---- */

  .message-area {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    scroll-behavior: auto;
  }

  /* ---- Base message bubble ---- */

  .message {
    max-width: 80%;
    padding: 8px 14px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.45;
    word-wrap: break-word;
    margin-bottom: 2px;
  }

  /* ---- Role-specific styles ---- */

  .message--user {
    align-self: flex-end;
    background: var(--w1-accent-color, #0066FF);
    color: white;
    border-bottom-right-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  .message--agent {
    align-self: flex-start;
    background: var(--w1-agent-bg, #f0f0f0);
    color: var(--w1-agent-color, #1a1a1a);
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  .message--system {
    align-self: center;
    background: none;
    color: var(--w1-system-color, #888);
    font-size: 12px;
    font-style: italic;
    padding: 4px 8px;
  }

  /* ---- Grouping styles ---- */

  .message--solo {
    border-radius: 16px;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .message--first {
    margin-top: 8px;
    margin-bottom: 1px;
  }

  .message--middle {
    margin-top: 1px;
    margin-bottom: 1px;
  }

  .message--last {
    margin-top: 1px;
    margin-bottom: 8px;
  }

  /* Reduced radius on grouped side for middle bubbles */
  .message--user.message--middle {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .message--agent.message--middle {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  /* First bubble: keep full top radius, reduce bottom grouped side */
  .message--user.message--first {
    border-bottom-right-radius: 4px;
  }

  .message--agent.message--first {
    border-bottom-left-radius: 4px;
  }

  /* Last bubble: full radius on tail side (pointed tail effect) */
  .message--user.message--last {
    border-bottom-right-radius: 16px;
    border-top-right-radius: 4px;
  }

  .message--agent.message--last {
    border-bottom-left-radius: 16px;
    border-top-left-radius: 4px;
  }

  /* ---- Scroll sentinel ---- */

  .scroll-sentinel {
    height: 0;
    width: 0;
    overflow: hidden;
  }

  /* ---- Scroll-to-bottom pill ---- */

  .scroll-pill {
    position: sticky;
    bottom: 8px;
    align-self: center;
    background: var(--w1-accent-color, #0066FF);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 6px 14px;
    font-size: 12px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1;
  }
`;
