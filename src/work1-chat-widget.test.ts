import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock ChatClient before importing widget
vi.mock('./chat-client.js', () => {
  class MockChatClient extends EventTarget {
    private _connected = false;

    get connected(): boolean {
      return this._connected;
    }

    _setConnected(value: boolean): void {
      this._connected = value;
    }

    connect = vi.fn((_url: string) => {});
    disconnect = vi.fn(() => {
      this._connected = false;
    });
    send = vi.fn((_content: string) => {});
  }

  return { ChatClient: MockChatClient };
});

// Dynamic import after mock
const { Work1ChatWidget } = await import('./work1-chat-widget.js');

type WidgetInstance = InstanceType<typeof Work1ChatWidget>;

function createWidget(attrs: Record<string, string> = {}): WidgetInstance {
  const el = document.createElement('work1-chat-widget');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el as WidgetInstance;
}

/** Dispatch a CustomEvent on the mock ChatClient inside the store */
function fireOnClient(widget: WidgetInstance, type: string, detail?: unknown): void {
  const client = (widget as any).store?.client;
  if (!client) throw new Error('No client on store -- is the widget connected?');
  client.dispatchEvent(new CustomEvent(type, { detail }));
}

/** Open the panel and connect the widget to a mock server */
async function openAndConnect(widget: WidgetInstance): Promise<void> {
  // Open panel (triggers connect when server-url is set)
  (widget as any).handleOpen();
  await widget.updateComplete;

  // Simulate the server sending a connected event
  const client = (widget as any).store?.client;
  if (client) {
    client._setConnected(true);
  }
  fireOnClient(widget, 'connected', { session_id: 'test-session-123' });
  await widget.updateComplete;
}

