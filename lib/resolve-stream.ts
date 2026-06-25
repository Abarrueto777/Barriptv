import type { StreamKind } from '@/types/catalog';

export interface ResolvedStream {
  kind: StreamKind;
  url: string;
}

/**
 * Live TV channels on this provider start from the same-looking URL but redirect
 * to different stream types: most are raw MPEG-TS (video/mp2t), but some redirect
 * to an HLS playlist (.m3u8) on a different host/CDN. We can only tell which by
 * following the redirect, so we probe it server-side to detect the TYPE.
 *
 * We always hand the CLIENT the ORIGINAL url (never the resolved one): some CDNs
 * (e.g. mdstrm) mint expiring, IP-bound tokens on the redirect, so the resolved
 * URL would be stale/invalid for the client. Letting the player follow the redirect
 * itself means the token is minted for the viewer's own request.
 */
export async function resolveLiveStream(originalUrl: string): Promise<ResolvedStream> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(originalUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timeout);

    const finalUrl = res.url || originalUrl;
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    // We only need the headers/final URL — don't download the live stream body.
    res.body?.cancel().catch(() => {});

    const isHls = contentType.includes('mpegurl') || finalUrl.includes('.m3u8');
    return { kind: isHls ? 'hls' : 'mpegts', url: originalUrl };
  } catch {
    // Network error / timeout / dead channel — best-effort default to mpegts.
    return { kind: 'mpegts', url: originalUrl };
  }
}
