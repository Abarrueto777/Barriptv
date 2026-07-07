import { getSession, type Profile } from './session';
import { getKidsCategories, getAdultCategories, getCategoryGroup } from './settings';
import { normalize } from './normalize';
import { getUserById } from './users';

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

export function getAdultsCategorySet(): Set<string> {
  return new Set(getAdultCategories());
}

/** Returns the allowed-category set when the adults profile is active, or null (no filtering) otherwise. */
export async function getAdultsFilter(): Promise<Set<string> | null> {
  const profile = await getActiveProfile();
  if (profile !== 'adults') return null;

  const session = await getSession();
  if (session.userId) {
    const user = getUserById(session.userId);
    if (user && user.category_group_id) {
      const group = getCategoryGroup(user.category_group_id);
      if (group && group.categories.length > 0) {
        return new Set(group.categories);
      }
    }
  }

  const adultsCats = getAdultsCategorySet();
  return adultsCats.size > 0 ? adultsCats : null;
}

/** Returns the active profile's category filter (kids or adults), or null if no filtering. */
export async function getActiveProfileFilter(): Promise<Set<string> | null> {
  const kidsFilter = await getKidsFilter();
  if (kidsFilter) return kidsFilter;
  return await getAdultsFilter();
}
