// Pure classificatie van scanner-invoer: EAN-13 (barcode) of EPC (RFID-hex).
// Bewust geen React/DOM hier zodat dit los te unit-testen is (kern van de scanflow).

import { isValidEan13 } from '@/lib/schemas';
import { normalizeEpc } from './epc';

export type ScanType = 'rfid' | 'ean';
export interface Scan {
  type: ScanType;
  value: string;
}

// Minimale/maximale EPC-lengte na normalisatie (hex-tekens). EPC-96 = 24 hex.
export const EPC_MIN_HEX = 16;
export const EPC_MAX_HEX = 32;

/**
 * Classificeer een ruwe scanreeks.
 * - Exact 13 cijfers met geldige checksum → EAN-13 (barcode).
 * - Genormaliseerd 16–32 hex-tekens → EPC (RFID-tag).
 * - Anders null (ongeldig).
 *
 * Volgorde is belangrijk: een 13-cijferige code kan óók als hex gelezen worden,
 * maar een geldige EAN heeft voorrang zodat barcodes niet als "korte EPC" sneuvelen.
 */
export function classifyScan(raw: string): Scan | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d{13}$/.test(trimmed) && isValidEan13(trimmed)) {
    return { type: 'ean', value: trimmed };
  }
  const epc = normalizeEpc(trimmed);
  if (new RegExp(`^[0-9A-F]{${EPC_MIN_HEX},${EPC_MAX_HEX}}$`).test(epc)) {
    return { type: 'rfid', value: epc };
  }
  return null;
}
