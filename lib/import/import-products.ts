import { productImportRowSchema, isValidEan13, type ProductImportRow } from '@/lib/schemas';

// Parse + normalisatie voor de modellenimport (D1). Pure functies.

const CANONICAL_BRANDS: Record<string, string> = {
  'lg electronics': 'LG',
  'samsung electronics': 'Samsung',
  'sony corporation': 'Sony',
  'tp vision': 'Philips',
  philips: 'Philips',
  'tcl technology': 'TCL',
  hisense: 'Hisense',
};

export function canonicalBrand(s: string): string {
  const key = s.trim().toLowerCase();
  return CANONICAL_BRANDS[key] ?? s.trim();
}

const PANELS: Record<string, ProductImportRow['panelType']> = {
  led: 'LED',
  qled: 'QLED',
  miniled: 'MiniLED',
  'mini-led': 'MiniLED',
  oled: 'OLED',
};
const SEGMENTS: Record<string, ProductImportRow['segment']> = {
  budget: 'budget',
  mid: 'mid',
  midden: 'mid',
  premium: 'premium',
};

export interface ParsedRow {
  row: ProductImportRow;
  successorEan?: string;
}
export interface ParseResult {
  valid: ParsedRow[];
  invalid: Array<{ line: number; reason: string }>;
}

function get(rec: Record<string, string>, ...aliases: string[]): string | undefined {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(rec)) lower[k.trim().toLowerCase()] = v;
  for (const a of aliases) {
    const v = lower[a];
    if (v != null && v !== '') return v.trim();
  }
  return undefined;
}

export function parseImportRecords(records: Record<string, string>[]): ParseResult {
  const valid: ParsedRow[] = [];
  const invalid: Array<{ line: number; reason: string }> = [];

  records.forEach((rec, i) => {
    const line = i + 2; // +1 header, +1 1-based
    const yearRaw = get(rec, 'modeljaar', 'jaar', 'model_year');
    const year = Number(yearRaw);
    const eanRaw = get(rec, 'ean');
    const panelRaw = get(rec, 'paneltype', 'panel')?.toLowerCase();
    const segRaw = get(rec, 'segment')?.toLowerCase();
    const sizeRaw = get(rec, 'schermmaat', 'screen_size_inch', 'inch');

    const candidate = {
      brand: canonicalBrand(get(rec, 'merk', 'brand') ?? ''),
      modelName: get(rec, 'modelnaam', 'model_name', 'naam') ?? '',
      modelNumber: (get(rec, 'modelnummer', 'model_number') ?? '').toUpperCase().trim(),
      modelYear: year,
      ean: eanRaw && isValidEan13(eanRaw) ? eanRaw : undefined,
      screenSizeInch: sizeRaw ? Number(sizeRaw) : undefined,
      panelType: panelRaw ? PANELS[panelRaw] : undefined,
      segment: segRaw ? SEGMENTS[segRaw] : undefined,
      skuHellotv: get(rec, 'hellotv-sku', 'sku', 'sku_hellotv'),
      successorEan: get(rec, 'opvolger-ean', 'successor_ean', 'opvolgerean'),
    };

    const parsed = productImportRowSchema.safeParse(candidate);
    if (!parsed.success) {
      invalid.push({ line, reason: parsed.error.issues[0]?.message ?? 'ongeldig' });
      return;
    }
    if (eanRaw && !candidate.ean) {
      invalid.push({ line, reason: `ongeldige EAN-checksum: ${eanRaw}` });
      return;
    }
    valid.push({ row: parsed.data, successorEan: candidate.successorEan });
  });

  return { valid, invalid };
}
