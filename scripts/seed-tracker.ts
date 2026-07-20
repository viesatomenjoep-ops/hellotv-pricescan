/**
 * Seed voor de HelloTV Sales Tracker (prototype-data). Bedragen in centen.
 *   pnpm db:seed-tracker   (valt terug op de lokale Supabase)
 */
import './load-env';
import { createClient } from '@supabase/supabase-js';
import { buildCatalog } from '../lib/catalog/tv-catalog';
import { SERIES } from '../lib/catalog/tv-series';

const LOCAL_URL = 'http://127.0.0.1:55321';
const LOCAL_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const db = createClient(
  process.env.SUPABASE_URL ?? LOCAL_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? LOCAL_SERVICE_KEY,
  { auth: { persistSession: false } },
);

// De echte helloTV-filialen. type: 'xl' | 'standaard'. opent: null = open, anders opening-maand.
const FILIALEN = [
  // XL-filialen
  { id: 'alk', naam: 'HelloTV Alkmaar', plaats: 'Alkmaar', adres: 'Huiswaarderplein 11A', postcode: '1823 CP', type: 'xl', opent: null, lat: 52.632, lng: 4.749 },
  { id: 'bop', naam: 'HelloTV Bergen op Zoom', plaats: 'Bergen op Zoom', adres: 'Van Konijnenburgweg 23', postcode: '4612 RC', type: 'xl', opent: null, lat: 51.495, lng: 4.29 },
  { id: 'cru', naam: 'HelloTV Cruquius', plaats: 'Cruquius', adres: 'Cruquiuszoom 49', postcode: '2142 EW', type: 'xl', opent: null, lat: 52.343, lng: 4.633 },
  { id: 'dui', naam: 'HelloTV Duiven', plaats: 'Duiven', adres: 'Nieuwgraaf 13', postcode: '6921 RJ', type: 'xl', opent: null, lat: 51.947, lng: 5.997 },
  { id: 'ein', naam: 'HelloTV Eindhoven', plaats: 'Eindhoven', adres: 'Ekkersrijt 4009', postcode: '5692 DB', type: 'xl', opent: null, lat: 51.49, lng: 5.49 },
  { id: 'rot', naam: 'HelloTV Rotterdam', plaats: 'Rotterdam', adres: 'Vierhavensstraat 169', postcode: '3029 BB', type: 'xl', opent: null, lat: 51.912, lng: 4.43 },
  { id: 'til', naam: 'HelloTV Tilburg', plaats: 'Tilburg', adres: 'Aabe-straat 58', postcode: '5021 AV', type: 'xl', opent: null, lat: 51.56, lng: 5.079 },
  { id: 'utr', naam: 'HelloTV Utrecht', plaats: 'Utrecht', adres: 'Hollantlaan 1', postcode: '3526 AL', type: 'xl', opent: null, lat: 52.066, lng: 5.095 },
  // Standaard & nieuwe filialen
  { id: 'ams', naam: 'HelloTV Amsterdam', plaats: 'Amsterdam', adres: 'Daniël Goedkoopstraat 21b', postcode: '1096 BD', type: 'standaard', opent: 'oktober 2026', lat: 52.336, lng: 4.933 },
  { id: 'ape', naam: 'HelloTV Apeldoorn', plaats: 'Apeldoorn', adres: 'De Voorwaarts 738', postcode: '7321 BT', type: 'standaard', opent: 'augustus 2026', lat: 52.226, lng: 5.985 },
  { id: 'bre', naam: 'HelloTV Breda', plaats: 'Breda', adres: 'Ettensebaan 17A', postcode: '4812 XA', type: 'standaard', opent: null, lat: 51.585, lng: 4.74 },
  { id: 'dbo', naam: 'HelloTV Den Bosch', plaats: 'Den Bosch', adres: 'Goudsmidstraat 24', postcode: '5232 BP', type: 'standaard', opent: null, lat: 51.706, lng: 5.301 },
  { id: 'doe', naam: 'HelloTV Doetinchem', plaats: 'Doetinchem', adres: 'Innovatieweg 18', postcode: '7007 CD', type: 'standaard', opent: null, lat: 51.965, lng: 6.288 },
  { id: 'gro', naam: 'HelloTV Groningen', plaats: 'Groningen', adres: 'Roskildeweg 15', postcode: '9723 MA', type: 'standaard', opent: null, lat: 53.203, lng: 6.512 },
  { id: 'lee', naam: 'HelloTV Leeuwarden', plaats: 'Leeuwarden', adres: 'De Centrale 26', postcode: '8924 CZ', type: 'standaard', opent: null, lat: 53.185, lng: 5.826 },
  { id: 'naa', naam: 'HelloTV Naarden', plaats: 'Naarden', adres: 'Bronsstraat 10', postcode: '1411 AV', type: 'standaard', opent: null, lat: 52.295, lng: 5.145 },
  { id: 'nij', naam: 'HelloTV Nijmegen', plaats: 'Nijmegen', adres: 'Molenstraat 76', postcode: '6511 HH', type: 'standaard', opent: null, lat: 51.844, lng: 5.862 },
  { id: 'zoe', naam: 'HelloTV Zoeterwoude', plaats: 'Zoeterwoude', adres: 'Hoge Rijndijk 293', postcode: '2382 AN', type: 'standaard', opent: null, lat: 52.135, lng: 4.545 },
];

