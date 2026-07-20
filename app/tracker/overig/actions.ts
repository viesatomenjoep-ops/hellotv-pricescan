'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

// Managers togglen feature-flags live (§5). Zonder deploy.
export async function toggleFlagAction(
  key: string,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (user?.role !== 'admin')
    return { ok: false, error: 'Alleen beheer/manager mag flags wijzigen' };
  const supabase = createClient();
  const { error } = await supabase.from('feature_flags').update({ enabled }).eq('key', key);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/tracker', 'layout');
  return { ok: true };
}
