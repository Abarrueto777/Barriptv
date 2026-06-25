import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { getDb } from './db';
import { parseM3u } from './m3u-parser';
import { classify } from './classify';
import type { ContentType, IngestLogEntry, IngestResult, IngestSourceType } from '@/types/catalog';

const UPLOAD_PATH = path.join(process.cwd(), 'data', 'uploads', 'current.m3u');
const FETCH_TIMEOUT_MS = 30_000;
const MAX_SIZE_BYTES = 100 * 1024 * 1024;

function emptyBreakdown(): Record<ContentType, number> {
  return { tv: 0, movie: 0, series: 0 };
}

function persistRaw(text: string) {
  mkdirSync(path.dirname(UPLOAD_PATH), { recursive: true });
  writeFileSync(UPLOAD_PATH, text, 'utf8');
}

function runIngest(text: string, sourceType: IngestSourceType, sourceRef: string): IngestResult {
  const db = getDb();
  const startedAt = Date.now();

  const logInsert = db.prepare(
    `INSERT INTO ingest_log (source_type, source_ref, entry_count, started_at, status)
     VALUES (?, ?, 0, ?, 'running')`
  );
  const logId = logInsert.run(sourceType, sourceRef, startedAt).lastInsertRowid;

  try {
    const rawEntries = parseM3u(text);
    const breakdown = emptyBreakdown();

    const rows = rawEntries.map((entry) => {
      const classified = classify(entry);
      breakdown[classified.contentType]++;
      return {
        tvgId: entry.tvgId || null,
        name: entry.displayName,
        seriesName: classified.seriesName,
        season: classified.season,
        episode: classified.episode,
        logoUrl: entry.tvgLogo || null,
        groupTitle: entry.groupTitle || '(sin categoría)',
        contentType: classified.contentType,
        streamUrl: entry.streamUrl,
      };
    });

    const insertStmt = db.prepare(
      `INSERT INTO catalog
        (tvg_id, name, series_name, season, episode, logo_url, group_title, content_type, stream_url, created_at)
       VALUES (@tvgId, @name, @seriesName, @season, @episode, @logoUrl, @groupTitle, @contentType, @streamUrl, @createdAt)`
    );

    const replaceAll = db.transaction((entries: typeof rows) => {
      db.exec('DELETE FROM catalog');
      db.exec('DELETE FROM catalog_fts');
      const createdAt = Date.now();
      for (const row of entries) {
        insertStmt.run({ ...row, createdAt });
      }
    });

    replaceAll(rows);
    persistRaw(text);

    db.prepare(
      `UPDATE ingest_log SET entry_count = ?, finished_at = ?, status = 'success' WHERE id = ?`
    ).run(rows.length, Date.now(), logId);

    return { entryCount: rows.length, contentTypeBreakdown: breakdown };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    db.prepare(
      `UPDATE ingest_log SET finished_at = ?, status = 'error', error_message = ? WHERE id = ?`
    ).run(Date.now(), message, logId);
    throw error;
  }
}

export function ingestFromFile(buffer: Buffer, filename: string): IngestResult {
  const text = buffer.toString('utf8');
  return runIngest(text, 'upload', filename);
}

export async function ingestFromUrl(url: string): Promise<IngestResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`No se pudo descargar la playlist (HTTP ${response.status})`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_SIZE_BYTES) {
      throw new Error('La playlist supera el tamaño máximo permitido (100MB)');
    }

    const text = await response.text();
    if (text.length > MAX_SIZE_BYTES) {
      throw new Error('La playlist supera el tamaño máximo permitido (100MB)');
    }

    return runIngest(text, 'url', url);
  } finally {
    clearTimeout(timeout);
  }
}

export function getIngestLog(limit = 10): IngestLogEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, source_type as sourceType, source_ref as sourceRef, entry_count as entryCount,
              started_at as startedAt, finished_at as finishedAt, status, error_message as errorMessage
       FROM ingest_log ORDER BY started_at DESC LIMIT ?`
    )
    .all(limit);
  return rows as IngestLogEntry[];
}
