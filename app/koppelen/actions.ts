'use server';

import { epcSchema } from '@/lib/schemas';
import {
  searchProducts,
  coupleTag,
  moveTag,
  unlinkTag,
  type ProductListItem,
} from '@/lib/supabase/queries';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

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

export async function moveAction(
  rawEpc: string,
  productId: string,
): Promise<ActionResult<{ epc: string }>> {
  const epc = epcSchema.safeParse(rawEpc);
  if (!epc.success) return { ok: false, error: epc.error.issues[0]?.message ?? 'Ongeldige EPC' };
  try {
    await moveTag(epc.data, productId);
    return { ok: true, data: { epc: epc.data } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Verplaatsen mislukt' };
  }
}

export async function unlinkAction(rawEpc: string): Promise<ActionResult<{ epc: string }>> {
  const epc = epcSchema.safeParse(rawEpc);
  if (!epc.success) return { ok: false, error: epc.error.issues[0]?.message ?? 'Ongeldige EPC' };
  try {
    await unlinkTag(epc.data);
    return { ok: true, data: { epc: epc.data } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ontkoppelen mislukt' };
  }
}
