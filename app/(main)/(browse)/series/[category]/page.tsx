import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import CategoryBrowser from '@/components/CategoryBrowser';
import RememberCategory from '@/components/RememberCategory';
import { listSeriesShows } from '@/lib/catalog-queries';
import { getActiveProfileFilter } from '@/lib/profile';
import { buildImageUrl } from '@/lib/image-url';

export default async function SeriesCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const groupTitle = decodeURIComponent(category);

  const filter = await getActiveProfileFilter();
  if (filter && !filter.has(groupTitle)) {
    notFound();
  }

  const shows = listSeriesShows({ group: groupTitle, pageSize: 2000 });

  if (shows.length === 0) {
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  return (
    <>
      <RememberCategory section="series" category={groupTitle} />
      <CategoryBrowser
        title={groupTitle}
        unit="series"
        items={shows.map((show) => ({
          id: show.seriesName,
          href: `/series/show/${encodeURIComponent(show.seriesName)}`,
          title: show.seriesName,
          imageUrl: buildImageUrl(show.logoUrl, origin),
          subtitle: `${show.episodeCount} episodios`,
        }))}
      />
    </>
  );
}
