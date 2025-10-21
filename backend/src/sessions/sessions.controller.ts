import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionRecord } from './interfaces/session.interface';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('providers')
  listProviders() {
    return this.sessionsService.listProviders();
  }

  @Post()
  createSession(@Body() dto: CreateSessionDto): SessionRecord {
    return this.sessionsService.createSession(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): SessionRecord {
    return this.sessionsService.getSession(id);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<{ data: any }> {
    return this.sessionsService.streamSession(id);
  }
}
