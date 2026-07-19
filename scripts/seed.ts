/**
 * Seed voor helloTV PriceScan (B2). Deterministisch.
 * Draait tegen de Supabase in SUPABASE_URL met SUPABASE_SERVICE_ROLE_KEY (lokaal of remote).
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm tsx scripts/seed.ts
 */
import { createClient } from '@supabase/supabase-js';

// Zonder env vars valt de seed terug op de lokale Supabase (vaste dev-keys, geen secret).
const LOCAL_URL = 'http://127.0.0.1:55321';
const LOCAL_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const url = process.env.SUPABASE_URL ?? LOCAL_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? LOCAL_SERVICE_KEY;
const db = createClient(url, key, { auth: { persistSession: false } });
console.log(`Seeden tegen ${url}`);

const VAT = 21;
const BRANDS = ['Samsung', 'LG', 'Sony', 'Philips', 'TCL', 'Hisense'];

// Basisprijs (incl. btw, centen) per schermmaat; segment schaalt mee.
const SIZE_BASE: Record<number, number> = {
  43: 49900,
  48: 64900,
  50: 69900,
  55: 99900,
  65: 149900,
  75: 219900,
  85: 329900,
};
const SEG_MULT: Record<string, number> = { budget: 0.8, mid: 1.0, premium: 1.3 };
const MARGINS = [
  8, 12, 15, 18, 22, 25, 28, 10, 14, 17, 20, 24, 9, 13, 16, 19, 23, 26, 11, 15, 21, 27, 12, 18,
];

type Panel = 'LED' | 'QLED' | 'MiniLED' | 'OLED';
type Segment = 'budget' | 'mid' | 'premium';
interface Spec {
  key: string;
  brand: string;
  model_name: string;
  model_number: string;
  model_year: 2025 | 2026;
  ean: string;
  size: number;
  panel: Panel;
  segment: Segment;
  status: 'active' | 'eol';
  successorKey?: string;
}

