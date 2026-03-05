import {
  type ServerMessage,
  type ChatClientEventMap,
  type TypedEventTarget,
  isServerMessage,
} from './chat-client.types.js';

/**
 * ChatClient - WebSocket protocol client for chat-server v0.1.0
 *
 * Extends EventTarget with typed events for all protocol message types.
 * Manages WebSocket lifecycle, message parsing, and debug logging.
 */
export class ChatClient extends (EventTarget as {
  new (): TypedEventTarget<ChatClientEventMap> & EventTarget;
  prototype: EventTarget;
}) {
  private ws: WebSocket | null = null;
  private _sessionId: string | null = null;
  private _debug: boolean;

  get sessionId(): string | null {
    return this._sessionId;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  constructor(options?: { debug?: boolean }) {
    super();
    this._debug = options?.debug ?? false;
  }

  /**
   * Open a WebSocket connection to the given URL.
   */
  connect(url: string): void {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (event: MessageEvent) => this.handleMessage(event);
    this.ws.onclose = (event: CloseEvent) => this.handleClose(event);
    this.ws.onerror = () => {}; // errors surface through onclose
  }

  /**
   * Close the WebSocket connection gracefully.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.close(1000, 'User closed');
      this.ws = null;
      this._sessionId = null;
    }
  }

  /**
   * Send a message to the server. No-op if not connected.
   */
  send(content: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', content }));
    }
  }

  private handleMessage(event: MessageEvent): void {
    let data: unknown;
    try {
      data = JSON.parse(event.data as string);
    } catch {
      this.warn('Malformed JSON received');
      return;
    }

    if (!isServerMessage(data)) {
      const obj = data as Record<string, unknown>;
      if (typeof obj.type === 'string') {
        this.warn(`[work1-widget] unknown or malformed message type: ${obj.type}`);
      } else {
        this.warn('[work1-widget] message missing type field');
      }
      return;
    }

    this.logMessage(data);

    switch (data.type) {
      case 'connected':
        this._sessionId = data.session_id;
        this.dispatchEvent(
          new CustomEvent('connected', { detail: { session_id: data.session_id } }),
        );
        break;
      case 'token':
        this.dispatchEvent(
          new CustomEvent('token', { detail: { content: data.content } }),
        );
        break;
      case 'typing':
        this.dispatchEvent(
          new CustomEvent('typing', { detail: { active: data.active } }),
        );
        break;
      case 'message_end':
        this.dispatchEvent(new CustomEvent('message_end'));
        break;
      case 'status':
        this.dispatchEvent(
          new CustomEvent('status', { detail: { content: data.content } }),
        );
        break;
      case 'reconnecting':
        this.dispatchEvent(new CustomEvent('reconnecting'));
        break;
      case 'session_end':
        this.dispatchEvent(
          new CustomEvent('session_end', {
            detail: { reason: data.reason, content: data.content },
          }),
        );
        break;
      case 'error':
        this.dispatchEvent(
          new CustomEvent('error', { detail: { content: data.content } }),
        );
        break;
      case 'session_start':
        // Parsed but NOT dispatched as public event (user decision)
        break;
    }
  }

  private handleClose(event: CloseEvent): void {
    if (event.code === 1008) {
      this.dispatchEvent(
        new CustomEvent('rejected', { detail: { code: 1008 } }),
      );
    } else if (event.code !== 1000) {
      this.dispatchEvent(
        new CustomEvent('disconnected', {
          detail: { code: event.code, reason: event.reason },
        }),
      );
    }
    this.ws = null;
    this._sessionId = null;
  }

  private logMessage(msg: ServerMessage): void {
    if (!this._debug) return;

    switch (msg.type) {
      case 'connected':
        this.log(`connected session=${msg.session_id}`);
        break;
      case 'token':
        this.log(`token (${msg.content.length} chars)`);
        break;
      case 'typing':
        this.log(`typing active=${msg.active}`);
        break;
      case 'message_end':
        this.log('message_end');
        break;
      case 'status':
        this.log(`status: ${msg.content}`);
        break;
      case 'reconnecting':
        this.log('reconnecting');
        break;
      case 'session_end':
        this.log(`session_end reason=${msg.reason}`);
        break;
      case 'error':
        this.log(`error: ${msg.content}`);
        break;
      case 'session_start':
        this.log(`session_start session=${msg.session_id}`);
        break;
    }
  }

  private log(msg: string): void {
    if (this._debug) {
      console.log(`[work1-widget] ${msg}`);
    }
  }

  private warn(msg: string): void {
    console.warn(msg);
  }
}
