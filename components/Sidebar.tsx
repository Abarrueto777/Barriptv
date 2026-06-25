'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CategoryCount } from '@/lib/catalog-queries';
import { normalize } from '@/lib/normalize';

type SectionKey = 'tv' | 'movie' | 'series';

interface SidebarProps {
  tvCategories: CategoryCount[];
  movieCategories: CategoryCount[];
  seriesCategories: CategoryCount[];
}

const SECTIONS: { key: SectionKey; label: string; basePath: string }[] = [
  { key: 'tv', label: 'TV', basePath: '/tv' },
  { key: 'movie', label: 'Películas', basePath: '/movies' },
  { key: 'series', label: 'Series', basePath: '/series' },
];

export default function Sidebar({ tvCategories, movieCategories, seriesCategories }: SidebarProps) {
  const pathname = usePathname();
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);

  const activeSection = SECTIONS.find((s) => pathname.startsWith(s.basePath)) ?? SECTIONS[0];
  const normalizedFilter = normalize(filter.trim());

  const categoriesBySection: Record<SectionKey, CategoryCount[]> = {
    tv: tvCategories,
    movie: movieCategories,
    series: seriesCategories,
  };

  const categories = categoriesBySection[activeSection.key];
  const filteredCategories = normalizedFilter
    ? categories.filter((c) => normalize(c.groupTitle).includes(normalizedFilter))
    : categories;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="glass glass-hover fixed left-3 top-[68px] z-30 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white md:hidden"
        aria-label="Abrir categorías"
      >
        <span className="text-base leading-none">☰</span> {activeSection.label}
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`glass thin-scroll flex w-72 shrink-0 flex-col border-y-0 border-l-0 p-4 transition-transform md:static md:w-64 md:translate-x-0
          fixed inset-y-0 left-0 top-[57px] z-40 h-[calc(100dvh-57px)] md:h-full
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px] shadow-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{activeSection.label}</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white md:hidden" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar categorías..."
          className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/10"
        />

        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {filteredCategories.length === 0 && (
            <li className="px-2 py-1 text-xs text-zinc-600">Sin coincidencias</li>
          )}
          {filteredCategories.map((category) => {
            const href = `${activeSection.basePath}/${encodeURIComponent(category.groupTitle)}`;
            const isCategoryActive = pathname === href;

            return (
              <li key={category.groupTitle}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={
                    isCategoryActive
                      ? 'block truncate rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1.5 text-sm text-white'
                      : 'block truncate rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white'
                  }
                >
                  {category.groupTitle} <span className="text-zinc-600">({category.count})</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
