import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import type { ChatMessage } from '../chat-store.types.js';

// Mock ChatClient before importing ChatStore
vi.mock('../chat-client.js', () => {
  class MockChatClient extends EventTarget {
    private _connected = false;

    get connected(): boolean {
      return this._connected;
    }

    // Test helper to simulate connected state
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

// Import after mock is set up
const { ChatStore } = await import('../chat-store.js');

function createMockHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

/** Dispatch a typed CustomEvent on the ChatClient instance inside the store */
function fireClientEvent(store: InstanceType<typeof ChatStore>, type: string, detail?: unknown): void {
  // Access the private client field for testing
  const client = (store as unknown as { client: EventTarget | null }).client;
  if (!client) throw new Error('No client on store');
  client.dispatchEvent(new CustomEvent(type, { detail }));
}

/** Get the mock ChatClient from the store for assertions */
function getClient(store: InstanceType<typeof ChatStore>): {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  _setConnected: (v: boolean) => void;
} & EventTarget {
  const client = (store as unknown as { client: unknown }).client;
  return client as ReturnType<typeof getClient>;
}

describe('ChatStore', () => {
  let host: ReactiveControllerHost;
  let store: InstanceType<typeof ChatStore>;

  beforeEach(() => {
    host = createMockHost();
    store = new ChatStore(host);
  });

  it('constructor registers controller with host', () => {
    expect(host.addController).toHaveBeenCalledWith(store);
  });

  it('connect() creates ChatClient, sets connectionState to connecting, calls requestUpdate', () => {
    store.connect('ws://test', false);
    expect(store.connectionState).toBe('connecting');
    expect(host.requestUpdate).toHaveBeenCalled();
    const client = getClient(store);
    expect(client.connect).toHaveBeenCalledWith('ws://test');
  });

  it('on ChatClient connected event, connectionState becomes connected, inputDisabled becomes false', () => {
    store.connect('ws://test', false);
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();

    fireClientEvent(store, 'connected', { session_id: 'abc' });

    expect(store.connectionState).toBe('connected');
    expect(store.inputDisabled).toBe(false);
    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it('on ChatClient disconnected event, connectionState becomes disconnected, inputDisabled becomes true', () => {
    store.connect('ws://test', false);
    fireClientEvent(store, 'connected', { session_id: 'abc' });
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();

    fireClientEvent(store, 'disconnected', { code: 1006, reason: 'lost' });

    expect(store.connectionState).toBe('disconnected');
    expect(store.inputDisabled).toBe(true);
    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it('on ChatClient rejected event, connectionState becomes disconnected, inputDisabled becomes true', () => {
    store.connect('ws://test', false);
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();

    fireClientEvent(store, 'rejected', { code: 1008 });

    expect(store.connectionState).toBe('disconnected');
    expect(store.inputDisabled).toBe(true);
    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it('on ChatClient reconnecting event, connectionState becomes reconnecting', () => {
    store.connect('ws://test', false);
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();

    fireClientEvent(store, 'reconnecting');

    expect(store.connectionState).toBe('reconnecting');
    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it('send() adds user ChatMessage to messages array, calls ChatClient.send(), calls requestUpdate', () => {
    store.connect('ws://test', false);
    // Simulate connected state
    const client = getClient(store);
    client._setConnected(true);
    fireClientEvent(store, 'connected', { session_id: 'abc' });
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();

    store.send('hello');

    expect(store.messages).toHaveLength(1);
    const msg: ChatMessage = store.messages[0];
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('hello');
    expect(msg.id).toBeTruthy();
    expect(msg.timestamp).toBeGreaterThan(0);
    expect(client.send).toHaveBeenCalledWith('hello');
    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it('send() is no-op when not connected', () => {
    // Store is not connected
    store.send('hello');

    expect(store.messages).toHaveLength(0);
    // requestUpdate should not have been called for send (only constructor/init calls)
  });

  it('disconnect() nulls client, sets connectionState disconnected, inputDisabled true', () => {
    store.connect('ws://test', false);
    fireClientEvent(store, 'connected', { session_id: 'abc' });
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();

    store.disconnect();

    expect(store.connectionState).toBe('disconnected');
    expect(store.inputDisabled).toBe(true);
    expect((store as unknown as { client: unknown }).client).toBeNull();
    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it('hostDisconnected() calls disconnect()', () => {
    store.connect('ws://test', false);
    const disconnectSpy = vi.spyOn(store, 'disconnect');

    store.hostDisconnected();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('toggleOpen() flips isOpen and calls requestUpdate', () => {
    expect(store.isOpen).toBe(false);
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();

    store.toggleOpen();

    expect(store.isOpen).toBe(true);
    expect(host.requestUpdate).toHaveBeenCalled();

    store.toggleOpen();

    expect(store.isOpen).toBe(false);
  });

  it('on first open with greeting text, greeting is added as agent message', () => {
    store.toggleOpen('Welcome!');

    expect(store.messages).toHaveLength(1);
    const msg: ChatMessage = store.messages[0];
    expect(msg.role).toBe('agent');
    expect(msg.content).toBe('Welcome!');
    expect(msg.id).toBeTruthy();
  });

  it('greeting is only added once (second toggle does not duplicate)', () => {
    store.toggleOpen('Welcome!');
    expect(store.messages).toHaveLength(1);

    // Close
    store.toggleOpen('Welcome!');
    // Reopen
    store.toggleOpen('Welcome!');

    expect(store.messages).toHaveLength(1);
  });

  it('on session_end event, adds system message with reason', () => {
    store.connect('ws://test', false);
    fireClientEvent(store, 'connected', { session_id: 'abc' });
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();

    fireClientEvent(store, 'session_end', { reason: 'timeout', content: 'Session timed out' });

    expect(store.connectionState).toBe('disconnected');
    expect(store.inputDisabled).toBe(true);
    const systemMsg = store.messages.find((m: ChatMessage) => m.role === 'system');
    expect(systemMsg).toBeDefined();
    expect(systemMsg!.content).toContain('timeout');
  });

  it('on error event, adds system message with error content', () => {
    store.connect('ws://test', false);
    fireClientEvent(store, 'connected', { session_id: 'abc' });
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();

    fireClientEvent(store, 'error', { content: 'Something went wrong' });

    const systemMsg = store.messages.find((m: ChatMessage) => m.role === 'system');
    expect(systemMsg).toBeDefined();
    expect(systemMsg!.content).toContain('Something went wrong');
  });
});
