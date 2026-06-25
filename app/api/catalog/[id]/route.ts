import { NextResponse } from 'next/server';
import { getEntryById } from '@/lib/catalog-queries';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getEntryById(Number(id));

  if (!entry) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  return NextResponse.json({ entry });
}
