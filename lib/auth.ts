import { getSession } from './session';
import { getUserById, userStatus, type User } from './users';

/**
 * Authoritative current-user check (hits the DB): returns the user only if it still
 * exists, isn't disabled and isn't expired. Used to enforce subscription state on
 * every navigation, catching mid-session revoke/extend/delete.
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session.userId) return null;

  const user = getUserById(session.userId);
  if (!user) return null;

  const { status } = userStatus(user);
  if (status !== 'active') return null;

  return user;
}

/**
 * In-route admin guard (defense in depth). The proxy already blocks /api/admin
 * for non-admins, but routes must not trust that alone: a single middleware
 * bypass (cf. CVE-2025-29927) would otherwise expose the whole admin surface.
 * Returns the admin user, or null if the caller is not an active admin.
 */
export async function requireAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}
