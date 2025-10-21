import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SessionsModule,
  ],
})
export class AppModule {}
