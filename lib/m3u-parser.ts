import type { RawM3uEntry } from '@/types/catalog';

const ATTR_RE = /([\w-]+)="([^"]*)"/g;

function parseExtinfLine(line: string): Omit<RawM3uEntry, 'streamUrl'> {
  const attrs: Record<string, string> = {};
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(line)) !== null) {
    attrs[match[1]] = match[2];
    lastIndex = match.index + match[0].length;
  }

  const rest = line.slice(lastIndex);
  const commaIdx = rest.indexOf(',');
  const displayName = commaIdx >= 0 ? rest.slice(commaIdx + 1).trim() : '';

  return {
    tvgId: attrs['tvg-id'] ?? '',
    tvgName: attrs['tvg-name'] ?? '',
    tvgLogo: attrs['tvg-logo'] ?? '',
    groupTitle: (attrs['group-title'] ?? '').trim(),
    displayName: displayName || attrs['tvg-name'] || '',
  };
}

export function parseM3u(text: string): RawM3uEntry[] {
  const lines = text.split(/\r?\n/);
  const entries: RawM3uEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF')) continue;

    let j = i + 1;
    while (j < lines.length && (lines[j].trim() === '' || lines[j].trim().startsWith('#'))) {
      j++;
    }
    if (j >= lines.length) break;

    const streamUrl = lines[j].trim();
    if (!streamUrl) {
      i = j;
      continue;
    }

    entries.push({ ...parseExtinfLine(line), streamUrl });
    i = j;
  }

  return entries;
}
