'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({ key: z.string().min(1), value: z.number() });

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateSettingAction(key: string, value: number): Promise<ActionResult> {
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