const VERKOPERS = [
  { id: 'youri', naam: 'Youri', kleur: '#2563B8', filiaal_id: 'alk', rol: 'verkoper' },
  { id: 'calvin', naam: 'Calvin', kleur: '#0B7A53', filiaal_id: 'rot', rol: 'verkoper' },
  { id: 'ivo', naam: 'Ivo', kleur: '#C13443', filiaal_id: 'utr', rol: 'verkoper' },
  { id: 'sanne', naam: 'Sanne', kleur: '#9A6400', filiaal_id: 'til', rol: 'manager' },
  { id: 'mees', naam: 'Mees', kleur: '#6B4EAA', filiaal_id: 'ein', rol: 'verkoper' },
  { id: 'fleur', naam: 'Fleur', kleur: '#B85C00', filiaal_id: 'gro', rol: 'verkoper' },
];

// Volledige 2025/2026 Benelux-catalogus (gegenereerd, gedeeld met PriceScan → EAN-brug automatisch).
type Klasse = 'OLED' | 'QLED' | 'Mini-LED' | 'LED';
const CAT = buildCatalog(SERIES);
const TOESTELLEN = CAT.map((item, idx) => ({
  id: idx + 1,
  merk: item.merk,
  model: item.model_name,
  type: item.model_number,
  ean: item.ean,
  inch: item.inch,
  klasse: item.klasse as Klasse,
  inkoop_c: item.inkoop_c,
  ticket_c: item.ticket_c,
  min_marge_c: item.min_marge_c,
  snelheid: ((item.inch + idx) % 10) + 1,
  specs: `${item.panel} · ${item.inch}" · UHD 4K · ${item.jaar}`,
}));

const KLANTEN = [
  {
    naam: 'Jan Bakker',
    email: 'j.bakker@gmail.com',
    segment: 'Consument',
    prijsfactor: 1.0,
    telefoon: '06-24815503',
  },
  {
    naam: 'Horeca Groep NL',
    email: 'info@horecagroep.nl',
    segment: 'Zakelijk',
    prijsfactor: 0.92,
    telefoon: '010-4457781',
  },
  {
    naam: 'Marije de Vries',
    email: 'm.devries@outlook.com',
    segment: 'Loyaliteit Goud',
    prijsfactor: 0.95,
    telefoon: '06-31552048',
  },
  {
    naam: 'Hotel Zon',
    email: 'inkoop@hotelzon.nl',
    segment: 'Zakelijk',
    prijsfactor: 0.9,
    telefoon: '020-6689120',
  },
  {
    naam: 'Peter Jansen',
    email: 'p.jansen@ziggo.nl',
    segment: 'Consument',
    prijsfactor: 1.0,
    telefoon: '06-14229087',
  },
  {
    naam: 'Sophie Smit',
    email: 's.smit@kpnmail.nl',
    segment: 'Loyaliteit Zilver',
    prijsfactor: 0.97,
    telefoon: '06-55098412',
  },
];

