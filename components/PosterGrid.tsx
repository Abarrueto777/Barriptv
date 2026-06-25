import PosterCard from './PosterCard';

interface GridItem {
  id: string | number;
  href: string;
  title: string;
  imageUrl: string | null;
  subtitle?: string;
}

interface PosterGridProps {
  items: GridItem[];
  emptyMessage?: string;
}

export default function PosterGrid({ items, emptyMessage }: PosterGridProps) {
  if (items.length === 0 && emptyMessage) {
    return <p className="text-zinc-400">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {items.map((item) => (
        <PosterCard
          key={item.id}
          href={item.href}
          title={item.title}
          imageUrl={item.imageUrl}
          subtitle={item.subtitle}
        />
      ))}
    </div>
  );
}
