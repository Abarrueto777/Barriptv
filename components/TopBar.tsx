'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Profile } from '@/lib/session';

const SECTIONS = [
  { href: '/tv', label: 'TV' },
  { href: '/movies', label: 'Películas' },
  { href: '/series', label: 'Series' },
];

export default function TopBar({ profile, isAdmin = false }: { profile: Profile | null; isAdmin?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const isKids = profile === 'kids';

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="glass z-30 flex h-[57px] shrink-0 items-center justify-between gap-2 border-x-0 border-t-0 px-3 sm:px-6">
      <Link href="/" className="accent-text shrink-0 text-lg font-bold tracking-tight sm:text-xl">
        BarriPTV
      </Link>

      <nav className="flex items-center gap-0.5">
        {SECTIONS.map((section) => {
          const isActive = pathname.startsWith(section.href);
          return (
            <Link
              key={section.href}
              href={section.href}
              className={
                isActive
                  ? 'rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white sm:px-4 sm:py-1.5 sm:text-sm'
                  : 'rounded-lg px-2 py-1 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-1.5 sm:text-sm'
              }
            >
              {section.label}
            </Link>
          );
        })}
      </nav>

      <nav className="flex shrink-0 items-center gap-0.5">
        <Link
          href="/search"
          title="Buscar"
          className="rounded-lg px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <span aria-hidden>🔍</span>
          <span className="ml-1 hidden lg:inline">Buscar</span>
        </Link>
        {isAdmin && !isKids && (
          <Link
            href="/admin"
            title="Admin"
            className="rounded-lg px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <span aria-hidden>⚙️</span>
            <span className="ml-1 hidden lg:inline">Admin</span>
          </Link>
        )}
        <Link
          href="/profile"
          title="Cambiar perfil"
          className="rounded-lg px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <span aria-hidden>{isKids ? '🧒' : '🧑'}</span>
          <span className="ml-1 hidden lg:inline">Perfil</span>
        </Link>
        <button
          onClick={handleLogout}
          title="Salir"
          className="rounded-lg px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <span aria-hidden>⏻</span>
          <span className="ml-1 hidden lg:inline">Salir</span>
        </button>
      </nav>
    </header>
  );
}
