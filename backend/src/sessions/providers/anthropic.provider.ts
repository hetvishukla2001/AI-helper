import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { StreamChunk, ModelProvider } from './provider.interface';

@Injectable()
export class AnthropicMessagesProvider implements ModelProvider {
  readonly id = 'anthropic-claude-3-haiku';
  readonly name = 'Anthropic Claude 3 Haiku';

  private readonly model: string;

  constructor() {
    this.model = process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-haiku-20240307';
  }

  async *streamCompletion(prompt: string, abortSignal: AbortSignal): AsyncGenerator<StreamChunk> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      yield { type: 'error', error: 'ANTHROPIC_API_KEY is not configured.' };
      yield { type: 'done' };
      return;
    }

    const client = new Anthropic({ apiKey });
    const started = Date.now();

    const stream = await client.messages.stream(
      {
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      },
      { signal: abortSignal },
    );

    let finished = false;

    for await (const event of stream) {
      if (event.type === 'message_start') continue;
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        yield { type: 'data', content: event.delta.text };
      }
      if (!finished && event.type === 'message_delta' && event.delta?.stop_reason) {
        finished = true;
        yield {
          type: 'done',
          metrics: {
            latencyMs: Date.now() - started,
          },
        };
      }
      if (!finished && (event.type === 'error' || event.type === 'message_stop')) {
        finished = true;
        yield {
          type: 'done',
          metrics: { latencyMs: Date.now() - started },
        };
      }
    }

    if (!finished) {
      yield {
        type: 'done',
        metrics: { latencyMs: Date.now() - started },
      };
    }
  }
}
