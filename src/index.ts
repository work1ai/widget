// Public API barrel export
export {
  type ServerMessage,
  type ClientMessage,
  type ChatClientEventMap,
  type TypedEventTarget,
  isServerMessage,
} from './chat-client.types.js';

export { ChatClient } from './chat-client.js';
export { ChatStore } from './chat-store.js';
export {
  type ChatMessage,
  type MessageRole,
  type ConnectionState,
} from './chat-store.types.js';
export { Work1ChatWidget } from './work1-chat-widget.js';
