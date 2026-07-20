import { getScanData } from '@/lib/tracker/scan-data';
import { ScanClient } from './scan-client';

export const dynamic = 'force-dynamic';

export default async function ScanPage({
  searchParams,
}: {
  searchParams: { toestel?: string };
}) {
  const data = await getScanData();
  const parsed = searchParams.toestel ? Number(searchParams.toestel) : null;
  const initieelToestelId = parsed != null && Number.isFinite(parsed) ? parsed : null;
  return <ScanClient data={data} initieelToestelId={initieelToestelId} />;
}
