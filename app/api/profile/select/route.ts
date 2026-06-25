import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSession } from '@/lib/session';
import { getAdultPin } from '@/lib/settings';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export async function POST(request: NextRequest) {
  const { profile, pin } = await request.json();

  if (profile !== 'kids' && profile !== 'adults') {
    return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 });
  }

  if (profile === 'adults') {
    const expected = getAdultPin();
    // If no PIN is configured yet, the adult profile is open (admin is warned to set one).
    if (expected && (typeof pin !== 'string' || !safeEqual(pin, expected))) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
    }
  }

  const session = await getSession();
  session.profile = profile;
  await session.save();

  return NextResponse.json({ ok: true });
}
