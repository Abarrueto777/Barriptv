import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { getSessionOptions, type SessionData } from '@/lib/session';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];
// Reachable once authenticated but before a profile is chosen.
const PROFILE_PUBLIC = ['/profile', '/api/profile/select', '/api/auth/logout'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // The stream proxy authorizes itself (signed token OR session), so it must be
  // reachable cookie-less for Chromecast. Its own route enforces auth + concurrency.
  if (pathname.startsWith('/api/stream/')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, getSessionOptions());

  if (!session.userId) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Subscription expired (fast snapshot check; getCurrentUser does the authoritative DB check).
  if (session.expiresAt && Date.now() > session.expiresAt && !PROFILE_PUBLIC.includes(pathname)) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'expired' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/login?expired=1', request.url));
  }

  // Authenticated but no profile picked yet → force the profile selector.
  if (!session.profile && !PROFILE_PUBLIC.includes(pathname)) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'no-profile' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // Admin area is admin-only (and never the kids profile).
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (isAdminPath && (session.role !== 'admin' || session.profile === 'kids')) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
