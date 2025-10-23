'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ModelColumn } from '../components/ModelColumn';
import { API_BASE_URL } from '../lib/config';
import type { ModelProviderInfo, ModelStatus, StreamChunkPayload } from '../lib/types';
import clsx from 'clsx';

interface ModelState {
  id: string;
  name: string;
  status: ModelStatus;
  content: string;
  metrics?: {
    latencyMs?: number;
    tokens?: number;
    costUsd?: number;
  };
  error?: string;
}

export default function HomePage() {
  const [providers, setProviders] = useState<ModelProviderInfo[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('Explain the benefits of unit testing in software development.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelStates, setModelStates] = useState<Record<string, ModelState>>({});
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/sessions/providers`);
        const data = await res.json();
        const visible = (data as ModelProviderInfo[]).filter(
          (p) => p.id !== 'anthropic-claude-3-haiku'
        );
  
        setProviders(visible);
        if (visible.length > 0) {
          setSelectedModels(visible.slice(0, 2).map((p) => p.id));
        }
      } catch (error) {
        console.error('Failed to fetch providers', error);
      }
    };

    fetchProviders();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    setModelStates((prev) => {
      const next: Record<string, ModelState> = {};
      for (const provider of providers) {
        next[provider.id] = prev[provider.id] ?? {
          id: provider.id,
          name: provider.name,
          status: 'idle',
          content: '',
        };
      }
      return next;
    });
  }, [providers]);

  const handleModelToggle = (id: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(id)) {
        return prev.filter((modelId) => modelId !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim() || selectedModels.length < 2) {
      return;
    }

    setIsSubmitting(true);
    eventSourceRef.current?.close();

    setModelStates((prev) => {
      const next = { ...prev };
      for (const id of selectedModels) {
        next[id] = {
          ...next[id],
          status: 'pending',
          content: '',
          error: undefined,
          metrics: undefined,
        };
      }
      return next;
    });

    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, models: selectedModels }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();

      const eventSource = new EventSource(`${API_BASE_URL}/sessions/${data.id}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const payload: StreamChunkPayload = JSON.parse(event.data);
          if (payload.type === 'status') {
            if (payload.status === 'error') {
              setModelStates((prev) => {
                const next = { ...prev };
                for (const id of selectedModels) {
                  next[id] = {
                    ...next[id],
                    status: 'error',
                    error: payload.error || 'Session failed.',
                  };
                }
                return next;
              });
              eventSource.close();
              eventSourceRef.current = null;
              setIsSubmitting(false);
            }

            if (payload.status === 'completed') {
              setModelStates((prev) => {
                const next = { ...prev };
                for (const id of selectedModels) {
                  next[id] = {
                    ...next[id],
                    status: next[id]?.status === 'error' ? 'error' : 'completed',
                  };
                }
                return next;
              });
              eventSource.close();
              eventSourceRef.current = null;
              setIsSubmitting(false);
            }
          }

          // inside eventSource.onmessage = (event) => { ... }
          if (payload.type === 'chunk') {
            if (!payload.modelId) {
              return;
            }

            setModelStates((prev) => {
              const id = payload.modelId as string;        // cast to string for indexing
              const target = prev[id];
              if (!target) return prev;

              const nextStatus: ModelStatus =
                payload.chunk?.error
                  ? 'error'
                  : payload.chunk?.done
                  ? 'completed'
                  : 'streaming';

              return {
                ...prev,
                [id]: {
                  ...target,
                  status: nextStatus,
                  content: target.content + (payload.chunk?.content ?? ''),
                  error: payload.chunk?.error,
                  metrics: payload.chunk?.metrics
                    ? { ...target.metrics, ...payload.chunk.metrics }
                    : target.metrics,
                },
              };
            });
          }

        } catch (error) {
          console.error('Failed to parse stream payload', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error', error);
        setIsSubmitting(false);
        setModelStates((prev) => {
          const next = { ...prev };
          for (const id of selectedModels) {
            next[id] = {
              ...next[id],
              status: 'error',
              error: 'Connection lost. Please try again.',
            };
          }
          return next;
        });
        eventSource.close();
      };
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const modelColumns = useMemo(() => selectedModels.map((id) => modelStates[id]).filter(Boolean), [selectedModels, modelStates]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h1 className="text-3xl font-semibold text-slate-50">AI Model Playground</h1>
        <p className="mt-2 text-sm text-slate-300">
          Submit a single prompt and watch multiple language models respond in real time. Compare speed,
          quality, and cost from one dashboard.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-slate-200" htmlFor="prompt">
            Prompt
          </label>
          <textarea
            id="prompt"
            name="prompt"
            rows={4}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-slate-100 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />

          <div>
            <p className="text-sm font-medium text-slate-200">Select up to three models</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {providers.map((provider) => {
                const isSelected = selectedModels.includes(provider.id);
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleModelToggle(provider.id)}
                    className={clsx(
                      'rounded-full border px-4 py-2 text-sm transition',
                      isSelected
                        ? 'border-blue-500 bg-blue-500/20 text-blue-100 shadow-lg'
                        : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-blue-500/40 hover:text-blue-100',
                    )}
                  >
                    {provider.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {selectedModels.length < 2
                ? 'Select at least two models to start a comparison.'
                : 'All responses are streamed live and saved to the backend.'}
            </p>
            <button
              type="submit"
              disabled={isSubmitting || selectedModels.length < 2}
              className="rounded-lg bg-blue-500 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {isSubmitting ? 'Running…' : 'Compare models'}
            </button>
          </div>
        </form>
      </section>

      <section className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {modelColumns.map((column) => (
          <ModelColumn
            key={column.id}
            providerName={column.name}
            status={column.status}
            content={column.content}
            error={column.error}
            latencyMs={column.metrics?.latencyMs}
            costUsd={column.metrics?.costUsd}
            tokens={column.metrics?.tokens}
          />
        ))}
      </section>
    </main>
  );
}
