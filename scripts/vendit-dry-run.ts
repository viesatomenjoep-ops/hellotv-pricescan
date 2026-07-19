/**
 * C2-dry-run: haalt de eerste 25 artikelen op en toont de gemapte rijen, ZONDER de DB te raken.
 * Zonder VENDIT_API_BASE_URL valt 'ie terug op de MockVenditAdapter.
 *   pnpm vendit:dry-run
 */
import { configFromEnv, VenditRestAdapter } from '../lib/vendit/rest';
import { MockVenditAdapter } from '../lib/vendit/mock';
import type { VenditAdapter } from '../lib/vendit/types';

async function main() {
  const hasVendit = !!process.env.VENDIT_API_BASE_URL;
  const adapter: VenditAdapter = hasVendit
    ? new VenditRestAdapter(configFromEnv())
    : new MockVenditAdapter();

  console.log(
    hasVendit ? 'Bron: Vendit REST' : 'Bron: MockVenditAdapter (geen VENDIT_API_BASE_URL)',
  );
  console.log('---');

  let n = 0;
  for await (const row of adapter.fetchArticles()) {
    console.log(
      `${row.venditArticleId.padEnd(10)} ean=${(row.ean ?? '—').padEnd(14)} inkoop=${row.purchasePriceCents} verkoop=${row.salePriceCents} stock=${row.stock.reduce((a, s) => a + s.qty, 0)}`,
    );
    if (++n >= 25) break;
  }
  if (hasVendit && adapter instanceof VenditRestAdapter) {
    console.log('---');
    console.log(
      `ongeldige EANs: ${adapter.counters.eanInvalid}, dubbelzinnige prijzen: ${adapter.counters.priceAmbiguous}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
