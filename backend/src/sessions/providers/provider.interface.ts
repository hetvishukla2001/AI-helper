export interface StreamChunk {
  type: 'data' | 'error' | 'done';
  content?: string;
  metrics?: {
    latencyMs?: number;
    tokens?: number;
    costUsd?: number;
  };
  error?: string;
}

export interface ModelProvider {
  readonly id: string;
  readonly name: string;
  streamCompletion(prompt: string, abortSignal: AbortSignal): AsyncGenerator<StreamChunk>;
}
