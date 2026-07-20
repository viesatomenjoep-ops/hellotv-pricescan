'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

// Ticketprijs bewerken — alleen manager (flag toestel.prijs_bewerken, rol_scope manager).
export async function updateTicketAction(
  id: number,
  ticketC: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (user?.role !== 'admin') return { ok: false, error: 'Alleen manager mag de ticketprijs wijzigen' };
  if (!Number.isFinite(ticketC) || ticketC < 0) return { ok: false, error: 'Ongeldige prijs' };
  const supabase = createClient();
  const { error } = await supabase.from('toestellen').update({ ticket_c: Math.round(ticketC) }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/tracker/toestellen/${id}`);
  return { ok: true };
}
