'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatEuro } from '@/lib/pricing/margin';
import { useFlag } from '@/components/tracker/flags-provider';
import type { TargetRow } from '@/lib/tracker/queries';

// Marge-gauge: halve donut die de gerealiseerde marge% tegen het doel toont.
export function MargeGauge({ target }: { target: TargetRow | null }) {
  const zichtbaar = useFlag('dashboard.marge_gauge');
  if (!zichtbaar || !target) return null;

  const pct = Number(target.marge_pct) || 0;
  const doel = Number(target.marge_doel_pct) || 0;
  // schaal: 0..(doel of pct, wat groter is) * 1.2 zodat de naald ruimte houdt.
  const max = Math.max(doel, pct, 1) * 1.25;
  const frac = Math.min(pct / max, 1);
  const doelFrac = Math.min(doel / max, 1);

  // halve cirkel van 180° (links) naar 0° (rechts).
  const r = 80;
  const cx = 100;
  const cy = 100;
  const point = (f: number) => {
    const a = Math.PI - f * Math.PI;
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
  };
  const [ex, ey] = point(frac);
  const [dx1, dy1] = point(doelFrac);
  const opDoel = pct >= doel;
  const kleur = opDoel ? '#15803d' : pct >= doel * 0.85 ? '#c2410c' : '#b91c1c';

  const omzetFrac = target.omzet_doel_c > 0 ? target.omzet_c / target.omzet_doel_c : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Marge vs. doel · {target.periode}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 200 120" className="w-full max-w-[260px]">
            {/* baan */}
            <path
              d={`M 20 100 A ${r} ${r} 0 0 1 180 100`}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* gerealiseerd */}
            <path
              d={`M 20 100 A ${r} ${r} 0 0 1 ${ex} ${ey}`}
              fill="none"
              stroke={kleur}
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* doel-markering */}
            <line
              x1={cx + (r - 12) * Math.cos(Math.PI - doelFrac * Math.PI)}
              y1={cy - (r - 12) * Math.sin(Math.PI - doelFrac * Math.PI)}
              x2={dx1}
              y2={dy1}
              stroke="hsl(var(--foreground))"
              strokeWidth="2.5"
            />
            <text x="100" y="86" textAnchor="middle" className="fill-foreground text-[26px] font-bold">
              {pct.toFixed(1)}%
            </text>
            <text x="100" y="104" textAnchor="middle" className="fill-muted-foreground text-[9px]">
              doel {doel.toFixed(0)}%
            </text>
          </svg>

          <div className="mt-3 w-full space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Omzet</span>
              <span className="font-medium">
                {formatEuro(target.omzet_c)} / {formatEuro(target.omzet_doel_c)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(omzetFrac * 100, 100)}%` }}
              />
            </div>
            <p className={`pt-1 text-xs font-medium ${opDoel ? 'text-green-700' : 'text-orange-700'}`}>
              {opDoel
                ? `Doel gehaald (+${(pct - doel).toFixed(1)} pp)`
                : `Nog ${(doel - pct).toFixed(1)} pp tot doel`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
