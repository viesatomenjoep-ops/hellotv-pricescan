// Centrale staleness-logica (voorheen gedupliceerd in price-badge, reports en catalog).
// Actueel < 2u, verouderend 2–4u, verouderd > 4u.

export function ageHours(lastSyncedAt: string | null): number {
  return lastSyncedAt ? (Date.now() - new Date(lastSyncedAt).getTime()) / 3_600_000 : Infinity;
}

export function isStale(lastSyncedAt: string | null): boolean {
  return ageHours(lastSyncedAt) > 4;
}

export type StalenessTone = 'fresh' | 'aging' | 'stale';

export function stalenessTone(lastSyncedAt: string | null): StalenessTone {
  const h = ageHours(lastSyncedAt);
  return h < 2 ? 'fresh' : h <= 4 ? 'aging' : 'stale';
}
