'use client';

import { useState } from 'react';
import VideoPlayer from '@/components/VideoPlayer';
import CastButton from '@/components/CastButton';
import BackButton from '@/components/BackButton';
import MovieInfo from '@/components/MovieInfo';
import ChannelNav from '@/components/ChannelNav';
import type { Profile, StreamKind } from '@/types/catalog';

interface Channel {
  id: number;
  name: string;
}

export interface WatchSource {
  id: number;
  name: string;
  groupTitle: string;
  contentType: 'tv' | 'movie' | 'series';
  logoUrl: string | null;
  kind: StreamKind;
  url: string;
  isAdult: boolean;
}

interface WatchViewProps {
  initial: WatchSource;
  channels: Channel[];
  initialIndex: number;
  profile: Profile;
}

export default function WatchView({ initial, channels, initialIndex, profile }: WatchViewProps) {
  const [current, setCurrent] = useState<WatchSource>(initial);
  const [index, setIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(false);

  const isLive = current.contentType === 'tv';
  const canZap = channels.length > 1;

  async function zap(direction: -1 | 1) {
    if (!canZap || loading) return;
    const newIndex = (index + direction + channels.length) % channels.length;
    const target = channels[newIndex];
    setLoading(true);
    try {
      const res = await fetch(`/api/watch-source/${target.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setCurrent({ ...data, isAdult: false });
      setIndex(newIndex);
      // Update the URL in place WITHOUT a route navigation — keeps the <video>
      // element (and thus fullscreen) alive while only the source changes.
      window.history.replaceState(null, '', `/watch/${target.id}`);
      // Delay to let the previous player unmount and clean up completely before the new one loads.
      // Without this, rapid channel changes leave stale connections causing "stream canceled by remote" errors.
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto h-full max-w-5xl overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
      <BackButton />
      <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
        <VideoPlayer
          // Remount a fresh player on every channel change. Reusing the same <video>
          // element across an in-place source swap left a stale MSE state on mobile
          // browsers and the new mpegts player failed to load ("Load failed"). A fresh
          // mount per channel mirrors the always-working category→channel path.
          key={current.id}
          streamUrl={current.url}
          title={current.name}
          kind={current.kind}
          profile={profile}
          channelOsd={isLive}
          resume={
            isLive
              ? undefined
              : {
                  id: current.id,
                  name: current.name,
                  logoUrl: current.logoUrl,
                  contentType: current.contentType,
                  isAdult: current.isAdult,
                }
          }
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{current.name}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {isLive && (
              <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> EN VIVO
              </span>
            )}
            {current.groupTitle}
          </p>
        </div>
        <CastButton streamUrl={current.url} title={current.name} imageUrl={current.logoUrl} kind={current.kind} />
      </div>

      {canZap && (
        <ChannelNav
          prevName={channels[(index - 1 + channels.length) % channels.length].name}
          nextName={channels[(index + 1) % channels.length].name}
          position={index + 1}
          total={channels.length}
          onPrev={() => zap(-1)}
          onNext={() => zap(1)}
        />
      )}

      {current.contentType === 'movie' && <MovieInfo id={current.id} />}
    </div>
  );
}
