/**
 * Short-lived signed tokens that authorize a single catalog entry for playback
 * through the stream proxy WITHOUT a session cookie. Needed because Chromecast
 * fetches the stream URL from the cast device, which carries none of our cookies.
 *
 * A leaked token is far less dangerous than a leaked provider credential: it is
 * scoped to one entry, expires quickly, and is still subject to the concurrency
 * cap — it can never open a 4th connection on the provider line.
 */

import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // long enough for a full movie / viewing session

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET no está configurado (mínimo 32 caracteres).');
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', secret()).update(payload).digest());
}

/** Mints a token binding an entry to a user with an expiry. */
export function signStreamToken(entryId: number, userId: number, ttlMs = DEFAULT_TTL_MS): string {
  const payload = `${entryId}.${userId}.${Date.now() + ttlMs}`;
  return `${b64url(Buffer.from(payload))}.${sign(payload)}`;
}

export interface StreamTokenClaims {
  entryId: number;
  userId: number;
}

/** Verifies signature + expiry. Returns the claims, or null if invalid/expired. */
export function verifyStreamToken(token: string): StreamTokenClaims | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  } catch {
    return null;
  }

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [entryStr, userStr, expStr] = payload.split('.');
  const entryId = Number(entryStr);
  const userId = Number(userStr);
  const exp = Number(expStr);
  if (!Number.isFinite(entryId) || !Number.isFinite(userId) || !Number.isFinite(exp)) return null;
  if (Date.now() > exp) return null;

  return { entryId, userId };
}
