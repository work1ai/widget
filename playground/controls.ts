import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MockWebSocket } from './mock-ws.ts';
import type { Work1ChatWidget } from '../src/work1-chat-widget.ts';

/**
 * CSS custom properties exposed by the widget with their defaults and labels.
 */
const CSS_CUSTOM_PROPERTIES: Array<{ prop: string; default: string; label: string }> = [
  { prop: '--w1-accent-color',   default: '#0066FF', label: 'Accent Color' },
  { prop: '--w1-panel-bg',       default: '#ffffff', label: 'Panel Background' },
  { prop: '--w1-user-bg',        default: '#0066FF', label: 'User Bubble BG' },
  { prop: '--w1-agent-bg',       default: '#f0f0f0', label: 'Agent Bubble BG' },
  { prop: '--w1-agent-color',    default: '#1a1a1a', label: 'Agent Text Color' },
  { prop: '--w1-border-color',   default: '#e5e5e5', label: 'Border Color' },
  { prop: '--w1-input-bg',       default: '#ffffff', label: 'Input Area BG' },
  { prop: '--w1-input-field-bg', default: '#f8f8f8', label: 'Input Field BG' },
  { prop: '--w1-error-color',    default: '#dc3545', label: 'Error Text Color' },
  { prop: '--w1-error-bg',       default: '#fef2f2', label: 'Error BG' },
];

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * <playground-controls> - Developer control panel for the widget playground.
 *
 * Provides interactive controls for theming, connection switching, and
 * mock scenario triggering without using the browser console.
 */
@customElement('playground-controls')
export class PlaygroundControls extends LitElement {
  /** Reference to the <work1-chat-widget> element, set externally after DOM ready. */
  widgetEl!: Work1ChatWidget;

  @state() connectionStatus: ConnectionStatus = 'connecting';
  @state() mockMode: boolean = true;
  @state() realUrl: string = '';
  @state() expandedSections = { theme: true, connection: true, scenarios: true };

  // Track current control values for reset
  @state() private colorValues: Record<string, string> = {};
  @state() private positionValue: string = 'bottom-right';
  @state() private widthValue: number = 380;
  @state() private heightValue: number = 560;
  @state() private bubbleIconValue: string = '';

