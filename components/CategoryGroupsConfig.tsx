'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/users';

interface CategoryGroup {
  id: number;
  name: string;
  categories: string[];
}

interface ConfigData {
  groups: CategoryGroup[];
  users: User[];
  allCategories: string[];
}

export default function CategoryGroupsConfig() {
  const [data, setData] = useState<ConfigData | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/category-groups')
      .then((r) => r.json())
      .then((d: ConfigData) => {
        if (!active) return;
        setData(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function saveGroup() {
    if (!newGroupName.trim() || !data) return;
    setSaving(true);
    try {
      const action = editingGroupId ? 'update' : 'create';
      await fetch('/api/admin/category-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          groupId: editingGroupId,
          name: newGroupName,
          categories: [...selectedCategories],
        }),
      });
      setNewGroupName('');
      setSelectedCategories(new Set());
      setEditingGroupId(null);
      const resp = await fetch('/api/admin/category-groups');
      setData(await resp.json());
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(id: number) {
    if (!confirm('¿Borrar este grupo?')) return;
    try {
      await fetch('/api/admin/category-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', groupId: id }),
      });
      const resp = await fetch('/api/admin/category-groups');
      setData(await resp.json());
    } catch {}
  }

  async function assignUserToGroup(userId: number, groupId: number | null) {
    try {
      await fetch('/api/admin/category-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', userId, groupId }),
      });
      const resp = await fetch('/api/admin/category-groups');
      setData(await resp.json());
    } catch {}
  }

  if (!data) return null;

  const visibleCategories = filterText
    ? data.allCategories.filter((c) => c.toLowerCase().includes(filterText.toLowerCase()))
    : data.allCategories;

  return (
    <div className="space-y-6">
      {/* Create/Edit Group */}
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 font-semibold text-white">
          {editingGroupId ? 'Editar grupo' : 'Crear nuevo grupo'}
        </h2>

        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Nombre del grupo"
          className="mb-4 w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/10"
        />

        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-zinc-300">
            Categorías ({selectedCategories.size})
          </label>
          <input
            type="search"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filtrar..."
            className="w-40 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-cyan-400/60"
          />
        </div>

        <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-white/10 p-2">
          {visibleCategories.map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-zinc-200 hover:bg-white/5">
              <input
                type="checkbox"
                checked={selectedCategories.has(cat)}
                onChange={() => {
                  setSelectedCategories((prev) => {
                    const next = new Set(prev);
                    if (next.has(cat)) next.delete(cat);
                    else next.add(cat);
                    return next;
                  });
                }}
                className="accent-cyan-500"
              />
              <span className="truncate">{cat}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveGroup}
            disabled={saving || !newGroupName.trim()}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : editingGroupId ? 'Actualizar' : 'Crear grupo'}
          </button>
          {editingGroupId && (
            <button
              onClick={() => {
                setEditingGroupId(null);
                setNewGroupName('');
                setSelectedCategories(new Set());
              }}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Groups List */}
      {data.groups.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 font-semibold text-white">Grupos existentes</h2>
          <div className="space-y-3">
            {data.groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-white">{group.name}</h3>
                  <p className="text-xs text-zinc-400">{group.categories.length} categorías</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingGroupId(group.id);
                      setNewGroupName(group.name);
                      setSelectedCategories(new Set(group.categories));
                    }}
                    className="rounded px-2 py-1 text-xs text-cyan-400 hover:bg-white/5"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="rounded px-2 py-1 text-xs text-red-400 hover:bg-white/5"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Users to Groups */}
      {data.groups.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 font-semibold text-white">Asignar usuarios a grupos</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.users
              .filter((u) => u.role === 'user')
              .map((user) => {
                const currentGroup = data.groups.find((g) => g.id === user.category_group_id);
                return (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-zinc-400">
                        {currentGroup ? `Grupo: ${currentGroup.name}` : 'Sin grupo asignado'}
                      </p>
                    </div>
                    <select
                      value={user.category_group_id || ''}
                      onChange={(e) => assignUserToGroup(user.id, e.target.value ? Number(e.target.value) : null)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-cyan-400/60"
                    >
                      <option value="">Sin grupo</option>
                      {data.groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
