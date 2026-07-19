import { requireRole } from '@/lib/auth';
import { KoppelWizard } from './koppel-wizard';

export const dynamic = 'force-dynamic';

export default async function KoppelenPage({ searchParams }: { searchParams: { epc?: string } }) {
  await requireRole(['warehouse', 'admin']);
  return <KoppelWizard initialEpc={searchParams.epc ?? null} />;
}
