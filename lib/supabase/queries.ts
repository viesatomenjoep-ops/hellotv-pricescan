import 'server-only';
import { z } from 'zod';
import { createClient } from './server';

// Alle datatoegang loopt via deze module (CLAUDE.md conventies). Elke DB-response wordt met
// Zod gevalideerd voordat de app hem gebruikt.

const panelSchema = z.enum(['LED', 'QLED', 'MiniLED', 'OLED']);
const segmentSchema = z.enum(['budget', 'mid', 'premium']);

const stockLocationSchema = z.object({
  location_code: z.string(),
  location_name: z.string().nullable(),
  qty: z.number().int(),
});

const scanProductSchema = z.object({
  id: z.string().uuid(),
  brand: z.string(),
  model_name: z.string(),
  model_number: z.string(),
  model_year: z.number().int(),
  screen_size_inch: z.number().int().nullable(),
  panel_type: panelSchema.nullable(),
  segment: segmentSchema.nullable(),
  status: z.enum(['active', 'eol']),
  successor_id: z.string().uuid().nullable(),
  purchase_price_cents: z.number().int().nullable(),
  currency: z.string().nullable(),
  last_synced_at: z.string().nullable(),
  is_stale: z.boolean(),
  total_stock: z.number().int(),
  stock_by_location: z.array(stockLocationSchema),
  // alleen sales/admin:
  sale_price_cents: z.number().int().nullable(),
  margin_cents: z.number().int().nullable(),
  margin_pct: z.number().nullable(),
});
export type ScanProduct = z.infer<typeof scanProductSchema>;

const scanResultSchema = z.object({
  input_type: z.enum(['rfid', 'ean']),
  result: z.enum(['hit', 'unknown_tag', 'unlinked']),
  role: z.enum(['warehouse', 'sales', 'admin']).nullable(),
  tag_status: z.string().nullable().optional(),
  epc: z.string().nullable(),
  ean: z.string().nullable(),
  product: scanProductSchema.nullable(),
});
export type ScanResult = z.infer<typeof scanResultSchema>;

export const productListItemSchema = z.object({
  id: z.string().uuid(),
  brand: z.string(),
  model_name: z.string(),
  model_number: z.string(),
  model_year: z.number().int(),
  ean: z.string().nullable(),
});
export type ProductListItem = z.infer<typeof productListItemSchema>;

/** Eén call voor het scan-scherm: EPC of EAN → rol-afhankelijk resultaat (logt de scan). */
export async function lookupScan(input: { epc?: string; ean?: string }): Promise<ScanResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('fn_lookup_scan', {
    p_epc: input.epc ?? undefined,
    p_ean: input.ean ?? undefined,
  });
  if (error) throw new Error(error.message);
  return scanResultSchema.parse(data);
}

function mapProductRow(r: {
  id: string;
  model_name: string;
  model_number: string;
  model_year: number;
  ean: string | null;
  brands: { name: string } | { name: string }[] | null;
}): ProductListItem {
  const brand = Array.isArray(r.brands) ? r.brands[0]?.name : r.brands?.name;
  return productListItemSchema.parse({
    id: r.id,
    brand: brand ?? '—',
    model_name: r.model_name,
    model_number: r.model_number,
    model_year: r.model_year,
    ean: r.ean,
  });
}

/** Zoek producten op merk, modelnaam, modelnummer of EAN. */
export async function searchProducts(query: string): Promise<ProductListItem[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, model_name, model_number, model_year, ean, brands(name)')
    .or(`model_name.ilike.%${term}%,model_number.ilike.%${term}%,ean.ilike.%${term}%`)
    .order('model_name')
    .limit(25);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProductRow);
}

/** 2025/2026-producten zonder gekoppeld Vendit-artikel (voorloper van D4). */
export async function getUnmatchedProducts(): Promise<ProductListItem[]> {
  const supabase = createClient();
  const [{ data: products, error: pErr }, { data: articles, error: aErr }] = await Promise.all([
    supabase
      .from('products')
      .select('id, model_name, model_number, model_year, ean, brands(name)')
      .order('model_name'),
    supabase.from('vendit_articles').select('product_id').not('product_id', 'is', null),
  ]);
  if (pErr) throw new Error(pErr.message);
  if (aErr) throw new Error(aErr.message);
  const matched = new Set((articles ?? []).map((a) => a.product_id));
  return (products ?? []).filter((p) => !matched.has(p.id)).map(mapProductRow);
}

export const alternativeSchema = z.object({
  product_id: z.string().uuid(),
  model_name: z.string(),
  brand_name: z.string(),
  screen_size_inch: z.number().int().nullable(),
  segment: segmentSchema.nullable(),
  panel_type: panelSchema.nullable(),
  model_year: z.number().int(),
  sale_price_cents: z.number().int().nullable(),
  total_stock: z.coerce.number().int(),
  margin_pct: z.coerce.number().nullable(),
  margin_diff_pp: z.coerce.number().nullable(),
  score: z.coerce.number(),
  is_pinned: z.boolean(),
  is_successor: z.boolean(),
});
export type Alternative = z.infer<typeof alternativeSchema>;

/** Blok D5: top-alternatieven op voorraad voor een product (rol-afhankelijke marge). */
export async function getAlternatives(productId: string, limit = 3): Promise<Alternative[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('fn_alternatives', {
    p_product_id: productId,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return z.array(alternativeSchema).parse(data);
}

/** Koppel een EPC aan een product (warehouse/admin, afgedwongen door RLS). */
export async function coupleTag(epc: string, productId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('rfid_tags')
    .insert({ epc, product_id: productId, status: 'active', linked_at: new Date().toISOString() });
  if (error) {
    if (error.code === '23505') throw new Error('EPC is al gekoppeld');
    throw new Error(error.message);
  }
}

/** Verplaats een bestaande tag naar een ander model (conflict-oplossing). */
export async function moveTag(epc: string, productId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('rfid_tags')
    .update({ product_id: productId, status: 'active', linked_at: new Date().toISOString() })
    .eq('epc', epc);
  if (error) throw new Error(error.message);
}

/** Ontkoppel een tag (bij misscan): product losmaken, status inactief. */
export async function unlinkTag(epc: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('rfid_tags')
    .update({ product_id: null, status: 'inactive' })
    .eq('epc', epc);
  if (error) throw new Error(error.message);
}
