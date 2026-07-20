import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { OverigClient } from './overig-client';

export const dynamic = 'force-dynamic';

export default async function OverigPage() {
  const supabase = createClient();
  const [{ data: flags }, { data: notificaties }, user] = await Promise.all([
    supabase.from('feature_flags').select('key, enabled, rol_scope, beschrijving').order('key'),
    supabase
      .from('notificaties')
      .select('id, type, tekst, gelezen')
      .order('tijd', { ascending: false })
      .limit(30),
    getSessionUser(),
  ]);
  return (
    <OverigClient
      flags={flags ?? []}
      notificaties={notificaties ?? []}
      isManager={user?.role === 'admin'}
    />
  );
}
