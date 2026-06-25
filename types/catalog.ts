export type ContentType = 'tv' | 'movie' | 'series';

export type Profile = 'kids' | 'adults';

/** How the client should play a stream: HLS (.m3u8), raw MPEG-TS, or a plain file (mp4/mkv). */
export type StreamKind = 'hls' | 'mpegts' | 'file';

export interface RawM3uEntry {
  tvgId: string;
  tvgName: string;
  tvgLogo: string;
  groupTitle: string;
  displayName: string;
  streamUrl: string;
}

export interface CatalogEntry {
  id: number;
  tvgId: string | null;
  name: string;
  seriesName: string | null;
  season: number | null;
  episode: number | null;
  logoUrl: string | null;
  groupTitle: string;
  contentType: ContentType;
  streamUrl: string;
}

export interface IngestResult {
  entryCount: number;
  contentTypeBreakdown: Record<ContentType, number>;
}

export type IngestSourceType = 'upload' | 'url';

export interface IngestLogEntry {
  id: number;
  sourceType: IngestSourceType;
  sourceRef: string | null;
  entryCount: number;
  startedAt: number;
  finishedAt: number | null;
  status: 'running' | 'success' | 'error';
  errorMessage: string | null;
}
