import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Persists and restores the scrollTop of an inner scroll container, keyed by route.
 * Needed because the app-shell scrolls inside a div (not the window), and Next.js
 * only restores window scroll on back-navigation.
 */
export function useScrollRestoration<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const key = `scroll:${pathname}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      el.scrollTop = parseInt(saved, 10) || 0;
    }

    const handler = () => sessionStorage.setItem(key, String(el.scrollTop));
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [pathname]);

  return ref;
}
