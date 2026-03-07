import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { ChatClient } from './chat-client.js';
import type { WebSocketConstructor } from './chat-client.js';
import type { ChatMessage, ConnectionState } from './chat-store.types.js';

/**
 * ChatStore - ReactiveController that bridges ChatClient events to Lit rendering.
 *
 * Single source of truth for all chat state: messages, connection status, open/close.
 * Every UI component reads from ChatStore. Mutations trigger host.requestUpdate()
 * so the host re-renders automatically.
 */
export class ChatStore implements ReactiveController {
  readonly host: ReactiveControllerHost;

  private client: ChatClient | null = null;
  private greetingAdded = false;
  private streamingMessageId: string | null = null;
  private streamingContent = '';

  // ---- Reactive state (mutations call host.requestUpdate()) ----

  messages: ChatMessage[] = [];
  connectionState: ConnectionState = 'disconnected';
  isOpen = false;
  inputDisabled = true;
  statusText = '';
  typingActive = false;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  // ---- Lifecycle ----

  hostConnected(): void {
    // No-op for now -- connection is triggered by first panel open
  }

  hostDisconnected(): void {
    this.disconnect();
  }

  // ---- Public methods ----

  /**
   * Create a ChatClient, wire events, and connect to the given URL.
   */
  connect(url: string, debug: boolean, options?: { WebSocket?: WebSocketConstructor }): void {
    if (this.client) {
      this.client.disconnect();
    }

    this.client = new ChatClient({ debug });
    this.wireClientEvents();
    this.client.connect(url, { WebSocket: options?.WebSocket });
    this.connectionState = 'connecting';
    this.host.requestUpdate();
  }

  /**
   * Close the client, null the reference, reset state.
   */
  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    this.connectionState = 'disconnected';
    this.inputDisabled = true;
    this.host.requestUpdate();
  }

  /**
   * Send a user message. No-op if not connected.
   * Adds the message to the local array immediately for instant display.
   */
  send(content: string): void {
    if (!this.client?.connected) return;

    // Finalize any in-progress streaming message before sending
    if (this.streamingMessageId) {
      this.messages = this.messages.map(m =>
        m.id === this.streamingMessageId
          ? { ...m, streaming: false }
          : m
      );
      this.streamingMessageId = null;
      this.streamingContent = '';
      this.typingActive = false;
      this.statusText = '';
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    this.messages = [...this.messages, message];
    this.client.send(content);
    this.host.requestUpdate();
  }

  /**
   * Toggle the chat panel open/close.
   * On first open, if greeting is provided and messages are empty, add an agent greeting message.
   */
  toggleOpen(greeting?: string): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen && greeting && !this.greetingAdded) {
      this.greetingAdded = true;
      this.messages = [
        ...this.messages,
        {
          id: crypto.randomUUID(),
          role: 'agent',
          content: greeting,
          timestamp: Date.now(),
        },
      ];
    }

    this.host.requestUpdate();
  }

  // ---- Private ----

  private wireClientEvents(): void {
    if (!this.client) return;

    this.client.addEventListener('connected', () => {
      this.connectionState = 'connected';
      this.inputDisabled = false;
      this.host.requestUpdate();
    });

    this.client.addEventListener('disconnected', () => {
      this.connectionState = 'disconnected';
      this.inputDisabled = true;
      this.host.requestUpdate();
    });

    this.client.addEventListener('rejected', () => {
      this.connectionState = 'disconnected';
      this.inputDisabled = true;
      this.host.requestUpdate();
    });

    this.client.addEventListener('reconnecting', () => {
      this.connectionState = 'reconnecting';
      this.host.requestUpdate();
    });

    this.client.addEventListener('session_end', ((e: CustomEvent<{ reason: string; content: string }>) => {
      this.connectionState = 'disconnected';
      this.inputDisabled = true;
      this.addSystemMessage(e.detail.reason);
      this.host.requestUpdate();
    }) as EventListener);

    this.client.addEventListener('error', ((e: CustomEvent<{ content: string }>) => {
      this.addSystemMessage(e.detail.content);
      this.host.requestUpdate();
    }) as EventListener);

    this.client.addEventListener('token', ((e: CustomEvent<{ content: string }>) => {
      this.typingActive = false;
      this.statusText = '';

      if (!this.streamingMessageId) {
        const id = crypto.randomUUID();
        this.streamingMessageId = id;
        this.streamingContent = e.detail.content;
        this.messages = [...this.messages, {
          id,
          role: 'agent' as const,
          content: this.streamingContent,
          timestamp: Date.now(),
          streaming: true,
        }];
      } else {
        this.streamingContent += e.detail.content;
        this.messages = this.messages.map(m =>
          m.id === this.streamingMessageId
            ? { ...m, content: this.streamingContent }
            : m
        );
      }
      this.host.requestUpdate();
    }) as EventListener);

    this.client.addEventListener('typing', ((e: CustomEvent<{ active: boolean }>) => {
      this.typingActive = e.detail.active;
      this.host.requestUpdate();
    }) as EventListener);

    this.client.addEventListener('message_end', (() => {
      if (this.streamingMessageId) {
        this.messages = this.messages.map(m =>
          m.id === this.streamingMessageId
            ? { ...m, streaming: false }
            : m
        );
        this.streamingMessageId = null;
        this.streamingContent = '';
      }
      this.typingActive = false;
      this.statusText = '';
      this.host.requestUpdate();
    }) as EventListener);

    this.client.addEventListener('status', ((e: CustomEvent<{ content: string }>) => {
      this.statusText = e.detail.content;
      this.host.requestUpdate();
    }) as EventListener);
  }

  private addSystemMessage(content: string): void {
    this.messages = [
      ...this.messages,
      {
        id: crypto.randomUUID(),
        role: 'system',
        content,
        timestamp: Date.now(),
      },
    ];
  }
}
