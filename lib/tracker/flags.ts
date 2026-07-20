import 'server-only';
import { createClient } from '@/lib/supabase/server';

// Feature-flags (§5). Server leest de tabel; een uitgezette vlag verbergt UI én schakelt
// data-calls uit. rol_scope beperkt tot een rol.

export interface FlagRow {
  key: string;
  enabled: boolean;
  rol_scope: string | null;
}

export type FlagMap = Record<string, { enabled: boolean; rolScope: string | null }>;

export async function getFlags(): Promise<FlagMap> {
  const supabase = createClient();
  const { data } = await supabase.from('feature_flags').select('key, enabled, rol_scope');
  const map: FlagMap = {};
  for (const f of (data ?? []) as FlagRow[]) {
    map[f.key] = { enabled: f.enabled, rolScope: f.rol_scope };
  }
  return map;
}
