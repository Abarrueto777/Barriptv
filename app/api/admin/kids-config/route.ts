import { NextRequest, NextResponse } from 'next/server';
import { getCategories, getSeriesCategories } from '@/lib/catalog-queries';
import { getAdultPin, setAdultPin, getKidsCategories, setKidsCategories, kidsCategoriesConfigured } from '@/lib/settings';
import { suggestKidsCategories } from '@/lib/profile';
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
  const configured = kidsCategoriesConfigured();
  // Pre-select keyword suggestions until the admin has saved a whitelist at least once.
  const kidsCategories = configured ? getKidsCategories() : suggestKidsCategories(all);

  return NextResponse.json({
    pinSet: getAdultPin() !== null,
    allCategories: all,
    kidsCategories,
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { pin, kidsCategories } = await request.json();

  if (typeof pin === 'string') {
    setAdultPin(pin.trim());
  }

  if (Array.isArray(kidsCategories)) {
    setKidsCategories(kidsCategories.filter((x) => typeof x === 'string'));
  }

  return NextResponse.json({ ok: true });
}
