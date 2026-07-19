import { cn } from '@/lib/utils';

export interface StockLocation {
  location_code: string;
  location_name: string | null;
  qty: number;
}

// Totale voorraad + uitsplitsing per locatie; rood bij 0 (C6).
export function StockBadge({
  total,
  byLocation,
  className,
}: {
  total: number;
  byLocation: StockLocation[];
  className?: string;
}) {
  const tone = total === 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800';
  const detail = byLocation
    .map((l) => `${l.location_name ?? l.location_code}: ${l.qty}`)
    .join(' · ');

  return (
    <span
      title={detail || undefined}
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-sm font-medium',
        tone,
        className,
      )}
    >
      {total} {total === 1 ? 'stuk' : 'stuks'}
    </span>
  );
}
