import 'server-only';
import { z } from 'zod';
import { createClient } from './server';

// Alle datatoegang loopt via deze module (CLAUDE.md conventies). Elke RPC-response wordt met
// Zod gevalideerd (Zod op elke API-grens) voordat de rest van de app hem gebruikt.

const roleSchema = z.enum(['medewerker', 'manager', 'admin']);
const panelSchema = z.enum(['OLED', 'QLED', 'Mini-LED', 'LED', 'Overig']);

export const modelSchema = z.object({
  id: z.string().uuid(),
  brand: z.string(),
  model_code: z.string(),
  name: z.string(),
  model_year: z.number().int(),
  screen_size_inch: z.number().int().nullable(),
  panel_type: panelSchema.nullable(),
  segment: z.string().nullable().optional(),
  ean: z.string().nullable().optional(),
  created_at: z.string().optional(),
});
export type Model = z.infer<typeof modelSchema>;

const priceSchema = z.object({
  sale_price_cents: z.number().int(),
  sale_price_excl_vat_cents: z.number().int(),
  price_includes_vat: z.boolean(),
  vat_rate: z.number(),
  stock_qty: z.number().int(),
  // Alleen aanwezig voor manager/admin (blok G):
  purchase_price_cents: z.number().int().optional(),
  margin_cents: z.number().int().optional(),
  margin_pct: z.number().nullable().optional(),
});
export type Price = z.infer<typeof priceSchema>;

const scanResultSchema = z.discriminatedUnion('matched', [
  z.object({ matched: z.literal(false), epc: z.string() }),
  z.object({
    matched: z.literal(true),
    epc: z.string(),
    role: roleSchema,
    model: modelSchema.pick({
      id: true,
      brand: true,
      model_code: true,
      name: true,
      model_year: true,
      screen_size_inch: true,
      panel_type: true,
    }),
    price: priceSchema.nullable(),
  }),
]);
export type ScanResult = z.infer<typeof scanResultSchema>;

const coupleResultSchema = z.object({
  id: z.string().uuid(),
  epc: z.string(),
  model_id: z.string().uuid(),
});
export type CoupleResult = z.infer<typeof coupleResultSchema>;

/** Blok B: scan een genormaliseerde EPC op (logt de scan server-side). */
export async function scanLookup(epc: string): Promise<ScanResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('scan_lookup', { p_epc: epc });
  if (error) throw new Error(error.message);
  return scanResultSchema.parse(data);
}

/** Blok F: koppel een EPC aan een model. */
export async function coupleTag(epc: string, modelId: string): Promise<CoupleResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('couple_tag', { p_epc: epc, p_model_id: modelId });
  if (error) throw new Error(error.message);
  return coupleResultSchema.parse(data);
}

/** Blok B/F: handmatig zoeken op merk, naam of EAN (fallback zonder tag, en bij koppelen). */
export async function searchModels(query: string): Promise<Model[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('models')
    .select('id,brand,model_code,name,model_year,screen_size_inch,panel_type,segment,ean')
    .or(`brand.ilike.%${term}%,name.ilike.%${term}%,ean.ilike.%${term}%`)
    .order('brand')
    .limit(25);
  if (error) throw new Error(error.message);
  return z.array(modelSchema).parse(data);
}

/** Blok F: 2025/2026-modellen zonder gekoppeld Vendit-artikel (alleen beheer). */
export async function getUnmatchedModels(): Promise<Model[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('unmatched_models');
  if (error) throw new Error(error.message);
  return z.array(modelSchema).parse(data);
}
