import { getScanData } from '@/lib/tracker/scan-data';
import { ScanClient } from './scan-client';

export const dynamic = 'force-dynamic';

export default async function ScanPage() {
  const data = await getScanData();
  return <ScanClient data={data} />;
}
