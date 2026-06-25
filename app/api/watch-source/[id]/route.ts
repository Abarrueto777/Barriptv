import { NextRequest, NextResponse } from 'next/server';
import { getEntryById } from '@/lib/catalog-queries';
import { resolveLiveStream } from '@/lib/resolve-stream';
import { getKidsFilter } from '@/lib/profile';
import { getCurrentUser } from '@/lib/auth';
import { buildPlayUrl } from '@/lib/stream-url';
import type { StreamKind } from '@/types/catalog';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getEntryById(Number(id));
  if (!entry) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Kids profile must not reach a non-allowed category, even via this endpoint.
  const filter = await getKidsFilter();
  if (filter && !filter.has(entry.groupTitle)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const isLive = entry.contentType === 'tv';
  let kind: StreamKind = 'file';
  let rawUrl = entry.streamUrl;
  if (isLive) {
    const resolved = await resolveLiveStream(entry.streamUrl);
    kind = resolved.kind;
    rawUrl = resolved.url;
  }

  // When behind a reverse proxy (Cloudflare Tunnel), use X-Forwarded-Host header to get the real domain.
  // Falls back to request origin if header is missing.
  let origin = request.nextUrl.origin;
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) {
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    origin = `${proto}://${forwardedHost}`;
  }

  const url = buildPlayUrl(entry.id, kind, rawUrl, user.id, origin);

  return NextResponse.json({
    id: entry.id,
    name: entry.name,
    groupTitle: entry.groupTitle,
    contentType: entry.contentType,
    logoUrl: entry.logoUrl,
    kind,
    url,
  });
}
