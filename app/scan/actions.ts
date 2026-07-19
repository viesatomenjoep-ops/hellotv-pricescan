'use server';

import { epcSchema, ean13Schema } from '@/lib/schemas';
import {
  lookupScan,
  getAlternatives,
  type ScanResult,
  type Alternative,
} from '@/lib/supabase/queries';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Scan op EPC (rfid) of EAN, afhankelijk van de invoer. */
export async function scanAction(raw: string): Promise<ActionResult<ScanResult>> {
  const value = raw.trim();
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

export async function alternativesAction(productId: string): Promise<ActionResult<Alternative[]>> {
  try {
    return { ok: true, data: await getAlternatives(productId) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Alternatieven laden mislukt' };
  }
}
