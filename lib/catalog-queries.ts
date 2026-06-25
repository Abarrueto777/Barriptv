import { getDb } from './db';
import type { CatalogEntry, ContentType } from '@/types/catalog';

export interface ListParams {
  group?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface CategoryCount {
  groupTitle: string;
  count: number;
}

export interface SeriesShow {
  seriesName: string;
  logoUrl: string | null;
  groupTitle: string;
  episodeCount: number;
}

interface CatalogRow {
  id: number;
  tvg_id: string | null;
  name: string;
  series_name: string | null;
  season: number | null;
  episode: number | null;
  logo_url: string | null;
  group_title: string;
  content_type: ContentType;
  stream_url: string;
}

const ADULT_CATEGORY_RE = /adulto|🔞|❌/i;

export function isAdultCategory(groupTitle: string): boolean {
  return ADULT_CATEGORY_RE.test(groupTitle);
}

/** Adult and placeholder categories sort last so they're never the default/auto-selected one. */
function isLowPriorityCategory(groupTitle: string): boolean {
  return isAdultCategory(groupTitle) || groupTitle === '(sin categoría)';
}

function sortCategoriesAdultLast(categories: CategoryCount[]): CategoryCount[] {
  return [...categories].sort((a, b) => {
    const aLow = isLowPriorityCategory(a.groupTitle);
    const bLow = isLowPriorityCategory(b.groupTitle);
    if (aLow !== bLow) return aLow ? 1 : -1;
    return a.groupTitle.localeCompare(b.groupTitle);
  });
}

/** Prefers the remembered category (if it still exists in the catalog) over the first one. */
export function resolveDefaultCategory(categories: CategoryCount[], remembered: string | null): string {
  if (remembered && categories.some((c) => c.groupTitle === remembered)) {
    return remembered;
  }
  return categories[0].groupTitle;
}

function buildFtsQuery(q: string): string {
  const tokens = q.trim().split(/\s+/).filter(Boolean);
  return tokens.map((token) => `"${token.replace(/"/g, '""')}"*`).join(' ');
}

function rowToEntry(row: CatalogRow): CatalogEntry {
  return {
    id: row.id,
    tvgId: row.tvg_id,
    name: row.name,
    seriesName: row.series_name,
    season: row.season,
    episode: row.episode,
    logoUrl: row.logo_url,
    groupTitle: row.group_title,
    contentType: row.content_type,
    streamUrl: row.stream_url,
  };
}

export function getCategories(type: 'tv' | 'movie'): CategoryCount[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT group_title as groupTitle, COUNT(*) as count
       FROM catalog WHERE content_type = ?
       GROUP BY group_title ORDER BY group_title`
    )
    .all(type) as CategoryCount[];
  return sortCategoriesAdultLast(rows);
}

export function getSeriesCategories(): CategoryCount[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT group_title as groupTitle, COUNT(DISTINCT series_name) as count
       FROM catalog WHERE content_type = 'series'
       GROUP BY group_title ORDER BY group_title`
    )
    .all() as CategoryCount[];
  return sortCategoriesAdultLast(rows);
}

export function listEntries(type: 'tv' | 'movie', params: ListParams = {}): CatalogEntry[] {
  const db = getDb();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 60;
  const offset = (page - 1) * pageSize;

  if (params.q) {
    const ftsQuery = buildFtsQuery(params.q);
    const rows = db
      .prepare(
        `SELECT c.* FROM catalog c
         JOIN catalog_fts f ON f.rowid = c.id
         WHERE c.content_type = ?
           AND (? IS NULL OR c.group_title = ?)
           AND catalog_fts MATCH ?
         ORDER BY c.name
         LIMIT ? OFFSET ?`
      )
      .all(type, params.group ?? null, params.group ?? null, ftsQuery, pageSize, offset) as CatalogRow[];
    return rows.map(rowToEntry);
  }

  const rows = db
    .prepare(
      `SELECT * FROM catalog
       WHERE content_type = ? AND (? IS NULL OR group_title = ?)
       ORDER BY name
       LIMIT ? OFFSET ?`
    )
    .all(type, params.group ?? null, params.group ?? null, pageSize, offset) as CatalogRow[];
  return rows.map(rowToEntry);
}

export function listSeriesShows(params: ListParams = {}): SeriesShow[] {
  const db = getDb();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 60;
  const offset = (page - 1) * pageSize;

  if (params.q) {
    const ftsQuery = buildFtsQuery(params.q);
    const rows = db
      .prepare(
        `SELECT series_name as seriesName, MIN(logo_url) as logoUrl, group_title as groupTitle, COUNT(*) as episodeCount
         FROM catalog
         WHERE content_type = 'series'
           AND (? IS NULL OR group_title = ?)
           AND series_name IN (
             SELECT DISTINCT c.series_name FROM catalog c
             JOIN catalog_fts f ON f.rowid = c.id
             WHERE catalog_fts MATCH ?
           )
         GROUP BY series_name
         ORDER BY series_name
         LIMIT ? OFFSET ?`
      )
      .all(params.group ?? null, params.group ?? null, ftsQuery, pageSize, offset);
    return rows as SeriesShow[];
  }

  const rows = db
    .prepare(
      `SELECT series_name as seriesName, MIN(logo_url) as logoUrl, group_title as groupTitle, COUNT(*) as episodeCount
       FROM catalog
       WHERE content_type = 'series' AND (? IS NULL OR group_title = ?)
       GROUP BY series_name
       ORDER BY series_name
       LIMIT ? OFFSET ?`
    )
    .all(params.group ?? null, params.group ?? null, pageSize, offset);
  return rows as SeriesShow[];
}

export function listSeriesEpisodes(seriesName: string): CatalogEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM catalog
       WHERE content_type = 'series' AND series_name = ?
       ORDER BY season, episode`
    )
    .all(seriesName) as CatalogRow[];
  return rows.map(rowToEntry);
}

export function getEntryById(id: number): CatalogEntry | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM catalog WHERE id = ?').get(id) as CatalogRow | undefined;
  return row ? rowToEntry(row) : null;
}

export function getCatalogStats(): Record<ContentType, number> {
  const db = getDb();
  const rows = db
    .prepare('SELECT content_type as contentType, COUNT(*) as count FROM catalog GROUP BY content_type')
    .all() as { contentType: ContentType; count: number }[];

  const stats: Record<ContentType, number> = { tv: 0, movie: 0, series: 0 };
  for (const row of rows) stats[row.contentType] = row.count;
  return stats;
}
