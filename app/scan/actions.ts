'use server';

import { epcSchema, ean13Schema } from '@/lib/schemas';
import {
  lookupScan,
  searchProducts,
  coupleTag,
  type ScanResult,
  type ProductListItem,
} from '@/lib/supabase/queries';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Scan op EPC (rfid) of EAN, afhankelijk van de invoer. */
export async function scanAction(raw: string): Promise<ActionResult<ScanResult>> {
  const value = raw.trim();
  // Puur numeriek van 13 tekens? Behandel als EAN, anders als EPC.
  if (/^\d{13}$/.test(value)) {
    const ean = ean13Schema.safeParse(value);
    if (!ean.success) return { ok: false, error: ean.error.issues[0]?.message ?? 'Ongeldige EAN' };
    try {
      return { ok: true, data: await lookupScan({ ean: ean.data }) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Scan mislukt' };
    }
  }
  const epc = epcSchema.safeParse(value);
  if (!epc.success) return { ok: false, error: epc.error.issues[0]?.message ?? 'Ongeldige EPC' };
  try {
    return { ok: true, data: await lookupScan({ epc: epc.data }) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Scan mislukt' };
  }
}

export async function searchAction(query: string): Promise<ActionResult<ProductListItem[]>> {
  try {
    return { ok: true, data: await searchProducts(query) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Zoeken mislukt' };
  }
}

export async function coupleAction(
  rawEpc: string,
  productId: string,
): Promise<ActionResult<{ epc: string }>> {
  const epc = epcSchema.safeParse(rawEpc);
  if (!epc.success) return { ok: false, error: epc.error.issues[0]?.message ?? 'Ongeldige EPC' };
  try {
    await coupleTag(epc.data, productId);
    return { ok: true, data: { epc: epc.data } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Koppelen mislukt' };
  }
}
