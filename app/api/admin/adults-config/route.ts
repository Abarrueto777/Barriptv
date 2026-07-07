import { NextRequest, NextResponse } from 'next/server';
import { getCategories, getSeriesCategories } from '@/lib/catalog-queries';
import { getAdultCategories, setAdultCategories, adultsCategoriesConfigured } from '@/lib/settings';
import { requireAdmin } from '@/lib/auth';

function allCategoryTitles(): string[] {
  const titles = new Set<string>();
  for (const c of getCategories('tv')) titles.add(c.groupTitle);
  for (const c of getCategories('movie')) titles.add(c.groupTitle);
  for (const c of getSeriesCategories()) titles.add(c.groupTitle);
  return [...titles].sort((a, b) => a.localeCompare(b));
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const all = allCategoryTitles();
  const configured = adultsCategoriesConfigured();
  const adultsCategories = configured ? getAdultCategories() : all;

  return NextResponse.json({
    allCategories: all,
    adultsCategories,
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { adultsCategories } = await request.json();

  if (Array.isArray(adultsCategories)) {
    setAdultCategories(adultsCategories.filter((x) => typeof x === 'string'));
  }

  return NextResponse.json({ ok: true });
}
