'use server';

import { createClient } from '@/lib/supabase/server';
import { epcSchema } from '@/lib/schemas';

// Koppel (of verplaats) een RFID-chip aan een toestel, zodat de Tracker hem herkent bij scannen.
export async function koppelToestelTagAction(
  rawEpc: string,
  toestelId: number,
): Promise<{ ok: true; epc: string } | { ok: false; error: string }> {
  const parsed = epcSchema.safeParse(rawEpc);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige EPC' };
  if (!Number.isInteger(toestelId)) return { ok: false, error: 'Ongeldig toestel' };
  const epc = parsed.data;
  const supabase = createClient();
  const { error } = await supabase
    .from('toestel_tags')
    .upsert({ epc, toestel_id: toestelId, status: 'active', linked_at: new Date().toISOString() });
  if (error) return { ok: false, error: error.message };
  return { ok: true, epc };
}

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
