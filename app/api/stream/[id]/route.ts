import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getEntryById } from '@/lib/catalog-queries';
import { getKidsFilter } from '@/lib/profile';
import { getUserById, userStatus } from '@/lib/users';
import { verifyStreamToken } from '@/lib/stream-token';
import { acquireSlot, releaseSlot } from '@/lib/stream-slots';

/** Headers worth forwarding from the provider response to the client/player. */
const PASS_HEADERS = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'cache-control'];

/**
 * Reverse-proxies a single catalog entry's stream through our server. This hides
 * the provider credential from the client entirely and, by holding the upstream
 * connection for the whole playback, lets stream-slots enforce the line's
 * concurrency limit exactly — the 4th simultaneous viewer is refused here, before
 * a connection ever reaches the provider, so the line never gets flagged.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entryId = Number(id);
  if (!Number.isFinite(entryId)) {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }

  // Authorize via signed token (cookie-less, e.g. Chromecast) or the session.
  const token = request.nextUrl.searchParams.get('t');
  let userId: number | null = null;
  let viaToken = false;
  if (token) {
    const claims = verifyStreamToken(token);
    if (claims && claims.entryId === entryId) {
      // Token is valid, but the account must still be active (not expired/disabled).
      const u = getUserById(claims.userId);
      if (u && userStatus(u).status === 'active') {
        userId = u.id;
        viaToken = true;
      }
    }
  }
  if (userId === null) {
    const user = await getCurrentUser();
    if (user) userId = user.id;
  }
  if (userId === null) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const entry = getEntryById(entryId);
  if (!entry) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  // Kids profile must not reach a non-allowed category via the cookie path. The
  // token path was already authorized at mint time, so it is trusted here.
  if (!viaToken) {
    const filter = await getKidsFilter();
    if (filter && !filter.has(entry.groupTitle)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  // Reserve a concurrency slot BEFORE touching the provider.
  const slot = acquireSlot(userId, entryId);
  if (!slot.ok) {
    return NextResponse.json(
      { error: 'no-slots', reason: slot.reason },
      { status: 503, headers: { 'Retry-After': '10' } }
    );
  }

  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      releaseSlot(slot.id);
    }
  };

  try {
    const range = request.headers.get('range');
    const upstream = await fetch(entry.streamUrl, {
      redirect: 'follow',
      signal: request.signal, // client disconnect aborts the upstream fetch
      headers: {
        'User-Agent': 'Mozilla/5.0',
        ...(range ? { Range: range } : {}),
      },
    });

    if (!upstream.ok && upstream.status !== 206) {
      release();
      return NextResponse.json({ error: 'upstream', status: upstream.status }, { status: 502 });
    }
    if (!upstream.body) {
      release();
      return NextResponse.json({ error: 'no-body' }, { status: 502 });
    }

    const headers = new Headers();
    for (const h of PASS_HEADERS) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }

    // Wrap the upstream body so the slot is freed on normal end, client cancel, or error.
    const reader = upstream.body.getReader();
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            release();
            return;
          }
          controller.enqueue(value);
        } catch (err) {
          controller.error(err);
          release();
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
        release();
      },
    });

    request.signal.addEventListener('abort', release);

    return new NextResponse(body, { status: upstream.status, headers });
  } catch {
    release();
    return NextResponse.json({ error: 'proxy-failed' }, { status: 502 });
  }
}
