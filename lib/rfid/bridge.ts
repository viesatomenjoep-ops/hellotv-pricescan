import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

// EAN-brug: één fysieke chip, in beide apps herkend. Koppel je een chip in de ene app,
// dan spiegelen we hem via de gedeelde EAN naar de andere (PriceScan rfid_tags ↔ Tracker
// toestel_tags). Systeemoperatie → service-role client (omzeilt RLS-rolgrenzen bewust).
// Vindt de counterpart geen match op EAN, dan gebeurt er niets (chip werkt in de bron-app).

/** Chip gekoppeld in PriceScan (epc→product) → spiegel naar een toestel met dezelfde EAN. */
export async function bridgeFromPriceScan(epc: string, productId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: product } = await admin
      .from('products')
      .select('ean')
      .eq('id', productId)
      .maybeSingle();
    const ean = product?.ean;
    if (!ean) return;
    const { data: toestel } = await admin
      .from('toestellen')
      .select('id')
      .eq('ean', ean)
      .maybeSingle();
    if (!toestel) return;
    await admin
      .from('toestel_tags')
      .upsert({ epc, toestel_id: toestel.id, status: 'active', linked_at: new Date().toISOString() });
  } catch {
    // Spiegel is best-effort; faalt stil zodat de primaire koppeling niet sneuvelt.
  }
}

/** Chip gekoppeld in de Tracker (epc→toestel) → spiegel naar een product met dezelfde EAN. */
export async function bridgeFromTracker(epc: string, toestelId: number): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: toestel } = await admin
      .from('toestellen')
      .select('ean')
      .eq('id', toestelId)
      .maybeSingle();
    const ean = toestel?.ean;
    if (!ean) return;
    const { data: product } = await admin
      .from('products')
      .select('id')
      .eq('ean', ean)
      .maybeSingle();
    if (!product) return;
    await admin
      .from('rfid_tags')
      .upsert({ epc, product_id: product.id, status: 'active', linked_at: new Date().toISOString() });
  } catch {
    // Best-effort spiegel.
  }
}

/** Ontkoppel een chip overal (bij unlink in PriceScan of Tracker). */
export async function unbridge(epc: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('toestel_tags').delete().eq('epc', epc);
    await admin.from('rfid_tags').update({ product_id: null, status: 'inactive' }).eq('epc', epc);
  } catch {
    // Best-effort.
  }
}
