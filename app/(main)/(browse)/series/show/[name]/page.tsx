import Link from 'next/link';
import { listSeriesEpisodes } from '@/lib/catalog-queries';
import { notFound } from 'next/navigation';
import BackButton from '@/components/BackButton';
import ScrollArea from '@/components/ScrollArea';
import { getKidsFilter } from '@/lib/profile';

export default async function SeriesShowPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const seriesName = decodeURIComponent(name);
  const episodes = listSeriesEpisodes(seriesName);

  if (episodes.length === 0) {
    notFound();
  }

  const filter = await getKidsFilter();
  if (filter && !filter.has(episodes[0].groupTitle)) {
    notFound();
  }

  const bySeason = new Map<number, typeof episodes>();
  for (const episode of episodes) {
    const season = episode.season ?? 0;
    if (!bySeason.has(season)) bySeason.set(season, []);
    bySeason.get(season)!.push(episode);
  }

  return (
    <ScrollArea className="animate-fade-in-up h-full overflow-y-auto px-4 pt-16 pb-8 sm:px-8 md:pt-8">
      <BackButton />
      <h1 className="mb-6 border-b border-white/10 pb-4 text-2xl font-bold tracking-tight text-white">
        {seriesName}
      </h1>
      {Array.from(bySeason.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([season, eps]) => (
          <section key={season} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-zinc-200">Temporada {season}</h2>
            <div className="flex flex-col gap-2">
              {eps.map((episode) => (
                <Link
                  key={episode.id}
                  href={`/watch/${episode.id}`}
                  className="glass glass-hover group flex items-center gap-4 rounded-xl p-3 transition"
                >
                  {episode.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={episode.logoUrl} alt="" className="h-14 w-24 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-24 rounded-lg bg-white/5" />
                  )}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-cyan-300">
                    {episode.episode?.toString().padStart(2, '0')}
                  </span>
                  <span className="text-sm text-zinc-200 group-hover:text-white">{episode.name}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
    </ScrollArea>
  );
}
