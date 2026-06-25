import { NextResponse } from 'next/server';
import { getIngestLog } from '@/lib/ingest';
import { getCatalogStats } from '@/lib/catalog-queries';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return NextResponse.json({
    log: getIngestLog(10),
    stats: getCatalogStats(),
  });
}
