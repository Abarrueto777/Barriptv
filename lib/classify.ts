import type { ContentType, RawM3uEntry } from '@/types/catalog';

const SEASON_EPISODE_RE = /\s*S(\d{1,2})\s*E(\d{1,3})\b/i;

export interface ClassifiedFields {
  contentType: ContentType;
  seriesName: string | null;
  season: number | null;
  episode: number | null;
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function pathOf(streamUrl: string): string {
  try {
    return new URL(streamUrl).pathname;
  } catch {
    return streamUrl;
  }
}

function classifyByGroupTitle(groupTitle: string): ContentType {
  const normalized = stripAccents(groupTitle.toLowerCase());
  if (/serie/.test(normalized)) return 'series';
  if (/pelicul|movie|vod|film/.test(normalized)) return 'movie';
  return 'tv';
}

export function classify(entry: RawM3uEntry): ClassifiedFields {
  const path = pathOf(entry.streamUrl);

  let contentType: ContentType;
  if (/\/series\//i.test(path)) {
    contentType = 'series';
  } else if (/\/movie\//i.test(path)) {
    contentType = 'movie';
  } else {
    contentType = classifyByGroupTitle(entry.groupTitle);
  }

  let seriesName: string | null = null;
  let season: number | null = null;
  let episode: number | null = null;

  if (contentType === 'series') {
    const name = entry.displayName || entry.tvgName;
    const match = name.match(SEASON_EPISODE_RE);
    if (match) {
      season = parseInt(match[1], 10);
      episode = parseInt(match[2], 10);
      seriesName = name.slice(0, match.index).trim();
    } else {
      seriesName = name.trim();
    }
  }

  return { contentType, seriesName, season, episode };
}
