import { z } from 'zod';
import { normalizeEpc } from '@/lib/rfid/epc';

// Centrale Zod-schemas. Elke route handler / server action valideert input hiermee (B5).

/** EPC: hex, 16–32 tekens (na normalisatie: uppercase, zonder scheidingstekens). */
export const epcSchema = z
  .string()
  .transform(normalizeEpc)
  .pipe(z.string().regex(/^[0-9A-F]{16,32}$/, 'Ongeldige EPC (16–32 hex-tekens)'));

/** EAN-13 met checksum-validatie. */
export function isValidEan13(ean: string): boolean {
  if (!/^\d{13}$/.test(ean)) return false;
  const d = ean.split('').map(Number);
  const sum = d.slice(0, 12).reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return check === d[12];
}

export const ean13Schema = z
  .string()
  .trim()
  .refine(isValidEan13, 'Ongeldige EAN-13 (checksum klopt niet)');

/** Prijsmutatie (interne mutatie / sync). */
export const priceMutationSchema = z.object({
  productId: z.string().uuid(),
  field: z.enum(['purchase', 'sale']),
  newCents: z.number().int().min(0),
});
export type PriceMutation = z.infer<typeof priceMutationSchema>;

/** Eén voorraadregel binnen een Vendit-artikel. */
export const venditStockSchema = z.object({
  locationCode: z.string().min(1),
  locationName: z.string().optional(),
  qty: z.number().int(),
});

/** Genormaliseerde Vendit-artikelrij (adapter-output, C1). */
export const venditArticleRowSchema = z.object({
  venditArticleId: z.string().min(1),
  ean: z.string().optional(),
  sku: z.string().optional(),
  description: z.string(),
  purchasePriceCents: z.number().int().min(0).nullable(),
  salePriceCents: z.number().int().min(0).nullable(),
  salePriceIncludesVat: z.boolean(),
  stock: z.array(venditStockSchema),
  status: z.string(),
  sourceTimestamp: z.string(),
});
export type VenditArticleRow = z.infer<typeof venditArticleRowSchema>;

/** Product-importrij (CSV/Excel of Vendit-parsing, D1). */
export const productImportRowSchema = z.object({
  brand: z.string().min(1),
  modelName: z.string().min(1),
  modelNumber: z.string().min(1),
  modelYear: z.union([z.literal(2025), z.literal(2026)]),
  ean: z.string().optional(),
  screenSizeInch: z.number().int().min(20).max(120).optional(),
  panelType: z.enum(['LED', 'QLED', 'MiniLED', 'OLED']).optional(),
  segment: z.enum(['budget', 'mid', 'premium']).optional(),
  skuHellotv: z.string().optional(),
  successorEan: z.string().optional(),
});
export type ProductImportRow = z.infer<typeof productImportRowSchema>;

/** Quarantaine-besluit (C5). */
export const quarantineDecisionSchema = z.object({
  quarantineId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
});
export type QuarantineDecision = z.infer<typeof quarantineDecisionSchema>;
