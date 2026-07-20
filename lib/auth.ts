import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export type Role = 'admin' | 'sales' | 'warehouse';

export interface SessionUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: Role | null;
}

/** Huidige gebruiker + rol (server-side). null als niet ingelogd.
 *  Gecacht per request (React cache) zodat layout + pagina niet elk apart auth.getUser() doen. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: (profile?.role ?? null) as Role | null,
  };
});

/** Vereist een van de rollen; anders redirect. Voor server components / layouts. */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!user.role || !roles.includes(user.role)) redirect('/');
  return user;
}

export function canSeeMargin(role: Role | null): boolean {
  return role === 'sales' || role === 'admin';
}
