import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { verifyCredentials } from '@/lib/users';
import { checkLoginAllowed, recordLoginFailure, recordLoginSuccess } from '@/lib/rate-limit';

/** Best-effort client IP for rate-limiting; behind nginx this is x-forwarded-for. */
function clientKey(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  const key = clientKey(request);
  const limit = checkLoginAllowed(key);
  if (!limit.allowed) {
    const retryAfter = Math.ceil(limit.retryAfterMs / 1000);
    return NextResponse.json(
      { error: 'Demasiados intentos. Probá de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  const { username, password } = await request.json();

  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return NextResponse.json({ error: 'Completá usuario y contraseña' }, { status: 400 });
  }

  const result = verifyCredentials(username, password);

  if (!result.ok) {
    recordLoginFailure(key);
    if (result.reason === 'disabled') {
      return NextResponse.json({ error: 'Cuenta deshabilitada' }, { status: 403 });
    }
    if (result.reason === 'expired') {
      return NextResponse.json({ error: 'Suscripción vencida' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  recordLoginSuccess(key);
  const { user } = result;
  const session = await getSession();
  session.userId = user.id;
  session.role = user.role;
  session.expiresAt = user.expiresAt;
  session.issuedAt = Date.now();
  // Profile must be re-picked after login.
  session.profile = undefined;
  await session.save();

  return NextResponse.json({ ok: true });
}
