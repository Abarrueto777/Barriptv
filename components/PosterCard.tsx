import Link from 'next/link';

interface PosterCardProps {
  href: string;
  title: string;
  imageUrl: string | null;
  subtitle?: string;
  /** 0–1 watch progress; renders a bar at the bottom of the poster when set. */
  progress?: number;
}

export default function PosterCard({ href, title, imageUrl, subtitle, progress }: PosterCardProps) {
  return (
    <Link
      href={href}
      className="group flex w-40 shrink-0 flex-col gap-2 transition-transform duration-200 hover:-translate-y-1 sm:w-48"
    >
      <div className="relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 transition duration-200 group-hover:border-cyan-400/40 group-hover:shadow-[0_8px_30px_-6px_rgba(34,211,238,0.35)]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="px-2 text-center text-xs text-zinc-500">{title}</span>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition duration-200 group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5 text-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>

        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
              style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
            />
          </div>
        )}
      </div>
      <div>
        <p className="truncate text-sm font-medium text-zinc-200 transition group-hover:text-white">{title}</p>
        {subtitle && <p className="truncate text-xs text-zinc-500">{subtitle}</p>}
      </div>
    </Link>
  );
}
