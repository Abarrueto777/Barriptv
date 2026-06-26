import Link from 'next/link';
import { getCatalogStats } from '@/lib/catalog-queries';
import ContinueWatching from '@/components/ContinueWatching';
import { getActiveProfile, getActiveUserId } from '@/lib/profile';

export default async function HomePage() {
  const stats = getCatalogStats();
  const profile = (await getActiveProfile()) ?? 'adults';
  const userId = (await getActiveUserId()) ?? 1;
  const isKids = profile === 'kids';

  const sections = [
    {
      href: '/tv',
      label: 'TV en vivo',
      count: stats.tv,
      description: 'Canales en vivo por categoría',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
          <rect x="2" y="7" width="20" height="13" rx="2" />
          <path d="m8 3 4 4 4-4" />
        </svg>
      ),
    },
    {
      href: '/movies',
      label: 'Películas',
      count: stats.movie,
      description: 'Catálogo de películas',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M7 3v18M17 3v18M2 9h5M2 15h5M17 9h5M17 15h5" />
        </svg>
      ),
    },
    {
      href: '/series',
      label: 'Series',
      count: stats.series,
      description: 'Series agrupadas por temporada',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="m17 2-5 5-5-5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col items-center justify-start overflow-y-auto px-4 py-8 sm:px-6 sm:py-12">
      <div className="animate-fade-in-up text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {isKids ? (
            <>
              Hola <span className="accent-text">peque</span> 🧒
            </>
          ) : (
            <>
              Bienvenido a <span className="accent-text">BarriPTV</span>
            </>
          )}
        </h1>
        <p className="mt-3 text-zinc-400">Elegí qué querés ver</p>
      </div>

      <ContinueWatching userId={userId} profile={profile} />

      <div className="mt-12 grid w-full gap-6 sm:grid-cols-3">
        {sections.map((section, i) => (
          <Link
            key={section.href}
            href={section.href}
            style={{ animationDelay: `${i * 80}ms` }}
            className="glass glass-hover animate-fade-in-up group flex flex-col items-center gap-3 rounded-2xl p-8 text-center transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_-8px_rgba(34,211,238,0.3)]"
          >
            <span className="accent-text transition group-hover:scale-110">{section.icon}</span>
            <span className="text-xl font-semibold text-white">{section.label}</span>
            <span className="text-sm text-zinc-400">{section.description}</span>
            {!isKids && (
              <span className="mt-2 text-3xl font-bold tabular-nums accent-text">
                {section.count.toLocaleString()}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