const VERKOPEN = [
  {
    toestel_id: 4,
    model: 'LG OLED evo C4',
    type_nr: 'OLED48C4',
    klant: 'Jan Bakker',
    verkoper_id: 'youri',
    waarde: 1299,
    status: 'lead',
  },
  {
    toestel_id: 8,
    model: 'Sony Bravia 8',
    type_nr: 'K55XR80',
    klant: 'Sophie Smit',
    verkoper_id: 'calvin',
    waarde: 1899,
    status: 'lead',
  },
  {
    toestel_id: 2,
    model: 'Samsung OLED S90D',
    type_nr: 'QE55S90D',
    klant: 'Peter Jansen',
    verkoper_id: 'ivo',
    waarde: 1499,
    status: 'offerte',
  },
  {
    toestel_id: 9,
    model: 'Philips OLED809',
    type_nr: '48OLED809',
    klant: 'Marije de Vries',
    verkoper_id: 'sanne',
    waarde: 1349,
    status: 'offerte',
  },
  {
    toestel_id: 11,
    model: 'TCL C805',
    type_nr: '75C805',
    klant: 'Hotel Zon',
    verkoper_id: 'mees',
    waarde: 1399,
    status: 'verkocht',
  },
  {
    toestel_id: 3,
    model: 'Samsung Neo QLED QN90D',
    type_nr: 'QN65QN90D',
    klant: 'Horeca Groep NL',
    verkoper_id: 'fleur',
    waarde: 2299,
    status: 'verkocht',
  },
  {
    toestel_id: 5,
    model: 'LG OLED evo G4',
    type_nr: 'OLED65G4',
    klant: 'Jan Bakker',
    verkoper_id: 'youri',
    waarde: 2999,
    status: 'geleverd',
  },
  {
    toestel_id: 10,
    model: 'Philips The One',
    type_nr: '50PUS8909',
    klant: 'Sophie Smit',
    verkoper_id: 'calvin',
    waarde: 649,
    status: 'geleverd',
  },
];

const TAKEN = [
  { titel: 'Voorraad LG OLED evo C5 aanvullen Groningen', persoon_id: 'youri', status: 'te-doen' },
  { titel: 'Prijsafspraak Hotel Zon bevestigen', persoon_id: 'mees', status: 'te-doen' },
  { titel: 'Samsung The Frame etalage opzetten', persoon_id: 'fleur', status: 'te-doen' },
  { titel: 'VMS-afwijking Samsung Neo QLED QN90F uitzoeken', persoon_id: 'ivo', status: 'bezig' },
  { titel: 'Marge-actie Sony BRAVIA 8 II opstellen', persoon_id: 'calvin', status: 'bezig' },
  { titel: 'Offerte Marije de Vries nabellen', persoon_id: 'sanne', status: 'review' },
  { titel: 'Retour LG OLED evo G5 verwerken', persoon_id: 'youri', status: 'review' },
  { titel: 'Weekrapport marges afronden', persoon_id: 'ivo', status: 'klaar' },
  { titel: 'Trainingsmoment nieuwe TCL C-serie', persoon_id: 'mees', status: 'klaar' },
];

const BIJVERKOOP = [
  { naam: 'HDMI 2.1 kabel 2m', categorie: 'Kabel', prijs: 24.95, marge: 18 },
  { naam: 'Muurbeugel + montage', categorie: 'Montage', prijs: 129, marge: 70 },
  { naam: 'Soundbar Denon Home', categorie: 'Audio', prijs: 299, marge: 90 },
  { naam: '5 jaar garantie', categorie: 'Service', prijs: 149, marge: 120 },
];

