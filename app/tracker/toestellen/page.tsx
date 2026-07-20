import { getToestellenMetVoorraad } from '@/lib/tracker/queries';
import { ToestellenClient } from './toestellen-client';

export const dynamic = 'force-dynamic';

export default async function ToestellenPage() {
  const { toestellen } = await getToestellenMetVoorraad();
  return <ToestellenClient toestellen={toestellen} />;
}
