'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

const SOORTEN = ['vms', 'email', 'drive'] as const;
const STATUSSEN = ['verbonden', 'niet-verbonden', 'fout'] as const;

// Koppelingen beheren — alleen manager (flag overig.koppelingen).
export async function updateKoppelingAction(input: {
  id: string;
  status: string;
  config: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (user?.role !== 'admin') return { ok: false, error: 'Alleen beheer/manager mag koppelingen wijzigen' };
  if (!STATUSSEN.includes(input.status as (typeof STATUSSEN)[number])) {
    return { ok: false, error: 'Onbekende status' };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from('integraties')
    .update({ status: input.status, config_json: input.config as never })
    .eq('id', input.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/tracker/koppelingen');
  return { ok: true };
}

// Testverbinding — simuleert een check tot de echte adapters er zijn (VMS ~2 weken).
export async function testKoppelingAction(
  soort: string,
): Promise<{ ok: boolean; bericht: string }> {
  const user = await getSessionUser();
  if (user?.role !== 'admin') return { ok: false, bericht: 'Geen rechten' };
  if (!SOORTEN.includes(soort as (typeof SOORTEN)[number])) {
    return { ok: false, bericht: 'Onbekende koppeling' };
  }
  // Placeholder: echte handshake volgt met de Vendit/e-mail/Drive-adapters.
  return {
    ok: false,
    bericht:
      soort === 'vms'
        ? 'VMS-adapter nog niet actief (Vendit volgt ~2 weken).'
        : 'Nog geen credentials ingesteld — vul de config in en sla op.',
  };
}
