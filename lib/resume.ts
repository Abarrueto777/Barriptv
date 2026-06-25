import type { ContentType, Profile } from '@/types/catalog';

const MIN_RESUME = 10; // seconds — below this, not worth resuming
const END_MARGIN = 30; // seconds from end — consider it finished
const MAX_LIST = 20;

// Storage is scoped per profile so the kids and adults "Continuar viendo" lists never mix.
function resumeKey(profile: Profile, id: number): string {
  return `resume:${profile}:${id}`;
}
export function continueWatchingKey(profile: Profile): string {
  return `continue-watching:${profile}`;
}

export interface ResumeItem {
  id: number;
  name: string;
  logoUrl: string | null;
  contentType: ContentType;
  time: number;
  duration: number;
  updatedAt: number;
}

export interface ResumeMeta {
  id: number;
  name: string;
  logoUrl: string | null;
  contentType: ContentType;
  /** Adult-category titles keep their resume position but are kept OUT of the home row. */
  isAdult?: boolean;
}

// --- Same-tab change notification (localStorage 'storage' events only fire cross-tab) ---
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeContinueWatching(callback: () => void) {
  listeners.add(callback);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', callback);
    }
  };
}

export function getProgress(profile: Profile, id: number): { time: number; duration: number } | null {
  try {
    const raw = localStorage.getItem(resumeKey(profile, id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getContinueWatching(profile: Profile): ResumeItem[] {
  try {
    const raw = localStorage.getItem(continueWatchingKey(profile));
    return raw ? (JSON.parse(raw) as ResumeItem[]) : [];
  } catch {
    return [];
  }
}

export function clearProgress(profile: Profile, id: number) {
  try {
    localStorage.removeItem(resumeKey(profile, id));
    const list = getContinueWatching(profile).filter((x) => x.id !== id);
    localStorage.setItem(continueWatchingKey(profile), JSON.stringify(list));
    notify();
  } catch {
    /* ignore */
  }
}

export function saveProgress(profile: Profile, meta: ResumeMeta, time: number, duration: number) {
  try {
    if (!duration || Number.isNaN(duration)) return;
    // Near the start (nothing to resume) or near the end (finished) → drop it.
    if (time < MIN_RESUME || time > duration - END_MARGIN) {
      clearProgress(profile, meta.id);
      return;
    }
    // Keep the resume position so reopening the title still continues where it left off.
    localStorage.setItem(resumeKey(profile, meta.id), JSON.stringify({ time, duration }));

    const list = getContinueWatching(profile).filter((x) => x.id !== meta.id);
    // Adult titles stay out of the "Continuar viendo" row (just remove any stale entry).
    if (!meta.isAdult) {
      list.unshift({ ...meta, time, duration, updatedAt: Date.now() });
    }
    localStorage.setItem(continueWatchingKey(profile), JSON.stringify(list.slice(0, MAX_LIST)));
    notify();
  } catch {
    /* ignore */
  }
}
