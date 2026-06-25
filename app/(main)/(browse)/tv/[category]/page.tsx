import { notFound } from 'next/navigation';
import CategoryBrowser from '@/components/CategoryBrowser';
import RememberCategory from '@/components/RememberCategory';
import { listEntries } from '@/lib/catalog-queries';
import { getKidsFilter } from '@/lib/profile';

export default async function TvCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const groupTitle = decodeURIComponent(category);

  const filter = await getKidsFilter();
  if (filter && !filter.has(groupTitle)) {
    notFound();
  }

  const entries = listEntries('tv', { group: groupTitle, pageSize: 2000 });

  if (entries.length === 0) {
    notFound();
  }

  return (
    <>
      <RememberCategory section="tv" category={groupTitle} />
      <CategoryBrowser
        title={groupTitle}
        unit="canales"
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
