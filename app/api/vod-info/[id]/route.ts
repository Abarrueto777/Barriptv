import { NextResponse } from 'next/server';
import { getEntryById } from '@/lib/catalog-queries';
import { getVodInfo } from '@/lib/vod-info';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getEntryById(Number(id));

  if (!entry || entry.contentType !== 'movie') {
    return NextResponse.json({ info: null });
  }

  const info = await getVodInfo(entry.streamUrl);
  return NextResponse.json({ info });
}
