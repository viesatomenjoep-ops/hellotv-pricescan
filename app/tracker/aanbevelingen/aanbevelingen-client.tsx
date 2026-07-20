'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AanbevolenItem {
  id: number;
  model: string;
  merk: string;
  klasse: string | null;
  inch: number | null;
  margePct: number;
  voorraadTotaal: number;
  score: number;
}

function scoreTint(s: number) {
  return s >= 68
    ? 'bg-green-100 text-green-800'
    : s >= 48
      ? 'bg-amber-100 text-amber-800'
      : 'bg-muted text-muted-foreground';
}

export function AanbevelingenClient({ items }: { items: AanbevolenItem[] }) {
  const maten = useMemo(
    () => Array.from(new Set(items.map((t) => t.inch).filter((n): n is number => n != null))).sort((a, b) => a - b),
    [items],
  );
  const [gekozen, setGekozen] = useState<Set<number>>(new Set());

  const rows = useMemo(() => {
    const base = gekozen.size ? items.filter((t) => t.inch != null && gekozen.has(t.inch)) : items;
    return [...base].sort((a, b) => b.score - a.score).slice(0, 40);
  }, [items, gekozen]);

  function toggle(maat: number) {
    setGekozen((prev) => {
      const next = new Set(prev);
      if (next.has(maat)) next.delete(maat);
      else next.add(maat);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aanbevelingen</h1>
        <p className="text-sm text-muted-foreground">
          Kies de maat(en) die de klant zoekt — gesorteerd op interessantheid.
        </p>
      </div>

      {/* Maat-selector (meerdere kiesbaar) */}
      <div className="flex flex-wrap gap-2">
        {maten.map((m) => {
          const actief = gekozen.has(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-[0.98]',
                actief ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
              )}
            >
              {m}&quot;
            </button>
          );
        })}
        {gekozen.size > 0 && (
          <button
            type="button"
            onClick={() => setGekozen(new Set())}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:underline"
          >
            Wis maten
          </button>
        )}
      </div>

      {/* Compacte, gesorteerde lijst */}
      <div className="overflow-hidden rounded-2xl border bg-card elev-1">
        <ul className="divide-y">
          {rows.map((t) => (
            <li key={t.id}>
              <Link
                href={`/tracker/toestellen/${t.id}`}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums',
                    scoreTint(t.score),
                  )}
                >
                  {t.score}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t.model}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t.merk} · {t.klasse} · {t.inch}&quot;
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums">{t.margePct}%</span>
                  <span className="block text-xs text-muted-foreground">{t.voorraadTotaal} st</span>
                </span>
              </Link>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              Geen modellen in deze maat.
            </li>
          )}
        </ul>
      </div>

      {gekozen.size === 0 && (
        <p className="text-xs text-muted-foreground">
          <Badge variant="secondary" className="mr-1">tip</Badge>
          Tik een of meer maten aan om te filteren op wat de klant zoekt.
        </p>
      )}
    </div>
  );
}
