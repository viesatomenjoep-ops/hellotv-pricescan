import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Supabase client for use in the browser (Client Components).
 * Reads the public URL + anon key from the environment.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
