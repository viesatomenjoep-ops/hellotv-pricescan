import { getToestellenLijst } from '@/lib/tracker/queries';
import { ZoekenClient } from './zoeken-client';

export const dynamic = 'force-dynamic';

export default async function ZoekenPage() {
  const toestellen = await getToestellenLijst();
  return <ZoekenClient toestellen={toestellen} />;
}
