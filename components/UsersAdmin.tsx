'use client';

import { useEffect, useState } from 'react';

interface AdminUser {
  id: number;
  username: string;
  role: 'admin' | 'user';
  expiresAt: number | null;
  disabled: boolean;
  status: 'active' | 'expired' | 'disabled';
  daysLeft: number | null;
}

const STATUS_STYLE: Record<AdminUser['status'], string> = {
  active: 'bg-green-400/15 text-green-300',
  expired: 'bg-red-400/15 text-red-300',
  disabled: 'bg-zinc-400/15 text-zinc-400',
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [days, setDays] = useState('30');
  const [noExpiry, setNoExpiry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    let active = true;
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => {
        if (active) setUsers(d.users ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, days: noExpiry ? null : Number(days) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'No se pudo crear');
        return;
      }
      setUsername('');
      setPassword('');
      setDays('30');
      setNoExpiry(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: number, body: Record<string, unknown>) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    await load();
  }

  async function remove(id: number, name: string) {
    if (!confirm(`¿Eliminar al usuario "${name}"?`)) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    await load();
  }

  if (!users) return null;

  function expiryLabel(u: AdminUser): string {
    if (u.role === 'admin') return 'Administrador';
    if (u.expiresAt === null) return 'Sin vencimiento';
    const date = new Date(u.expiresAt).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
    if (u.status === 'expired') return `Venció el ${date}`;
    return `${u.daysLeft} días (${date})`;
  }

  return (
    <div className="glass mt-6 rounded-2xl p-6">
      <h2 className="mb-1 font-semibold text-white">Usuarios y suscripciones</h2>
      <p className="mb-4 text-sm text-zinc-400">Creá accesos con vencimiento y gestioná las suscripciones.</p>

      {/* Create */}
      <form onSubmit={createUser} className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario"
          autoCapitalize="none"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={days}
            disabled={noExpiry}
            onChange={(e) => setDays(e.target.value)}
            className="w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60 disabled:opacity-40"
          />
          <label className="flex items-center gap-1 text-xs text-zinc-400">
            <input type="checkbox" checked={noExpiry} onChange={(e) => setNoExpiry(e.target.checked)} className="accent-cyan-500" />
            sin venc.
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Crear
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {/* List */}
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 text-sm">
            <span className="font-medium text-white">{u.username}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[u.status]}`}>
              {u.status === 'active' ? 'Activo' : u.status === 'expired' ? 'Vencido' : 'Deshabilitado'}
            </span>
            <span className="text-xs text-zinc-400">{expiryLabel(u)}</span>

            {u.role !== 'admin' && (
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => patch(u.id, { action: 'extend', days: 30 })} className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">
                  +30 días
                </button>
                <button
                  onClick={() => patch(u.id, { action: u.disabled ? 'enable' : 'disable' })}
                  className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
                >
                  {u.disabled ? 'Habilitar' : 'Deshabilitar'}
                </button>
                <button onClick={() => remove(u.id, u.username)} className="rounded-lg bg-red-600/20 px-2 py-1 text-xs text-red-300 hover:bg-red-600/40">
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
