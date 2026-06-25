'use client';

import { useState, FormEvent } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('expired') === '1') {
      return 'Tu suscripción venció. Contactá al administrador para renovarla.';
    }
    return null;
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'No se pudo iniciar sesión');
        return;
      }

      // Full navigation so the new session cookie is picked up cleanly (no stale RSC cache).
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="glass animate-fade-in-up w-full max-w-sm rounded-2xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
      >
        <h1 className="accent-text mb-2 text-center text-3xl font-bold tracking-tight">BarriPTV</h1>
        <p className="mb-6 text-center text-sm text-zinc-400">Iniciá sesión</p>
        <input
          type="text"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario"
          className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/10"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/10"
        />
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
