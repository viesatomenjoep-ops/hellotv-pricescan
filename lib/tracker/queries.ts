import 'server-only';
import { createClient } from '@/lib/supabase/server';

// Data-laag Sales Tracker. Bedragen in centen. Afgeleide marges in code (niet opgeslagen).

export interface ToestelRow {
  id: number;
  merk: string;
  model: string;
  type_nr: string;
  ean: string | null;
  inch: number | null;
  klasse: string | null;
  inkoop_c: number;
  ticket_c: number;
  min_marge_c: number;
  verkoopsnelheid: number;
  specs: string | null;
  voorraad: Record<string, number>;
  voorraadTotaal: number;
  margeC: number;
  margePct: number;
  wijktAfVms: boolean;
}
export interface Filiaal {
  id: string;
  naam: string;
  plaats: string | null;
}

export async function getToestellenMetVoorraad(): Promise<{
  toestellen: ToestelRow[];
  filialen: Filiaal[];
}> {
  const supabase = createClient();
  const [{ data: toestellen }, { data: voorraad }, { data: filialen }] = await Promise.all([
    supabase.from('toestellen').select('*'),
    supabase.from('voorraad').select('toestel_id, filiaal_id, aantal, wijkt_af_vms'),
    supabase.from('filialen').select('id, naam, plaats').order('naam'),
  ]);

  const perToestel = new Map<number, { v: Record<string, number>; afw: boolean }>();
  for (const v of voorraad ?? []) {
    const cur = perToestel.get(v.toestel_id) ?? { v: {}, afw: false };
    cur.v[v.filiaal_id] = v.aantal;
    if (v.wijkt_af_vms) cur.afw = true;
    perToestel.set(v.toestel_id, cur);
  }

  const rows: ToestelRow[] = (toestellen ?? []).map((t) => {
    const p = perToestel.get(t.id) ?? { v: {}, afw: false };
    const margeC = t.ticket_c - t.inkoop_c;
    return {
      id: t.id,
      merk: t.merk,
      model: t.model,
      type_nr: t.type_nr,
      ean: t.ean,
      inch: t.inch,
      klasse: t.klasse,
      inkoop_c: t.inkoop_c,
      ticket_c: t.ticket_c,
      min_marge_c: t.min_marge_c,
      verkoopsnelheid: t.verkoopsnelheid ?? 0,
      specs: t.specs,
      voorraad: p.v,
      voorraadTotaal: Object.values(p.v).reduce((s, n) => s + n, 0),
      margeC,
      margePct: t.ticket_c > 0 ? Math.round((margeC / t.ticket_c) * 1000) / 10 : 0,
      wijktAfVms: p.afw,
    };
  });
  return { toestellen: rows, filialen: filialen ?? [] };
}

export interface DashboardData {
  toestellen: number;
  voorraadTotaal: number;
  pipeline: Record<string, number>;
  takenOpen: number;
  besteMarge: Array<{ id: number; model: string; merk: string; margePct: number; margeC: number }>;
}

export interface VerkoopRow {
  id: string;
  model: string | null;
  type_nr: string | null;
  klant: string | null;
  verkoper_id: string | null;
  waarde_c: number;
  status: string;
}

export async function getVerkopen(): Promise<VerkoopRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('verkopen')
    .select('id, model, type_nr, klant, verkoper_id, waarde_c, status')
    .order('aangemaakt', { ascending: false });
  return (data ?? []) as VerkoopRow[];
}

export interface TaakRow {
  id: string;
  titel: string;
  persoon_id: string | null;
  status: string;
}

export async function getTaken(): Promise<{
  taken: TaakRow[];
  verkopers: Array<{ id: string; naam: string }>;
}> {
  const supabase = createClient();
  const [{ data: taken }, { data: verkopers }] = await Promise.all([
    supabase.from('taken').select('id, titel, persoon_id, status').order('aangemaakt'),
    supabase.from('verkopers').select('id, naam').order('naam'),
  ]);
  return { taken: (taken ?? []) as TaakRow[], verkopers: verkopers ?? [] };
}

export async function getFilialenOverzicht(): Promise<
  Array<{
    id: string;
    naam: string;
    plaats: string | null;
    aantal: number;
    waardeC: number;
    topMarge: number;
  }>
> {
  const { toestellen, filialen } = await getToestellenMetVoorraad();
  return filialen.map((f) => {
    let aantal = 0;
    let waardeC = 0;
    let topMarge = 0;
    for (const t of toestellen) {
      const n = t.voorraad[f.id] ?? 0;
      aantal += n;
      waardeC += n * t.ticket_c;
      if (n > 0) topMarge = Math.max(topMarge, t.margePct);
    }
    return { id: f.id, naam: f.naam, plaats: f.plaats, aantal, waardeC, topMarge };
  });
}

