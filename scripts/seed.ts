/**
 * Seed voor helloTV PriceScan (B2). Deterministisch.
 * Draait tegen de Supabase in SUPABASE_URL met SUPABASE_SERVICE_ROLE_KEY (lokaal of remote).
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm tsx scripts/seed.ts
 */
import { createClient } from '@supabase/supabase-js';
import { buildCatalog } from '../lib/catalog/tv-catalog';
import { SERIES } from '../lib/catalog/tv-series';

// Zonder env vars valt de seed terug op de lokale Supabase (vaste dev-keys, geen secret).
const LOCAL_URL = 'http://127.0.0.1:55321';
const LOCAL_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const url = process.env.SUPABASE_URL ?? LOCAL_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? LOCAL_SERVICE_KEY;
const db = createClient(url, key, { auth: { persistSession: false } });
console.log(`Seeden tegen ${url}`);

const VAT = 21;
const BRANDS = ['Samsung', 'LG', 'Sony', 'Philips', 'TCL'];

// Volledige 2025/2026 Benelux-catalogus, gegenereerd uit de gescrapete line-ups. Geen Hisense.
const CAT = buildCatalog(SERIES);

// DB-enum panel_type kent 'MiniLED' (zonder streepje) en geen 'QD-OLED' (→ OLED).
const PANEL_DB: Record<string, 'LED' | 'QLED' | 'MiniLED' | 'OLED'> = {
  LED: 'LED',
  QLED: 'QLED',
  'Mini-LED': 'MiniLED',
  OLED: 'OLED',
};

// Geschatte inkoopmarge per segment (excl. btw) tot Vendit de echte inkoop levert.
const SEG_MARGE: Record<string, number> = { budget: 9, mid: 13, premium: 17 };

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

  // Producten — volledige gegenereerde catalogus (317 modellen).
  const { data: prodRows, error: pErr } = await db
    .from('products')
    .insert(
      CAT.map((c) => ({
        brand_id: brandId.get(c.merk)!,
        model_name: c.model_name,
        model_number: c.model_number,
        model_year: c.jaar,
        ean: c.ean,
        screen_size_inch: c.inch,
        panel_type: PANEL_DB[c.klasse],
        segment: c.segment,
        sku_hellotv: `HTV-${c.model_number}`,
        status: c.status,
      })),
    )
    .select('id,model_number');
  if (pErr) throw pErr;
  const pid = new Map<string, string>();
  const rowByNr = new Map((prodRows ?? []).map((r) => [r.model_number, r.id as string]));
  CAT.forEach((c) => {
    const id = rowByNr.get(c.model_number);
    if (id) pid.set(c.key, id);
  });

  // Prijzen — verkoop = ticket (incl. btw); inkoop (excl. btw) via geschatte segmentmarge.
  const priceRows = CAT.map((c) => {
    const sale = c.ticket_c;
    const excl = Math.round((sale * 100) / (100 + VAT));
    const purchase = Math.round(excl * (1 - SEG_MARGE[c.segment] / 100));
    return {
      product_id: pid.get(c.key)!,
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

  // Voorraad over 2 locaties (deterministisch, niet elk model op voorraad).
  const stockRows = CAT.flatMap((c, i) => [
    { product_id: pid.get(c.key)!, location_code: 'WINKEL', location_name: 'Winkel Oosterhout', qty: (i * 3) % 7 },
    { product_id: pid.get(c.key)!, location_code: 'MAGAZIJN', location_name: 'Centraal magazijn', qty: (i * 2 + 1) % 11 },
  ]);
  const { error: sErr } = await db.from('stock_levels').insert(stockRows);
  if (sErr) throw sErr;

  // RFID: eerste 12 modellen gekoppeld + 5 ongekoppeld (demo).
  const linked = CAT.slice(0, 12).map((c, i) => ({
    epc: `E280117000000200000000${(i + 10).toString(16).toUpperCase().padStart(2, '0')}`,
    product_id: pid.get(c.key)!,
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
