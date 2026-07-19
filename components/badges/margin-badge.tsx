import { formatEuro, formatPct } from '@/lib/pricing/margin';
import { cn } from '@/lib/utils';

// Marge in EUR + %. Groen >= 15%, oranje 10–15%, rood < 10% (drempels uit settings, C6).
// Rendert NIETS als er geen marge is (rol zonder marge-recht krijgt marginCents = null).
export function MarginBadge({
  marginCents,
  marginPct,
  className,
}: {
  marginCents: number | null;
  marginPct: number | null;
  className?: string;
}) {
  if (marginCents == null) return null;

  const pct = marginPct ?? 0;
  const tone =
    pct >= 15
      ? 'bg-green-100 text-green-800'
      : pct >= 10
        ? 'bg-orange-100 text-orange-800'
        : 'bg-red-100 text-red-800';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-sm font-medium',
        tone,
        className,
      )}
    >
      {formatEuro(marginCents)}
      {marginPct != null && ` · ${formatPct(marginPct / 100)}`}
    </span>
  );
}
