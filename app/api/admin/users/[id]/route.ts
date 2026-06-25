import { NextRequest, NextResponse } from 'next/server';
import { getUserById, extendUser, setDisabled, deleteUser } from '@/lib/users';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const userId = Number(id);
  const target = getUserById(userId);
  if (!target) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const { action, days } = await request.json();

  if (action === 'extend') {
    const n = Number(days);
    if (!Number.isFinite(n) || n <= 0) {
      return NextResponse.json({ error: 'Días inválidos' }, { status: 400 });
    }
    extendUser(userId, n);
    return NextResponse.json({ ok: true });
  }

  if (action === 'disable' || action === 'enable') {
    if (target.role === 'admin') {
      return NextResponse.json({ error: 'No se puede deshabilitar a un administrador' }, { status: 400 });
    }
    setDisabled(userId, action === 'disable');
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const userId = Number(id);
  const target = getUserById(userId);
  if (!target) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }
  if (target.role === 'admin') {
    return NextResponse.json({ error: 'No se puede eliminar a un administrador' }, { status: 400 });
  }
  // Extra guard: never delete yourself.
  const me = await getCurrentUser();
  if (me && me.id === userId) {
    return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 });
  }

  deleteUser(userId);
  return NextResponse.json({ ok: true });
}
