'use client';

import { useState, FormEvent } from 'react';
import type { IngestResult } from '@/types/catalog';

export default function AdminUploadForm({ onIngested }: { onIngested: (result: IngestResult) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/playlist/upload', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Error al subir el archivo');
        return;
      }

      onIngested(data);
      setFile(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6">
      <h3 className="mb-3 font-semibold text-white">Subir archivo .m3u</h3>
      <input
        type="file"
        accept=".m3u,.m3u8"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-3 block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-white/20"
      />
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!file || loading}
        className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Subir y actualizar catálogo'}
      </button>
    </form>
  );
}