const FLAGS = [
  ['scan.auto_detectie', true, 'NFC/BLE auto-herkenning'],
  ['scan.privacyscherm', true, 'verkoper/klant-toggle'],
  ['scan.combideals', true, 'bijverkoop-selectie'],
  ['scan.alternatieven', true, 'alternatieven zelfde klasse'],
  ['scan.centraal_magazijn', true, 'centraal + ETA in voorraadblok'],
  ['scan.toon_service', true, 'service-highlights'],
  ['voorraad.vms_sync', true, 'sync-knop + statusindicator'],
  ['voorraad.vms_afwijking', true, 'wijkt-af-van-VMS-markering'],
  ['dashboard.marge_gauge', true, 'marge-gauge op dashboard'],
  ['aanbieding.spraakinvoer', true, 'Web Speech API'],
  ['aanbieding.mail_klant', true, 'e-mail versturen'],
  ['toestel.prijs_bewerken', true, 'ticketprijs editable (manager)'],
  ['notificaties', true, 'notificatie-bel'],
  ['filialen.kaart', false, 'geo-kaartweergave'],
  ['agenda', false, 'agenda-module zichtbaar'],
  ['overig.koppelingen', false, 'VMS/e-mail/Drive integraties'],
  ['overig.rapportage_csv', false, 'rapportage + CSV-export'],
] as const;

const c = (euro: number) => Math.round(euro * 100);
// EAN-brug is automatisch: toestellen en PriceScan-producten komen uit dezelfde catalogus in
// dezelfde volgorde, dus toestel[i].ean == product[i].ean. Eén chip → in beide apps herkend.
const toestelById = new Map(TOESTELLEN.map((t) => [t.id, t]));

