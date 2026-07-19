'use server';

import { epcSchema } from '@/lib/rfid';
import {
  scanLookup,
  searchModels,
  coupleTag,
  type ScanResult,
  type Model,
  type CoupleResult,
} from '@/lib/supabase/queries';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function scanAction(rawEpc: string): Promise<ActionResult<ScanResult>> {
  const parsed = epcSchema.safeParse(rawEpc);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige EPC' };
  }
  try {
    return { ok: true, data: await scanLookup(parsed.data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Scan mislukt' };
  }
}

export async function searchAction(query: string): Promise<ActionResult<Model[]>> {
  try {
    return { ok: true, data: await searchModels(query) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Zoeken mislukt' };
  }
}

export async function coupleAction(
  rawEpc: string,
  modelId: string,
): Promise<ActionResult<CoupleResult>> {
  const parsed = epcSchema.safeParse(rawEpc);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige EPC' };
  }
  try {
    return { ok: true, data: await coupleTag(parsed.data, modelId) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Koppelen mislukt' };
  }
}
