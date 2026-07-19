import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { runSync } from './run-sync';
import { MockVenditAdapter } from './mock';

// Integratietest tegen de lokale Supabase (vereist `pnpm db:start`).
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const NIL = '00000000-0000-0000-0000-000000000000';

describe('run-sync (integratie)', () => {
  let run1Id = '';
  let run2Id = '';

  beforeAll(async () => {
    await db.from('price_quarantine').delete().neq('id', NIL);
    await db.from('price_history').delete().neq('id', NIL);
    await db.from('prices').delete().neq('id', NIL);
    const adapter = new MockVenditAdapter();
    run1Id = (await runSync(adapter)).runId;
    run2Id = (await runSync(adapter)).runId;
  }, 60_000);

  it('eerste run: alle prijzen nieuw, geen history', async () => {
    const { count } = await db
      .from('price_history')
      .select('*', { count: 'exact', head: true })
      .eq('sync_run_id', run1Id);
    expect(count).toBe(0);
  });

  it('tweede run: exact 3 history-rijen', async () => {
    const { count } = await db
      .from('price_history')
      .select('*', { count: 'exact', head: true })
      .eq('sync_run_id', run2Id);
    expect(count).toBe(3);
  });

  it('tweede run: de +65%-case staat in quarantaine (pending)', async () => {
    const { data } = await db
      .from('price_quarantine')
      .select('delta_pct')
      .eq('sync_run_id', run2Id)
      .eq('status', 'pending');
    expect(data?.length).toBe(1);
    expect(Number(data![0].delta_pct)).toBeGreaterThan(40);
  });

  it('ongematchte artikelen worden geteld (2 zonder EAN + 4 onbekend = 6)', async () => {
    const adapter = new MockVenditAdapter();
    const summary = await runSync(adapter);
    expect(summary.unmatched).toBe(6);
  });
});
