import { getDb } from './db';

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

export function setSetting(key: string, value: string) {
  const db = getDb();
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

export function getAdultPin(): string | null {
  const pin = getSetting('adult_pin');
  return pin && pin.length > 0 ? pin : null;
}

export function setAdultPin(pin: string) {
  setSetting('adult_pin', pin);
}

export function getKidsCategories(): string[] {
  const raw = getSetting('kids_categories');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function setKidsCategories(list: string[]) {
  setSetting('kids_categories', JSON.stringify(list));
}

/** True once the admin has saved a kids whitelist at least once (even if empty array). */
export function kidsCategoriesConfigured(): boolean {
  return getSetting('kids_categories') !== null;
}

export function getAdultCategories(): string[] {
  const raw = getSetting('adults_categories');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function setAdultCategories(list: string[]) {
  setSetting('adults_categories', JSON.stringify(list));
}

export function adultsCategoriesConfigured(): boolean {
  return getSetting('adults_categories') !== null;
}

export interface CategoryGroup {
  id: number;
  name: string;
  categories: string[];
}

export function getCategoryGroup(id: number): CategoryGroup | null {
  const db = getDb();
  const row = db.prepare('SELECT id, name, categories FROM category_groups WHERE id = ?').get(id) as
    | { id: number; name: string; categories: string }
    | undefined;
  if (!row) return null;
  try {
    const categories = JSON.parse(row.categories);
    return {
      id: row.id,
      name: row.name,
      categories: Array.isArray(categories) ? categories : [],
    };
  } catch {
    return null;
  }
}

export function getAllCategoryGroups(): CategoryGroup[] {
  const db = getDb();
  const rows = db.prepare('SELECT id, name, categories FROM category_groups ORDER BY name').all() as Array<{
    id: number;
    name: string;
    categories: string;
  }>;
  return rows
    .map((row) => {
      try {
        const categories = JSON.parse(row.categories);
        return {
          id: row.id,
          name: row.name,
          categories: Array.isArray(categories) ? categories : [],
        };
      } catch {
        return null;
      }
    })
    .filter((g): g is CategoryGroup => g !== null);
}

export function createCategoryGroup(name: string, categories: string[]): CategoryGroup {
  const db = getDb();
  const now = Date.now();
  const result = db
    .prepare('INSERT INTO category_groups (name, categories, created_at) VALUES (?, ?, ?)')
    .run(name, JSON.stringify(categories), now);
  const id = typeof result.lastInsertRowid === 'number' ? result.lastInsertRowid : Number(result.lastInsertRowid);
  return { id, name, categories };
}

export function updateCategoryGroup(id: number, name: string, categories: string[]) {
  const db = getDb();
  db.prepare('UPDATE category_groups SET name = ?, categories = ? WHERE id = ?').run(name, JSON.stringify(categories), id);
}

export function deleteCategoryGroup(id: number) {
  const db = getDb();
  db.prepare('UPDATE users SET category_group_id = NULL WHERE category_group_id = ?').run(id);
  db.prepare('DELETE FROM category_groups WHERE id = ?').run(id);
}
