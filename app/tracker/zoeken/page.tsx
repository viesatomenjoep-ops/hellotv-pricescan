import { getToestellenMetVoorraad } from '@/lib/tracker/queries';
import { ZoekenClient } from './zoeken-client';

export const dynamic = 'force-dynamic';

export default async function ZoekenPage() {
  const { toestellen } = await getToestellenMetVoorraad();
  return <ZoekenClient toestellen={toestellen} />;
}
