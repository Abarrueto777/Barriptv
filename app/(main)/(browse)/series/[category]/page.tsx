import { notFound } from 'next/navigation';
import CategoryBrowser from '@/components/CategoryBrowser';
import RememberCategory from '@/components/RememberCategory';
import { listSeriesShows } from '@/lib/catalog-queries';
import { getKidsFilter } from '@/lib/profile';

export default async function SeriesCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const groupTitle = decodeURIComponent(category);

  const filter = await getKidsFilter();
  if (filter && !filter.has(groupTitle)) {
    notFound();
  }

  const shows = listSeriesShows({ group: groupTitle, pageSize: 2000 });

  if (shows.length === 0) {
    notFound();
  }

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
          imageUrl: show.logoUrl,
          subtitle: `${show.episodeCount} episodios`,
        }))}
      />
    </>
  );
}