  static styles = css`
    :host {
      display: block;
      padding: 12px;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      color: #333;
    }

    details {
      margin-bottom: 8px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 8px;
    }

    summary {
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      padding: 6px 0;
      user-select: none;
      list-style: none;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    summary::-webkit-details-marker { display: none; }

    summary::before {
      content: '\\25B6';
      font-size: 9px;
      transition: transform 0.15s;
    }

    details[open] > summary::before {
      transform: rotate(90deg);
    }

    .section-content {
      padding: 8px 0 4px;
    }

    .control-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 3px 0;
      gap: 8px;
    }

    .control-row label {
      font-size: 12px;
      color: #555;
      flex-shrink: 0;
    }

    input[type="color"] {
      width: 36px;
      height: 36px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 2px;
      cursor: pointer;
      background: none;
    }

    input[type="range"] {
      width: 120px;
    }

    input[type="text"] {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
      box-sizing: border-box;
    }

    .range-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 3px 0;
      gap: 8px;
    }

    .range-value {
      font-size: 11px;
      color: #888;
      min-width: 36px;
      text-align: right;
    }

    .radio-group {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .radio-group label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #555;
      cursor: pointer;
    }

    /* Toggle switch */
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 0;
    }

    .toggle-labels {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #555;
    }

    .toggle-label-active {
      font-weight: 600;
      color: #333;
    }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      inset: 0;
      background: #0066FF;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      top: 3px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle-switch input:checked + .toggle-slider {
      background: #ccc;
    }

    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(20px);
    }

    /* Status dot */
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-dot.connected { background: #22c55e; }
    .status-dot.connecting { background: #eab308; }
    .status-dot.disconnected { background: #ef4444; }

    /* Buttons */
    .group-label {
      font-size: 11px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 0 4px;
    }

    .scenario-btn {
      display: block;
      width: 100%;
      padding: 7px 10px;
      margin-bottom: 6px;
      border: 1px solid transparent;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: opacity 0.15s;
    }

    .scenario-btn.content {
      background: #e8f0fe;
      color: #1a73e8;
    }

    .scenario-btn.content:hover { background: #d2e3fc; }

    .scenario-btn.error {
      background: #fce8e6;
      color: #c5221f;
    }

    .scenario-btn.error:hover { background: #f8d7da; }

    .scenario-btn:disabled {
      opacity: 0.4;
      pointer-events: none;
    }

    .reconnect-btn {
      display: block;
      width: 100%;
      padding: 7px 10px;
      margin-top: 8px;
      border: 1px solid transparent;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      background: #e8f0fe;
      color: #1a73e8;
    }

    .reconnect-btn:hover { background: #d2e3fc; }

    .reset-btn {
      background: none;
      border: none;
      font-size: 11px;
      color: #888;
      cursor: pointer;
      padding: 2px 0;
      margin-left: auto;
    }

    .reset-btn:hover { color: #333; }

    .section-header {
      display: flex;
      align-items: center;
      width: 100%;
      justify-content: space-between;
    }

    .url-input {
      margin-top: 8px;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();

    // Initialize color values with defaults
    for (const cp of CSS_CUSTOM_PROPERTIES) {
      this.colorValues[cp.prop] = cp.default;
    }
  }

  /**
   * Set up widget event listeners for connection state observation.
   * Called externally or when widgetEl is assigned.
   */
  setupWidgetListeners(): void {
    if (!this.widgetEl) return;

    this.widgetEl.addEventListener('w1-connected', () => {
      this.connectionStatus = 'connected';
    });

    this.widgetEl.addEventListener('w1-disconnected', () => {
      this.connectionStatus = 'disconnected';
    });
  }

  // --- Theme ---

  private handleColorChange(prop: string, e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.colorValues = { ...this.colorValues, [prop]: value };
    this.widgetEl.style.setProperty(prop, value);
  }

  private handlePositionChange(value: string): void {
    this.positionValue = value;
    this.widgetEl.setAttribute('position', value);
  }

  private handleWidthChange(e: Event): void {
    this.widthValue = Number((e.target as HTMLInputElement).value);
    this.widgetEl.setAttribute('width', this.widthValue + 'px');
  }

  private handleHeightChange(e: Event): void {
    this.heightValue = Number((e.target as HTMLInputElement).value);
    this.widgetEl.setAttribute('height', this.heightValue + 'px');
  }

  private handleBubbleIconChange(e: Event): void {
    this.bubbleIconValue = (e.target as HTMLInputElement).value;
    this.widgetEl.setAttribute('bubble-icon', this.bubbleIconValue);
  }

  private resetTheme(): void {
    for (const cp of CSS_CUSTOM_PROPERTIES) {
      this.colorValues = { ...this.colorValues, [cp.prop]: cp.default };
      this.widgetEl.style.removeProperty(cp.prop);
    }
    this.positionValue = 'bottom-right';
    this.widthValue = 380;
    this.heightValue = 560;
    this.bubbleIconValue = '';

    this.widgetEl.removeAttribute('position');
    this.widgetEl.removeAttribute('width');
    this.widgetEl.removeAttribute('height');
    this.widgetEl.removeAttribute('bubble-icon');
    this.requestUpdate();
  }

  // --- Connection ---

  private handleMockToggle(): void {
    this.mockMode = !this.mockMode;
    this.connectionStatus = 'connecting';

    if (this.mockMode) {
      (this.widgetEl as any)._wsConstructor = MockWebSocket;
      this.widgetEl.setAttribute('server-url', 'ws://mock');
    } else {
      (this.widgetEl as any)._wsConstructor = undefined;
      if (this.realUrl) {
        this.widgetEl.setAttribute('server-url', this.realUrl);
      }
    }

    (this.widgetEl as any).handleNewConversation();
  }

  private handleUrlChange(e: Event): void {
    this.realUrl = (e.target as HTMLInputElement).value;
    if (!this.mockMode && this.realUrl) {
      this.widgetEl.setAttribute('server-url', this.realUrl);
      this.connectionStatus = 'connecting';
      (this.widgetEl as any).handleNewConversation();
    }
  }

  private handleReconnect(): void {
    this.connectionStatus = 'connecting';
    (this.widgetEl as any).handleNewConversation();
  }

  // --- Scenarios ---

  private triggerScenario(name: string): void {
    MockWebSocket.instance?.triggerScenario(name);
  }

  // --- Render ---

  protected render() {
    return html`
      ${this.renderThemeSection()}
      ${this.renderConnectionSection()}
      ${this.renderScenariosSection()}
    `;
  }

  private renderThemeSection() {
    return html`
      <details ?open=${this.expandedSections.theme}>
        <summary>
          <span class="section-header">
            Theme
            <button class="reset-btn" @click=${(e: Event) => { e.preventDefault(); this.resetTheme(); }}>Reset</button>
          </span>
        </summary>
        <div class="section-content">
          ${CSS_CUSTOM_PROPERTIES.map(cp => html`
            <div class="control-row">
              <label>${cp.label}</label>
              <input type="color"
                .value=${this.colorValues[cp.prop] ?? cp.default}
                @input=${(e: Event) => this.handleColorChange(cp.prop, e)}>
            </div>
          `)}

