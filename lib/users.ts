import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getDb } from './db';

export type Role = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  role: Role;
  expiresAt: number | null;
  disabled: boolean;
  createdAt: number;
}

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  role: Role;
  expires_at: number | null;
  disabled: number;
  created_at: number;
}

const DAY_MS = 86_400_000;

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    expiresAt: row.expires_at,
    disabled: row.disabled === 1,
    createdAt: row.created_at,
  };
}

// --- password hashing (scrypt, no external deps) ---
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// --- queries ---
export function getUserById(id: number): User | null {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserByUsername(username: string): UserRow | null {
  const row = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
  return row ?? null;
}

export function listUsers(): User[] {
  const rows = getDb().prepare('SELECT * FROM users ORDER BY role DESC, username').all() as UserRow[];
  return rows.map(rowToUser);
}

export function createUser(params: { username: string; password: string; days: number | null; role?: Role }): User {
  const expiresAt = params.days === null ? null : Date.now() + params.days * DAY_MS;
  const info = getDb()
    .prepare(
      `INSERT INTO users (username, password_hash, role, expires_at, disabled, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    )
    .run(params.username.trim(), hashPassword(params.password), params.role ?? 'user', expiresAt, Date.now());
  return getUserById(Number(info.lastInsertRowid))!;
}

export function extendUser(id: number, days: number) {
  const user = getUserById(id);
  if (!user) return;
  // Extend from now if already expired/none, else from current expiry.
  const base = user.expiresAt && user.expiresAt > Date.now() ? user.expiresAt : Date.now();
  getDb().prepare('UPDATE users SET expires_at = ? WHERE id = ?').run(base + days * DAY_MS, id);
}

export function setDisabled(id: number, disabled: boolean) {
  getDb().prepare('UPDATE users SET disabled = ? WHERE id = ?').run(disabled ? 1 : 0, id);
}

export function deleteUser(id: number) {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
}

export type VerifyResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'invalid' | 'disabled' | 'expired' };

export function verifyCredentials(username: string, password: string): VerifyResult {
  const row = getUserByUsername(username);
  if (!row || !verifyPassword(password, row.password_hash)) {
    return { ok: false, reason: 'invalid' };
  }
  if (row.disabled === 1) return { ok: false, reason: 'disabled' };
  if (row.expires_at !== null && Date.now() > row.expires_at) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, user: rowToUser(row) };
}

export type UserStatus = 'active' | 'expired' | 'disabled';

export function userStatus(user: User): { status: UserStatus; daysLeft: number | null } {
  if (user.disabled) return { status: 'disabled', daysLeft: null };
  if (user.expiresAt === null) return { status: 'active', daysLeft: null };
  const msLeft = user.expiresAt - Date.now();
  if (msLeft <= 0) return { status: 'expired', daysLeft: 0 };
  return { status: 'active', daysLeft: Math.ceil(msLeft / DAY_MS) };
}

/** Seeds the admin account on first boot so the owner is never locked out. */
export function seedAdmin() {
  const db = getDb();
  const existing = db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'admin'").get() as { n: number };
  if (existing.n > 0) return;
  const configured = process.env.ADMIN_PASSWORD || process.env.ACCESS_PASSPHRASE;
  // In production a guessable default password is a takeover risk: refuse to seed
  // an admin unless the owner set a real one. Dev keeps a convenience fallback.
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_PASSWORD no está configurado. Definí ADMIN_PASSWORD antes de iniciar en producción.'
    );
  }
  const password = configured || 'barriptv2026';
  db.prepare(
    `INSERT INTO users (username, password_hash, role, expires_at, disabled, created_at)
     VALUES ('admin', ?, 'admin', NULL, 0, ?)`
  ).run(hashPassword(password), Date.now());
}
