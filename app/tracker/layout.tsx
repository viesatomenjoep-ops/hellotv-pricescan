import { getFlags } from '@/lib/tracker/flags';
import { getSessionUser } from '@/lib/auth';
import { FlagsProvider } from '@/components/tracker/flags-provider';
import { TrackerShell } from '@/components/tracker/tracker-shell';

export const dynamic = 'force-dynamic';

export default async function TrackerLayout({ children }: { children: React.ReactNode }) {
  const [flags, user] = await Promise.all([getFlags(), getSessionUser()]);
  // Voorlopige rol-mapping: PriceScan-admin => manager, anders verkoper (verkoper-koppeling later).
  const rol = user?.role === 'admin' ? 'manager' : 'verkoper';
  const label = user?.fullName ?? user?.email ?? 'Verkoper';

  return (
    <FlagsProvider flags={flags} rol={rol}>
      <TrackerShell userLabel={label} filiaal="Amsterdam-Zuid">
        {children}
      </TrackerShell>
    </FlagsProvider>
  );
}
