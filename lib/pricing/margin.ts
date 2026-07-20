// Marge- en geldberekeningen. Alles in integer eurocenten (PRD §5).
// De database (RPC scan_lookup) is de bron van waarheid voor getoonde marges; deze helpers
// bestaan voor client-side weergave en zijn 1-op-1 met de SQL-logica.

/** Verwijder btw uit een incl.-bedrag. Round-half-up op hele centen. */
export function exclVat(inclCents: number, vatRate: number): number {
  return Math.round(inclCents / (1 + vatRate));
}

export interface MarginResult {
  marginCents: number;
  marginPct: number | null; // null als verkoop_excl <= 0
}

/** marge = verkoop_excl_btw − inkoop; marge% = marge / verkoop_excl_btw. */
export function computeMargin(saleExclCents: number, purchaseCents: number): MarginResult {
  const marginCents = saleExclCents - purchaseCents;
  const marginPct = saleExclCents > 0 ? marginCents / saleExclCents : null;
  return { marginCents, marginPct };
}

/** Tracker-marge: verkoop is incl. btw (ticket), inkoop is ex. btw. Marge% wordt ex-btw berekend
 *  (zoals de echte inkooplijst): (verkoop_excl − inkoop) / verkoop_excl. */
const TRACKER_VAT = 0.21;
export function toestelMarge(
  ticketInclCents: number,
  inkoopExclCents: number,
): { margeC: number; margePct: number } {
  const ex = exclVat(ticketInclCents, TRACKER_VAT);
  const { marginCents, marginPct } = computeMargin(ex, inkoopExclCents);
  return {
    margeC: marginCents,
    margePct: marginPct != null ? Math.round(marginPct * 1000) / 10 : 0,
  };
}

/** Adviesprijs (RRP) afgeleid uit de ticketprijs: de ticketprijs (echte verkoop) is 8–20%
 *  goedkoper dan de adviesprijs, variabel per model. advies = ticket / (1 − korting). */
export function adviesPrijs(ticketCents: number, seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const korting = 0.08 + (((h >>> 0) % 1000) / 1000) * 0.12; // 8..20%
  return Math.round(ticketCents / (1 - korting));
}

/** Centen → "€ 1.799,00" (nl-NL). */
export function formatEuro(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** Fractie (0,152) → "15,2%". */
export function formatPct(fraction: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(fraction);
}
