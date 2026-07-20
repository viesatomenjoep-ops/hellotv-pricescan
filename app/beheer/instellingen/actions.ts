'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { configFromEnv, VenditRestAdapter } from '@/lib/vendit/rest';
import { MockVenditAdapter } from '@/lib/vendit/mock';

const schema = z.object({ key: z.string().min(1), value: z.number() });

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function assertAdmin(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.role === 'admin' ? null : 'Geen rechten';
}

export async function updateSettingAction(key: string, value: number): Promise<ActionResult> {
  if (await assertAdmin()) return { ok: false, error: 'Geen rechten' };
  const parsed = schema.safeParse({ key, value });
  if (!parsed.success) return { ok: false, error: 'Ongeldige waarde' };
  const supabase = createClient();
  const { error } = await supabase
    .from('settings')
    .upsert({ key: parsed.data.key, value: parsed.data.value });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/beheer/instellingen');
  return { ok: true };
}

const weightsSchema = z.object({
  margin: z.number(),
  stock: z.number(),
  brand: z.number(),
  year: z.number(),
  panel: z.number(),
  price: z.number(),
});

export async function updateWeightsAction(weights: Record<string, number>): Promise<ActionResult> {
  if (await assertAdmin()) return { ok: false, error: 'Geen rechten' };
  const parsed = weightsSchema.safeParse(weights);
  if (!parsed.success) return { ok: false, error: 'Ongeldige gewichten' };
  const supabase = createClient();
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'alternatives_weights', value: parsed.data });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/beheer/instellingen');
  return { ok: true };
}

export interface TestRow {
  id: string;
  ean: string | null;
  purchase: number | null;
  sale: number | null;
}

/** "Verbinding testen": haalt 5 artikelen op via de adapter, zonder de DB te raken. */
export async function testConnectionAction(): Promise<
  ActionResult<{ source: string; rows: TestRow[] }>
> {
  if (await assertAdmin()) return { ok: false, error: 'Geen rechten' };
  try {
    const useRest = !!process.env.VENDIT_API_BASE_URL;
    const adapter = useRest ? new VenditRestAdapter(configFromEnv()) : new MockVenditAdapter();
    const rows: TestRow[] = [];
    let n = 0;
    for await (const r of adapter.fetchArticles()) {
      rows.push({
        id: r.venditArticleId,
        ean: r.ean ?? null,
        purchase: r.purchasePriceCents,
        sale: r.salePriceCents,
      });
      if (++n >= 5) break;
    }
    return { ok: true, data: { source: useRest ? 'Vendit REST' : 'Mock-adapter', rows } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Verbinding mislukt' };
  }
}
