import { Injectable } from '@nestjs/common';
import { AnthropicMessagesProvider } from './anthropic.provider';
import { ModelProvider } from './provider.interface';
import { OpenAIChatProvider } from './openai.provider';

@Injectable()
export class ProvidersRegistry {
  private readonly providers: Record<string, ModelProvider>;

  constructor(
    private readonly openaiProvider: OpenAIChatProvider,
    private readonly anthropicProvider: AnthropicMessagesProvider,
  ) {
    this.providers = {
      [openaiProvider.id]: openaiProvider,
      [anthropicProvider.id]: anthropicProvider,
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
