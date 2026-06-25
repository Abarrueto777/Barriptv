export interface VodInfo {
  plot: string | null;
  cast: string | null;
  director: string | null;
  genre: string | null;
  year: string | null;
  duration: string | null;
  cover: string | null;
  rating: string | null;
  country: string | null;
}

/** The stream URL embeds host + credentials + vod id, so we derive the Xtream API call from it. */
function parseMovieUrl(streamUrl: string) {
  const m = streamUrl.match(/^(https?:\/\/[^/]+)\/movie\/([^/]+)\/([^/]+)\/(\d+)\b/);
  if (!m) return null;
  return { base: m[1], user: m[2], pass: m[3], vodId: m[4] };
}

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

export async function getVodInfo(streamUrl: string): Promise<VodInfo | null> {
  const parsed = parseMovieUrl(streamUrl);
  if (!parsed) return null;

  const api = `${parsed.base}/player_api.php?username=${encodeURIComponent(parsed.user)}&password=${encodeURIComponent(parsed.pass)}&action=get_vod_info&vod_id=${parsed.vodId}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(api, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    const info = data?.info;
    if (!info || typeof info !== 'object') return null;

    const releaseDate = str(info.releasedate);
    return {
      plot: str(info.plot) ?? str(info.description),
      cast: str(info.cast) ?? str(info.actors),
      director: str(info.director),
      genre: str(info.genre),
      year: releaseDate ? releaseDate.slice(0, 4) : null,
      duration: str(info.duration),
      cover: str(info.cover_big) ?? str(info.movie_image),
      rating: str(info.rating),
      country: str(info.country),
    };
  } catch {
    return null;
  }
}
