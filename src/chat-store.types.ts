export type MessageRole = 'user' | 'agent' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  /** True while agent message is still streaming (used in Phase 3) */
  streaming?: boolean;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';