describe('chat-title and chat-subtitle', () => {
  let widget: WidgetInstance;

  afterEach(() => {
    widget?.remove();
  });

  it('setting chat-title="Support" renders "Support" in .header-title', async () => {
    widget = createWidget({ 'chat-title': 'Support' });
    await widget.updateComplete;
    // Open panel so header renders
    (widget as any).store.toggleOpen();
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;
    const title = shadow.querySelector('.header-title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toBe('Support');
  });

  it('widget does NOT have override title property (no native tooltip conflict)', async () => {
    widget = createWidget({ 'chat-title': 'Support' });
    await widget.updateComplete;

    // HTMLElement.title should be empty string (not overridden by widget)
    expect(widget.title).toBe('');
    // chatTitle should have the value
    expect((widget as any).chatTitle).toBe('Support');
  });

  it('setting chat-subtitle="We reply fast" renders subtitle below title', async () => {
    widget = createWidget({ 'chat-title': 'Support', 'chat-subtitle': 'We reply fast' });
    await widget.updateComplete;
    (widget as any).store.toggleOpen();
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;
    const subtitle = shadow.querySelector('.header-subtitle');
    expect(subtitle).toBeTruthy();
    expect(subtitle!.textContent).toBe('We reply fast');
  });

  it('when chat-subtitle is not set, no .header-subtitle element is rendered', async () => {
    widget = createWidget({ 'chat-title': 'Support' });
    await widget.updateComplete;
    (widget as any).store.toggleOpen();
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;
    const subtitle = shadow.querySelector('.header-subtitle');
    expect(subtitle).toBeNull();
  });

  it('default chat-title is "Chat" when no attribute is set', async () => {
    widget = createWidget();
    await widget.updateComplete;
    (widget as any).store.toggleOpen();
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;
    const title = shadow.querySelector('.header-title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toBe('Chat');
  });
});

describe('Work1ChatWidget UI states', () => {
  let widget: WidgetInstance;

  afterEach(() => {
    widget?.remove();
  });

  it('disconnected state: input is disabled', async () => {
    widget = createWidget();
    await widget.updateComplete;

    // Open the panel without a server-url (stays disconnected)
    (widget as any).store.toggleOpen();
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;
    const textarea = shadow.querySelector('.input-textarea') as HTMLTextAreaElement | null;
    expect(textarea).toBeTruthy();
    expect(textarea!.disabled).toBe(true);

    const sendBtn = shadow.querySelector('.send-button') as HTMLButtonElement | null;
    expect(sendBtn).toBeTruthy();
    expect(sendBtn!.disabled).toBe(true);
  });

  it('connected state: input is enabled, no error banners', async () => {
    widget = createWidget({ 'server-url': 'ws://test' });
    await widget.updateComplete;

    await openAndConnect(widget);

    const shadow = widget.shadowRoot!;
    const textarea = shadow.querySelector('.input-textarea') as HTMLTextAreaElement | null;
    expect(textarea).toBeTruthy();
    expect(textarea!.disabled).toBe(false);

    const sendBtn = shadow.querySelector('.send-button') as HTMLButtonElement | null;
    expect(sendBtn).toBeTruthy();
    // Send button is disabled because input is empty (no text to send), but it exists and is not
    // structurally disabled by connection state. The textarea being enabled is the key signal.

    // No error messages visible
    const errorMsgs = shadow.querySelectorAll('.message--error');
    expect(errorMsgs.length).toBe(0);

    const systemMsgs = shadow.querySelectorAll('.message--system');
    expect(systemMsgs.length).toBe(0);
  });

  it('streaming state: streaming message bubble visible with content', async () => {
    widget = createWidget({ 'server-url': 'ws://test' });
    await widget.updateComplete;

    await openAndConnect(widget);

    // Fire a token event to start streaming
    fireOnClient(widget, 'token', { content: 'Hello' });
    await widget.updateComplete;
    // Extra tick for Lit scheduling
    await new Promise(r => setTimeout(r, 0));
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;

    // Look for an agent message containing the streamed content
    const agentMsgs = shadow.querySelectorAll('.message--agent');
    expect(agentMsgs.length).toBeGreaterThan(0);

    // The streaming message should contain the token content
    const streamingMsg = Array.from(agentMsgs).find(
      el => el.textContent?.includes('Hello')
    );
    expect(streamingMsg).toBeTruthy();

    // Streaming cursor should be visible on the active streaming message
    const cursor = shadow.querySelector('.streaming-cursor');
    expect(cursor).toBeTruthy();
  });

  it('error state: error system message displayed in chat', async () => {
    widget = createWidget({ 'server-url': 'ws://test' });
    await widget.updateComplete;

    await openAndConnect(widget);

    // Fire an error event
    fireOnClient(widget, 'error', { content: 'Something went wrong' });
    await widget.updateComplete;
    await new Promise(r => setTimeout(r, 0));
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;

    // System messages get both message--system and message--error classes
    const errorMsgs = shadow.querySelectorAll('.message--error');
    expect(errorMsgs.length).toBeGreaterThan(0);

    const errorMsg = Array.from(errorMsgs).find(
      el => el.textContent?.includes('Something went wrong')
    );
    expect(errorMsg).toBeTruthy();
  });

  it('session ended state: input disabled, system message, new conversation button', async () => {
    widget = createWidget({ 'server-url': 'ws://test' });
    await widget.updateComplete;

    await openAndConnect(widget);

    // Fire session_end event
    fireOnClient(widget, 'session_end', { reason: 'timeout', content: 'Session timed out' });
    await widget.updateComplete;
    await new Promise(r => setTimeout(r, 0));
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;

    // Input should be disabled (session ended sets connectionState to disconnected)
    // After session_end, showNewConversation = disconnected + messages.length > 0 + eventsWired
    // This replaces the input area with a "Start new conversation" button
    const newConvBtn = shadow.querySelector('.new-conversation-btn') as HTMLButtonElement | null;
    expect(newConvBtn).toBeTruthy();

    // System message with timeout reason should be in the chat
    const systemMsgs = shadow.querySelectorAll('.message--system');
    expect(systemMsgs.length).toBeGreaterThan(0);

    const timeoutMsg = Array.from(systemMsgs).find(
      el => el.textContent?.includes('timeout')
    );
    expect(timeoutMsg).toBeTruthy();
  });
});

describe('connection status dot', () => {
  let widget: WidgetInstance;

  afterEach(() => {
    widget?.remove();
  });

  it('CONN-01: shows green dot when connectionState is connected', async () => {
    widget = createWidget({ 'server-url': 'ws://test' });
    await widget.updateComplete;
    await openAndConnect(widget);

    const shadow = widget.shadowRoot!;
    const dot = shadow.querySelector('.status-dot--connected');
    expect(dot).toBeTruthy();
    expect(dot!.classList.contains('status-dot')).toBe(true);
  });

  it('CONN-02: shows yellow dot when connectionState is connecting', async () => {
    widget = createWidget({ 'server-url': 'ws://test' });
    await widget.updateComplete;

    // Open panel to trigger connect (state goes to 'connecting' before 'connected')
    (widget as any).store.toggleOpen();
    (widget as any).store.connectionState = 'connecting';
    (widget as any).store.host.requestUpdate();
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;
    const dot = shadow.querySelector('.status-dot--connecting');
    expect(dot).toBeTruthy();
    expect(dot!.classList.contains('status-dot')).toBe(true);
  });

  it('CONN-02: shows yellow dot when connectionState is reconnecting', async () => {
    widget = createWidget({ 'server-url': 'ws://test' });
    await widget.updateComplete;

    (widget as any).store.toggleOpen();
    (widget as any).store.connectionState = 'reconnecting';
    (widget as any).store.host.requestUpdate();
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;
    // Reconnecting should map to the same yellow 'connecting' class
    const dot = shadow.querySelector('.status-dot--connecting');
    expect(dot).toBeTruthy();
    expect(dot!.classList.contains('status-dot')).toBe(true);
  });

  it('CONN-03: shows red dot when connectionState is disconnected', async () => {
    widget = createWidget();
    await widget.updateComplete;

    (widget as any).store.toggleOpen();
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;
    const dot = shadow.querySelector('.status-dot--disconnected');
    expect(dot).toBeTruthy();
    expect(dot!.classList.contains('status-dot')).toBe(true);
  });
});

describe('branding badge', () => {
  let widget: WidgetInstance;

  afterEach(() => {
    widget?.remove();
  });

  it('BRAND-01: badge text reads "Powered by work1.ai"', async () => {
    widget = createWidget();
    await widget.updateComplete;

    (widget as any).store.toggleOpen();
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;
    const badge = shadow.querySelector('.header-badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent!.trim()).toBe('Powered by work1.ai');
  });

  it('BRAND-02: badge is an anchor linking to https://work1.ai in new tab', async () => {
    widget = createWidget();
    await widget.updateComplete;

    (widget as any).store.toggleOpen();
    await widget.updateComplete;

    const shadow = widget.shadowRoot!;
    const badge = shadow.querySelector('a.header-badge') as HTMLAnchorElement | null;
    expect(badge).toBeTruthy();
    expect(badge!.href).toBe('https://work1.ai/');
    expect(badge!.target).toBe('_blank');
    expect(badge!.rel).toBe('noopener noreferrer');
  });
});
