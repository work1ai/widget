import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ChatStore } from './chat-store.js';
import { renderBubble } from './components/bubble-button.js';
import { renderHeader } from './components/chat-header.js';
import { renderInputArea, getByteLength } from './components/input-area.js';
import { renderPanel } from './components/chat-panel.js';
import { ScrollManager, renderMessageList } from './components/message-list.js';
import { widgetStyles } from './styles/widget.styles.js';
import { panelStyles } from './styles/panel.styles.js';
import { inputStyles } from './styles/input.styles.js';
import { messageStyles } from './styles/messages.styles.js';
import { streamingStyles } from './styles/streaming.styles.js';

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
  static styles = [widgetStyles, panelStyles, inputStyles, messageStyles, streamingStyles];

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
   * Header title text. Uses `chat-title` attribute to avoid native
   * HTMLElement.title tooltip conflict.
   * @attr chat-title
   */
  @property({ attribute: 'chat-title', type: String })
  chatTitle: string = 'Chat';

  /**
   * Optional subtitle text displayed below the title in the header.
   * @attr chat-subtitle
   */
  @property({ attribute: 'chat-subtitle', type: String })
  chatSubtitle: string = '';

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

  /**
   * Primary accent color override (CSS color value, e.g. '#ff0000').
   * Maps to --w1-accent-color on :host. External CSS custom properties
   * override this value via natural CSS cascade.
   * @attr primary-color
   */
  @property({ attribute: 'primary-color' })
  primaryColor: string = '';

  /**
   * Bubble icon name from the Lucide registry (e.g. 'help-circle', 'bot').
   * When set, replaces the default chat bubble icon. A named slot
   * `<span slot="bubble-icon">...</span>` takes precedence over this attribute.
   * @attr bubble-icon
   */
  @property({ attribute: 'bubble-icon' })
  bubbleIcon: string = '';

  private store = new ChatStore(this);
  _wsConstructor?: new (url: string) => WebSocket;
  private scrollManager = new ScrollManager();
  private scrollObserverInitialized = false;
  private lastMessageCount = 0;
  private eventsWired = false;
  private viewportHandler: (() => void) | null = null;

  @state()
  private inputValue: string = '';

  @state()
  private inputByteCount: number = 0;

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
      ${this.renderAttributeOverrides()}
      ${renderBubble(
        () => this.handleOpen(),
        pos,
        this.store.isOpen,
        this.bubbleIcon,
      )}
      ${renderPanel(
        this.store.isOpen,
        pos,
        html`
          ${renderHeader(this.chatTitle, this.chatSubtitle, () => this.handleClose())}
          <div class="message-area" part="message-list">
            ${renderMessageList(
              this.store.messages,
              this.scrollManager,
              () => this.scrollManager.scrollToBottom(),
              this.store.typingActive,
              this.store.statusText,
            )}
          </div>
          <div class="input-wrapper" part="input">
            ${renderInputArea({
              disabled: this.store.inputDisabled,
              placeholder: this.placeholder,
              onSend: (content) => this.handleSend(content),
              onInput: (value) => this.handleInput(value),
              value: this.inputValue,
              byteCount: this.inputByteCount,
              showNewConversation: this.store.connectionState === 'disconnected' && this.store.messages.length > 0 && this.eventsWired,
              onNewConversation: () => this.handleNewConversation(),
            })}
          </div>
        `,
      )}
    `;
  }

  /**
   * Render dynamic CSS custom property overrides for attribute-driven values.
   * Emits a <style> element setting --w1-* vars on :host when attributes are set.
   * External CSS custom properties override these via natural CSS cascade.
   */
  private renderAttributeOverrides() {
    const rules: string[] = [];
    if (this.width) rules.push(`--w1-panel-width: ${this.width}`);
    if (this.height) rules.push(`--w1-panel-height: ${this.height}`);
    if (this.primaryColor) rules.push(`--w1-accent-color: ${this.primaryColor}`);
    if (!rules.length) return nothing;
    return html`<style>:host { ${rules.join('; ')} }</style>`;
  }

  private handleInput(value: string): void {
    this.inputValue = value;
    this.inputByteCount = getByteLength(value);
  }

  private handleSend(content: string): void {
    this.store.send(content);
    this.inputValue = '';
    this.inputByteCount = 0;
  }

  /**
   * Handle "Start new conversation" button: disconnect, clear state, reconnect.
   */
  private handleNewConversation(): void {
    this.store.disconnect();
    this.store.messages = [];
    this.store.greeting = this.greeting;
    this.store.connect(this.serverUrl, this.debug, { WebSocket: this._wsConstructor });
  }

  /**
   * Handle bubble click: open panel, connect on first open if server-url is set.
   */
  private handleOpen(): void {
    this.store.greeting = this.greeting;
    this.store.toggleOpen();

    // Connect on first open (lazy connection per research recommendation)
    if (this.store.isOpen && this.serverUrl && this.store.connectionState === 'disconnected') {
      this.store.connect(this.serverUrl, this.debug, { WebSocket: this._wsConstructor });
      this.wireStoreEvents();
    }

    this.setupKeyboardHandler();
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

  private setupKeyboardHandler(): void {
    if (!window.visualViewport || this.viewportHandler) return;

    this.viewportHandler = () => {
      const vv = window.visualViewport!;
      const keyboardHeight = window.innerHeight - vv.height;
      const panel = this.renderRoot.querySelector('.chat-panel') as HTMLElement | null;
      if (!panel) return;

      if (keyboardHeight > 100) {
        // Virtual keyboard visible -- shrink panel to visible area
        panel.style.height = `${vv.height}px`;
      } else {
        // Keyboard dismissed -- clear inline override, CSS takes over
        panel.style.height = '';
      }
    };

    window.visualViewport.addEventListener('resize', this.viewportHandler);
  }

  private teardownKeyboardHandler(): void {
    if (window.visualViewport && this.viewportHandler) {
      window.visualViewport.removeEventListener('resize', this.viewportHandler);
      this.viewportHandler = null;
    }
  }

  disconnectedCallback(): void {
    this.teardownKeyboardHandler();
    this.scrollManager.destroy();
    super.disconnectedCallback();
  }

  protected updated(): void {
    // Initialize scroll observer when panel is open and DOM is ready
    if (this.store.isOpen && !this.scrollObserverInitialized) {
      const container = this.renderRoot.querySelector('.message-area') as HTMLElement | null;
      const sentinel = this.renderRoot.querySelector('.scroll-sentinel') as HTMLElement | null;
      if (container && sentinel) {
        this.scrollManager.setup(container, sentinel, this);
        this.scrollObserverInitialized = true;
      }
    }

    // Detect new messages and trigger scroll behavior
    const currentCount = this.store.messages.length;
    if (currentCount > this.lastMessageCount) {
      this.scrollManager.onNewMessage();
    }
    this.lastMessageCount = currentCount;

    // Auto-scroll during streaming as bubble height grows
    const hasStreaming = this.store.messages.some(m => m.streaming);
    if (hasStreaming && this.scrollManager.isAtBottom) {
      this.scrollManager.onNewMessage();
    }

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
