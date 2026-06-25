'use client';

import { useMemo, useSyncExternalStore } from 'react';
import PosterCard from '@/components/PosterCard';
import { continueWatchingKey, clearProgress, subscribeContinueWatching, type ResumeItem } from '@/lib/resume';
import { buildImageUrlClient } from '@/lib/image-url';
import type { Profile } from '@/types/catalog';

export default function ContinueWatching({ profile }: { profile: Profile }) {
  const key = continueWatchingKey(profile);
  // Read localStorage the SSR-safe way: stable string snapshot, '' on the server.
  const raw = useSyncExternalStore(
    subscribeContinueWatching,
    () => localStorage.getItem(key) ?? '',
    () => ''
  );

  const items = useMemo<ResumeItem[]>(() => {
    try {
      return raw ? (JSON.parse(raw) as ResumeItem[]) : [];
    } catch {
      return [];
    }
  }, [raw]);

  // Get origin once (for image proxying).
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  if (items.length === 0) return null;

  return (
    <section className="mt-12 w-full">
      <h2 className="mb-3 text-lg font-semibold text-zinc-200">Continuar viendo</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <PosterCard
              href={`/watch/${item.id}`}
              title={item.name}
              imageUrl={buildImageUrlClient(item.logoUrl, origin)}
              progress={item.duration ? item.time / item.duration : 0}
            />
            <button
              onClick={() => clearProgress(profile, item.id)}
              aria-label="Quitar de continuar viendo"
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm text-white opacity-80 transition hover:bg-red-600 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
