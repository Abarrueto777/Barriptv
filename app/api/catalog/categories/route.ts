import { NextRequest, NextResponse } from 'next/server';
import { getCategories, getSeriesCategories } from '@/lib/catalog-queries';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');

  if (type === 'series') {
    return NextResponse.json({ categories: getSeriesCategories() });
  }

  if (type === 'tv' || type === 'movie') {
    return NextResponse.json({ categories: getCategories(type) });
  }

  return NextResponse.json({ error: 'type debe ser tv, movie o series' }, { status: 400 });
}
