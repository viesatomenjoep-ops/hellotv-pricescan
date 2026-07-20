import { getIntegraties } from '@/lib/tracker/queries';
import { getSessionUser } from '@/lib/auth';
import { KoppelingenClient } from './koppelingen-client';

export const dynamic = 'force-dynamic';

export default async function KoppelingenPage() {
  const [integraties, user] = await Promise.all([getIntegraties(), getSessionUser()]);
  return <KoppelingenClient integraties={integraties} isManager={user?.role === 'admin'} />;
}
