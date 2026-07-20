'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseImportRecords } from '@/lib/import/import-products';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
export interface Preview {
  toCreate: number;
  toUpdate: number;
  invalid: Array<{ line: number; reason: string }>;
}

export async function previewImport(
  records: Record<string, string>[],
): Promise<ActionResult<Preview>> {
  try {
    const { valid, invalid } = parseImportRecords(records);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from('products')
      .select('ean, model_number, brands(name)');
    const eans = new Set((existing ?? []).map((e) => e.ean).filter(Boolean));
    const keys = new Set(
      (existing ?? []).map((e) => {
        const brand = Array.isArray(e.brands) ? e.brands[0]?.name : e.brands?.name;
        return `${brand}|${e.model_number}`;
      }),
    );
    let toUpdate = 0;
    for (const { row } of valid) {
      if ((row.ean && eans.has(row.ean)) || keys.has(`${row.brand}|${row.modelNumber}`)) toUpdate++;
    }
    return { ok: true, data: { toCreate: valid.length - toUpdate, toUpdate, invalid } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Preview mislukt' };
  }
}

export async function commitImport(
  records: Record<string, string>[],
): Promise<ActionResult<{ created: number; updated: number; invalid: number }>> {
  try {
    const { valid, invalid } = parseImportRecords(records);
    const supabase = createClient();

    const brandNames = Array.from(new Set(valid.map((v) => v.row.brand)));
    const brandUpsert = await supabase.from('brands').upsert(
      brandNames.map((name) => ({ name })),
      { onConflict: 'name' },
    );
    if (brandUpsert.error) throw new Error(`Merken: ${brandUpsert.error.message}`);

    const { data: brands, error: brandsErr } = await supabase.from('brands').select('id, name');
    if (brandsErr) throw new Error(brandsErr.message);
    const brandId = new Map((brands ?? []).map((b) => [b.name, b.id]));

    const { data: existing, error: existErr } = await supabase
      .from('products')
      .select('id, ean, brand_id, model_number');
    if (existErr) throw new Error(existErr.message);
    const eanMap = new Map((existing ?? []).filter((e) => e.ean).map((e) => [e.ean!, e.id]));
    const keyMap = new Map((existing ?? []).map((e) => [`${e.brand_id}|${e.model_number}`, e.id]));

    let created = 0;
    let updated = 0;
    const errors: string[] = [];
    for (const { row } of valid) {
      const bId = brandId.get(row.brand);
      if (!bId) {
        errors.push(`Merk niet gevonden: ${row.brand}`);
        continue;
      }
      const existId = (row.ean && eanMap.get(row.ean)) || keyMap.get(`${bId}|${row.modelNumber}`);
      const record = {
        brand_id: bId,
        model_name: row.modelName,
        model_number: row.modelNumber,
        model_year: row.modelYear,
        ean: row.ean ?? null,
        screen_size_inch: row.screenSizeInch ?? null,
        panel_type: row.panelType ?? null,
        segment: row.segment ?? null,
        sku_hellotv: row.skuHellotv ?? null,
      };
      const { error } = existId
        ? await supabase.from('products').update(record).eq('id', existId)
        : await supabase.from('products').insert(record);
      if (error) errors.push(`${row.modelNumber}: ${error.message}`);
      else if (existId) updated++;
      else created++;
    }

    // Opvolger-EAN -> successor_id.
    for (const { row, successorEan } of valid) {
      if (!successorEan || !row.ean) continue;
      const [{ data: succ }, { data: self }] = await Promise.all([
        supabase.from('products').select('id').eq('ean', successorEan).maybeSingle(),
        supabase.from('products').select('id').eq('ean', row.ean).maybeSingle(),
      ]);
      if (succ && self)
        await supabase.from('products').update({ successor_id: succ.id }).eq('id', self.id);
    }

    await supabase.from('import_runs').insert({
      source: 'csv',
      finished_at: new Date().toISOString(),
      status: errors.length > 0 ? 'failed' : 'success',
      new_count: created,
      updated_count: updated,
      invalid_count: invalid.length,
      error_text: errors.length > 0 ? errors.slice(0, 20).join('; ') : null,
    });

    if (errors.length > 0) {
      return { ok: false, error: `${errors.length} rij(en) mislukt: ${errors[0]}` };
    }
    revalidatePath('/catalogus');
    return { ok: true, data: { created, updated, invalid: invalid.length } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Import mislukt' };
  }
}
