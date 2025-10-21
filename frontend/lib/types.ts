export interface ModelProviderInfo {
  id: string;
  name: string;
}

export type ModelStatus = 'idle' | 'pending' | 'streaming' | 'completed' | 'error';

export interface StreamChunkPayload {
  type: 'chunk' | 'status';
  sessionId: string;
  status?: string;
  error?: string;
  modelId?: string;
  chunk?: {
    id: string;
    model: string;
    content: string;
    done: boolean;
    timestamp: number;
    metrics?: {
      latencyMs?: number;
      tokens?: number;
      costUsd?: number;
    };
    error?: string;
  };
}

export interface SessionRecord {
  id: string;
  prompt: string;
  models: string[];
  createdAt: number;
  status: string;
  label?: string;
}
