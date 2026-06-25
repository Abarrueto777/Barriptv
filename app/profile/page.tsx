import ProfileGate from '@/components/ProfileGate';
import { getAdultPin } from '@/lib/settings';

export default function ProfilePage() {
  const pinRequired = getAdultPin() !== null;
  return <ProfileGate pinRequired={pinRequired} />;
}
