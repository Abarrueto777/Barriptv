'use client';

import { useState } from 'react';

export default function ProfileGate({ pinRequired }: { pinRequired: boolean }) {
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function select(profile: 'kids' | 'adults', pinValue?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, pin: pinValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'No se pudo seleccionar el perfil');
        return;
      }
      // Full navigation (not router.push) so the fresh session cookie is used and the
      // client RSC cache for "/" (which previously redirected to /profile) is bypassed.
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  }

  function handleAdults() {
    if (pinRequired) {
      setShowPin(true);
    } else {
      select('adults');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        ¿Quién está <span className="accent-text">mirando</span>?
      </h1>
      <p className="mb-10 text-zinc-400">Elegí un perfil</p>

      {!showPin ? (
        <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
          <button
            onClick={() => select('kids')}
            disabled={loading}
            className="glass glass-hover flex flex-col items-center gap-3 rounded-2xl p-10 transition hover:-translate-y-1 disabled:opacity-50"
          >
            <span className="text-5xl">🧒</span>
            <span className="text-xl font-semibold text-white">Niños</span>
            <span className="text-sm text-zinc-400">Solo contenido apto</span>
          </button>

          <button
            onClick={handleAdults}
            disabled={loading}
            className="glass glass-hover flex flex-col items-center gap-3 rounded-2xl p-10 transition hover:-translate-y-1 disabled:opacity-50"
          >
            <span className="text-5xl">🧑</span>
            <span className="text-xl font-semibold text-white">Adultos</span>
            <span className="text-sm text-zinc-400">{pinRequired ? 'Requiere PIN' : 'Acceso completo'}</span>
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            select('adults', pin);
          }}
          className="glass w-full max-w-xs rounded-2xl p-8 text-center"
        >
          <p className="mb-4 text-sm text-zinc-300">Ingresá el PIN de adultos</p>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-lg tracking-widest text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/10"
          />
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || pin.length === 0}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowPin(false);
              setError(null);
              setPin('');
            }}
            className="mt-3 text-sm text-zinc-400 hover:text-white"
          >
            ← Volver
          </button>
        </form>
      )}

      {error && !showPin && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
