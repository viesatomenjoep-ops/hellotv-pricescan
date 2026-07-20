import type { CatalogItem, Merk, Segment } from './tv-catalog';

// Echte campagne-data (HelloTV OLED Weken, aug 2026). Verkoop = incl. btw, inkoop = ex. btw,
// zoals aangeleverd. Cashback in centen. Deze modellen vervangen/vullen de generieke catalogus.
const c = (euro: number) => Math.round(euro * 100);

interface RealRow {
  merk: Merk;
  serie: string; // "OLED S95H", "OLED evo C67"
  model_number: string; // exact EU-typenummer
  inch: number;
  ticket: number; // verkoop incl. btw (€)
  inkoop: number; // inkoop ex. btw (€)
  cashback?: number; // € cashback
}

// Uit het vergelijkingsoverzicht (echte inkoopprijzen).
const IMAGE: RealRow[] = [
  // LG OLED 2026 — C67
  { merk: 'LG', serie: 'OLED evo C67', model_number: 'OLED55C67', inch: 55, ticket: 1899, inkoop: 1110, cashback: 100 },
  { merk: 'LG', serie: 'OLED evo C67', model_number: 'OLED65C67', inch: 65, ticket: 2499, inkoop: 1460, cashback: 100 },
  { merk: 'LG', serie: 'OLED evo C67', model_number: 'OLED77C67', inch: 77, ticket: 3499, inkoop: 2042, cashback: 250 },
  { merk: 'LG', serie: 'OLED evo C67', model_number: 'OLED83C67', inch: 83, ticket: 4899, inkoop: 2864, cashback: 250 },
  // LG OLED 2026 — G69 / G67 (flagship)
  { merk: 'LG', serie: 'OLED evo G6', model_number: 'OLED55G69', inch: 55, ticket: 2499, inkoop: 1421, cashback: 150 },
  { merk: 'LG', serie: 'OLED evo G6', model_number: 'OLED65G69', inch: 65, ticket: 2999, inkoop: 1709, cashback: 150 },
  { merk: 'LG', serie: 'OLED evo G6', model_number: 'OLED77G67', inch: 77, ticket: 4499, inkoop: 2564, cashback: 250 },
  // Samsung OLED 2026 — S93H
  { merk: 'Samsung', serie: 'OLED S93H', model_number: 'QE55S93H', inch: 55, ticket: 1999, inkoop: 1092, cashback: 100 },
  { merk: 'Samsung', serie: 'OLED S93H', model_number: 'QE65S93H', inch: 65, ticket: 2599, inkoop: 1419, cashback: 100 },
  { merk: 'Samsung', serie: 'OLED S93H', model_number: 'QE77S93H', inch: 77, ticket: 3599, inkoop: 2026, cashback: 200 },
  { merk: 'Samsung', serie: 'OLED S90H', model_number: 'QE83S90H', inch: 83, ticket: 4499, inkoop: 2532, cashback: 200 },
  // Samsung OLED 2026 — S95H (flagship, uitschieter 65")
  { merk: 'Samsung', serie: 'OLED S95H', model_number: 'QE55S95H', inch: 55, ticket: 2499, inkoop: 1345, cashback: 100 },
  { merk: 'Samsung', serie: 'OLED S95H', model_number: 'QE65S95H', inch: 65, ticket: 3099, inkoop: 1480, cashback: 100 },
  { merk: 'Samsung', serie: 'OLED S95H', model_number: 'QE77S95H', inch: 77, ticket: 4599, inkoop: 2504, cashback: 200 },
];

const MERK_SLUG: Record<Merk, string> = { Samsung: 'sam', LG: 'lg', Sony: 'sony', Philips: 'phi', TCL: 'tcl' };

export const REAL_MODELLEN: CatalogItem[] = IMAGE.map((r) => ({
  key: `${MERK_SLUG[r.merk]}-${r.model_number.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
  merk: r.merk,
  familie: r.serie,
  model_name: `${r.merk} ${r.serie} ${r.inch}"`,
  model_number: r.model_number,
  jaar: 2026,
  ean: '', // ingevuld door buildCatalog (uniek volgnummer)
  inch: r.inch,
  panel: 'OLED',
  klasse: 'OLED',
  segment: 'premium' as Segment,
  status: 'active',
  inkoop_c: c(r.inkoop),
  ticket_c: c(r.ticket),
  min_marge_c: Math.round(c(r.inkoop) * 1.21 * 1.03),
  cashback_c: c(r.cashback ?? 0),
}));

// Cashback per model_number (campagne) — client-safe lookup voor scan/detail.
export const CASHBACK_BY_MODELNR: Record<string, number> = Object.fromEntries(
  IMAGE.filter((r) => r.cashback).map((r) => [r.model_number, c(r.cashback ?? 0)]),
);

// Model-nummers die de generieke catalogus NIET meer moet genereren (echte data vervangt ze).
export const VERVANG_FAMILIES = new Set<string>([
  'LG|OLED evo C6',
  'LG|OLED evo G6',
  'LG|OLED B6',
  'Samsung|OLED S95H',
  'Samsung|OLED S90H',
  'Samsung|OLED S99H',
]);

// Actie-marges (ex. btw) voor bestaande generieke modellen — override de geschatte inkoop.
// Key = exact model_number (zoals de generator die maakt).
export const REAL_MARGE: Record<string, number> = {
  // Samsung OLED 2025 (actie-marges uit de tekst)
  QE55S95F: 27,
  QE55S90F: 27,
  QE65S90F: 31,
  QE77S90F: 35, // tekst noemt 77S91F; dichtstbijzijnde in de catalogus
  QE83S90F: 41,
  // Philips OLED — actie-inkoopprijs
  '55OLED810/12': 35,
  '65OLED810/12': 37,
  '55OLED811/12': 45, // 2026, vanaf woensdag beschikbaar
};
