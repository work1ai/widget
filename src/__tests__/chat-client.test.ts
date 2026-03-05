import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import WS from 'vitest-websocket-mock';
import { ChatClient } from '../chat-client.js';

describe('ChatClient', () => {
  let server: WS;
  let client: ChatClient;
  const URL = 'ws://localhost:1234';

  beforeEach(() => {
    server = new WS(URL);
    client = new ChatClient();
  });

  afterEach(() => {
    client?.disconnect();
    WS.clean();
  });

  // ---- Connection lifecycle ----

  describe('connection lifecycle', () => {
    it('connects to a WebSocket URL', async () => {
      client.connect(URL);
      await server.connected;
      expect(client.connected).toBe(true);
    });

    it('emits connected event with session_id', async () => {
      const handler = vi.fn();
      client.addEventListener('connected', handler);
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'connected', session_id: 'abc-123' }));

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.session_id).toBe('abc-123');
    });

    it('stores session_id from connected event', async () => {
      expect(client.sessionId).toBeNull();
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'connected', session_id: 'xyz-456' }));

      expect(client.sessionId).toBe('xyz-456');
    });

    it('returns false for connected before connecting', () => {
      expect(client.connected).toBe(false);
    });

    it('disconnect() closes WebSocket with code 1000', async () => {
      client.connect(URL);
      await server.connected;

      client.disconnect();
      await server.closed;

      expect(client.connected).toBe(false);
    });
  });

  // ---- Close handling ----

  describe('close handling', () => {
    it('emits rejected event on close code 1008', async () => {
      const handler = vi.fn();
      client.addEventListener('rejected', handler);
      client.connect(URL);
      await server.connected;

      server.close({ code: 1008, reason: 'Policy violation', wasClean: false });

      // Wait for async event processing
      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.code).toBe(1008);
    });

    it('emits disconnected event on unexpected close (non-1000, non-1008)', async () => {
      const handler = vi.fn();
      client.addEventListener('disconnected', handler);
      client.connect(URL);
      await server.connected;

      server.close({ code: 1006, reason: 'Connection lost', wasClean: false });

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.code).toBe(1006);
      expect(event.detail.reason).toBe('Connection lost');
    });

    it('does not emit any event on normal close (code 1000)', async () => {
      const rejectedHandler = vi.fn();
      const disconnectedHandler = vi.fn();
      client.addEventListener('rejected', rejectedHandler);
      client.addEventListener('disconnected', disconnectedHandler);
      client.connect(URL);
      await server.connected;

      server.close({ code: 1000, reason: 'Normal', wasClean: true });

      // Give time for any event to fire
      await new Promise((r) => setTimeout(r, 50));
      expect(rejectedHandler).not.toHaveBeenCalled();
      expect(disconnectedHandler).not.toHaveBeenCalled();
    });

    it('sets connected to false and sessionId to null after close', async () => {
      client.connect(URL);
      await server.connected;
      server.send(JSON.stringify({ type: 'connected', session_id: 'abc' }));
      expect(client.sessionId).toBe('abc');

      server.close({ code: 1006, reason: 'Lost', wasClean: false });

      await vi.waitFor(() => {
        expect(client.connected).toBe(false);
      });
      expect(client.sessionId).toBeNull();
    });
  });

  // ---- Protocol messages ----

  describe('protocol messages', () => {
    it('emits token event with content', async () => {
      const handler = vi.fn();
      client.addEventListener('token', handler);
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'token', content: 'hello' }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect((handler.mock.calls[0][0] as CustomEvent).detail.content).toBe('hello');
    });

    it('emits typing event with active true', async () => {
      const handler = vi.fn();
      client.addEventListener('typing', handler);
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'typing', active: true }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect((handler.mock.calls[0][0] as CustomEvent).detail.active).toBe(true);
    });

    it('emits typing event with active false', async () => {
      const handler = vi.fn();
      client.addEventListener('typing', handler);
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'typing', active: false }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect((handler.mock.calls[0][0] as CustomEvent).detail.active).toBe(false);
    });

    it('emits message_end event', async () => {
      const handler = vi.fn();
      client.addEventListener('message_end', handler);
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'message_end' }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('emits status event with content', async () => {
      const handler = vi.fn();
      client.addEventListener('status', handler);
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'status', content: 'Looking up...' }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect((handler.mock.calls[0][0] as CustomEvent).detail.content).toBe('Looking up...');
    });

    it('emits reconnecting event', async () => {
      const handler = vi.fn();
      client.addEventListener('reconnecting', handler);
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'reconnecting' }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('emits session_end event with reason and content', async () => {
      const handler = vi.fn();
      client.addEventListener('session_end', handler);
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({
        type: 'session_end',
        reason: 'idle_timeout',
        content: 'Session closed due to inactivity.',
      }));

      expect(handler).toHaveBeenCalledTimes(1);
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.reason).toBe('idle_timeout');
      expect(detail.content).toBe('Session closed due to inactivity.');
    });

    it('emits error event with content', async () => {
      const handler = vi.fn();
      client.addEventListener('error', handler);
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'error', content: 'Something went wrong' }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect((handler.mock.calls[0][0] as CustomEvent).detail.content).toBe('Something went wrong');
    });

    it('does not emit event for session_start (parsed but not public)', async () => {
      const handler = vi.fn();
      // Listen for any event that might be dispatched
      const eventTypes = ['connected', 'token', 'typing', 'message_end', 'status',
        'reconnecting', 'session_end', 'error', 'disconnected', 'rejected'] as const;
      eventTypes.forEach((type) => client.addEventListener(type, handler));

      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'session_start', session_id: 'agent-session' }));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ---- Resilience (CONN-08) ----

  describe('resilience', () => {
    it('warns on non-JSON string without crashing', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      client.connect(URL);
      await server.connected;

      server.send('not json at all');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Malformed'));
      warnSpy.mockRestore();
    });

    it('warns on unknown message type without crashing', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'unknown_type' }));

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unknown'));
      warnSpy.mockRestore();
    });

    it('warns on JSON with missing required fields without crashing', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'connected' })); // missing session_id

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('warns on JSON object with no type field without crashing', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ no_type_field: true }));

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // ---- Sending ----

  describe('sending messages', () => {
    it('sends JSON message with type and content', async () => {
      client.connect(URL);
      await server.connected;

      client.send('Hello agent');

      await expect(server).toReceiveMessage(
        JSON.stringify({ type: 'message', content: 'Hello agent' }),
      );
    });

    it('does not throw when sending while not connected', () => {
      expect(() => client.send('Hello')).not.toThrow();
    });
  });

  // ---- Debug mode ----

  describe('debug mode', () => {
    it('logs parsed summary when debug is true', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const debugClient = new ChatClient({ debug: true });
      debugClient.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'connected', session_id: 'abc123' }));

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[work1-widget]'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('abc123'),
      );

      debugClient.disconnect();
      logSpy.mockRestore();
    });

    it('logs token character count in debug mode', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const debugClient = new ChatClient({ debug: true });
      debugClient.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'token', content: 'hello world!' }));

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('12 chars'),
      );

      debugClient.disconnect();
      logSpy.mockRestore();
    });

    it('does not log when debug is false (default)', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      client.connect(URL);
      await server.connected;

      server.send(JSON.stringify({ type: 'connected', session_id: 'test' }));

      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it('always warns on malformed messages regardless of debug flag', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      client.connect(URL);
      await server.connected;

      server.send('not json');

      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
      logSpy.mockRestore();
    });
  });
});
