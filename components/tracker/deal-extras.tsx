'use client';

import { ShieldCheck, Cable, Frame, Wrench, Minus, Plus, type LucideIcon } from 'lucide-react';
import { formatEuro } from '@/lib/pricing/margin';
import { cn } from '@/lib/utils';
import { getExtras, type ExtraSelectie } from '@/lib/tracker/extras-catalog';

const ICONS: Record<string, LucideIcon> = {
  'shield-check': ShieldCheck,
  cable: Cable,
  frame: Frame,
  wrench: Wrench,
};

// Compacte deal-extra's: per categorie kies je een variant (aantikken) en een aantal.
// Alles in één oogopslag, mobiel-eerst.
export function DealExtras({
  selectie,
  onChange,
  inch = 0,
}: {
  selectie: ExtraSelectie;
  onChange: (s: ExtraSelectie) => void;
  inch?: number;
}) {
  const extras = getExtras(inch);
  function kies(catId: string, variantId: string) {
    const huidig = selectie[catId];
    const next = { ...selectie };
    if (huidig?.variantId === variantId) {
      delete next[catId]; // opnieuw tikken = deselecteren
    } else {
      next[catId] = { variantId, aantal: huidig?.aantal ?? 1 };
    }
    onChange(next);
  }
  function setAantal(catId: string, delta: number) {
    const huidig = selectie[catId];
    if (!huidig) return;
    const aantal = Math.max(1, Math.min(9, huidig.aantal + delta));
    onChange({ ...selectie, [catId]: { ...huidig, aantal } });
  }

  return (
    <div className="space-y-3">
      {extras.map((cat) => {
        const Icon = ICONS[cat.icon] ?? Frame;
        const sel = selectie[cat.id];
        return (
          <div key={cat.id} className="rounded-xl border bg-background p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                {cat.naam}
              </span>
              {sel && (
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAantal(cat.id, -1)}
                    aria-label="Minder"
                    className="flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground active:scale-95"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-4 text-center text-sm font-semibold tabular-nums">
                    {sel.aantal}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAantal(cat.id, 1)}
                    aria-label="Meer"
                    className="flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cat.variants.map((v) => {
                const actief = sel?.variantId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => kies(cat.id, v.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.98]',
                      actief
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted',
                    )}
                  >
                    {v.label} · {formatEuro(v.prijs_c)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
