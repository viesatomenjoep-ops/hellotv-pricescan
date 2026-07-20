import { getVerkopen } from '@/lib/tracker/queries';
import { VerkopenClient } from './verkopen-client';

export const dynamic = 'force-dynamic';

export default async function VerkopenPage() {
  const verkopen = await getVerkopen();
  return <VerkopenClient verkopen={verkopen} />;
}
