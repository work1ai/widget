import { css } from 'lit';

export const inputStyles = css`
  .input-wrapper {
    display: flex;
    align-items: flex-end;
    padding: 8px 12px;
    border-top: 1px solid var(--w1-border-color, #e5e5e5);
    background: var(--w1-input-bg, #ffffff);
    flex-shrink: 0;
    position: relative;
  }

  .input-grow-wrap {
    display: grid;
    flex: 1;
    min-width: 0;
  }

  .input-grow-wrap::after {
    content: attr(data-replicated-value) ' ';
    white-space: pre-wrap;
    word-wrap: break-word;
    visibility: hidden;
    grid-area: 1 / 1 / 2 / 2;
    font: inherit;
    padding: 10px 40px 10px 12px;
    max-height: 120px;
    overflow: hidden;
    font-size: 14px;
    line-height: 1.4;
  }

  .input-textarea {
    grid-area: 1 / 1 / 2 / 2;
    resize: none;
    overflow-y: auto;
    font: inherit;
    padding: 10px 40px 10px 12px;
    max-height: 120px;
    border: 1px solid var(--w1-border-color, #e5e5e5);
    border-radius: 20px;
    outline: none;
    font-size: 14px;
    line-height: 1.4;
    background: var(--w1-input-field-bg, #f8f8f8);
    transition: border-color 150ms ease;
  }

  .input-textarea:focus {
    border-color: var(--w1-accent-color, #0066ff);
  }

  .input-textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f0f0f0;
  }

  .send-button {
    position: absolute;
    right: 20px;
    bottom: 16px;
    background: none;
    border: none;
    color: var(--w1-accent-color, #0066ff);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: opacity 150ms ease;
  }

  .send-button--disabled {
    color: #ccc;
    cursor: default;
  }

  .byte-counter {
    position: absolute;
    right: 48px;
    bottom: 20px;
    font-size: 11px;
    color: #999;
  }

  .byte-counter--over {
    color: var(--w1-error-color, #dc3545);
    font-weight: 600;
  }

  @media (max-width: 480px) {
    .input-textarea {
      font-size: 16px;
    }

    .input-grow-wrap::after {
      font-size: 16px;
    }

    .send-button {
      min-width: 44px;
      min-height: 44px;
    }
  }
`;
