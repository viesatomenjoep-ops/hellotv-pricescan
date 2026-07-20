import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { getVerkopen, getToestellenLijst } from '@/lib/tracker/queries';
import { OverigClient } from './overig-client';

export const dynamic = 'force-dynamic';

export default async function OverigPage() {
  const supabase = createClient();
  const [{ data: flags }, { data: notificaties }, user, verkopen, toestellen] =
    await Promise.all([
      supabase.from('feature_flags').select('key, enabled, rol_scope, beschrijving').order('key'),
      supabase
        .from('notificaties')
        .select('id, type, tekst, gelezen')
        .order('tijd', { ascending: false })
        .limit(30),
      getSessionUser(),
      getVerkopen(),
      getToestellenLijst(),
    ]);

  const datasets = {
    verkopen: verkopen.map((v) => ({
      model: v.model,
      klant: v.klant,
      waarde_eur: (v.waarde_c / 100).toFixed(2),
      status: v.status,
    })),
    toestellen: toestellen.map((t) => ({
      merk: t.merk,
      model: t.model,
      klasse: t.klasse,
      ticket_eur: (t.ticket_c / 100).toFixed(2),
      marge_pct: t.margePct,
      voorraad: t.voorraadTotaal,
    })),
  };

  return (
    <OverigClient
      flags={flags ?? []}
      notificaties={notificaties ?? []}
      isManager={user?.role === 'admin'}
      datasets={datasets}
    />
  );
}
