'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import type { ModelStatus } from '../lib/types';

interface ModelColumnProps {
  providerName: string;
  status: ModelStatus;
  content: string;
  latencyMs?: number;
  costUsd?: number;
  tokens?: number;
  error?: string;
}

const STATUS_LABELS: Record<ModelStatus, string> = {
  idle: 'Idle',
  pending: 'Queued',
  streaming: 'Streaming…',
  completed: 'Completed',
  error: 'Error',
};

export function ModelColumn({
  providerName,
  status,
  content,
  latencyMs,
  costUsd,
  tokens,
  error,
}: ModelColumnProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg">
      <header className="flex items-center justify-between text-sm text-slate-300">
        <div>
          <p className="text-base font-semibold text-slate-100">{providerName}</p>
          <p
            className={clsx('mt-1 inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium', {
              'bg-emerald-500/10 text-emerald-300': status === 'completed',
              'bg-blue-500/10 text-blue-200': status === 'streaming' || status === 'pending',
              'bg-orange-500/10 text-orange-300': status === 'idle',
              'bg-rose-500/10 text-rose-300': status === 'error',
            })}
          >
            {STATUS_LABELS[status]}
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          {typeof latencyMs === 'number' && (
            <p>
              Latency: <span className="text-slate-200">{latencyMs}ms</span>
            </p>
          )}
          {typeof tokens === 'number' && (
            <p>
              Tokens: <span className="text-slate-200">{tokens}</span>
            </p>
          )}
          {typeof costUsd === 'number' && (
            <p>
              Cost: <span className="text-slate-200">${costUsd.toFixed(4)}</span>
            </p>
          )}
        </div>
      </header>

      <div className="max-h-[28rem] overflow-y-auto text-sm leading-relaxed text-slate-200">
        {error ? (
          <p className="text-rose-300">{error}</p>
        ) : content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <p className="text-slate-500">Waiting for response…</p>
        )}
      </div>
    </div>
  );
}
