'use client';

import { useState, FormEvent } from 'react';
import type { IngestResult } from '@/types/catalog';

export default function AdminUrlForm({ onIngested }: { onIngested: (result: IngestResult) => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/playlist/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Error al descargar la playlist');
        return;
      }

      onIngested(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6">
      <h3 className="mb-3 font-semibold text-white">Cargar desde URL</h3>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://bit.ly/tu-lista"
        className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/10"
      />
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!url.trim() || loading}
        className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Descargando...' : 'Descargar y actualizar catálogo'}
      </button>
    </form>
  );
}
