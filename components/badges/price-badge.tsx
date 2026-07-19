import { formatEuro } from '@/lib/pricing/margin';
import { cn } from '@/lib/utils';

// Inkoopprijs met actualiteitskleur: groen < 2u, oranje 2–4u, rood > 4u (C6).
export function PriceBadge({
  cents,
  lastSyncedAt,
  className,
}: {
  cents: number | null;
  lastSyncedAt: string | null;
  className?: string;
}) {
  if (cents == null) return <span className="text-muted-foreground">—</span>;

  const ageHours = lastSyncedAt
    ? (Date.now() - new Date(lastSyncedAt).getTime()) / 3_600_000
    : Infinity;
  const tone =
    ageHours < 2
      ? 'bg-green-100 text-green-800'
      : ageHours <= 4
        ? 'bg-orange-100 text-orange-800'
        : 'bg-red-100 text-red-800';
  const title = lastSyncedAt
    ? `Laatst gesynct: ${new Date(lastSyncedAt).toLocaleString('nl-NL')}`
    : 'Nog niet gesynct';

  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-sm font-medium',
        tone,
        className,
      )}
    >
      {formatEuro(cents)}
      {ageHours > 4 && ' ⚠︎'}
    </span>
  );
}
