'use client';

import { useState } from 'react';
import AdminUploadForm from '@/components/AdminUploadForm';
import AdminUrlForm from '@/components/AdminUrlForm';
import KidsConfig from '@/components/KidsConfig';
import AdultsConfig from '@/components/AdultsConfig';
import CategoryGroupsConfig from '@/components/CategoryGroupsConfig';
import UsersAdmin from '@/components/UsersAdmin';
import type { IngestLogEntry, IngestResult } from '@/types/catalog';

interface StatusResponse {
  log: IngestLogEntry[];
  stats: Record<string, number>;
}

export default function AdminStatusPanel({ initialStatus }: { initialStatus: StatusResponse }) {
  const [status, setStatus] = useState<StatusResponse>(initialStatus);
  const [lastResult, setLastResult] = useState<IngestResult | null>(null);

  async function refreshStatus() {
    const response = await fetch('/api/admin/playlist/status');
    setStatus(await response.json());
  }

  function handleIngested(result: IngestResult) {
    setLastResult(result);
    refreshStatus();
  }

  return (
    <div className="mx-auto h-full max-w-5xl overflow-y-auto px-4 py-8 sm:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-white">Administración de la playlist</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <AdminUploadForm onIngested={handleIngested} />
        <AdminUrlForm onIngested={handleIngested} />
      </div>

      {lastResult && (
        <div className="mb-6 rounded-xl border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-300">
          Catálogo actualizado: {lastResult.entryCount} entradas — TV: {lastResult.contentTypeBreakdown.tv},
          Películas: {lastResult.contentTypeBreakdown.movie}, Series: {lastResult.contentTypeBreakdown.series}
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h2 className="mb-3 font-semibold text-white">Estado actual</h2>
        <p className="mb-4 text-sm text-zinc-300">
          TV: {status.stats.tv ?? 0} · Películas: {status.stats.movie ?? 0} · Series: {status.stats.series ?? 0}
        </p>
        <h3 className="mb-2 text-sm font-semibold text-zinc-400">Historial de ingestas</h3>
        <ul className="space-y-2 text-sm">
          {status.log.map((entry) => (
            <li key={entry.id} className="flex flex-col rounded-lg border border-white/5 bg-white/5 p-3">
              <span className="text-zinc-200">
                {new Date(entry.startedAt).toLocaleString('es-CL', { timeZone: 'America/Santiago' })} —{' '}
                {entry.sourceType} —{' '}
                <span
                  className={
                    entry.status === 'success'
                      ? 'text-green-400'
                      : entry.status === 'error'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                  }
                >
                  {entry.status}
                </span>
              </span>
              {entry.sourceRef && <span className="truncate text-xs text-zinc-500">{entry.sourceRef}</span>}
              {entry.errorMessage && <span className="text-xs text-red-400">{entry.errorMessage}</span>}
            </li>
          ))}
        </ul>
      </div>

      <KidsConfig />

      <AdultsConfig />

      <CategoryGroupsConfig />

      <UsersAdmin />
    </div>
  );
}
