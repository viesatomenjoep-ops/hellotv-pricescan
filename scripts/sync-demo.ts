/**
 * C3-demo: draait de sync 2x tegen de MockVenditAdapter en toont history/quarantaine/alerts.
 *   pnpm sync:demo   (valt terug op de lokale Supabase)
 *
 * Run 1 = eerste prijzen (geen delta). Run 2 = 3 matige wijzigingen (history) + 1 extreme
 * (+65% -> quarantaine). Herseed daarna met `pnpm db:seed` om de app-data te herstellen.
 */
import { createClient } from '@supabase/supabase-js';
import { MockVenditAdapter } from '../lib/vendit/mock';
import { runSync } from '../lib/vendit/run-sync';

const LOCAL_URL = 'http://127.0.0.1:55321';
const LOCAL_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
process.env.SUPABASE_URL ??= LOCAL_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY ??= LOCAL_SERVICE_KEY;

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function main() {
  // Schone basis: prijzen leeg (zodat run 1 "eerste prijs ooit" is).
  await db.from('price_quarantine').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('price_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('prices').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const adapter = new MockVenditAdapter();

  console.log('--- RUN 1 (eerste prijzen) ---');
  const r1 = await runSync(adapter);
  console.log(r1);

  console.log('\n--- RUN 2 (3 matig + 1 extreme) ---');
  const r2 = await runSync(adapter);
  console.log(r2);

  const { count: histCount } = await db
    .from('price_history')
    .select('*', { count: 'exact', head: true })
    .eq('sync_run_id', r2.runId);
  const { data: quar } = await db
    .from('price_quarantine')
    .select('product_id, field, current_cents, proposed_cents, delta_pct')
    .eq('sync_run_id', r2.runId);

  console.log('\n=== CONTROLE (run 2) ===');
  console.log(`price_history-rijen: ${histCount} (verwacht 3)`);
  console.log(`quarantaine-rijen:   ${quar?.length ?? 0} (verwacht 1)`);
  for (const q of quar ?? []) {
    console.log(
      `  quarantaine: ${q.field} €${(q.current_cents! / 100).toFixed(2)} -> €${(q.proposed_cents! / 100).toFixed(2)} (+${q.delta_pct}%)`,
    );
  }
  console.log(`unmatched:           ${r2.unmatched} (verwacht 6: 2 zonder EAN + 4 onbekend)`);
  console.log(`marge-alerts:        ${r2.marginAlerts.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
