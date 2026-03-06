import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WS from 'vitest-websocket-mock';
import type { ReactiveControllerHost } from 'lit';
import { ChatStore } from './chat-store.js';

function createMockHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

const URL = 'ws://localhost:1234';
let server: WS;
let store: ChatStore;

describe('Integration: ChatStore + ChatClient + WebSocket', () => {
  beforeEach(() => {
    server = new WS(URL);
    store = new ChatStore(createMockHost());
  });

  afterEach(() => {
    store.disconnect();
    WS.clean();
  });

  // ---- TEST-04: Full message flow ----

  describe('full message flow', () => {
    it('connect -> send -> stream tokens -> finalize produces correct ChatStore state', async () => {
      // 1. Connect -- assert connecting
      store.connect(URL, false);
      expect(store.connectionState).toBe('connecting');

      // 2. WebSocket connected
      await server.connected;

      // 3. Server sends connected event -- assert connected + input enabled
      server.send(JSON.stringify({ type: 'connected', session_id: 'test-123' }));
      await vi.waitFor(() => {
        expect(store.connectionState).toBe('connected');
      });
      expect(store.inputDisabled).toBe(false);

      // 4. User sends message -- assert user message in store
      store.send('Hello');
      expect(store.messages).toHaveLength(1);
      expect(store.messages[0].role).toBe('user');
      expect(store.messages[0].content).toBe('Hello');

      // 5. Verify server received the message
      await expect(server).toReceiveMessage(
        JSON.stringify({ type: 'message', content: 'Hello' }),
      );

      // 6. First token -- assert streaming agent message created
      server.send(JSON.stringify({ type: 'token', content: 'Hi' }));
      await vi.waitFor(() => {
        expect(store.messages).toHaveLength(2);
      });
      expect(store.messages[1].streaming).toBe(true);
      expect(store.messages[1].content).toBe('Hi');

      // 7. Second token -- assert content accumulation
      server.send(JSON.stringify({ type: 'token', content: ' there' }));
      await vi.waitFor(() => {
        expect(store.messages[1].content).toBe('Hi there');
      });

      // 8. Message end -- assert streaming finalized
      server.send(JSON.stringify({ type: 'message_end' }));
      await vi.waitFor(() => {
        expect(store.messages[1].streaming).toBe(false);
      });
      expect(store.messages[1].content).toBe('Hi there');
    });
  });

  // ---- TEST-05: Lifecycle transitions ----

  describe('lifecycle transitions', () => {
    async function connectAndEstablish(): Promise<void> {
      store.connect(URL, false);
      await server.connected;
      server.send(JSON.stringify({ type: 'connected', session_id: 'test-123' }));
      await vi.waitFor(() => {
        expect(store.connectionState).toBe('connected');
      });
    }

    it('reconnection flow: connected -> reconnecting -> status restored', async () => {
      // 1. Connect and establish session
      await connectAndEstablish();

      // 2. Server sends reconnecting -- assert state transition
      server.send(JSON.stringify({ type: 'reconnecting' }));
      await vi.waitFor(() => {
        expect(store.connectionState).toBe('reconnecting');
      });

      // 3. Server sends status -- assert statusText updated
      server.send(JSON.stringify({ type: 'status', content: 'Connection restored' }));
      await vi.waitFor(() => {
        expect(store.statusText).toBe('Connection restored');
      });

      // 4. connectionState should still be reconnecting (status doesn't change it)
      expect(store.connectionState).toBe('reconnecting');
    });

    it('session end flow: connected -> session_end -> disconnected with disabled input', async () => {
      // 1. Connect and establish session
      await connectAndEstablish();

      // 2. Server sends session_end
      server.send(
        JSON.stringify({
          type: 'session_end',
          reason: 'idle_timeout',
          content: 'Session closed due to inactivity.',
        }),
      );

      // Assert: disconnected, input disabled, system message with reason
      await vi.waitFor(() => {
        expect(store.connectionState).toBe('disconnected');
      });
      expect(store.inputDisabled).toBe(true);

      // System message should contain the reason
      const systemMessage = store.messages.find((m) => m.role === 'system');
      expect(systemMessage).toBeDefined();
      expect(systemMessage!.content).toContain('idle_timeout');
    });
  });
});
