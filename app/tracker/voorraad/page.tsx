import { getToestellenMetVoorraad } from '@/lib/tracker/queries';
import { VoorraadClient } from './voorraad-client';

export const dynamic = 'force-dynamic';

export default async function VoorraadPage() {
  const { toestellen, filialen } = await getToestellenMetVoorraad();
  return <VoorraadClient toestellen={toestellen} filialen={filialen} />;
}
