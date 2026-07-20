import { isValidEan13 } from '@/lib/schemas';

// Prijs- en veldnormalisatie voor de Vendit-adapter (C2). Pure functies, los te testen.

export type PriceUnit = 'auto' | 'euros' | 'cents';

export interface NormalizedPrice {
  cents: number | null;
  ambiguous: boolean;
}

/**
 * Normaliseer een prijs naar centen. Accepteert "123.45", "123,45", 123.45 en 12345.
 * - Strings/decimalen met scheidingsteken -> euro's -> *100.
 * - Hele getallen zijn dubbelzinnig: unit bepaalt de uitkomst; bij 'auto' -> centen + waarschuwing.
 */
export function normalizePriceToCents(
  value: string | number | null | undefined,
  unit: PriceUnit = 'auto',
): NormalizedPrice {
  if (value == null || value === '') return { cents: null, ambiguous: false };

  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/\s/g, '').replace(',', '.');
    const num = Number(cleaned);
    if (!Number.isFinite(num)) return { cents: null, ambiguous: false };
    const hasDecimal = cleaned.includes('.');
    return normalizePriceToCents(num, hasDecimal && unit === 'auto' ? 'euros' : unit);
  }

  if (!Number.isInteger(value)) {
    // Decimaal getal = euro's.
    return { cents: Math.round(value * 100), ambiguous: false };
  }

  // Heel getal.
  if (unit === 'euros') return { cents: Math.round(value * 100), ambiguous: false };
  if (unit === 'cents') return { cents: Math.round(value), ambiguous: false };
  return { cents: Math.round(value), ambiguous: true }; // 'auto' -> centen, maar dubbelzinnig
}

/** Valideer EAN-13; ongeldig -> null. */
export function normalizeEan(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  return isValidEan13(trimmed) ? trimmed : null;
}

export interface VenditFieldMapping {
  articleId: string;
  ean: string;
  sku: string;
  description: string;
  purchasePrice: string;
  salePrice: string;
  vatIncluded: string;
  stock: string;
  changedAt: string;
}

export const DEFAULT_MAPPING: VenditFieldMapping = {
  articleId: 'articleNumber',
  ean: 'ean',
  sku: 'sku',
  description: 'description',
  purchasePrice: 'purchasePrice',
  salePrice: 'salePrice',
  vatIncluded: 'priceInclVat',
  stock: 'stock',
  changedAt: 'modifiedAt',
};
