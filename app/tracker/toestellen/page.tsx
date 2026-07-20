import { getToestellenLijst } from '@/lib/tracker/queries';
import { ToestellenClient } from './toestellen-client';

export const dynamic = 'force-dynamic';

export default async function ToestellenPage() {
  const toestellen = await getToestellenLijst();
  return <ToestellenClient toestellen={toestellen} />;
}
