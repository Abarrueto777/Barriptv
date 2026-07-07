import { NextRequest, NextResponse } from 'next/server';
import { listEntries, listSeriesShows, listSeriesEpisodes } from '@/lib/catalog-queries';
import { getActiveProfileFilter } from '@/lib/profile';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get('type');
  const group = params.get('group') ?? undefined;
  const q = params.get('q') ?? undefined;
  const seriesName = params.get('seriesName') ?? undefined;
  const page = params.get('page') ? Number(params.get('page')) : undefined;
  const pageSize = params.get('pageSize') ? Number(params.get('pageSize')) : undefined;

  const filter = await getActiveProfileFilter();
  const allowed = <T extends { groupTitle: string }>(rows: T[]) =>
    filter ? rows.filter((r) => filter.has(r.groupTitle)) : rows;

  if (type === 'series') {
    if (seriesName) {
      return NextResponse.json({ episodes: allowed(listSeriesEpisodes(seriesName)) });
    }
    return NextResponse.json({ shows: allowed(listSeriesShows({ group, q, page, pageSize })) });
  }

  if (type === 'tv' || type === 'movie') {
    return NextResponse.json({ entries: allowed(listEntries(type, { group, q, page, pageSize })) });
  }

  return NextResponse.json({ error: 'type debe ser tv, movie o series' }, { status: 400 });
}
