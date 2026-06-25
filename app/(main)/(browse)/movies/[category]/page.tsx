import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import CategoryBrowser from '@/components/CategoryBrowser';
import RememberCategory from '@/components/RememberCategory';
import { listEntries } from '@/lib/catalog-queries';
import { getKidsFilter } from '@/lib/profile';
import { buildImageUrl } from '@/lib/image-url';

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

  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

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
          imageUrl: buildImageUrl(entry.logoUrl, origin),
        }))}
      />
    </>
  );
}
