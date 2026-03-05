import { css } from 'lit';

/**
 * Streaming content styles: typing indicator, blinking cursor, markdown content,
 * status text, error messages, and new-conversation button.
 *
 * All colors use CSS custom properties with fallbacks for Phase 4 theming.
 */
export const streamingStyles = css`
  /* ---- Typing indicator dots ---- */

  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 4px 0;
  }

  .typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--w1-agent-color, #888);
    animation: typing-bounce 1.4s ease-in-out infinite;
  }

  .typing-dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing-bounce {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-4px);
      opacity: 1;
    }
  }

  /* ---- Blinking cursor at end of streaming text ---- */

  .streaming-cursor::after {
    content: '\u258C';
    animation: cursor-blink 1s step-end infinite;
    color: var(--w1-agent-color, #1a1a1a);
  }

  @keyframes cursor-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* ---- Markdown content styles ---- */

  .markdown-content p {
    margin: 0 0 8px 0;
  }

  .markdown-content p:last-child {
    margin-bottom: 0;
  }

  .markdown-content strong {
    font-weight: 600;
  }

  .markdown-content a {
    color: inherit;
    text-decoration: underline;
  }

  .markdown-content ul,
  .markdown-content ol {
    margin: 4px 0;
    padding-left: 20px;
  }

  .markdown-content li {
    margin: 2px 0;
  }

  /* ---- Code blocks ---- */

  .markdown-content pre {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    padding: 10px 12px;
    overflow: auto;
    max-height: 250px;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.4;
    margin: 6px 0;
  }

  /* ---- Inline code ---- */

  .markdown-content code:not(pre code) {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 4px;
    padding: 1px 4px;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
  }

  /* ---- Status text ---- */

  .status-text {
    font-size: 11px;
    font-style: italic;
    color: #888;
    padding: 2px 14px;
    animation: ellipsis-pulse 2s ease-in-out infinite;
  }

  @keyframes ellipsis-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  /* ---- Error system messages ---- */

  .message--error {
    align-self: stretch;
    background: var(--w1-error-bg, #fef2f2);
    color: var(--w1-error-color, #991b1b);
    border-radius: 8px;
    text-align: center;
    font-size: 13px;
    padding: 8px 16px;
    margin: 8px 0;
  }

  /* ---- Start new conversation button ---- */

  .new-conversation-btn {
    background: var(--w1-accent-color, #0066FF);
    color: white;
    border-radius: 20px;
    padding: 8px 20px;
    cursor: pointer;
    border: none;
    font-size: 13px;
    display: block;
    margin: 0 auto;
  }
`;
