'use server';

import { createClient } from '@/lib/supabase/server';

export async function maakAanbiedingAction(input: {
  toestelId: number;
  prijsC: number;
  kortingPct: number;
  extras: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('aanbiedingen').insert({
    toestel_id: input.toestelId,
    prijs_c: input.prijsC,
    korting_pct: Math.round(input.kortingPct * 100) / 100,
    extras: input.extras,
    status: 'concept',
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
