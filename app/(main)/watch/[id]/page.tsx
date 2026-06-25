import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getEntryById, isAdultCategory, listEntries } from '@/lib/catalog-queries';
import { resolveLiveStream } from '@/lib/resolve-stream';
import { getKidsFilter, getActiveProfile } from '@/lib/profile';
import { getCurrentUser } from '@/lib/auth';
import { buildPlayUrl } from '@/lib/stream-url';
import WatchView, { type WatchSource } from '@/components/WatchView';
import type { StreamKind } from '@/types/catalog';

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getEntryById(Number(id));

  if (!entry) {
    notFound();
  }

  const filter = await getKidsFilter();
  if (filter && !filter.has(entry.groupTitle)) {
    redirect('/');
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const profile = (await getActiveProfile()) ?? 'adults';
  const isLive = entry.contentType === 'tv';

  let kind: StreamKind = 'file';
  let rawUrl = entry.streamUrl;
  if (isLive) {
    const resolved = await resolveLiveStream(entry.streamUrl);
    kind = resolved.kind;
    rawUrl = resolved.url;
  }

  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`;
  const url = buildPlayUrl(entry.id, kind, rawUrl, user.id, origin);

  const initial: WatchSource = {
    id: entry.id,
    name: entry.name,
    groupTitle: entry.groupTitle,
    contentType: entry.contentType,
    logoUrl: entry.logoUrl,
    kind,
    url,
    isAdult: isAdultCategory(entry.groupTitle),
  };

  // Channel list for in-place zapping (TV only).
  let channels: { id: number; name: string }[] = [];
  let initialIndex = 0;
  if (isLive) {
    const all = listEntries('tv', { group: entry.groupTitle, pageSize: 2000 });
    channels = all.map((c) => ({ id: c.id, name: c.name }));
    initialIndex = Math.max(0, channels.findIndex((c) => c.id === entry.id));
  }

  return <WatchView initial={initial} channels={channels} initialIndex={initialIndex} profile={profile} />;
}
