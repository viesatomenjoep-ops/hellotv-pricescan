// Bijverkoop / combideal-catalogus voor de scan-deal. Vaste prijzen (demo), per categorie
// meerdere varianten die de verkoper kiest + een aantal. Bedragen in centen.

export interface ExtraVariant {
  id: string;
  label: string;
  prijs_c: number;
  marge_c: number;
}
export interface ExtraCategorie {
  id: string;
  naam: string;
  icon: string; // lucide-naam
  variants: ExtraVariant[];
}

const c = (euro: number) => Math.round(euro * 100);

export const EXTRAS: ExtraCategorie[] = [
  {
    id: 'garantie',
    naam: 'Garantie',
    icon: 'shield-check',
    variants: [
      { id: 'g3', label: '3 jaar', prijs_c: c(59.99), marge_c: c(50) },
      { id: 'g4', label: '4 jaar', prijs_c: c(99.99), marge_c: c(85) },
      { id: 'g5', label: '5 jaar', prijs_c: c(159.99), marge_c: c(140) },
      { id: 'g6', label: '6 jaar', prijs_c: c(199.99), marge_c: c(175) },
    ],
  },
  {
    id: 'hdmi',
    naam: 'HDMI 2.1 kabel',
    icon: 'cable',
    variants: [
      { id: 'hdmi1', label: '1 m', prijs_c: c(49.99), marge_c: c(30) },
      { id: 'hdmi2', label: '2 m', prijs_c: c(59.99), marge_c: c(36) },
      { id: 'hdmi3', label: '3 m', prijs_c: c(69.99), marge_c: c(42) },
    ],
  },
  {
    id: 'premium',
    naam: 'Premiumkabel',
    icon: 'cable',
    variants: [
      { id: 'prem1', label: '1 m', prijs_c: c(79.99), marge_c: c(48) },
      { id: 'prem2', label: '2 m', prijs_c: c(99.99), marge_c: c(60) },
    ],
  },
  {
    id: 'muurbeugel',
    naam: 'Muurbeugel',
    icon: 'frame',
    variants: [
      { id: 'mb-vast', label: 'Vast', prijs_c: c(59.99), marge_c: c(38) },
      { id: 'mb-kantel', label: 'Kantelbaar', prijs_c: c(99.99), marge_c: c(62) },
      { id: 'mb-full', label: 'Full-motion', prijs_c: c(199.99), marge_c: c(125) },
    ],
  },
  {
    id: 'montage',
    naam: 'Ophangen',
    icon: 'wrench',
    // Prijs is maat-afhankelijk (>85" = €199,99); zie montageVariant(inch).
    variants: [{ id: 'mo', label: 'Ophangservice', prijs_c: c(99.99), marge_c: c(90) }],
  },
];

// Montage-prijs hangt af van de schermmaat: >85 inch = €199,99, anders €99,99.
export function montageVariant(inch: number): ExtraVariant {
  return inch > 85
    ? { id: 'mo', label: 'Ophangservice (>85")', prijs_c: c(199.99), marge_c: c(180) }
    : { id: 'mo', label: 'Ophangservice', prijs_c: c(99.99), marge_c: c(90) };
}

// Catalogus voor een concreet toestel (montage-prijs op maat).
export function getExtras(inch: number): ExtraCategorie[] {
  return EXTRAS.map((cat) =>
    cat.id === 'montage' ? { ...cat, variants: [montageVariant(inch)] } : cat,
  );
}

// Eén gekozen regel (categorie → variant × aantal).
export interface GekozenExtra {
  key: string; // categorie-id
  variantId: string;
  naam: string; // "Garantie · 5 jaar"
  prijs_c: number;
  marge_c: number;
  aantal: number;
}

export type ExtraSelectie = Record<string, { variantId: string; aantal: number }>;

export function gekozenExtras(sel: ExtraSelectie, inch = 0): GekozenExtra[] {
  const out: GekozenExtra[] = [];
  for (const cat of getExtras(inch)) {
    const s = sel[cat.id];
    if (!s || s.aantal < 1) continue;
    const v = cat.variants.find((x) => x.id === s.variantId);
    if (!v) continue;
    out.push({
      key: cat.id,
      variantId: v.id,
      naam: `${cat.naam} · ${v.label}`,
      prijs_c: v.prijs_c,
      marge_c: v.marge_c,
      aantal: s.aantal,
    });
  }
  return out;
}