          <div class="control-row" style="padding-top: 8px;">
            <label>Position</label>
            <div class="radio-group">
              <label>
                <input type="radio" name="position" value="bottom-right"
                  .checked=${this.positionValue === 'bottom-right'}
                  @change=${() => this.handlePositionChange('bottom-right')}>
                Bottom Right
              </label>
              <label>
                <input type="radio" name="position" value="bottom-left"
                  .checked=${this.positionValue === 'bottom-left'}
                  @change=${() => this.handlePositionChange('bottom-left')}>
                Bottom Left
              </label>
            </div>
          </div>

          <div class="range-row">
            <label>Width</label>
            <input type="range" min="300" max="500" step="10"
              .value=${String(this.widthValue)}
              @input=${this.handleWidthChange}>
            <span class="range-value">${this.widthValue}px</span>
          </div>

          <div class="range-row">
            <label>Height</label>
            <input type="range" min="400" max="700" step="10"
              .value=${String(this.heightValue)}
              @input=${this.handleHeightChange}>
            <span class="range-value">${this.heightValue}px</span>
          </div>

          <div class="control-row" style="padding-top: 4px;">
            <label>Bubble Icon</label>
            <input type="text" placeholder="e.g. help-circle"
              .value=${this.bubbleIconValue}
              @input=${this.handleBubbleIconChange}
              style="width: 140px;">
          </div>
        </div>
      </details>
    `;
  }

  private renderConnectionSection() {
    return html`
      <details ?open=${this.expandedSections.connection}>
        <summary>
          Connection
          <span class="status-dot ${this.connectionStatus}"></span>
        </summary>
        <div class="section-content">
          <div class="toggle-row">
            <div class="toggle-labels">
              <span class=${this.mockMode ? 'toggle-label-active' : ''}>Mock</span>
              <label class="toggle-switch">
                <input type="checkbox"
                  .checked=${!this.mockMode}
                  @change=${this.handleMockToggle}>
                <span class="toggle-slider"></span>
              </label>
              <span class=${!this.mockMode ? 'toggle-label-active' : ''}>Real</span>
            </div>
          </div>

          ${!this.mockMode ? html`
            <div class="url-input">
              <input type="text"
                placeholder="ws://localhost:8080"
                .value=${this.realUrl}
                @change=${this.handleUrlChange}>
            </div>
          ` : ''}

          ${this.connectionStatus === 'disconnected' ? html`
            <button class="reconnect-btn" @click=${this.handleReconnect}>
              Reconnect
            </button>
          ` : ''}
        </div>
      </details>
    `;
  }

  private renderScenariosSection() {
    const disabled = !this.mockMode;

    return html`
      <details ?open=${this.expandedSections.scenarios}>
        <summary>Scenarios</summary>
        <div class="section-content">
          <div class="group-label">Content</div>
          <button class="scenario-btn content" ?disabled=${disabled}
            @click=${() => this.triggerScenario('greeting')}>Greeting</button>
          <button class="scenario-btn content" ?disabled=${disabled}
            @click=${() => this.triggerScenario('long-markdown')}>Long Markdown</button>

          <div class="group-label">Error / State</div>
          <button class="scenario-btn error" ?disabled=${disabled}
            @click=${() => this.triggerScenario('error-protocol')}>Protocol Error</button>
          <button class="scenario-btn error" ?disabled=${disabled}
            @click=${() => this.triggerScenario('error-rejected')}>Connection Rejected</button>
          <button class="scenario-btn error" ?disabled=${disabled}
            @click=${() => this.triggerScenario('error-disconnect')}>Unexpected Disconnect</button>
          <button class="scenario-btn error" ?disabled=${disabled}
            @click=${() => this.triggerScenario('session-end')}>Session End</button>
        </div>
      </details>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'playground-controls': PlaygroundControls;
  }
}
