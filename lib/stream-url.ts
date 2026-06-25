import { signStreamToken } from './stream-token';
import type { StreamKind } from '@/types/catalog';

/**
 * Which stream kinds we route through our proxy. mpegts (live) and file (VOD) are
 * single continuous connections, so proxying hides the credential AND lets us count
 * the slot for the whole playback. HLS is still served direct for now: its manifest
 * lists per-segment provider URLs, so a useful proxy must rewrite the manifest —
 * that's a later phase. Until then HLS behaves exactly as before (no regression).
 */
export function shouldProxy(kind: StreamKind): boolean {
  return kind === 'mpegts' || kind === 'file';
}

/**
 * Returns the URL the client should play: a tokenized same-origin proxy URL for
 * proxied kinds, or the original provider URL for the rest. Absolute so it also
 * works when handed to a Chromecast (which has no session cookie — hence the token).
 */
export function buildPlayUrl(
  entryId: number,
  kind: StreamKind,
  rawUrl: string,
  userId: number,
  origin: string
): string {
  if (!shouldProxy(kind)) return rawUrl;
  const token = signStreamToken(entryId, userId);
  return `${origin}/api/stream/${entryId}?t=${encodeURIComponent(token)}`;
}
