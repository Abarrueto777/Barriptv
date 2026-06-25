'use client';

import { useEffect } from 'react';

interface ChannelNavProps {
  prevName: string;
  nextName: string;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function ChannelNav({ prevName, nextName, position, total, onPrev, onNext }: ChannelNavProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext]);

  if (total <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <button
        onClick={onPrev}
        className="glass glass-hover flex min-w-0 flex-1 items-center gap-2 rounded-xl px-4 py-2 text-left text-sm transition"
        title="Canal anterior (flecha ↑)"
      >
        <span className="text-lg leading-none text-cyan-300">▲</span>
        <span className="min-w-0">
          <span className="block text-xs text-zinc-500">Anterior</span>
          <span className="block truncate text-zinc-200">{prevName}</span>
        </span>
      </button>

      <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
        {position} / {total}
      </span>

      <button
        onClick={onNext}
        className="glass glass-hover flex min-w-0 flex-1 items-center justify-end gap-2 rounded-xl px-4 py-2 text-right text-sm transition"
        title="Canal siguiente (flecha ↓)"
      >
        <span className="min-w-0">
          <span className="block text-xs text-zinc-500">Siguiente</span>
          <span className="block truncate text-zinc-200">{nextName}</span>
        </span>
        <span className="text-lg leading-none text-cyan-300">▼</span>
      </button>
    </div>
  );
}
