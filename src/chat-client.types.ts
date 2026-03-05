// Protocol types for chat-server v0.1.0

// ---- Server Message Types (discriminated union) ----

export type ConnectedMessage = { type: 'connected'; session_id: string };
export type TokenMessage = { type: 'token'; content: string };
export type TypingMessage = { type: 'typing'; active: boolean };
export type MessageEndMessage = { type: 'message_end' };
export type SessionStartMessage = { type: 'session_start'; session_id: string };
export type StatusMessage = { type: 'status'; content: string };
export type ReconnectingMessage = { type: 'reconnecting' };
export type SessionEndMessage = { type: 'session_end'; reason: string; content: string };
export type ErrorMessage = { type: 'error'; content: string };

export type ServerMessage =
  | ConnectedMessage
  | TokenMessage
  | TypingMessage
  | MessageEndMessage
  | SessionStartMessage
  | StatusMessage
  | ReconnectingMessage
  | SessionEndMessage
  | ErrorMessage;

// ---- Client Message Type ----

export type ClientMessage = { type: 'message'; content: string };

// ---- Event Map ----

export interface ChatClientEventMap {
  'connected': CustomEvent<{ session_id: string }>;
  'token': CustomEvent<{ content: string }>;
  'typing': CustomEvent<{ active: boolean }>;
  'message_end': CustomEvent<void>;
  'status': CustomEvent<{ content: string }>;
  'reconnecting': CustomEvent<void>;
  'session_end': CustomEvent<{ reason: string; content: string }>;
  'error': CustomEvent<{ content: string }>;
  // Synthetic events (not from server messages, derived from WebSocket close)
  'disconnected': CustomEvent<{ code: number; reason: string }>;
  'rejected': CustomEvent<{ code: number }>;
}

// ---- Typed EventTarget ----

export interface TypedEventTarget<M> {
  addEventListener<K extends keyof M>(
    type: K,
    listener: (ev: M[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof M>(
    type: K,
    listener: (ev: M[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  dispatchEvent(event: Event): boolean;
}

// ---- Runtime Type Guard ----

/**
 * Runtime type guard for server messages.
 * Returns false for unknown types (supports CONN-08 graceful handling).
 */
export function isServerMessage(data: unknown): data is ServerMessage {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.type !== 'string') return false;

  switch (obj.type) {
    case 'connected':
      return typeof obj.session_id === 'string';
    case 'token':
      return typeof obj.content === 'string';
    case 'typing':
      return typeof obj.active === 'boolean';
    case 'message_end':
      return true;
    case 'session_start':
      return typeof obj.session_id === 'string';
    case 'status':
      return typeof obj.content === 'string';
    case 'reconnecting':
      return true;
    case 'session_end':
      return typeof obj.reason === 'string' && typeof obj.content === 'string';
    case 'error':
      return typeof obj.content === 'string';
    default:
      return false;
  }
}
