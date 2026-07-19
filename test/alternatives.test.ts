import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { runSync } from '@/lib/vendit/run-sync';
import { MockVenditAdapter } from '@/lib/vendit/mock';

// Integratietest voor fn_alternatives tegen de lokale Supabase.
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function productId(modelNumber: string): Promise<string> {
  const { data } = await db.from('products').select('id').eq('model_number', modelNumber).single();
  return data!.id;
}

describe('fn_alternatives (integratie)', () => {
  beforeAll(async () => {
    await runSync(new MockVenditAdapter()); // zorg voor prijzen + voorraad
  }, 60_000);

  it('EOL-toestel toont de opvolger als eerste kaart', async () => {
    const id = await productId('OLED65C4'); // LG OLED evo 65" C4 (EOL) -> opvolger C5
    const { data, error } = await db.rpc('fn_alternatives', { p_product_id: id, p_limit: 3 });
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(data![0].is_successor).toBe(true);
  });

  it('respecteert de schermmaat-tolerantie (65" ± 5)', async () => {
    const id = await productId('OLED65C4');
    const { data } = await db.rpc('fn_alternatives', { p_product_id: id, p_limit: 3 });
    for (const a of data!.filter((r: { is_successor: boolean }) => !r.is_successor)) {
      expect(Math.abs((a.screen_size_inch as number) - 65)).toBeLessThanOrEqual(5);
    }
  });

  it('is deterministisch bij gelijke input', async () => {
    const id = await productId('OLED65C4');
    const a = await db.rpc('fn_alternatives', { p_product_id: id, p_limit: 3 });
    const b = await db.rpc('fn_alternatives', { p_product_id: id, p_limit: 3 });
    expect((a.data ?? []).map((r: { product_id: string }) => r.product_id)).toEqual(
      (b.data ?? []).map((r: { product_id: string }) => r.product_id),
    );
  });
});
