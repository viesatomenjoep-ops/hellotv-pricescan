'use server';

import { createClient } from '@/lib/supabase/server';

const FASES = ['lead', 'offerte', 'verkocht', 'geleverd'] as const;

export async function advanceVerkoopAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const { data: row } = await supabase.from('verkopen').select('status').eq('id', id).maybeSingle();
  if (!row) return { ok: false, error: 'Niet gevonden' };
  const idx = FASES.indexOf(row.status as (typeof FASES)[number]);
  const next = FASES[Math.min(idx + 1, FASES.length - 1)];
  const { error } = await supabase.from('verkopen').update({ status: next }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Zet een deal direct op een gekozen fase (drag&drop-kanban).
export async function setVerkoopStatusAction(
  id: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!FASES.includes(status as (typeof FASES)[number])) {
    return { ok: false, error: 'Onbekende fase' };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from('verkopen')
    .update({ status: status as (typeof FASES)[number] })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
