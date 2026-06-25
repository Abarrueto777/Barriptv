import { NextRequest, NextResponse } from 'next/server';
import { ingestFromUrl } from '@/lib/ingest';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { url } = await request.json();

  if (typeof url !== 'string' || url.trim() === '') {
    return NextResponse.json({ error: 'Falta la URL' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Solo se permiten URLs http/https' }, { status: 400 });
  }

  try {
    const result = await ingestFromUrl(url);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
