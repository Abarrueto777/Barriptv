import { getSession, type Profile } from './session';
import { getKidsCategories } from './settings';
import { normalize } from './normalize';

export type { Profile };

export async function getActiveProfile(): Promise<Profile | null> {
  const session = await getSession();
  return session.profile ?? null;
}

export async function getActiveUserId(): Promise<number | null> {
  const session = await getSession();
  return session.userId ?? null;
}

export function getKidsCategorySet(): Set<string> {
  return new Set(getKidsCategories());
}

/** Returns the allowed-category set when the kids profile is active, or null (no filtering) otherwise. */
export async function getKidsFilter(): Promise<Set<string> | null> {
  const profile = await getActiveProfile();
  if (profile !== 'kids') return null;
  return getKidsCategorySet();
}

/** Keyword defaults pre-checked in admin; the admin freely adjusts (these are only suggestions). */
const KID_KEYWORDS = /infantil|kids|nin|disney|animad|anime|caricatura|dibujo|cartoon|junior|familia|pixar|nick/;

export function suggestKidsCategories(allGroupTitles: string[]): string[] {
  return allGroupTitles.filter((g) => KID_KEYWORDS.test(normalize(g)));
}
