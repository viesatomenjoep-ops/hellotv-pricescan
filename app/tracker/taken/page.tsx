import { getTaken } from '@/lib/tracker/queries';
import { TakenClient } from './taken-client';

export const dynamic = 'force-dynamic';

export default async function TakenPage() {
  const { taken, verkopers } = await getTaken();
  return <TakenClient taken={taken} verkopers={verkopers} />;
}
