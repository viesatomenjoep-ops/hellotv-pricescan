import { cn } from '@/lib/utils';
import { margeVerdict } from './marge-radar';

// Kleine glanceable marge-indicator (kleurstip, optioneel met %). Kleur = het signaal.
export function MargeStip({
  margePct,
  showPct = false,
  className,
}: {
  margePct: number;
  showPct?: boolean;
  className?: string;
}) {
  const v = margeVerdict(margePct);
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn('h-2.5 w-2.5 shrink-0 rounded-full', v.ring)}
        title={`${v.label} · ${Math.round(margePct)}%`}
        aria-label={v.label}
      />
      {showPct && (
        <span className={cn('text-xs font-semibold tabular-nums', v.tekst)}>
          {Math.round(margePct)}%
        </span>
      )}
    </span>
  );
}
