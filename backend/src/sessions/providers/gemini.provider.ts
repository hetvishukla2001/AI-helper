import { Injectable } from '@nestjs/common';
import { StreamChunk, ModelProvider } from './provider.interface';

@Injectable()
export class GeminiProvider implements ModelProvider {
  readonly id = 'google-gemini-1.5-flash';
  readonly name = 'Google Gemini 1.5 Flash';
  private readonly model = 'gemini-1.5-flash'; // ✅ updated

  async *streamCompletion(prompt: string, abortSignal: AbortSignal): AsyncGenerator<StreamChunk> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      yield { type: 'error', error: 'GEMINI_API_KEY is not configured.' };
      yield { type: 'done' };
      return;
    }

    // ✅ updated endpoint from v1beta → v1
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: abortSignal,
      },
    );

    if (!res.ok) {
      const text = await res.text();
      yield { type: 'error', error: `Gemini API error: ${res.status} ${text}` };
      yield { type: 'done' };
      return;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    yield { type: 'data', content: text };
    yield { type: 'done', metrics: { latencyMs: 0 } };
  }
}
