import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ChatClient } from './chat-client.js';

/**
 * <work1-chat-widget> - Custom element shell for chat-server integration.
 *
 * Bridges ChatClient WebSocket protocol to DOM custom events.
 * Accepts server-url and debug attributes for configuration.
 *
 * @fires w1-connected - When WebSocket connects successfully. Detail: { session_id: string }
 * @fires w1-disconnected - When WebSocket disconnects or is rejected. Detail: { code: number, reason: string }
 * @fires w1-error - When server sends an error message. Detail: { content: string }
 * @fires w1-session-end - When server ends the session. Detail: { reason: string, content: string }
 */
@customElement('work1-chat-widget')
export class Work1ChatWidget extends LitElement {
  /**
   * WebSocket server URL. Required before calling openConnection().
   * @attr server-url
   */
  @property({ attribute: 'server-url' })
  serverUrl: string = '';

  /**
   * Enable debug logging on the underlying ChatClient.
   * @attr debug
   */
  @property({ type: Boolean, reflect: true })
  debug: boolean = false;

  private client: ChatClient | null = null;

  /**
   * Current session ID from the ChatClient, or null if not connected.
   */
  get sessionId(): string | null {
    return this.client?.sessionId ?? null;
  }

  /**
   * Create a ChatClient and connect to the configured server-url.
   */
  openConnection(): void {
    if (!this.serverUrl) {
      console.error('[work1-widget] server-url attribute is required');
      return;
    }

    this.client = new ChatClient({ debug: this.debug });
    this.setupClientListeners();
    this.client.connect(this.serverUrl);
  }

  /**
   * Disconnect the ChatClient and release resources.
   */
  closeConnection(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }

  private setupClientListeners(): void {
    if (!this.client) return;

    this.client.addEventListener('connected', (e) => {
      this.dispatchEvent(
        new CustomEvent('w1-connected', {
          bubbles: true,
          composed: true,
          detail: { session_id: e.detail.session_id },
        }),
      );
    });

    this.client.addEventListener('disconnected', (e) => {
      this.dispatchEvent(
        new CustomEvent('w1-disconnected', {
          bubbles: true,
          composed: true,
          detail: { code: e.detail.code, reason: e.detail.reason },
        }),
      );
    });

    this.client.addEventListener('rejected', (e) => {
      this.dispatchEvent(
        new CustomEvent('w1-disconnected', {
          bubbles: true,
          composed: true,
          detail: { code: e.detail.code, reason: 'Connection rejected' },
        }),
      );
    });

    this.client.addEventListener('error', (e) => {
      this.dispatchEvent(
        new CustomEvent('w1-error', {
          bubbles: true,
          composed: true,
          detail: { content: e.detail.content },
        }),
      );
    });

    this.client.addEventListener('session_end', (e) => {
      this.dispatchEvent(
        new CustomEvent('w1-session-end', {
          bubbles: true,
          composed: true,
          detail: { reason: e.detail.reason, content: e.detail.content },
        }),
      );
    });
  }

  protected render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'work1-chat-widget': Work1ChatWidget;
  }
}
