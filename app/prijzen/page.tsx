import { requireRole } from '@/lib/auth';
import { getRecentPriceChanges, getMarginWatchlist } from '@/lib/supabase/reports';
import { PricesView } from './prices-view';

export const dynamic = 'force-dynamic';

export default async function PricesPage() {
  await requireRole(['sales', 'admin']);
  const [changes, watchlist] = await Promise.all([getRecentPriceChanges(), getMarginWatchlist()]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Prijzen &amp; marges</h1>
      <PricesView changes={changes} watchlist={watchlist} />
    </main>
  );
}
