import { NextRequest, NextResponse } from 'next/server';
import { changeUserPassword } from '@/lib/users';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { newPassword } = await request.json();

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 1) {
    return NextResponse.json({ error: 'newPassword-required' }, { status: 400 });
  }

  try {
    changeUserPassword(Number(id), newPassword.trim());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'change-failed' }, { status: 500 });
  }
}
