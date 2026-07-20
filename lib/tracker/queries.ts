import 'server-only';
import { createClient } from '@/lib/supabase/server';

// Data-laag Sales Tracker. Bedragen in centen. Afgeleide marges in code (niet opgeslagen).

export interface DashboardData {
  toestellen: number;
  voorraadTotaal: number;
  pipeline: Record<string, number>;
  takenOpen: number;
  besteMarge: Array<{ id: number; model: string; merk: string; margePct: number; margeC: number }>;
}

export async function getDashboard(): Promise<DashboardData> {
  const supabase = createClient();
  const [{ data: toestellen }, { data: voorraad }, { data: verkopen }, { data: taken }] =
    await Promise.all([
      supabase.from('toestellen').select('id, merk, model, inkoop_c, ticket_c'),
      supabase.from('voorraad').select('aantal'),
      supabase.from('verkopen').select('status'),
      supabase.from('taken').select('status'),
    ]);

  const pipeline: Record<string, number> = { lead: 0, offerte: 0, verkocht: 0, geleverd: 0 };
  for (const v of verkopen ?? []) pipeline[v.status] = (pipeline[v.status] ?? 0) + 1;

  const besteMarge = (toestellen ?? [])
    .map((t) => {
      const margeC = t.ticket_c - t.inkoop_c;
      return {
        id: t.id,
        model: t.model,
        merk: t.merk,
        margeC,
        margePct: t.ticket_c > 0 ? Math.round((margeC / t.ticket_c) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.margePct - a.margePct)
    .slice(0, 6);

  return {
    toestellen: (toestellen ?? []).length,
    voorraadTotaal: (voorraad ?? []).reduce((s, r) => s + (r.aantal ?? 0), 0),
    pipeline,
    takenOpen: (taken ?? []).filter((t) => t.status !== 'klaar').length,
    besteMarge,
  };
}
