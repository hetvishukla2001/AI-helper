export type SessionStatus = 'pending' | 'streaming' | 'completed' | 'error';

export interface SessionMessageChunk {
  id: string;
  model: string;
  content: string;
  done: boolean;
  timestamp: number;
  metrics?: Partial<SessionModelMetrics>;
  error?: string;
}

export interface SessionModelMetrics {
  latencyMs: number;
  tokens?: number;
  costUsd?: number;
}

export interface SessionRecord {
  id: string;
  prompt: string;
  models: string[];
  createdAt: number;
  status: SessionStatus;
  label?: string;
  responses: Record<string, string>;
  metrics: Record<string, SessionModelMetrics>;
  error?: string;
}
