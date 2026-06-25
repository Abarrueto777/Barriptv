'use client';

import { useEffect, useState } from 'react';
import type { VodInfo } from '@/lib/vod-info';

export default function MovieInfo({ id }: { id: number }) {
  const [info, setInfo] = useState<VodInfo | null>(null);

  useEffect(() => {
    let active = true;
    // Fetched independently of playback — the player has already started by now.
    fetch(`/api/vod-info/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (active) setInfo(data.info ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

  if (!info) return null;

  const meta = [info.year, info.genre, info.duration, info.country].filter(Boolean).join(' · ');

  return (
    <section className="glass mt-6 flex flex-col gap-4 rounded-2xl p-6 sm:flex-row">
      {info.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={info.cover}
          alt=""
          className="h-60 w-40 shrink-0 self-start rounded-xl object-cover"
          loading="lazy"
        />
      )}
      <div className="min-w-0">
        {meta && <p className="mb-2 text-sm text-cyan-300">{meta}</p>}
        {info.rating && (
          <p className="mb-2 text-sm text-zinc-400">
            <span className="text-yellow-400">★</span> {info.rating}
          </p>
        )}
        {info.plot && <p className="mb-3 text-sm leading-relaxed text-zinc-200">{info.plot}</p>}
        {info.director && (
          <p className="text-sm text-zinc-400">
            <span className="text-zinc-500">Director:</span> {info.director}
          </p>
        )}
        {info.cast && (
          <p className="mt-1 text-sm text-zinc-400">
            <span className="text-zinc-500">Reparto:</span> {info.cast}
          </p>
        )}
      </div>
    </section>
  );
}
