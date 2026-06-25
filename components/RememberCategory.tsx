'use client';

import { useEffect } from 'react';

interface RememberCategoryProps {
  section: 'tv' | 'movie' | 'series';
  category: string;
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export default function RememberCategory({ section, category }: RememberCategoryProps) {
  useEffect(() => {
    document.cookie = `last_category_${section}=${encodeURIComponent(category)}; path=/; max-age=${ONE_YEAR_SECONDS}`;
  }, [section, category]);

  return null;
}
