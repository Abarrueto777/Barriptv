import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSeriesCategories, resolveDefaultCategory } from '@/lib/catalog-queries';
import { getKidsFilter } from '@/lib/profile';

export default async function SeriesPage() {
  const filter = await getKidsFilter();
  const categories = getSeriesCategories().filter((c) => !filter || filter.has(c.groupTitle));

  if (categories.length === 0) {
    return (
      <p className="px-8 py-8 text-zinc-400">
        No hay series disponibles en este perfil.
      </p>
    );
  }

  const cookieStore = await cookies();
  const remembered = cookieStore.get('last_category_series')?.value;
  const target = resolveDefaultCategory(categories, remembered ? decodeURIComponent(remembered) : null);

  redirect(`/series/${encodeURIComponent(target)}`);
}
