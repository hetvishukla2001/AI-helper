import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { OpenAIChatProvider } from './providers/openai.provider';
import { AnthropicMessagesProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider'; // ✅
import { ProvidersRegistry } from './providers/providers.registry';

@Module({
  controllers: [SessionsController],
  providers: [
    SessionsService,
    ProvidersRegistry,
    OpenAIChatProvider,
    AnthropicMessagesProvider,
    GeminiProvider, // ✅ add this
  ],
  exports: [ProvidersRegistry],
})
export class SessionsModule {}
