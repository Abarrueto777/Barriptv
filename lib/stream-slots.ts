/**
 * In-memory concurrency limiter for live/VOD playback. Each active proxied stream
 * holds one slot for its whole lifetime, so the slot count mirrors the real number
 * of upstream connections we hold against the provider. This is what keeps us from
 * ever exceeding the provider's line limit (and getting the line banned).
 *
 * State lives in one process. On a single VPS that's exact; the safety TTL below
 * reclaims slots if a release is ever missed (crash, dropped close event).
 */

import { randomUUID } from 'crypto';

/** Provider line allows this many simultaneous connections total. */
const GLOBAL_MAX = Number(process.env.STREAM_MAX_GLOBAL ?? 3);
/** Per-user cap so one account can't eat every slot (e.g. 2 devices each). */
const PER_USER_MAX = Number(process.env.STREAM_MAX_PER_USER ?? 2);
/** Hard ceiling: a slot can never live longer than this, in case a release is lost. */
const MAX_SLOT_MS = 6 * 60 * 60 * 1000;

interface Slot {
  id: string;
  userId: number;
  entryId: number;
  startedAt: number;
}

const slots = new Map<string, Slot>();

/** Drops slots that overran the safety ceiling. Called on every acquire. */
function sweep(now: number) {
  for (const [id, s] of slots) {
    if (now - s.startedAt > MAX_SLOT_MS) slots.delete(id);
  }
}

export type AcquireResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'global-full' | 'user-full' };

/**
 * Tries to reserve a playback slot for a user. Returns a slot id to release later,
 * or a reason when the global / per-user limit is already reached.
 */
export function acquireSlot(userId: number, entryId: number): AcquireResult {
  const now = Date.now();
  sweep(now);

  if (slots.size >= GLOBAL_MAX) return { ok: false, reason: 'global-full' };

  let userCount = 0;
  for (const s of slots.values()) if (s.userId === userId) userCount++;
  if (userCount >= PER_USER_MAX) return { ok: false, reason: 'user-full' };

  const id = randomUUID();
  slots.set(id, { id, userId, entryId, startedAt: now });
  return { ok: true, id };
}

export function releaseSlot(id: string) {
  slots.delete(id);
}

/** Snapshot for diagnostics / admin (active total + per-user breakdown). */
export function slotStats() {
  const perUser: Record<number, number> = {};
  for (const s of slots.values()) perUser[s.userId] = (perUser[s.userId] ?? 0) + 1;
  return { active: slots.size, globalMax: GLOBAL_MAX, perUserMax: PER_USER_MAX, perUser };
}
