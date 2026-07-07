'use client';

import { useEffect, useState } from 'react';

interface ConfigData {
  allCategories: string[];
  adultsCategories: string[];
}

export default function AdultsConfig() {
  const [data, setData] = useState<ConfigData | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/adults-config')
      .then((r) => r.json())
      .then((d: ConfigData) => {
        if (!active) return;
        setData(d);
        setSelected(new Set(d.adultsCategories));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  function toggle(cat: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const body = { adultsCategories: [...selected] };
      await fetch('/api/admin/adults-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!data) return null;

  const visible = filter
    ? data.allCategories.filter((c) => c.toLowerCase().includes(filter.toLowerCase()))
    : data.allCategories;

  return (
    <div className="glass mt-6 rounded-2xl p-6">
      <h2 className="mb-1 font-semibold text-white">Perfil de Adultos</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Elegí qué categorías puede ver el perfil Adultos. Todas las categorías están disponibles por defecto.
      </p>

      {/* Category whitelist */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-zinc-300">
          Categorías permitidas ({selected.size})
        </label>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar..."
          className="w-40 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-cyan-400/60"
        />
      </div>

      <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10 p-2">
        {visible.map((cat) => (
          <label key={cat} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-zinc-200 hover:bg-white/5">
            <input type="checkbox" checked={selected.has(cat)} onChange={() => toggle(cat)} className="accent-cyan-500" />
            <span className="truncate">{cat}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
        {saved && <span className="text-sm text-green-400">✓ Guardado</span>}
      </div>
    </div>
  );
}
