import 'server-only';
import { createClient } from './server';

// Catalogus-leeslaag (D3). Combineert v_product_full met tag-aantallen en matchstatus.

export interface CatalogRow {
  id: string;
  brand_name: string | null;
  model_name: string | null;
  model_number: string | null;
  model_year: number | null;
  screen_size_inch: number | null;
  panel_type: string | null;
  segment: string | null;
  ean: string | null;
  status: string | null;
  successor_id: string | null;
  purchase_price_cents: number | null;
  sale_price_cents: number | null;
  margin_cents: number | null;
  margin_pct: number | null;
  last_synced_at: string | null;
  is_stale: boolean | null;
  total_stock: number | null;
  tag_count: number;
  matched: boolean;
}

export async function getCatalog(): Promise<CatalogRow[]> {
  const supabase = createClient();
  const [{ data: products, error }, { data: tags }, { data: articles }] = await Promise.all([
    supabase
      .from('v_product_full')
      .select(
        'id, brand_name, model_name, model_number, model_year, screen_size_inch, panel_type, segment, ean, status, successor_id, purchase_price_cents, sale_price_cents, margin_cents, margin_pct, last_synced_at, is_stale, total_stock',
      )
      .order('brand_name'),
    supabase.from('rfid_tags').select('product_id').eq('status', 'active'),
    supabase.from('vendit_articles').select('product_id').not('product_id', 'is', null),
  ]);
  if (error) throw new Error(error.message);

  const tagCounts = new Map<string, number>();
  for (const t of tags ?? []) {
    if (t.product_id) tagCounts.set(t.product_id, (tagCounts.get(t.product_id) ?? 0) + 1);
  }
  const matched = new Set((articles ?? []).map((a) => a.product_id));

  return (products ?? []).map((p) => ({
    ...p,
    total_stock: p.total_stock ?? 0,
    tag_count: p.id ? (tagCounts.get(p.id) ?? 0) : 0,
    matched: p.id ? matched.has(p.id) : false,
  })) as CatalogRow[];
}

export interface ProductDetail {
  product: CatalogRow;
  stockByLocation: Array<{ location_code: string; location_name: string | null; qty: number }>;
  tags: Array<{ epc: string; status: string }>;
  history: Array<{
    field: string;
    old_cents: number | null;
    new_cents: number | null;
    changed_at: string;
  }>;
}

export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  const supabase = createClient();
  const { data: full } = await supabase
    .from('v_product_full')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!full) return null;

  const [{ data: stock }, { data: tags }, { data: history }] = await Promise.all([
    supabase.from('stock_levels').select('location_code, location_name, qty').eq('product_id', id),
    supabase.from('rfid_tags').select('epc, status').eq('product_id', id),
    supabase
      .from('price_history')
      .select('field, old_cents, new_cents, changed_at')
      .eq('product_id', id)
      .order('changed_at', { ascending: false })
      .limit(20),
  ]);

  const product = {
    ...full,
    total_stock: full.total_stock ?? 0,
    tag_count: (tags ?? []).length,
    matched: true,
  } as CatalogRow;

  return {
    product,
    stockByLocation: stock ?? [],
    tags: tags ?? [],
    history: history ?? [],
  };
}