// 24 modellen (4 per merk), gespreid over jaar/maat/segment. 2 EOL met opvolger.
const SPECS: Spec[] = [
  // Samsung — 1 EOL (2025) -> opvolger 2026
  {
    key: 'sam1',
    brand: 'Samsung',
    model_name: 'Samsung Neo QLED 55" QN90F',
    model_number: 'QN55QN90F',
    model_year: 2026,
    ean: '8806090000011',
    size: 55,
    panel: 'MiniLED',
    segment: 'premium',
    status: 'active',
  },
  {
    key: 'sam2',
    brand: 'Samsung',
    model_name: 'Samsung Crystal UHD 43" DU7100',
    model_number: 'UE43DU7100',
    model_year: 2025,
    ean: '8806090000012',
    size: 43,
    panel: 'LED',
    segment: 'budget',
    status: 'eol',
    successorKey: 'sam4',
  },
  {
    key: 'sam3',
    brand: 'Samsung',
    model_name: 'Samsung QLED 65" Q80F',
    model_number: 'QE65Q80F',
    model_year: 2026,
    ean: '8806090000013',
    size: 65,
    panel: 'QLED',
    segment: 'mid',
    status: 'active',
  },
  {
    key: 'sam4',
    brand: 'Samsung',
    model_name: 'Samsung Crystal UHD 50" DU8000',
    model_number: 'UE50DU8000',
    model_year: 2026,
    ean: '8806090000014',
    size: 50,
    panel: 'LED',
    segment: 'budget',
    status: 'active',
  },
  // LG — 1 EOL (2025) -> opvolger 2026
  {
    key: 'lg1',
    brand: 'LG',
    model_name: 'LG OLED evo 55" C5',
    model_number: 'OLED55C5',
    model_year: 2025,
    ean: '8806090000021',
    size: 55,
    panel: 'OLED',
    segment: 'premium',
    status: 'active',
  },
  {
    key: 'lg2',
    brand: 'LG',
    model_name: 'LG OLED evo 65" C4',
    model_number: 'OLED65C4',
    model_year: 2025,
    ean: '8806090000022',
    size: 65,
    panel: 'OLED',
    segment: 'premium',
    status: 'eol',
    successorKey: 'lg3',
  },
  {
    key: 'lg3',
    brand: 'LG',
    model_name: 'LG OLED evo 65" C5',
    model_number: 'OLED65C5',
    model_year: 2026,
    ean: '8806090000023',
    size: 65,
    panel: 'OLED',
    segment: 'premium',
    status: 'active',
  },
  {
    key: 'lg4',
    brand: 'LG',
    model_name: 'LG QNED 75" QNED85',
    model_number: 'QNED75QNED85',
    model_year: 2026,
    ean: '8806090000024',
    size: 75,
    panel: 'MiniLED',
    segment: 'mid',
    status: 'active',
  },
  // Sony
  {
    key: 'sony1',
    brand: 'Sony',
    model_name: 'Sony BRAVIA 8 OLED 55"',
    model_number: 'K55XR80',
    model_year: 2025,
    ean: '8806090000031',
    size: 55,
    panel: 'OLED',
    segment: 'premium',
    status: 'active',
  },
  {
    key: 'sony2',
    brand: 'Sony',
    model_name: 'Sony BRAVIA 7 MiniLED 65"',
    model_number: 'K65XR70',
    model_year: 2026,
    ean: '8806090000032',
    size: 65,
    panel: 'MiniLED',
    segment: 'premium',
    status: 'active',
  },
  {
    key: 'sony3',
    brand: 'Sony',
    model_name: 'Sony BRAVIA 3 LED 50"',
    model_number: 'K50S30',
    model_year: 2025,
    ean: '8806090000033',
    size: 50,
    panel: 'LED',
    segment: 'mid',
    status: 'active',
  },
  {
    key: 'sony4',
    brand: 'Sony',
    model_name: 'Sony BRAVIA 9 MiniLED 85"',
    model_number: 'K85XR90',
    model_year: 2026,
    ean: '8806090000034',
    size: 85,
    panel: 'MiniLED',
    segment: 'premium',
    status: 'active',
  },
  // Philips
  {
    key: 'phi1',
    brand: 'Philips',
    model_name: 'Philips OLED810 48"',
    model_number: '48OLED810',
    model_year: 2026,
    ean: '8806090000041',
    size: 48,
    panel: 'OLED',
    segment: 'mid',
    status: 'active',
  },
  {
    key: 'phi2',
    brand: 'Philips',
    model_name: 'Philips The One 55" PUS8909',
    model_number: '55PUS8909',
    model_year: 2025,
    ean: '8806090000042',
    size: 55,
    panel: 'LED',
    segment: 'mid',
    status: 'active',
  },
  {
    key: 'phi3',
    brand: 'Philips',
    model_name: 'Philips OLED910 65"',
    model_number: '65OLED910',
    model_year: 2026,
    ean: '8806090000043',
    size: 65,
    panel: 'OLED',
    segment: 'premium',
    status: 'active',
  },
  {
    key: 'phi4',
    brand: 'Philips',
    model_name: 'Philips PUS7009 43"',
    model_number: '43PUS7009',
    model_year: 2025,
    ean: '8806090000044',
    size: 43,
    panel: 'LED',
    segment: 'budget',
    status: 'active',
  },
  // TCL
  {
    key: 'tcl1',
    brand: 'TCL',
    model_name: 'TCL C805 75" MiniLED',
    model_number: '75C805',
    model_year: 2025,
    ean: '8806090000051',
    size: 75,
    panel: 'MiniLED',
    segment: 'mid',
    status: 'active',
  },
  {
    key: 'tcl2',
    brand: 'TCL',
    model_name: 'TCL C755 65" MiniLED',
    model_number: '65C755',
    model_year: 2026,
    ean: '8806090000052',
    size: 65,
    panel: 'MiniLED',
    segment: 'mid',
    status: 'active',
  },
  {
    key: 'tcl3',
    brand: 'TCL',
    model_name: 'TCL P755 50" LED',
    model_number: '50P755',
    model_year: 2025,
    ean: '8806090000053',
    size: 50,
    panel: 'LED',
    segment: 'budget',
    status: 'active',
  },
  {
    key: 'tcl4',
    brand: 'TCL',
    model_name: 'TCL C855 85" MiniLED',
    model_number: '85C855',
    model_year: 2026,
    ean: '8806090000054',
    size: 85,
    panel: 'MiniLED',
    segment: 'premium',
    status: 'active',
  },
  // Hisense
  {
    key: 'his1',
    brand: 'Hisense',
    model_name: 'Hisense U7N 65" MiniLED',
    model_number: '65U7N',
    model_year: 2025,
    ean: '8806090000061',
    size: 65,
    panel: 'MiniLED',
    segment: 'mid',
    status: 'active',
  },
  {
    key: 'his2',
    brand: 'Hisense',
    model_name: 'Hisense U8Q 75" MiniLED',
    model_number: '75U8Q',
    model_year: 2026,
    ean: '8806090000062',
    size: 75,
    panel: 'MiniLED',
    segment: 'premium',
    status: 'active',
  },
  {
    key: 'his3',
    brand: 'Hisense',
    model_name: 'Hisense E7Q 55" QLED',
    model_number: '55E7Q',
    model_year: 2026,
    ean: '8806090000063',
    size: 55,
    panel: 'QLED',
    segment: 'budget',
    status: 'active',
  },
  {
    key: 'his4',
    brand: 'Hisense',
    model_name: 'Hisense A6N 43" LED',
    model_number: '43A6N',
    model_year: 2025,
    ean: '8806090000064',
    size: 43,
    panel: 'LED',
    segment: 'budget',
    status: 'active',
  },
];

function salePriceCents(size: number, segment: Segment): number {
  const base = SIZE_BASE[size] ?? 99900;
  return Math.round((base * SEG_MULT[segment]) / 100) * 100 - 100; // eindigt op ,99
}

