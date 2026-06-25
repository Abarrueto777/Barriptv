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
