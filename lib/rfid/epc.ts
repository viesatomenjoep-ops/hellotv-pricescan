import { z } from 'zod';

// Een EPC wordt opgeslagen als hex-string, uppercase, zonder scheidingstekens (PRD §5).

/** Normaliseer ruwe scanner-invoer: trim, spaties/koppeltekens weg, uppercase. */
export function normalizeEpc(raw: string): string {
  return raw.replace(/[\s:-]/g, '').toUpperCase();
}

/** Geldige EPC: 8–32 hex-tekens (dekt EPC-96 en langere encodings). */
export const epcSchema = z
  .string()
  .transform(normalizeEpc)
  .pipe(z.string().regex(/^[0-9A-F]{8,32}$/, 'Ongeldige EPC (verwacht 8–32 hex-tekens)'));

export type Epc = z.infer<typeof epcSchema>;
