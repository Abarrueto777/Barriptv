import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { Profile } from '@/types/catalog';

export type { Profile };

export type Role = 'admin' | 'user';

export interface SessionData {
  userId?: number;
  role?: Role;
  /** Subscription end snapshot (epoch ms) for fast proxy expiry checks; null/undefined = never. */
  expiresAt?: number | null;
  issuedAt?: number;
  profile?: Profile;
}

/**
 * Resolves the cookie-signing secret, failing loud if it is missing or weak.
 * Forging a session requires this secret, so a blank/short value is a security
 * hole — we refuse to boot the auth layer rather than sign with a guessable key.
 */
function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET no está configurado o es muy corto (mínimo 32 caracteres). ' +
        'Generá uno con: openssl rand -base64 32'
    );
  }
  return secret;
}

export function getSessionOptions(): SessionOptions {
  return {
    password: requireSessionSecret(),
    cookieName: 'barriptv_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}
