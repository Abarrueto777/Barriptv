CREATE TABLE IF NOT EXISTS catalog (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tvg_id        TEXT,
  name          TEXT NOT NULL,
  series_name   TEXT,
  season        INTEGER,
  episode       INTEGER,
  logo_url      TEXT,
  group_title   TEXT NOT NULL,
  content_type  TEXT NOT NULL CHECK (content_type IN ('tv','movie','series')),
  stream_url    TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_type_group ON catalog(content_type, group_title);
CREATE INDEX IF NOT EXISTS idx_catalog_series_name ON catalog(series_name);

CREATE VIRTUAL TABLE IF NOT EXISTS catalog_fts USING fts5(
  name, series_name, group_title, content=catalog, content_rowid=id
);

CREATE TRIGGER IF NOT EXISTS catalog_ai AFTER INSERT ON catalog BEGIN
  INSERT INTO catalog_fts(rowid, name, series_name, group_title)
  VALUES (new.id, new.name, new.series_name, new.group_title);
END;

CREATE TABLE IF NOT EXISTS ingest_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type   TEXT NOT NULL CHECK (source_type IN ('upload','url')),
  source_ref    TEXT,
  entry_count   INTEGER NOT NULL,
  started_at    INTEGER NOT NULL,
  finished_at   INTEGER,
  status        TEXT NOT NULL CHECK (status IN ('running','success','error')),
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  expires_at    INTEGER,
  disabled      INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);
