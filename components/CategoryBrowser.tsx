'use client';

import { useState } from 'react';
import PosterGrid from '@/components/PosterGrid';
import { normalize } from '@/lib/normalize';
import { useScrollRestoration } from '@/components/useScrollRestoration';

interface GridItem {
  id: string | number;
  href: string;
  title: string;
  imageUrl: string | null;
  subtitle?: string;
}

interface CategoryBrowserProps {
  title: string;
  unit: string;
  items: GridItem[];
}

export default function CategoryBrowser({ title, unit, items }: CategoryBrowserProps) {
  const [filter, setFilter] = useState('');
  const scrollRef = useScrollRestoration<HTMLDivElement>();
  const normalizedFilter = normalize(filter.trim());

  const filtered = normalizedFilter
    ? items.filter((item) => normalize(item.title).includes(normalizedFilter))
    : items;

  return (
    <div className="flex h-full flex-col">
      {/* Fixed header: title + count + in-category search. Extra top padding on mobile clears the floating menu button. */}
      <div className="shrink-0 border-b border-white/10 px-4 pt-16 pb-4 sm:px-8 sm:pb-5 md:pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
              {filtered.length.toLocaleString()} {unit}
            </span>
          </div>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Buscar en ${title}...`}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/10 sm:max-w-xs"
          />
        </div>
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <PosterGrid items={filtered} emptyMessage="Sin resultados en esta categoría." />
      </div>
    </div>
  );
}
