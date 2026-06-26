import type { ContentType, Profile } from '@/types/catalog';

const MIN_RESUME = 10; // seconds — below this, not worth resuming
const END_MARGIN = 30; // seconds from end — consider it finished
const MAX_LIST = 20;

// Storage is scoped per user + profile so each user has isolated continue watching lists.
function resumeKey(userId: number, profile: Profile, id: number): string {
  return `resume:${userId}:${profile}:${id}`;
}
export function continueWatchingKey(userId: number, profile: Profile): string {
  return `continue-watching:${userId}:${profile}`;
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

export function getProgress(userId: number, profile: Profile, id: number): { time: number; duration: number } | null {
  try {
    const raw = localStorage.getItem(resumeKey(userId, profile, id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getContinueWatching(userId: number, profile: Profile): ResumeItem[] {
  try {
    const raw = localStorage.getItem(continueWatchingKey(userId, profile));
    return raw ? (JSON.parse(raw) as ResumeItem[]) : [];
  } catch {
    return [];
  }
}

export function clearProgress(userId: number, profile: Profile, id: number) {
  try {
    localStorage.removeItem(resumeKey(userId, profile, id));
    const list = getContinueWatching(userId, profile).filter((x) => x.id !== id);
    localStorage.setItem(continueWatchingKey(userId, profile), JSON.stringify(list));
    notify();
  } catch {
    /* ignore */
  }
}

export function saveProgress(userId: number, profile: Profile, meta: ResumeMeta, time: number, duration: number) {
  try {
    if (!duration || Number.isNaN(duration)) return;
    // Near the start (nothing to resume) or near the end (finished) → drop it.
    if (time < MIN_RESUME || time > duration - END_MARGIN) {
      clearProgress(userId, profile, meta.id);
      return;
    }
    // Keep the resume position so reopening the title still continues where it left off.
    localStorage.setItem(resumeKey(userId, profile, meta.id), JSON.stringify({ time, duration }));

    const list = getContinueWatching(userId, profile).filter((x) => x.id !== meta.id);
    // Adult titles stay out of the "Continuar viendo" row (just remove any stale entry).
    if (!meta.isAdult) {
      list.unshift({ ...meta, time, duration, updatedAt: Date.now() });
    }
    localStorage.setItem(continueWatchingKey(userId, profile), JSON.stringify(list.slice(0, MAX_LIST)));
    notify();
  } catch {
    /* ignore */
  }
}
