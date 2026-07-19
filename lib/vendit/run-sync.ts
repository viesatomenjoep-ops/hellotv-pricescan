import { createAdminClient } from '@/lib/supabase/admin';
import { venditArticleRowSchema } from '@/lib/schemas';
import type { VenditAdapter } from './types';

// Sync-engine (C3). Draait met de service-role client (omzeilt RLS). Vergelijkt inkoop/verkoop
// per veld, voert wijzigingen <= drempel door (+ history), parkeert > drempel in quarantaine.

const DEFAULT_QUARANTINE_DELTA_PCT = 40;
const DEFAULT_MARGIN_ALERT_PCT = 10;
const UNMATCHED_BUFFER_MAX = 500;

export interface SyncSummary {
  runId: string;
  itemsSeen: number;
  pricesChanged: number;
  stockChanged: number;
  quarantined: number;
  unmatched: number;
  unmatchedSample: string[];
  marginAlerts: Array<{ productId: string; marginPct: number }>;
}

type Db = ReturnType<typeof createAdminClient>;

async function readSetting(db: Db, key: string, fallback: number): Promise<number> {
  const { data } = await db.from('settings').select('value').eq('key', key).maybeSingle();
  const v = data?.value;
  return typeof v === 'number' ? v : fallback;
}

/** Zoek het product_id voor een Vendit-artikel via de koppeltabel, anders via EAN. */
async function resolveProductId(
  db: Db,
  venditArticleId: string,
  ean: string | undefined,
): Promise<string | null> {
  const { data: link } = await db
    .from('vendit_articles')
    .select('product_id')
    .eq('vendit_article_id', venditArticleId)
    .maybeSingle();
  if (link?.product_id) return link.product_id;

  if (ean) {
    const { data: prod } = await db.from('products').select('id').eq('ean', ean).maybeSingle();
    if (prod?.id) {
      // Leg de koppeling vast (match via EAN) zodat volgende syncs sneller matchen.
      await db.from('vendit_articles').upsert(
        {
          vendit_article_id: venditArticleId,
          product_id: prod.id,
          vendit_ean: ean,
          match_method: 'ean',
          match_confidence: 1.0,
        },
        { onConflict: 'vendit_article_id' },
      );
      return prod.id;
    }
  }
  return null;
}

export async function runSync(adapter: VenditAdapter, since?: Date): Promise<SyncSummary> {
  const db = createAdminClient();
  const quarantineDelta = await readSetting(
    db,
    'quarantine_delta_pct',
    DEFAULT_QUARANTINE_DELTA_PCT,
  );
  const marginAlertPct = await readSetting(
    db,
    'margin_alert_threshold_pct',
    DEFAULT_MARGIN_ALERT_PCT,
  );

  const { data: run, error: runErr } = await db
    .from('sync_runs')
    .insert({ status: 'running' })
    .select('id')
    .single();
  if (runErr || !run) throw new Error(runErr?.message ?? 'Kon sync_run niet starten');
  const runId = run.id;

  const summary: SyncSummary = {
    runId,
    itemsSeen: 0,
    pricesChanged: 0,
    stockChanged: 0,
    quarantined: 0,
    unmatched: 0,
    unmatchedSample: [],
    marginAlerts: [],
  };

  try {
    for await (const raw of adapter.fetchArticles(since)) {
      const article = venditArticleRowSchema.parse(raw);
      summary.itemsSeen += 1;

      const productId = await resolveProductId(db, article.venditArticleId, article.ean);
      if (!productId) {
        summary.unmatched += 1;
        if (summary.unmatchedSample.length < UNMATCHED_BUFFER_MAX) {
          summary.unmatchedSample.push(article.venditArticleId);
        }
        continue;
      }

      await applyPrices(db, runId, productId, article, quarantineDelta, summary, marginAlertPct);
      await applyStock(db, productId, article, summary);
    }

    await db
      .from('sync_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        items_seen: summary.itemsSeen,
        prices_changed: summary.pricesChanged,
        stock_changed: summary.stockChanged,
        quarantined: summary.quarantined,
        unmatched: summary.unmatched,
      })
      .eq('id', runId);
    return summary;
  } catch (e) {
    await db
      .from('sync_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_text: e instanceof Error ? e.message : String(e),
      })
      .eq('id', runId);
    throw e;
  }
}

