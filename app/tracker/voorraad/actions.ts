'use server';

import { createClient } from '@/lib/supabase/server';

// Mock VMS-sync (§ vervangbare bron vmsSync). Logt een run; later echte VMS-API.
export async function vmsSyncAction(): Promise<
  { ok: true; bijgewerkt: number } | { ok: false; error: string }
> {
  const supabase = createClient();
  const { data: voorraad } = await supabase.from('voorraad').select('id');
  const bijgewerkt = voorraad?.length ?? 0;
  const { error } = await supabase.from('vms_sync_log').insert({
    afgerond: new Date().toISOString(),
    aantal_bijgewerkt: bijgewerkt,
    status: 'success',
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, bijgewerkt };
}
