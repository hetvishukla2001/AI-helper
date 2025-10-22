import { Injectable } from '@nestjs/common';
import { ReadableStream as WebReadableStream } from 'node:stream/web';
import { StreamChunk, ModelProvider } from './provider.interface';

interface OpenAIStreamChoiceDelta {
  content?: { type: string; text: string }[];
  role?: string;
}

interface OpenAIStreamChunk {
  id: string;
  choices: {
    delta?: OpenAIStreamChoiceDelta;
    finish_reason: string | null;
  }[];
  created: number;
  model: string;
}

@Injectable()
export class OpenAIChatProvider implements ModelProvider {
  readonly id = 'openai-gpt-4o-mini';
  readonly name = 'OpenAI GPT-4o Mini';
  private readonly model: string;

  constructor() {
    this.model = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
  }

  async *streamCompletion(prompt: string, abortSignal: AbortSignal): AsyncGenerator<StreamChunk> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      yield { type: 'error', error: 'OPENAI_API_KEY is not configured.' };
      yield { type: 'done' };
      return;
    }

    const started = Date.now();

    // Use Node's built-in fetch (Node 18+)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: abortSignal,
    });

    if (!response.ok || !response.body) {
      yield {
        type: 'error',
        error: `OpenAI error: ${response.status} ${response.statusText}`,
      };
      yield { type: 'done' };
      return;
    }

    // Tell TS this is a Web ReadableStream so getReader() exists
    const body = response.body as unknown as WebReadableStream<Uint8Array>;
    const reader = body.getReader();
    const decoder = new TextDecoder();

    let accumulated = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      accumulated += decoder.decode(value, { stream: true });

      // SSE lines
      const lines = accumulated.split('\n');
      accumulated = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();

        // Stream terminator or empty keep-alives
        if (!trimmed || trimmed === 'data: [DONE]') {
          if (trimmed === 'data: [DONE]') {
            yield {
              type: 'done',
              metrics: { latencyMs: Date.now() - started },
            };
            return;
          }
          continue;
        }

        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.replace(/^data:\s*/, '');

        try {
          const parsed = JSON.parse(data) as OpenAIStreamChunk;
          const delta = parsed.choices?.[0]?.delta;
          let text = '';
          if (Array.isArray(delta?.content)) {
            text = delta.content.map((c) => c.text ?? '').join('');
          } else if (typeof (delta as any)?.content === 'string') {
            text = (delta as any).content;
          }

          if (text) {
            yield { type: 'data', content: text };
          }

          const finishReason = parsed.choices?.[0]?.finish_reason;
          if (finishReason) {
            yield {
              type: 'done',
              metrics: { latencyMs: Date.now() - started },
            };
            return;
          }
        } catch (error) {
          yield {
            type: 'error',
            error: `Failed to parse OpenAI stream chunk: ${error}`,
          };
        }
      }
    }

    yield {
      type: 'done',
      metrics: { latencyMs: Date.now() - started },
    };
  }
}
