import { Injectable } from '@nestjs/common';
import { AnthropicMessagesProvider } from './anthropic.provider';
import { OpenAIChatProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider'; // ✅ add this line
import { ModelProvider } from './provider.interface';

@Injectable()
export class ProvidersRegistry {
  private readonly providers: Record<string, ModelProvider>;

  constructor(
    private readonly openaiProvider: OpenAIChatProvider,
    private readonly anthropicProvider: AnthropicMessagesProvider,
    private readonly geminiProvider: GeminiProvider, // ✅ inject Gemini
  ) {
    this.providers = {
      [openaiProvider.id]: openaiProvider,
      [anthropicProvider.id]: anthropicProvider,
      [geminiProvider.id]: geminiProvider, // ✅ register Gemini here
    };
  }

  listProviders(): { id: string; name: string }[] {
    return Object.values(this.providers).map((provider) => ({
      id: provider.id,
      name: provider.name,
    }));
  }

  getProvider(id: string): ModelProvider | undefined {
    return this.providers[id];
  }
}
