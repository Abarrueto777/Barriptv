import { NextRequest, NextResponse } from 'next/server';
import { getAllCategoryGroups, createCategoryGroup, updateCategoryGroup, deleteCategoryGroup, getCategoryGroup } from '@/lib/settings';
import { getCategories, getSeriesCategories } from '@/lib/catalog-queries';
import { listUsers, setUserCategoryGroup } from '@/lib/users';
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

  const groups = getAllCategoryGroups();
  const users = listUsers();
  const allCategories = allCategoryTitles();

  return NextResponse.json({
    groups,
    users,
    allCategories,
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { action, name, categories, groupId, userId } = await request.json();

  if (action === 'create' && typeof name === 'string' && Array.isArray(categories)) {
    createCategoryGroup(name, categories.filter((x) => typeof x === 'string'));
    return NextResponse.json({ ok: true });
  }

  if (action === 'update' && groupId && typeof name === 'string' && Array.isArray(categories)) {
    updateCategoryGroup(groupId, name, categories.filter((x) => typeof x === 'string'));
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete' && groupId) {
    deleteCategoryGroup(groupId);
    return NextResponse.json({ ok: true });
  }

  if (action === 'assign' && userId && (groupId || groupId === null)) {
    setUserCategoryGroup(userId, groupId || null);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'invalid-action' }, { status: 400 });
}
