import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { sendIcon } from './icons.js';

const encoder = new TextEncoder();

const BYTE_LIMIT = 4096;
const WARNING_THRESHOLD = BYTE_LIMIT - 200;

/**
 * Return UTF-8 byte length of a string.
 */
export function getByteLength(str: string): number {
  return encoder.encode(str).length;
}

export interface InputAreaProps {
  disabled: boolean;
  placeholder: string;
  onSend: (content: string) => void;
  onInput: (value: string) => void;
  value: string;
  byteCount: number;
  showNewConversation?: boolean;
  onNewConversation?: () => void;
}

function canSend(props: InputAreaProps): boolean {
  return (
    !props.disabled &&
    props.value.trim().length > 0 &&
    props.byteCount <= BYTE_LIMIT
  );
}

function handleKeydown(e: KeyboardEvent, props: InputAreaProps): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (canSend(props)) {
      props.onSend(props.value.trim());
    }
  }
}

/**
 * Render the message input area with auto-growing textarea, send button,
 * and conditional byte counter.
 */
export function renderInputArea(props: InputAreaProps): TemplateResult {
  if (props.showNewConversation) {
    return html`
      <button
        class="new-conversation-btn"
        @click=${() => props.onNewConversation?.()}
      >Start new conversation</button>
    `;
  }

  const sendable = canSend(props);

  return html`
    <div class="input-grow-wrap" data-replicated-value=${props.value}>
      <textarea
        class="input-textarea"
        placeholder=${props.placeholder}
        ?disabled=${props.disabled}
        .value=${props.value}
        @input=${(e: Event) =>
          props.onInput((e.target as HTMLTextAreaElement).value)}
        @keydown=${(e: KeyboardEvent) => handleKeydown(e, props)}
        rows="1"
        aria-label="Message input"
      ></textarea>
    </div>
    <button
      class="send-button ${sendable ? '' : 'send-button--disabled'}"
      ?disabled=${!sendable}
      @click=${() => {
        if (sendable) props.onSend(props.value.trim());
      }}
      aria-label="Send message"
    >
      ${sendIcon}
    </button>
    ${props.byteCount >= WARNING_THRESHOLD
      ? html`
          <span
            class="byte-counter ${props.byteCount > BYTE_LIMIT
              ? 'byte-counter--over'
              : ''}"
          >
            ${props.byteCount}/${BYTE_LIMIT}
          </span>
        `
      : nothing}
  `;
}
