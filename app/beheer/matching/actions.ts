'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { searchProducts, type ProductListItem } from '@/lib/supabase/queries';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const ids = z.object({ articleId: z.string().uuid(), productId: z.string().uuid() });

export async function confirmMatchAction(
  articleId: string,
  productId: string,
): Promise<ActionResult<null>> {
  const parsed = ids.safeParse({ articleId, productId });
  if (!parsed.success) return { ok: false, error: 'Ongeldig id' };
  const supabase = createClient();
  const { error } = await supabase.rpc('confirm_match', {
    p_article_id: parsed.data.articleId,
    p_product_id: parsed.data.productId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/beheer/matching');
  return { ok: true, data: null };
}

export async function searchAction(query: string): Promise<ActionResult<ProductListItem[]>> {
  try {
    return { ok: true, data: await searchProducts(query) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Zoeken mislukt' };
  }
}
