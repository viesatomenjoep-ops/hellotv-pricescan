import type { VenditAdapter, VenditArticleRow } from './types';
import { SEED_EANS as PRODUCT_EANS } from '@/lib/catalog/eans';

// Deterministische test-adapter (C1). 30 artikelen:
//   * 24 gekoppeld aan de seed-product-EANs
//   * 2 zonder EAN (ongematcht)
//   * 4 met onbekende EAN (ongematcht)
// Bij de 2e (en latere) aanroep: 3 artikelen met een matige prijswijziging (+10%, binnen 40%)
// en 1 met een extreme wijziging (+65%, boven 40% -> quarantaine).

interface Base {
  venditArticleId: string;
  ean?: string;
  sku?: string;
  description: string;
  purchase: number;
  sale: number;
}

function buildBase(): Base[] {
  const rows: Base[] = PRODUCT_EANS.map((ean, i) => ({
    venditArticleId: `VND-${1000 + i}`,
    ean,
    sku: `HTV-${1000 + i}`,
    description: `TV artikel ${1000 + i}`,
    sale: 99900 + i * 5000,
    purchase: Math.round((99900 + i * 5000) * 0.75),
  }));
  // 2 zonder EAN
  rows.push({
    venditArticleId: 'VND-9001',
    description: 'Onbekende TV zonder EAN A',
    sale: 79900,
    purchase: 60000,
  });
  rows.push({
    venditArticleId: 'VND-9002',
    description: 'Onbekende TV zonder EAN B',
    sale: 89900,
    purchase: 67000,
  });
  // 4 met onbekende EAN
  for (let i = 0; i < 4; i++) {
    rows.push({
      venditArticleId: `VND-910${i + 1}`,
      ean: `999000000000${i + 1}`,
      description: `Onbekend artikel ${i + 1}`,
      sale: 59900 + i * 1000,
      purchase: 45000 + i * 800,
    });
  }
  return rows;
}

export class MockVenditAdapter implements VenditAdapter {
  private calls = 0;
  private readonly base = buildBase();

  async *fetchArticles(): AsyncIterable<VenditArticleRow> {
    this.calls += 1;
    const changed = this.calls >= 2;
    for (let i = 0; i < this.base.length; i++) {
      const b = this.base[i];
      let sale = b.sale;
      if (changed) {
        if (i < 3)
          sale = Math.round(b.sale * 1.1); // 3x matige stijging (binnen 40%)
        else if (i === 3) sale = Math.round(b.sale * 1.65); // 1x extreme stijging (>40%)
      }
      yield {
        venditArticleId: b.venditArticleId,
        ean: b.ean,
        sku: b.sku,
        description: b.description,
        purchasePriceCents: b.purchase,
        salePriceCents: sale,
        salePriceIncludesVat: true,
        stock: [
          { locationCode: 'WINKEL', locationName: 'Winkel Oosterhout', qty: (i * 2) % 6 },
          { locationCode: 'MAGAZIJN', locationName: 'Centraal magazijn', qty: (i * 3 + 1) % 9 },
        ],
        status: 'active',
        sourceTimestamp: '2026-07-19T12:00:00.000Z',
      };
    }
  }
}
