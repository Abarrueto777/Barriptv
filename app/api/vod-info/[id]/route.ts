import { NextRequest, NextResponse } from 'next/server';
import { getEntryById } from '@/lib/catalog-queries';
import { getVodInfo } from '@/lib/vod-info';
import { buildImageUrl } from '@/lib/image-url';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getEntryById(Number(id));

  if (!entry || entry.contentType !== 'movie') {
    return NextResponse.json({ info: null });
  }

  const info = await getVodInfo(entry.streamUrl);
  if (!info) {
    return NextResponse.json({ info: null });
  }

  // Get origin for image proxying (detect from reverse proxy headers).
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  // Proxify the cover image if it's from a restricted provider.
  const proxiedInfo = {
    ...info,
    cover: buildImageUrl(info.cover, origin),
  };

  return NextResponse.json({ info: proxiedInfo });
}
