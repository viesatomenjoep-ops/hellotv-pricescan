import { TriangleAlert } from 'lucide-react';
import { formatEuro } from '@/lib/pricing/margin';
import { stalenessTone } from '@/lib/pricing/staleness';
import { cn } from '@/lib/utils';

const TONE_CLASS = {
  fresh: 'bg-green-100 text-green-800',
  aging: 'bg-orange-100 text-orange-800',
  stale: 'bg-red-100 text-red-800',
} as const;

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

  const tone = stalenessTone(lastSyncedAt);
  const title = lastSyncedAt
    ? `Laatst gesynct: ${new Date(lastSyncedAt).toLocaleString('nl-NL')}`
    : 'Nog niet gesynct';

  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-sm font-medium',
        TONE_CLASS[tone],
        className,
      )}
    >
      {formatEuro(cents)}
      {tone === 'stale' && <TriangleAlert className="ml-1 h-3.5 w-3.5" />}
    </span>
  );
}
