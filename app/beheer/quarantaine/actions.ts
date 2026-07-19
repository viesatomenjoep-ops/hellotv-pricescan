'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

const idSchema = z.string().uuid();

export type ActionResult = { ok: true } | { ok: false; error: string };

async function decide(
  id: string,
  fn: 'approve_quarantine' | 'reject_quarantine',
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user?.role !== 'admin') return { ok: false, error: 'Geen rechten' };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: 'Ongeldig id' };
  const supabase = createClient();
  const { error } = await supabase.rpc(fn, { p_id: parsed.data });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/beheer/quarantaine');
  return { ok: true };
}

export const approveAction = (id: string) => decide(id, 'approve_quarantine');
export const rejectAction = (id: string) => decide(id, 'reject_quarantine');
