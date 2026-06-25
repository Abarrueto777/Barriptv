'use client';

import { useScrollRestoration } from '@/components/useScrollRestoration';

interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
}

/** Scrollable container that remembers its scroll position per route. */
export default function ScrollArea({ className, children }: ScrollAreaProps) {
  const ref = useScrollRestoration<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
