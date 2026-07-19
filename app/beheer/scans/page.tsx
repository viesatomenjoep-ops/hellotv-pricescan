import { requireRole } from '@/lib/auth';
import { getScanEvents } from '@/lib/supabase/reports';
import { ScanLog } from './scan-log';

export const dynamic = 'force-dynamic';

export default async function ScansPage() {
  await requireRole(['admin']);
  const events = await getScanEvents(200);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Scan-log</h1>
      <ScanLog events={events} />
    </main>
  );
}
