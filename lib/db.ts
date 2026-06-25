import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { seedAdmin } from './users';

const DATABASE_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'catalog.sqlite3');

let instance: Database.Database | null = null;

function createConnection(): Database.Database {
  mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });

  const db = new Database(DATABASE_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = readFileSync(path.join(process.cwd(), 'lib', 'schema.sql'), 'utf8');
  db.exec(schema);

  return db;
}

export function getDb(): Database.Database {
  if (!instance) {
    // Assign before seeding: seedAdmin() calls getDb() and must get this instance.
    instance = createConnection();
    seedAdmin();
  }
  return instance;
}
