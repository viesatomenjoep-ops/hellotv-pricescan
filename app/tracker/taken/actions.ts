'use server';

import { createClient } from '@/lib/supabase/server';

const FASES = ['te-doen', 'bezig', 'review', 'klaar'] as const;

export async function advanceTaakAction(id: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const { data } = await supabase.from('taken').select('status').eq('id', id).maybeSingle();
  if (!data) return { ok: false };
  const idx = FASES.indexOf(data.status as (typeof FASES)[number]);
  const next = FASES[Math.min(idx + 1, FASES.length - 1)];
  await supabase.from('taken').update({ status: next }).eq('id', id);
  return { ok: true };
}

export async function deleteTaakAction(id: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  await supabase.from('taken').delete().eq('id', id);
  return { ok: true };
}

export async function addTaakAction(
  titel: string,
  persoon: string | null,
): Promise<{ ok: boolean }> {
  if (!titel.trim()) return { ok: false };
  const supabase = createClient();
  await supabase
    .from('taken')
    .insert({ titel: titel.trim(), persoon_id: persoon, status: 'te-doen' });
  return { ok: true };
}
