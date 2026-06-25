import { notFound } from 'next/navigation';
import CategoryBrowser from '@/components/CategoryBrowser';
import RememberCategory from '@/components/RememberCategory';
import { listEntries } from '@/lib/catalog-queries';
import { getKidsFilter } from '@/lib/profile';

export default async function MoviesCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const groupTitle = decodeURIComponent(category);

  const filter = await getKidsFilter();
  if (filter && !filter.has(groupTitle)) {
    notFound();
  }

  const entries = listEntries('movie', { group: groupTitle, pageSize: 2000 });

  if (entries.length === 0) {
    notFound();
  }

  return (
    <>
      <RememberCategory section="movie" category={groupTitle} />
      <CategoryBrowser
        title={groupTitle}
        unit="películas"
        items={entries.map((entry) => ({
          id: entry.id,
          href: `/watch/${entry.id}`,
          title: entry.name,
          imageUrl: entry.logoUrl,
        }))}
      />
    </>
  );
}
