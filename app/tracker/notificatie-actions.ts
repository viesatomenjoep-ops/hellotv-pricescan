'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Markeer één notificatie als gelezen.
export async function markeerGelezenAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('notificaties').update({ gelezen: true }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/tracker', 'layout');
  return { ok: true };
}

// Markeer alle ongelezen notificaties als gelezen.
export async function markeerAllesGelezenAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = createClient();
  const { error } = await supabase
    .from('notificaties')
    .update({ gelezen: true })
    .eq('gelezen', false);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/tracker', 'layout');
  return { ok: true };
}
