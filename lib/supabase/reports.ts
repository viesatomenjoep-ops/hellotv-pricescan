import 'server-only';
import { createClient } from './server';

// Leeslaag voor dashboard, prijzen, quarantaine, scans en instellingen (blok F, C5, E4).
// RLS bepaalt zichtbaarheid per rol; deze functies draaien met de sessie van de gebruiker.

export interface DashboardData {
  lastSync: {
    status: string;
    finishedAt: string | null;
    pricesChanged: number;
    quarantined: number;
  } | null;
  stale: boolean;
  scansToday: number;
  pendingQuarantine: number;
  pendingMatches: number;
  underMargin: number;
  withoutPrice: number;
  withoutTag: number;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    { data: sync },
    { count: scansToday },
    { count: pendingQuarantine },
    { count: pendingMatches },
    { count: underMargin },
    { data: products },
    { data: prices },
    { data: tags },
  ] = await Promise.all([
    supabase
      .from('sync_runs')
      .select('status, finished_at, prices_changed, quarantined')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('scan_events')
      .select('id', { count: 'exact', head: true })
      .gte('scanned_at', startOfDay.toISOString()),
    supabase
      .from('price_quarantine')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('vendit_articles')
      .select('id', { count: 'exact', head: true })
      .gte('match_confidence', 0.6)
      .lt('match_confidence', 0.9),
    supabase.from('v_margin_watchlist').select('product_id', { count: 'exact', head: true }),
    supabase.from('products').select('id'),
    supabase.from('prices').select('product_id'),
    supabase.from('rfid_tags').select('product_id').eq('status', 'active'),
  ]);

  const priceSet = new Set((prices ?? []).map((p) => p.product_id));
  const tagSet = new Set((tags ?? []).map((t) => t.product_id));
  const withoutPrice = (products ?? []).filter((p) => !priceSet.has(p.id)).length;
  const withoutTag = (products ?? []).filter((p) => !tagSet.has(p.id)).length;

  const finishedAt = sync?.finished_at ?? null;
  const ageHours = finishedAt
    ? (Date.now() - new Date(finishedAt).getTime()) / 3_600_000
    : Infinity;
  const stale = !sync || sync.status !== 'success' || ageHours > 4;

  return {
    lastSync: sync
      ? {
          status: sync.status,
          finishedAt,
          pricesChanged: sync.prices_changed,
          quarantined: sync.quarantined,
        }
      : null,
    stale,
    scansToday: scansToday ?? 0,
    pendingQuarantine: pendingQuarantine ?? 0,
    pendingMatches: pendingMatches ?? 0,
    underMargin: underMargin ?? 0,
    withoutPrice,
    withoutTag,
  };
}

export interface PriceChange {
  id: string;
  model_name: string;
  field: 'purchase' | 'sale';
  old_cents: number | null;
  new_cents: number | null;
  delta_cents: number | null;
  delta_pct: number | null;
  current_margin_pct: number | null;
  changed_at: string;
}

export async function getRecentPriceChanges(limit = 100): Promise<PriceChange[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('v_price_changes_recent')
    .select(
      'id, model_name, field, old_cents, new_cents, delta_cents, delta_pct, current_margin_pct, changed_at',
    )
    .order('changed_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as PriceChange[];
}

export interface MarginWatchItem {
  product_id: string;
  brand_name: string;
  model_name: string;
  model_number: string;
  margin_pct: number | null;
  margin_cents: number | null;
  sale_price_cents: number | null;
}

export async function getMarginWatchlist(): Promise<MarginWatchItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('v_margin_watchlist')
    .select(
      'product_id, brand_name, model_name, model_number, margin_pct, margin_cents, sale_price_cents',
    )
    .order('margin_pct', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MarginWatchItem[];
}

export interface QuarantineItem {
  id: string;
  field: 'purchase' | 'sale';
  current_cents: number | null;
  proposed_cents: number | null;
  delta_pct: number | null;
  created_at: string;
  products: { model_name: string; brands: { name: string } | null } | null;
}

export async function getPendingQuarantine(): Promise<QuarantineItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('price_quarantine')
    .select(
      'id, field, current_cents, proposed_cents, delta_pct, created_at, products(model_name, brands(name))',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as QuarantineItem[];
}

export interface ScanEventRow {
  id: string;
  epc: string | null;
  ean: string | null;
  input_type: 'rfid' | 'ean';
  result: 'hit' | 'unknown_tag' | 'unlinked';
  scanned_at: string;
  products: { model_name: string } | null;
}

export async function getScanEvents(limit = 200): Promise<ScanEventRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scan_events')
    .select('id, epc, ean, input_type, result, scanned_at, products(model_name)')
    .order('scanned_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ScanEventRow[];
}

export async function getMarginByBrand(): Promise<Array<{ brand: string; avgMarginPct: number }>> {
  const supabase = createClient();
  const { data, error } = await supabase.from('v_product_full').select('brand_name, margin_pct');
  if (error) throw new Error(error.message);
  const acc = new Map<string, { sum: number; n: number }>();
  for (const r of data ?? []) {
    if (r.margin_pct == null || !r.brand_name) continue;
    const cur = acc.get(r.brand_name) ?? { sum: 0, n: 0 };
    cur.sum += Number(r.margin_pct);
    cur.n += 1;
    acc.set(r.brand_name, cur);
  }
  return Array.from(acc.entries())
    .map(([brand, { sum, n }]) => ({ brand, avgMarginPct: Math.round((sum / n) * 10) / 10 }))
    .sort((a, b) => b.avgMarginPct - a.avgMarginPct);
}

export interface SettingRow {
  key: string;
  value: unknown;
}

export async function getSettings(): Promise<SettingRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('settings').select('key, value').order('key');
  if (error) throw new Error(error.message);
  return (data ?? []) as SettingRow[];
}
