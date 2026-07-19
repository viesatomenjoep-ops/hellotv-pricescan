// EPC-normalisatie. Een EPC wordt opgeslagen als hex-string, uppercase, zonder scheidingstekens.
// De Zod-validatie (16–32 hex) staat in lib/schemas.ts.

export function normalizeEpc(raw: string): string {
  return raw.replace(/[\s:-]/g, '').toUpperCase();
}
