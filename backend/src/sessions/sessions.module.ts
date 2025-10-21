import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { ProvidersRegistry } from './providers/providers.registry';
import { OpenAIChatProvider } from './providers/openai.provider';
import { AnthropicMessagesProvider } from './providers/anthropic.provider';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, ProvidersRegistry, OpenAIChatProvider, AnthropicMessagesProvider],
})
export class SessionsModule {}
