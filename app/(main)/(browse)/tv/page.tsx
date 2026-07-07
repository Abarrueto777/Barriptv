import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCategories, resolveDefaultCategory } from '@/lib/catalog-queries';
import { getActiveProfileFilter } from '@/lib/profile';

export default async function TvPage() {
  const filter = await getActiveProfileFilter();
  const categories = getCategories('tv').filter((c) => !filter || filter.has(c.groupTitle));

  if (categories.length === 0) {
    return (
      <p className="px-8 py-8 text-zinc-400">
        No hay canales disponibles en este perfil.
      </p>
    );
  }

  const cookieStore = await cookies();
  const remembered = cookieStore.get('last_category_tv')?.value;
  const target = resolveDefaultCategory(categories, remembered ? decodeURIComponent(remembered) : null);

  redirect(`/tv/${encodeURIComponent(target)}`);
}
