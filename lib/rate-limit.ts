/**
 * Minimal in-memory failed-attempt limiter for the login endpoint. Sized for a
 * single-VPS, few-users deployment: no Redis, no external store. State lives in
 * one process and resets on restart — acceptable because it only throttles
 * brute-force bursts, it is not a security boundary on its own.
 */

interface Attempt {
  count: number;
  /** Epoch ms when the current counting window started. */
  windowStart: number;
  /** Epoch ms until which the key is locked out, if any. */
  blockedUntil?: number;
}

const WINDOW_MS = 15 * 60 * 1000; // count failures within a 15-min window
const MAX_FAILURES = 5; // ...up to 5, then lock out
const BLOCK_MS = 15 * 60 * 1000; // lockout duration after tripping the limit

const attempts = new Map<string, Attempt>();

/** Drops stale entries so the map can't grow unbounded over a long uptime. */
function prune(now: number) {
  for (const [key, a] of attempts) {
    const expired = now - a.windowStart > WINDOW_MS && (!a.blockedUntil || now > a.blockedUntil);
    if (expired) attempts.delete(key);
  }
}

/**
 * Checks whether a key (typically the client IP) may attempt a login right now.
 * Returns `retryAfterMs` when blocked so the caller can set a Retry-After header.
 */
export function checkLoginAllowed(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const a = attempts.get(key);
  if (a?.blockedUntil && now < a.blockedUntil) {
    return { allowed: false, retryAfterMs: a.blockedUntil - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

/** Records a failed login. Trips a lockout once MAX_FAILURES is reached. */
export function recordLoginFailure(key: string) {
  const now = Date.now();
  prune(now);
  const a = attempts.get(key);

  if (!a || now - a.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return;
  }

  a.count += 1;
  if (a.count >= MAX_FAILURES) {
    a.blockedUntil = now + BLOCK_MS;
  }
}

/** Clears the counter for a key after a successful login. */
export function recordLoginSuccess(key: string) {
  attempts.delete(key);
}