async function applyPrices(
  db: Db,
  runId: string,
  productId: string,
  article: {
    purchasePriceCents: number | null;
    salePriceCents: number | null;
    salePriceIncludesVat: boolean;
  },
  quarantineDelta: number,
  summary: SyncSummary,
  marginAlertPct: number,
): Promise<void> {
  const { data: existing } = await db
    .from('prices')
    .select('purchase_price_cents, sale_price_cents')
    .eq('product_id', productId)
    .maybeSingle();

  // Eerste prijs ooit: insert, geen delta/history/quarantaine.
  if (!existing) {
    await db.from('prices').insert({
      product_id: productId,
      purchase_price_cents: article.purchasePriceCents,
      sale_price_cents: article.salePriceCents,
      sale_price_includes_vat: article.salePriceIncludesVat,
      valid_from: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    });
    return;
  }

  const fields: Array<{
    field: 'purchase' | 'sale';
    col: 'purchase_price_cents' | 'sale_price_cents';
    next: number | null;
  }> = [
    { field: 'purchase', col: 'purchase_price_cents', next: article.purchasePriceCents },
    { field: 'sale', col: 'sale_price_cents', next: article.salePriceCents },
  ];

  const update: {
    last_synced_at: string;
    purchase_price_cents?: number;
    sale_price_cents?: number;
  } = { last_synced_at: new Date().toISOString() };
  let touched = false;

  for (const f of fields) {
    if (f.next == null) continue;
    const old = existing[f.col] as number | null;
    if (old == null) {
      update[f.col] = f.next; // eerste waarde voor dit veld
      touched = true;
      continue;
    }
    if (old === f.next) continue;
    const deltaPct = (Math.abs(f.next - old) / old) * 100;
    if (deltaPct <= quarantineDelta) {
      update[f.col] = f.next;
      touched = true;
      await db.from('price_history').insert({
        product_id: productId,
        field: f.field,
        old_cents: old,
        new_cents: f.next,
        sync_run_id: runId,
      });
      summary.pricesChanged += 1;
    } else {
      const { error } = await db.from('price_quarantine').insert({
        product_id: productId,
        field: f.field,
        current_cents: old,
        proposed_cents: f.next,
        delta_pct: Math.round(deltaPct * 100) / 100,
        sync_run_id: runId,
        status: 'pending',
      });
      // Al een openstaand item voor (product, field)? -> negeren (unieke partial index).
      if (error && error.code !== '23505') throw new Error(error.message);
      if (!error) summary.quarantined += 1;
    }
  }

  await db.from('prices').update(update).eq('product_id', productId);

  // Marge-bewaking na doorgevoerde wijzigingen.
  if (touched) {
    const { data: after } = await db
      .from('prices')
      .select('margin_pct')
      .eq('product_id', productId)
      .maybeSingle();
    if (after?.margin_pct != null && Number(after.margin_pct) < marginAlertPct) {
      summary.marginAlerts.push({ productId, marginPct: Number(after.margin_pct) });
    }
  }
}

async function applyStock(
  db: Db,
  productId: string,
  article: { stock: Array<{ locationCode: string; locationName?: string; qty: number }> },
  summary: SyncSummary,
): Promise<void> {
  const { data: current } = await db
    .from('stock_levels')
    .select('location_code, qty')
    .eq('product_id', productId);
  const currentMap = new Map((current ?? []).map((s) => [s.location_code, s.qty]));

  for (const s of article.stock) {
    if (currentMap.get(s.locationCode) !== s.qty) summary.stockChanged += 1;
    await db.from('stock_levels').upsert(
      {
        product_id: productId,
        location_code: s.locationCode,
        location_name: s.locationName ?? null,
        qty: s.qty,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'product_id,location_code' },
    );
  }
}