async function reset() {
  // Kinderen eerst i.v.m. FK's.
  for (const t of [
    'scan_events',
    'price_history',
    'price_quarantine',
    'rfid_tags',
    'stock_levels',
    'prices',
    'vendit_articles',
    'alternative_overrides',
  ]) {
    await db.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  await db
    .from('products')
    .update({ successor_id: null })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('brands').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

async function main() {
  await reset();

  // Merken
  const { data: brandRows, error: bErr } = await db
    .from('brands')
    .insert(BRANDS.map((name) => ({ name })))
    .select('id,name');
  if (bErr) throw bErr;
  const brandId = new Map(brandRows!.map((b) => [b.name, b.id as string]));

  // Producten
  const { data: prodRows, error: pErr } = await db
    .from('products')
    .insert(
      SPECS.map((s) => ({
        brand_id: brandId.get(s.brand)!,
        model_name: s.model_name,
        model_number: s.model_number,
        model_year: s.model_year,
        ean: s.ean,
        screen_size_inch: s.size,
        panel_type: s.panel,
        segment: s.segment,
        sku_hellotv: `HTV-${s.model_number}`,
        status: s.status,
      })),
    )
    .select('id,model_number');
  if (pErr) throw pErr;
  const pid = new Map<string, string>();
  SPECS.forEach((s) => {
    const row = prodRows!.find((r) => r.model_number === s.model_number);
    if (row) pid.set(s.key, row.id as string);
  });

  // Opvolgers (EOL -> 2026)
  for (const s of SPECS) {
    if (s.successorKey) {
      await db
        .from('products')
        .update({ successor_id: pid.get(s.successorKey) })
        .eq('id', pid.get(s.key));
    }
  }

  // Prijzen (marge 8–28%)
  const priceRows = SPECS.map((s, i) => {
    const sale = salePriceCents(s.size, s.segment);
    const excl = Math.round((sale * 100) / (100 + VAT));
    const marginPct = MARGINS[i % MARGINS.length];
    const purchase = Math.round(excl * (1 - marginPct / 100));
    return {
      product_id: pid.get(s.key)!,
      purchase_price_cents: purchase,
      sale_price_cents: sale,
      sale_price_includes_vat: true,
      vat_pct: VAT,
      currency: 'EUR',
      valid_from: new Date('2026-07-01T00:00:00Z').toISOString(),
      last_synced_at: new Date().toISOString(),
    };
  });
  const { error: prErr } = await db.from('prices').insert(priceRows);
  if (prErr) throw prErr;

  // Voorraad over 2 locaties
  const stockRows = SPECS.flatMap((s, i) => [
    {
      product_id: pid.get(s.key)!,
      location_code: 'WINKEL',
      location_name: 'Winkel Oosterhout',
      qty: (i * 3) % 7,
    },
    {
      product_id: pid.get(s.key)!,
      location_code: 'MAGAZIJN',
      location_name: 'Centraal magazijn',
      qty: (i * 2 + 1) % 11,
    },
  ]);
  const { error: sErr } = await db.from('stock_levels').insert(stockRows);
  if (sErr) throw sErr;

  // RFID: 12 gekoppeld + 5 ongekoppeld
  const linked = SPECS.slice(0, 12).map((s, i) => ({
    epc: `E280117000000200000000${(i + 10).toString(16).toUpperCase().padStart(2, '0')}`,
    product_id: pid.get(s.key)!,
    status: 'active',
    linked_at: new Date().toISOString(),
  }));
  const unlinked = Array.from({ length: 5 }, (_, i) => ({
    epc: `E280117000000200000009${(i + 90).toString(16).toUpperCase().padStart(2, '0')}`,
    product_id: null,
    status: 'active',
  }));
  const { error: tErr } = await db.from('rfid_tags').insert([...linked, ...unlinked]);
  if (tErr) throw tErr;

  // Settings
  const { error: setErr } = await db.from('settings').upsert([
    { key: 'margin_alert_threshold_pct', value: 10 },
    { key: 'quarantine_delta_pct', value: 40 },
    { key: 'vat_pct', value: 21 },
    { key: 'alternatives_size_tolerance_inch', value: 5 },
  ]);
  if (setErr) throw setErr;

  await report();
}

async function report() {
  const tables = [
    'brands',
    'products',
    'vendit_articles',
    'prices',
    'stock_levels',
    'rfid_tags',
    'scan_events',
    'sync_runs',
    'settings',
  ];
  console.log('\n=== Counts per tabel ===');
  for (const t of tables) {
    const { count } = await db.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t.padEnd(18)} ${count ?? 0}`);
  }
  console.log('\n=== 3 voorbeeldmarges (generated kolommen) ===');
  const { data } = await db
    .from('prices')
    .select(
      'sale_price_cents, purchase_price_cents, margin_cents, margin_pct, products(model_name)',
    )
    .order('margin_pct', { ascending: false })
    .limit(3);
  for (const r of (data ?? []) as any[]) {
    console.log(
      `${(r.products?.model_name ?? '').padEnd(34)} verkoop €${(r.sale_price_cents / 100).toFixed(2)}  inkoop €${(r.purchase_price_cents / 100).toFixed(2)}  marge €${(r.margin_cents / 100).toFixed(2)} (${r.margin_pct}%)`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
