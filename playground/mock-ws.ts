import type { ServerMessage } from '../src/chat-client.types.ts';
import {
  GREETING_TEXT,
  LONG_MARKDOWN_TEXT,
  ERROR_TEXT,
  SESSION_END_TEXT,
} from './scenarios.ts';

export class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  static instance: MockWebSocket | null = null;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: (() => void) | null = null;

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(_url: string) {
    MockWebSocket.instance = this;

    this.schedule(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
      this.emit({ type: 'connected', session_id: 'mock-session-001' });

      this.schedule(() => {
        this.triggerScenario('greeting');
      }, 100);
    }, 50);
  }

  private emit(msg: ServerMessage): void {
    if (this.readyState !== MockWebSocket.OPEN) return;
    const event = new MessageEvent('message', {
      data: JSON.stringify(msg),
    });
    if (this.onmessage) {
      this.onmessage(event);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const id = setTimeout(resolve, ms);
      this.timers.push(id);
    });
  }

  private schedule(fn: () => void, ms: number): void {
    const id = setTimeout(fn, ms);
    this.timers.push(id);
  }

  private async streamResponse(content: string): Promise<void> {
    this.emit({ type: 'typing', active: true });
    await this.delay(200);

    const words = content.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (this.readyState !== MockWebSocket.OPEN) return;
      const token = (i === 0 ? '' : ' ') + words[i];
      this.emit({ type: 'token', content: token });
      await this.delay(40);
    }

    this.emit({ type: 'message_end' });
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) return;

    try {
      const msg = JSON.parse(data);
      if (msg.type === 'message') {
        this.streamResponse('You said: ' + msg.content);
      }
    } catch {
      // Ignore parse errors
    }
  }

  close(code?: number, reason?: string): void {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    this.readyState = MockWebSocket.CLOSED;

    if (this.onclose) {
      this.onclose(
        new CloseEvent('close', {
          code: code ?? 1000,
          reason: reason ?? '',
          wasClean: true,
        }),
      );
    }
  }

  private simulateClose(code: number, reason: string): void {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    this.readyState = MockWebSocket.CLOSED;

    if (this.onclose) {
      this.onclose(
        new CloseEvent('close', { code, reason, wasClean: false }),
      );
    }
  }

  triggerScenario(name: string): void {
    switch (name) {
      case 'greeting':
        this.streamResponse(GREETING_TEXT);
        break;
      case 'long-markdown':
        this.streamResponse(LONG_MARKDOWN_TEXT);
        break;
      case 'error-protocol':
        this.emit({ type: 'error', content: ERROR_TEXT });
        break;
      case 'error-rejected':
        this.simulateClose(1008, 'Connection rejected');
        break;
      case 'error-disconnect':
        this.simulateClose(1006, 'Unexpected disconnect');
        break;
      case 'session-end':
        this.emit({
          type: 'session_end',
          reason: 'timeout',
          content: SESSION_END_TEXT,
        });
        break;
      default:
        console.warn(`[MockWebSocket] Unknown scenario: ${name}`);
    }
  }
}
