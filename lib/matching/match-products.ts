import { createAdminClient } from '@/lib/supabase/admin';

// Matching-engine (D2): vult vendit_articles op basis van EAN / SKU-in-omschrijving / fuzzy.
// EAN + exacte SKU gaan direct live; fuzzy (0.6–0.8) gaat naar de review-wachtrij (D4).

export function normalizeModelNumber(s: string): string {
  return s
    .toUpperCase()
    .replace(/[\s\-.]/g, '')
    .replace(/\/\d+$/, '') // suffix als /12
    .replace(/(AEU| AEK|EU)$/, '');
}

export interface MatchReport {
  auto: number;
  review: number;
  unmatched: number;
}

export async function matchProducts(): Promise<MatchReport> {
  const db = createAdminClient();
  const [{ data: products }, { data: articles }] = await Promise.all([
    db.from('products').select('id, ean, sku_hellotv, model_number'),
    db.from('vendit_articles').select('id, vendit_ean, vendit_description').is('product_id', null),
  ]);

  const byEan = new Map<string, string>();
  const list = (products ?? []).map((p) => ({
    id: p.id,
    ean: p.ean,
    sku: (p.sku_hellotv ?? '').toUpperCase(),
    model: p.model_number,
    modelNorm: normalizeModelNumber(p.model_number),
  }));
  for (const p of list) if (p.ean) byEan.set(p.ean, p.id);

  const report: MatchReport = { auto: 0, review: 0, unmatched: 0 };

  for (const a of articles ?? []) {
    const desc = (a.vendit_description ?? '').toUpperCase();
    const descNorm = normalizeModelNumber(desc);

    // 1. Exacte EAN.
    if (a.vendit_ean && byEan.has(a.vendit_ean)) {
      await db
        .from('vendit_articles')
        .update({
          product_id: byEan.get(a.vendit_ean)!,
          match_method: 'ean',
          match_confidence: 1.0,
        })
        .eq('id', a.id);
      report.auto += 1;
      continue;
    }

    // 2. Exacte SKU of modelnummer in de omschrijving.
    const exact = list.find(
      (p) => (p.sku && desc.includes(p.sku)) || desc.includes(p.model.toUpperCase()),
    );
    if (exact) {
      await db
        .from('vendit_articles')
        .update({ product_id: exact.id, match_method: 'sku', match_confidence: 0.9 })
        .eq('id', a.id);
      report.auto += 1;
      continue;
    }

    // 3. Fuzzy op genormaliseerd modelnummer -> review-wachtrij (geen product_id).
    const fuzzy = list.find((p) => p.modelNorm.length >= 4 && descNorm.includes(p.modelNorm));
    if (fuzzy) {
      await db
        .from('vendit_articles')
        .update({ suggested_product_id: fuzzy.id, match_confidence: 0.7 })
        .eq('id', a.id);
      report.review += 1;
      continue;
    }

    report.unmatched += 1;
  }

  return report;
}
