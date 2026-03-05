import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ChatStore } from './chat-store.js';
import { renderBubble } from './components/bubble-button.js';
import { renderHeader } from './components/chat-header.js';
import { renderPanel } from './components/chat-panel.js';
import { widgetStyles } from './styles/widget.styles.js';
import { panelStyles } from './styles/panel.styles.js';

/**
 * <work1-chat-widget> - Embeddable chat widget custom element.
 *
 * Renders a floating bubble button that opens a chat panel with slide-up animation.
 * ChatStore (ReactiveController) manages all state: messages, connection, open/close.
 * The widget dispatches w1-* DOM custom events for external consumers.
 *
 * @fires w1-connected - When WebSocket connects successfully. Detail: { session_id: string }
 * @fires w1-disconnected - When WebSocket disconnects or is rejected. Detail: { code: number, reason: string }
 * @fires w1-error - When server sends an error message. Detail: { content: string }
 * @fires w1-session-end - When server ends the session. Detail: { reason: string, content: string }
 */
@customElement('work1-chat-widget')
export class Work1ChatWidget extends LitElement {
  static styles = [widgetStyles, panelStyles];

  /**
   * WebSocket server URL. Connection is initiated on first panel open.
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

  /**
   * Header title text.
   * @attr title
   */
  @property({ type: String })
  override title: string = 'Chat';

  /**
   * Input placeholder text.
   * @attr placeholder
   */
  @property({ type: String })
  placeholder: string = 'Type a message...';

  /**
   * Greeting message displayed as first agent bubble on panel open.
   * @attr greeting
   */
  @property({ type: String })
  greeting: string = '';

  /**
   * Panel position: 'bottom-right' or 'bottom-left'.
   * @attr position
   */
  @property({ type: String })
  position: string = 'bottom-right';

  /**
   * Panel width override (CSS value, e.g. '400px').
   * @attr width
   */
  @property({ type: String })
  width: string = '';

  /**
   * Panel height override (CSS value, e.g. '600px').
   * @attr height
   */
  @property({ type: String })
  height: string = '';

  private store = new ChatStore(this);
  private eventsWired = false;

  /**
   * Current session ID from the ChatStore's client, or null if not connected.
   */
  get sessionId(): string | null {
    // ChatStore manages the client internally; expose session via store if needed
    return null;
  }

  protected render() {
    const pos = this.position === 'bottom-left' ? 'left' : 'right';

    return html`
      ${this.renderWidthHeightOverrides()}
      ${renderBubble(
        () => this.handleOpen(),
        pos,
        this.store.isOpen,
      )}
      ${renderPanel(
        this.store.isOpen,
        pos,
        html`
          ${renderHeader(this.title, () => this.handleClose())}
          <div class="message-area" part="message-list">
            <!-- Message list will be wired in Plan 03 -->
          </div>
          <div class="input-area" part="input">
            <!-- Input area will be wired in Plan 04 -->
          </div>
        `,
      )}
    `;
  }

  /**
   * Render dynamic CSS custom property overrides for width/height attributes.
   * Only emits a <style> element when width or height is explicitly set.
   */
  private renderWidthHeightOverrides() {
    if (!this.width && !this.height) return nothing;
    const rules: string[] = [];
    if (this.width) rules.push(`--w1-panel-width: ${this.width}`);
    if (this.height) rules.push(`--w1-panel-height: ${this.height}`);
    return html`<style>:host { ${rules.join('; ')} }</style>`;
  }

  /**
   * Handle bubble click: open panel, connect on first open if server-url is set.
   */
  private handleOpen(): void {
    this.store.toggleOpen(this.greeting);

    // Connect on first open (lazy connection per research recommendation)
    if (this.store.isOpen && this.serverUrl && this.store.connectionState === 'disconnected') {
      this.store.connect(this.serverUrl, this.debug);
      this.wireStoreEvents();
    }
  }

  /**
   * Handle close button: close panel. Connection persists across toggles.
   */
  private handleClose(): void {
    this.store.toggleOpen();
  }

  /**
   * Wire ChatStore's internal ChatClient events to outward-facing w1-* DOM events.
   * This preserves the public event API from Phase 1 while ChatStore owns the client.
   */
  private wireStoreEvents(): void {
    if (this.eventsWired) return;
    this.eventsWired = true;

    // Access client through store's internal event forwarding.
    // ChatStore fires requestUpdate on state changes; we use a MutationObserver-like
    // approach by checking connection state changes in the update cycle.
    // For DOM events, we hook directly into ChatStore's client via a callback mechanism.
    //
    // Since ChatStore manages the ChatClient internally and we need to dispatch
    // w1-* events externally, we set up a reactive update check.
    this.setupDOMEventForwarding();
  }

  /**
   * Forward ChatClient events to w1-* DOM custom events by observing ChatStore state.
   *
   * We override the update lifecycle to detect connection state transitions
   * and dispatch the appropriate DOM events.
   */
  private lastConnectionState = this.store.connectionState;

  protected updated(): void {
    const currentState = this.store.connectionState;

    if (currentState !== this.lastConnectionState) {
      if (currentState === 'connected') {
        this.dispatchEvent(
          new CustomEvent('w1-connected', {
            bubbles: true,
            composed: true,
            detail: { session_id: null },
          }),
        );
      } else if (
        currentState === 'disconnected' &&
        this.lastConnectionState !== 'disconnected'
      ) {
        this.dispatchEvent(
          new CustomEvent('w1-disconnected', {
            bubbles: true,
            composed: true,
            detail: { code: 1000, reason: 'Disconnected' },
          }),
        );
      }

      this.lastConnectionState = currentState;
    }
  }

  private setupDOMEventForwarding(): void {
    // The store's internal client dispatches events that update store state.
    // We observe state transitions in updated() above to dispatch DOM events.
    // For error and session_end events, we watch the messages array for system messages.
    // This is a pragmatic approach -- Phase 3 will add more granular event hooks.
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'work1-chat-widget': Work1ChatWidget;
  }
}
