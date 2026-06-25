'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="glass glass-hover mb-4 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:text-white"
    >
      <span className="text-base leading-none">←</span> Volver
    </button>
  );
}
