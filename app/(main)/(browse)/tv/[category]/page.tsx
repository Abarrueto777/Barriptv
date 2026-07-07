import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import CategoryBrowser from '@/components/CategoryBrowser';
import RememberCategory from '@/components/RememberCategory';
import { listEntries } from '@/lib/catalog-queries';
import { getActiveProfileFilter } from '@/lib/profile';
import { buildImageUrl } from '@/lib/image-url';

export default async function TvCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const groupTitle = decodeURIComponent(category);

  const filter = await getActiveProfileFilter();
  if (filter && !filter.has(groupTitle)) {
    notFound();
  }

  const entries = listEntries('tv', { group: groupTitle, pageSize: 2000 });

  if (entries.length === 0) {
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

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
          imageUrl: buildImageUrl(entry.logoUrl, origin),
        }))}
      />
    </>
  );
}