export interface ToestelDetail extends ToestelRow {
  lifetimeMargeC: number;
  centraalAantal: number;
  centraalEta: number | null;
}

export async function getToestelDetail(
  id: number,
): Promise<{ detail: ToestelDetail; filialen: Filiaal[] } | null> {
  const supabase = createClient();
  const [{ data: t }, { data: voorraad }, { data: centraal }, { data: events }, { data: filialen }] =
    await Promise.all([
      supabase.from('toestellen').select('*').eq('id', id).maybeSingle(),
      supabase.from('voorraad').select('filiaal_id, aantal, wijkt_af_vms').eq('toestel_id', id),
      supabase.from('centraal_magazijn').select('aantal, eta_dagen').eq('toestel_id', id).maybeSingle(),
      supabase.from('verkoop_events').select('marge_c').eq('toestel_id', id),
      supabase.from('filialen').select('id, naam, plaats').order('naam'),
    ]);
  if (!t) return null;

  const v: Record<string, number> = {};
  let afw = false;
  for (const r of voorraad ?? []) {
    v[r.filiaal_id] = r.aantal;
    if (r.wijkt_af_vms) afw = true;
  }
  const margeC = t.ticket_c - t.inkoop_c;
  return {
    detail: {
      id: t.id, merk: t.merk, model: t.model, type_nr: t.type_nr, ean: t.ean, inch: t.inch,
      klasse: t.klasse, inkoop_c: t.inkoop_c, ticket_c: t.ticket_c, min_marge_c: t.min_marge_c,
      verkoopsnelheid: t.verkoopsnelheid ?? 0, specs: t.specs, voorraad: v,
      voorraadTotaal: Object.values(v).reduce((s, n) => s + n, 0),
      margeC, margePct: t.ticket_c > 0 ? Math.round((margeC / t.ticket_c) * 1000) / 10 : 0,
      wijktAfVms: afw,
      lifetimeMargeC: (events ?? []).reduce((s, e) => s + e.marge_c, 0),
      centraalAantal: centraal?.aantal ?? 0,
      centraalEta: centraal?.eta_dagen ?? null,
    },
    filialen: filialen ?? [],
  };
}

export interface AgendaItem {
  id: string;
  datum: string;
  tijd: string | null;
  titel: string;
  type: string;
  locatie: string | null;
}

export async function getAgenda(): Promise<AgendaItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('agenda_items')
    .select('id, datum, tijd, titel, type, locatie')
    .order('datum');
  return (data ?? []) as AgendaItem[];
}

export interface VerkoperPrestatie {
  id: string;
  naam: string;
  filiaal_id: string | null;
  deals: number;
  gewonnen: number;
  omzetC: number;
  openC: number;
}

export async function getVerkopersPrestaties(): Promise<VerkoperPrestatie[]> {
  const supabase = createClient();
  const [{ data: verkopers }, { data: verkopen }] = await Promise.all([
    supabase.from('verkopers').select('id, naam, filiaal_id').order('naam'),
    supabase.from('verkopen').select('verkoper_id, waarde_c, status'),
  ]);

  const perVerkoper = new Map<string, { deals: number; gewonnen: number; omzetC: number; openC: number }>();
  for (const v of verkopen ?? []) {
    if (!v.verkoper_id) continue;
    const cur = perVerkoper.get(v.verkoper_id) ?? { deals: 0, gewonnen: 0, omzetC: 0, openC: 0 };
    cur.deals += 1;
    const afgerond = v.status === 'verkocht' || v.status === 'geleverd';
    if (afgerond) {
      cur.gewonnen += 1;
      cur.omzetC += v.waarde_c;
    } else {
      cur.openC += v.waarde_c;
    }
    perVerkoper.set(v.verkoper_id, cur);
  }

  return (verkopers ?? [])
    .map((vk) => {
      const p = perVerkoper.get(vk.id) ?? { deals: 0, gewonnen: 0, omzetC: 0, openC: 0 };
      return { id: vk.id, naam: vk.naam, filiaal_id: vk.filiaal_id ?? null, ...p };
    })
    .sort((a, b) => b.omzetC - a.omzetC || b.gewonnen - a.gewonnen);
}

export interface IntegratieRow {
  id: string;
  soort: string;
  status: string;
  config_json: Record<string, unknown>;
}

export async function getIntegraties(): Promise<IntegratieRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('integraties')
    .select('id, soort, status, config_json')
    .order('soort');
  return (data ?? []) as IntegratieRow[];
}

export interface TargetRow {
  periode: string;
  omzet_c: number;
  omzet_doel_c: number;
  marge_pct: number;
  marge_doel_pct: number;
}

export async function getTarget(): Promise<TargetRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('targets')
    .select('periode, omzet_c, omzet_doel_c, marge_pct, marge_doel_pct')
    .order('periode')
    .limit(1)
    .maybeSingle();
  return (data as TargetRow) ?? null;
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
