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
