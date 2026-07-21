import { formatEuro } from '@/lib/pricing/margin';
import { cn } from '@/lib/utils';

// Marge-verdict: kleur is het signaal (glanceable). Drempels passen op de demo-data.
export function margeVerdict(pct: number) {
  if (pct >= 28)
    return {
      tier: 'hoog' as const,
      paneel: 'bg-green-50 border-green-200',
      ring: 'bg-green-600',
      tekst: 'text-green-800',
      label: 'Topmarge',
      advies: 'Push dit toestel',
    };
  if (pct >= 20)
    return {
      tier: 'mid' as const,
      paneel: 'bg-amber-50 border-amber-200',
      ring: 'bg-amber-500',
      tekst: 'text-amber-800',
      label: 'Goede marge',
      advies: 'Prima — of pak een alternatief',
    };
  return {
    tier: 'laag' as const,
    paneel: 'bg-red-50 border-red-200',
    ring: 'bg-red-600',
    tekst: 'text-red-800',
    label: 'Lage marge',
    advies: 'Stuur naar een beter alternatief',
  };
}

// Trilling-patroon per marge-niveau — voelen zonder kijken.
export function margeVibratie(pct: number): number[] {
  if (pct >= 28) return [45]; // één stevige buzz = topmarge
  if (pct >= 20) return [20]; // korte buzz = goed
  return [15, 70, 15]; // twee korte = let op / lage marge
}

// Glanceable marge-paneel: grote gekleurde cirkel + verdict + € marge.
export function MargeRadar({
  margePct,
  margeC,
  className,
}: {
  margePct: number;
  margeC: number;
  className?: string;
}) {
  const v = margeVerdict(margePct);
  return (
    <div className={cn('flex items-center gap-4 rounded-2xl border p-4', v.paneel, className)}>
      <div
        className={cn(
          'flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white',
          v.ring,
        )}
      >
        <span className="text-xl font-extrabold tabular-nums">{Math.round(margePct)}%</span>
      </div>
      <div className="min-w-0">
        <p className={cn('text-base font-bold', v.tekst)}>{v.label}</p>
        <p className="text-sm text-muted-foreground">{v.advies}</p>
        <p className="text-sm font-semibold">{formatEuro(margeC)} marge</p>
      </div>
    </div>
  );
}
