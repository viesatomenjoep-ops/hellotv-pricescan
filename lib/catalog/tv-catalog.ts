// Gegenereerde helloTV-tv-catalogus (2025/2026, Benelux) voor de merken die helloTV verkoopt:
// TCL, Philips, LG, Sony, Samsung. GEEN Hisense.
//
// Bron: publiek gescrapete line-ups (serie, EU-typenummer, maten, paneltype, richtprijs).
// Inkoopprijzen en exacte EAN's per maat zijn NIET publiek — die worden geschat/placeholder
// gezet tot de Vendit-sync ze overschrijft. De EAN's hier zijn geldige (checksum-correcte)
// placeholder-EAN-13's, deterministisch per model, zodat matching/koppelen alvast werkt.

export type Panel = 'OLED' | 'QD-OLED' | 'QLED' | 'Mini-LED' | 'LED';
export type Segment = 'budget' | 'mid' | 'premium';
export type Merk = 'Samsung' | 'LG' | 'Sony' | 'Philips' | 'TCL';

// Eén serie zoals gescraped. `pattern` bevat {inch} als placeholder voor de maat.
export interface Serie {
  merk: Merk;
  familie: string; // bv. "Neo QLED QN90F" of "OLED evo C5"
  panel: Panel;
  jaar: 2025 | 2026;
  segment: Segment;
  pattern: string; // bv. "QE{inch}QN90F"  → typenummer per maat
  sizes: number[]; // beschikbare schermmaten in inch
  // Prijsankers: richt-adviesprijs (verkoop, incl. btw) voor 1–2 maten → rest wordt geïnterpoleerd.
  anchors: Array<{ inch: number; eur: number }>;
  status?: 'active' | 'eol';
}

// Eén concreet toestel (serie × maat), klaar voor de seeds.
export interface CatalogItem {
  key: string; // stabiele sleutel, bv. "samsung-qn90f-55"
  merk: Merk;
  familie: string;
  model_name: string; // "Samsung Neo QLED QN90F 55\""
  model_number: string; // EU-typenummer
  jaar: 2025 | 2026;
  ean: string;
  inch: number;
  panel: Panel;
  klasse: 'OLED' | 'QLED' | 'Mini-LED' | 'LED'; // tracker-klasse (QD-OLED→OLED)
  segment: Segment;
  status: 'active' | 'eol';
  inkoop_c: number;
  ticket_c: number;
  min_marge_c: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function checkDigit(ean12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(ean12[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}

// Geldige EAN-13 placeholder: '871' (fictief GS1-blok) + 9-cijferige volgnummer + check.
function genEan(seq: number): string {
  const base = '871' + String(seq).padStart(9, '0');
  return base + checkDigit(base);
}

// Interpoleer/extrapoleer de adviesprijs voor een maat uit de ankers.
// TV-prijs schaalt ruwweg met het paneeloppervlak (∝ inch²); dat benaderen we per segment.
function prijsVoorMaat(anchors: Array<{ inch: number; eur: number }>, inch: number): number {
  if (anchors.length === 0) return 599;
  if (anchors.length === 1) {
    const a = anchors[0];
    const factor = (inch * inch) / (a.inch * a.inch);
    return a.eur * factor;
  }
  // twee (of meer) ankers: lineair op inch² tussen de twee dichtstbijzijnde.
  const sorted = [...anchors].sort((x, y) => x.inch - y.inch);
  const lo = sorted[0];
  const hi = sorted[sorted.length - 1];
  const t = (inch * inch - lo.inch * lo.inch) / (hi.inch * hi.inch - lo.inch * lo.inch);
  return lo.eur + t * (hi.eur - lo.eur);
}

// Ronde adviesprijs af op nette €x9-prijspunten (zoals in de retail gebruikelijk).
function nettePrijs(eur: number): number {
  if (eur < 400) return Math.round(eur / 10) * 10 - 1; // ..9
  if (eur < 2000) return Math.round(eur / 50) * 50 - 1; // ..49 / ..99
  return Math.round(eur / 100) * 100 - 1;
}

// Geschatte marge per segment (TV-retail is dun); tot Vendit de echte inkoop levert.
const MARGE: Record<Segment, number> = { budget: 0.09, mid: 0.13, premium: 0.17 };

const PANEL_KLASSE: Record<Panel, CatalogItem['klasse']> = {
  OLED: 'OLED',
  'QD-OLED': 'OLED',
  QLED: 'QLED',
  'Mini-LED': 'Mini-LED',
  LED: 'LED',
};

const MERK_SLUG: Record<Merk, string> = {
  Samsung: 'sam',
  LG: 'lg',
  Sony: 'sony',
  Philips: 'phi',
  TCL: 'tcl',
};

// ── Generator ───────────────────────────────────────────────────────────────

export function buildCatalog(series: Serie[]): CatalogItem[] {
  const items: CatalogItem[] = [];
  let seq = 1;
  for (const s of series) {
    for (const inch of s.sizes) {
      const model_number = s.pattern.replace('{inch}', String(inch));
      const ticketEur = nettePrijs(prijsVoorMaat(s.anchors, inch));
      const ticket_c = Math.round(ticketEur * 100);
      const inkoop_c = Math.round(ticket_c * (1 - MARGE[s.segment]));
      const min_marge_c = Math.round(inkoop_c * 1.03); // 3% minimummarge
      items.push({
        key: `${MERK_SLUG[s.merk]}-${model_number.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        merk: s.merk,
        familie: s.familie,
        model_name: `${s.merk} ${s.familie} ${inch}"`,
        model_number,
        jaar: s.jaar,
        ean: genEan(seq++),
        inch,
        panel: s.panel,
        klasse: PANEL_KLASSE[s.panel],
        segment: s.segment,
        status: s.status ?? 'active',
        inkoop_c,
        ticket_c,
        min_marge_c,
      });
    }
  }
  return items;
}