async function reset() {
  for (const t of [
    'verkoop_events',
    'aanbiedingen',
    'voorraad',
    'centraal_magazijn',
    'verkopen',
    'taken',
    'agenda_items',
    'notificaties',
    'targets',
    'integraties',
    'vms_sync_log',
    'bijverkoop',
    'klanten',
  ]) {
    await db.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  await db.from('toestellen').delete().neq('id', -1);
  await db.from('verkopers').delete().neq('id', '');
  await db.from('filialen').delete().neq('id', '');
  await db.from('feature_flags').delete().neq('key', '');
}

async function main() {
  console.log(`Sales Tracker seeden tegen ${process.env.SUPABASE_URL ?? LOCAL_URL}`);
  await reset();

  await ins('filialen', FILIALEN);
  await ins('verkopers', VERKOPERS);
  await ins(
    'toestellen',
    TOESTELLEN.map((t) => ({
      id: t.id,
      merk: t.merk,
      model: t.model,
      type_nr: t.type,
      ean: t.ean,
      inch: t.inch,
      klasse: t.klasse,
      inkoop_c: t.inkoop_c,
      ticket_c: t.ticket_c,
      min_marge_c: t.min_marge_c,
      verkoopsnelheid: t.snelheid,
      specs: t.specs,
    })),
  );
  await ins(
    'voorraad',
    TOESTELLEN.flatMap((t) =>
      FILIALEN.map((f, i) => {
        // Nog niet geopende filialen hebben geen voorraad.
        if (f.opent) return { toestel_id: t.id, filiaal_id: f.id, aantal: 0 };
        // Deterministisch: niet elk model in elk filiaal, XL heeft meer.
        const basis = (t.id * 7 + i * 13) % 6; // 0..5
        const factor = f.type === 'xl' ? 1.5 : 0.8;
        return { toestel_id: t.id, filiaal_id: f.id, aantal: Math.max(0, Math.round(basis * factor)) };
      }),
    ),
  );
  await ins(
    'centraal_magazijn',
    TOESTELLEN.map((t) => ({
      toestel_id: t.id,
      aantal: (t.id * 3) % 9,
      eta_dagen: 2 + (t.id % 4),
    })),
  );
  await ins('klanten', KLANTEN);
  await ins(
    'bijverkoop',
    BIJVERKOOP.map((b) => ({
      naam: b.naam,
      categorie: b.categorie,
      prijs_c: c(b.prijs),
      marge_c: c(b.marge),
    })),
  );
  await ins(
    'verkopen',
    VERKOPEN.map((v) => ({
      toestel_id: v.toestel_id,
      // Model/typenr uit de echte catalogus halen (snapshot bij verkoop).
      model: toestelById.get(v.toestel_id)?.model ?? v.model,
      type_nr: toestelById.get(v.toestel_id)?.type ?? v.type_nr,
      klant: v.klant,
      verkoper_id: v.verkoper_id,
      waarde_c: c(v.waarde),
      status: v.status,
    })),
  );
  await ins('taken', TAKEN);
  await ins('targets', [
    {
      periode: 'deze-maand',
      omzet_c: c(184500),
      omzet_doel_c: c(250000),
      marge_pct: 21.4,
      marge_doel_pct: 23,
    },
  ]);
  // Lifetime-marge events (paar per toestel).
  await ins(
    'verkoop_events',
    TOESTELLEN.flatMap((t) =>
      Array.from({ length: (t.id % 3) + 1 }, () => ({
        toestel_id: t.id,
        marge_c: t.ticket_c - t.inkoop_c,
      })),
    ),
  );
  await ins(
    'feature_flags',
    FLAGS.map(([key, enabled, beschrijving]) => ({
      key,
      enabled,
      beschrijving,
      rol_scope: key === 'toestel.prijs_bewerken' ? 'manager' : null,
    })),
  );
  await ins('notificaties', [
    { type: 'voorraad', tekst: 'LG OLED evo C5 65" laag op voorraad in Rotterdam', gelezen: false },
    { type: 'marge', tekst: 'Sony BRAVIA 8 II onder marge-drempel na inkoopstijging', gelezen: false },
    { type: 'verkoop', tekst: 'Nieuwe lead: Samsung OLED S95F 65" — Peter Jansen', gelezen: false },
    { type: 'systeem', tekst: 'VMS-sync voltooid — 368 modellen bijgewerkt', gelezen: true },
  ]);
  const today = new Date();
  const iso = (d: number) =>
    new Date(today.getFullYear(), today.getMonth(), d).toISOString().slice(0, 10);
  await ins('agenda_items', [
    {
      datum: iso(today.getDate()),
      tijd: '10:00',
      titel: 'Teamoverleg marges',
      type: 'activiteit',
      locatie: 'Rotterdam',
    },
    {
      datum: iso(today.getDate() + 1),
      tijd: '14:30',
      titel: 'Levering Hotel Zon (TCL C8K 75")',
      type: 'herinnering',
      locatie: 'Eindhoven',
    },
    {
      datum: iso(today.getDate() + 3),
      tijd: '11:00',
      titel: 'Samsung The Frame etalage opzetten',
      type: 'activiteit',
      locatie: 'Groningen',
    },
    {
      datum: iso(Math.max(1, today.getDate() - 2)),
      tijd: '09:00',
      titel: 'Weekrapport afronden',
      type: 'herinnering',
      locatie: null,
    },
  ]);
  await ins('integraties', [
    { soort: 'vms', status: 'verbonden', config_json: {} },
    { soort: 'email', status: 'niet-verbonden', config_json: {} },
    { soort: 'drive', status: 'niet-verbonden', config_json: {} },
  ]);

  // Voorbeeld-RFID-chips gekoppeld aan de eerste toestellen (voor demo/handmatig testen).
  // Vervang deze door je eigen chip-EPC's zodra je die inscant.
  const demoChips = TOESTELLEN.slice(0, 4).map((t, i) => ({
    epc: `E2801170000002000000A0${(i + 1).toString(16).toUpperCase().padStart(2, '0')}`,
    toestel_id: t.id,
    status: 'active',
  }));
  await ins('toestel_tags', demoChips);

  // EAN-brug: spiegel de demo-chips ook naar PriceScan rfid_tags via het gedeelde EAN,
  // zodat dezelfde chip meteen in beide apps herkend wordt. Best-effort.
  for (const chip of demoChips) {
    const e = toestelById.get(chip.toestel_id)?.ean;
    if (!e) continue;
    const { data: product } = await db.from('products').select('id').eq('ean', e).maybeSingle();
    if (product) {
      await db.from('rfid_tags').upsert({
        epc: chip.epc,
        product_id: product.id,
        status: 'active',
        linked_at: new Date().toISOString(),
      });
    }
  }

  await report();
}

async function ins(table: string, rows: unknown[]) {
  // In batches i.v.m. de grote catalogus (bv. ~5.700 voorraadregels).
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).insert(rows.slice(i, i + 500) as never);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function report() {
  console.log('\n=== counts ===');
  for (const t of [
    'filialen',
    'verkopers',
    'toestellen',
    'voorraad',
    'klanten',
    'verkopen',
    'taken',
    'feature_flags',
  ]) {
    const { count } = await db.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t.padEnd(16)} ${count ?? 0}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
