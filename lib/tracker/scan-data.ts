import 'server-only';
import { createClient } from '@/lib/supabase/server';

// Data voor het scan-scherm. Alles vooraf ophalen (klein datamodel) zodat de calculator
// client-side snel is en offline werkt (PWA-doel).

export interface ScanToestel {
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
  centraalAantal: number;
  centraalEta: number | null;
  lifetimeMargeC: number;
}

export interface ScanKlant {
  id: string;
  naam: string;
  segment: string | null;
  prijsfactor: number;
}

export interface ScanData {
  toestellen: ScanToestel[];
  filialen: Array<{ id: string; naam: string; plaats: string | null }>;
  bijverkoop: Array<{
    id: string;
    naam: string;
    categorie: string | null;
    prijs_c: number;
    marge_c: number;
  }>;
  klanten: Array<{ id: string; naam: string; segment: string | null; prijsfactor: number }>;
}

export async function getScanData(): Promise<ScanData> {
  const supabase = createClient();
  const [
    { data: toestellen },
    { data: voorraad },
    { data: centraal },
    { data: events },
    { data: filialen },
    { data: bijverkoop },
    { data: klanten },
  ] = await Promise.all([
    supabase.from('toestellen').select('*'),
    supabase.from('voorraad').select('toestel_id, filiaal_id, aantal'),
    supabase.from('centraal_magazijn').select('toestel_id, aantal, eta_dagen'),
    supabase.from('verkoop_events').select('toestel_id, marge_c'),
    supabase.from('filialen').select('id, naam, plaats').order('naam'),
    supabase.from('bijverkoop').select('id, naam, categorie, prijs_c, marge_c').order('categorie'),
    supabase.from('klanten').select('id, naam, segment, prijsfactor').order('naam'),
  ]);

  const voorraadMap = new Map<number, Record<string, number>>();
  for (const v of voorraad ?? []) {
    const m = voorraadMap.get(v.toestel_id) ?? {};
    m[v.filiaal_id] = v.aantal;
    voorraadMap.set(v.toestel_id, m);
  }
  const centraalMap = new Map((centraal ?? []).map((c) => [c.toestel_id, c]));
  const lifetimeMap = new Map<number, number>();
  for (const e of events ?? []) {
    if (e.toestel_id != null)
      lifetimeMap.set(e.toestel_id, (lifetimeMap.get(e.toestel_id) ?? 0) + e.marge_c);
  }

  const rows: ScanToestel[] = (toestellen ?? []).map((t) => {
    const perFiliaal = voorraadMap.get(t.id) ?? {};
    const c = centraalMap.get(t.id);
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
      voorraad: perFiliaal,
      voorraadTotaal: Object.values(perFiliaal).reduce((s, n) => s + n, 0),
      centraalAantal: c?.aantal ?? 0,
      centraalEta: c?.eta_dagen ?? null,
      lifetimeMargeC: lifetimeMap.get(t.id) ?? 0,
    };
  });

  return {
    toestellen: rows,
    filialen: filialen ?? [],
    bijverkoop: bijverkoop ?? [],
    klanten: (klanten ?? []).map((k) => ({ ...k, prijsfactor: Number(k.prijsfactor) })),
  };
}
