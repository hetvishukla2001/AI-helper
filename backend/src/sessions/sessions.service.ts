import { Injectable, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { CreateSessionDto } from './dto/create-session.dto';
import { ProvidersRegistry } from './providers/providers.registry';
import { ModelProvider } from './providers/provider.interface';
import { SessionMessageChunk, SessionRecord } from './interfaces/session.interface';

interface StreamEvent {
  event: 'chunk' | 'status';
  data: any;
}

@Injectable()
export class SessionsService {
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(private readonly providersRegistry: ProvidersRegistry) {}

  listProviders() {
    return this.providersRegistry.listProviders();
  }

  createSession(dto: CreateSessionDto): SessionRecord {
    const id = uuidv4();
    const now = Date.now();
    const session: SessionRecord = {
      id,
      prompt: dto.prompt,
      models: dto.models,
      createdAt: now,
      status: 'pending',
      label: dto.sessionLabel,
      responses: {},
      metrics: {},
    };

    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): SessionRecord {
    const session = this.sessions.get(id);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  streamSession(id: string): Observable<{ data: any }> {
    const session = this.getSession(id);
    session.status = 'streaming';

    return new Observable((observer) => {
      const abortController = new AbortController();
      const pendingModels = new Set(session.models);

      observer.next({
        data: {
          type: 'status',
          sessionId: id,
          status: session.status,
        },
      });

      const startProviderStream = async (modelId: string, provider: ModelProvider) => {
        session.responses[modelId] = '';
        const started = Date.now();

        try {
          for await (const chunk of provider.streamCompletion(session.prompt, abortController.signal)) {
            if (chunk.type === 'data' && chunk.content) {
              session.responses[modelId] += chunk.content;
              const dataChunk: SessionMessageChunk = {
                id: `${id}:${modelId}:${Date.now()}`,
                model: modelId,
                content: chunk.content,
                done: false,
                timestamp: Date.now(),
              };
              observer.next({
                data: {
                  type: 'chunk',
                  sessionId: id,
                  modelId,
                  chunk: dataChunk,
                },
              });
            }

            if (chunk.type === 'error') {
              session.status = 'error';
              session.error = chunk.error || 'Unknown provider error';
              pendingModels.delete(modelId);
              observer.next({
                data: {
                  type: 'chunk',
                  sessionId: id,
                  modelId,
                  chunk: {
                    id: `${id}:${modelId}:error`,
                    model: modelId,
                    content: '',
                    done: true,
                    timestamp: Date.now(),
                    error: chunk.error,
                  },
                },
              });
            }

            if (chunk.type === 'done') {
              pendingModels.delete(modelId);
              session.metrics[modelId] = {
                latencyMs: chunk.metrics?.latencyMs ?? Date.now() - started,
                tokens: chunk.metrics?.tokens,
                costUsd: chunk.metrics?.costUsd,
              };
              observer.next({
                data: {
                  type: 'chunk',
                  sessionId: id,
                  modelId,
                  chunk: {
                    id: `${id}:${modelId}:done`,
                    model: modelId,
                    content: '',
                    done: true,
                    timestamp: Date.now(),
                    metrics: session.metrics[modelId],
                  },
                },
              });
            }
          }
        } catch (error: any) {
          session.status = 'error';
          session.error = error?.message ?? String(error);
          pendingModels.delete(modelId);
          observer.next({
            data: {
              type: 'chunk',
              sessionId: id,
              modelId,
              chunk: {
                id: `${id}:${modelId}:exception`,
                model: modelId,
                content: '',
                done: true,
                timestamp: Date.now(),
                error: session.error,
              },
            },
          });
        } finally {
          if (pendingModels.size === 0 && session.status !== 'error') {
            session.status = 'completed';
            observer.next({
              data: {
                type: 'status',
                sessionId: id,
                status: session.status,
              },
            });
            observer.complete();
          } else if (session.status === 'error') {
            observer.next({
              data: {
                type: 'status',
                sessionId: id,
                status: session.status,
                error: session.error,
              },
            });
            observer.complete();
          }
        }
      };

      const providerTasks = session.models.map((modelId) => {
        const provider = this.providersRegistry.getProvider(modelId);
        if (!provider) {
          session.status = 'error';
          session.error = `Provider ${modelId} is not configured`;
          observer.next({
            data: {
              type: 'chunk',
              sessionId: id,
              modelId,
              chunk: {
                id: `${id}:${modelId}:missing`,
                model: modelId,
                content: '',
                done: true,
                timestamp: Date.now(),
                error: session.error,
              },
            },
          });
          pendingModels.delete(modelId);
          return Promise.resolve();
        }

        return startProviderStream(modelId, provider);
      });

      Promise.all(providerTasks)
        .then(() => {
          if (session.status === 'error') {
            observer.next({
              data: {
                type: 'status',
                sessionId: id,
                status: session.status,
                error: session.error,
              },
            });
            observer.complete();
          }
        })
        .catch((error) => {
          session.status = 'error';
          session.error = error?.message ?? String(error);
          observer.error(error);
        });

      return () => {
        abortController.abort();
      };
    });
  }
}
