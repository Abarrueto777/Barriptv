import Sidebar from '@/components/Sidebar';
import { getCategories, getSeriesCategories, type CategoryCount } from '@/lib/catalog-queries';
import { getKidsFilter } from '@/lib/profile';

export default async function BrowseLayout({ children }: { children: React.ReactNode }) {
  const filter = await getKidsFilter();
  const apply = (cats: CategoryCount[]) =>
    filter ? cats.filter((c) => filter.has(c.groupTitle)) : cats;

  const tvCategories = apply(getCategories('tv'));
  const movieCategories = apply(getCategories('movie'));
  const seriesCategories = apply(getSeriesCategories());

  return (
    <div className="flex h-full min-h-0">
      <Sidebar
        tvCategories={tvCategories}
        movieCategories={movieCategories}
        seriesCategories={seriesCategories}
      />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
