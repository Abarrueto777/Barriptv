'use client';

import { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import PosterGrid from '@/components/PosterGrid';
import { buildImageUrlClient } from '@/lib/image-url';
import type { CatalogEntry } from '@/types/catalog';
import type { SeriesShow } from '@/lib/catalog-queries';

type SearchType = 'tv' | 'movie' | 'series';

const TYPE_LABELS: Record<SearchType, string> = {
  tv: 'TV',
  movie: 'Películas',
  series: 'Series',
};

export default function SearchPage() {
  const [type, setType] = useState<SearchType>('movie');
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [shows, setShows] = useState<SeriesShow[]>([]);
  const [loading, setLoading] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const hasQuery = query.trim() !== '';

  useEffect(() => {
    if (!hasQuery) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/catalog?type=${type}&q=${encodeURIComponent(query)}&pageSize=40`,
          { signal: controller.signal }
        );
        const data = await response.json();
        setEntries(data.entries ?? []);
        setShows(data.shows ?? []);
      } catch {
        // ignore aborted requests
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [type, query, hasQuery]);

  const visibleEntries = hasQuery ? entries : [];
  const visibleShows = hasQuery ? shows : [];

  return (
    <div className="h-full overflow-y-auto px-4 py-8 sm:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-white">Buscar</h1>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <SearchBar value={query} onChange={setQuery} />
        <div className="glass flex gap-1 rounded-xl p-1">
          {(Object.keys(TYPE_LABELS) as SearchType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={
                type === t
                  ? 'rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-1.5 text-sm font-semibold text-white'
                  : 'rounded-lg px-4 py-1.5 text-sm text-zinc-300 transition hover:bg-white/10'
              }
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-zinc-400">Buscando...</p>}

      <PosterGrid
        items={
          type === 'series'
            ? visibleShows.map((show) => ({
                id: show.seriesName,
                href: `/series/show/${encodeURIComponent(show.seriesName)}`,
                title: show.seriesName,
                imageUrl: buildImageUrlClient(show.logoUrl, origin),
                subtitle: `${show.episodeCount} episodios`,
              }))
            : visibleEntries.map((entry) => ({
                id: entry.id,
                href: `/watch/${entry.id}`,
                title: entry.name,
                imageUrl: buildImageUrlClient(entry.logoUrl, origin),
              }))
        }
      />

      {!loading && hasQuery && visibleEntries.length === 0 && visibleShows.length === 0 && (
        <p className="text-zinc-400">Sin resultados para &quot;{query}&quot;.</p>
      )}
    </div>
  );
}
