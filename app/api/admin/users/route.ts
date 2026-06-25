import { NextRequest, NextResponse } from 'next/server';
import { listUsers, createUser, getUserByUsername, userStatus } from '@/lib/users';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const users = listUsers().map((u) => {
    const { status, daysLeft } = userStatus(u);
    return {
      id: u.id,
      username: u.username,
      role: u.role,
      expiresAt: u.expiresAt,
      disabled: u.disabled,
      status,
      daysLeft,
    };
  });
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { username, password, days } = await request.json();

  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
    return NextResponse.json({ error: 'Usuario y contraseña son obligatorios' }, { status: 400 });
  }
  if (getUserByUsername(username.trim())) {
    return NextResponse.json({ error: 'Ese usuario ya existe' }, { status: 409 });
  }

  const parsedDays = days === null || days === undefined || days === '' ? null : Number(days);
  if (parsedDays !== null && (!Number.isFinite(parsedDays) || parsedDays < 0)) {
    return NextResponse.json({ error: 'Duración inválida' }, { status: 400 });
  }

  const user = createUser({ username: username.trim(), password, days: parsedDays });
  return NextResponse.json({ ok: true, id: user.id });
}
