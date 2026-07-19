import 'server-only'; // Bouwt een harde guard: importeren in een client bundle gooit een error.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Service-role client voor server-side taken (sync-engine, goedkeur-RPC's, seed).
 * Omzeilt RLS — NOOIT in de browser gebruiken. De `server-only` import hierboven verhindert
 * dat dit bestand in een client bundle belandt.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('SUPABASE_URL ontbreekt');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY ontbreekt (server-only)');
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
