import { redirect } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { getActiveProfile } from '@/lib/profile';
import { getCurrentUser } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { userStatus } from '@/lib/users';

const EXPIRY_WARNING_DAYS = 7;

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // Authoritative subscription check on every navigation (catches revoke/extend/delete/expiry).
  const user = await getCurrentUser();
  if (!user) {
    const session = await getSession();
    session.destroy();
    redirect('/login?expired=1');
  }

  const profile = await getActiveProfile();
  const { daysLeft } = userStatus(user);
  const showExpiryWarning = user.role === 'user' && daysLeft !== null && daysLeft <= EXPIRY_WARNING_DAYS;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar profile={profile} isAdmin={user.role === 'admin'} />
      {showExpiryWarning && (
        <div className="shrink-0 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-200">
          Tu suscripción vence {daysLeft === 0 ? 'hoy' : daysLeft === 1 ? 'mañana' : `en ${daysLeft} días`}. Contactá al administrador para renovarla.
        </div>
      )}
      <main className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>{children}</main>
    </div>
  );
}
