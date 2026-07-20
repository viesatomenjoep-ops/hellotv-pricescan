'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/lib/tracker/queries';

const DAGEN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const MAANDEN = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function AgendaClient({ items }: { items: AgendaItem[] }) {
  const now = new Date();
  const [maand, setMaand] = useState(now.getMonth());
  const [jaar, setJaar] = useState(now.getFullYear());
  const [sel, setSel] = useState(iso(now.getFullYear(), now.getMonth(), now.getDate()));

  const perDag = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const i of items) map.set(i.datum, [...(map.get(i.datum) ?? []), i]);
    return map;
  }, [items]);

  const eersteDag = (new Date(jaar, maand, 1).getDay() + 6) % 7; // ma=0
  const dagenInMaand = new Date(jaar, maand + 1, 0).getDate();
  const cellen: (number | null)[] = [
    ...Array.from({ length: eersteDag }, () => null),
    ...Array.from({ length: dagenInMaand }, (_, i) => i + 1),
  ];

  function stap(delta: number) {
    const d = new Date(jaar, maand + delta, 1);
    setMaand(d.getMonth());
    setJaar(d.getFullYear());
  }

  const selItems = perDag.get(sel) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => stap(-1)}>
            ‹
          </Button>
          <span className="w-36 text-center text-sm font-medium">
            {MAANDEN[maand]} {jaar}
          </span>
          <Button size="sm" variant="outline" onClick={() => stap(1)}>
            ›
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {DAGEN.map((d) => (
              <div key={d} className="pb-1 font-semibold">
                {d}
              </div>
            ))}
            {cellen.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const datum = iso(jaar, maand, d);
              const heeft = perDag.has(datum);
              return (
                <button
                  key={datum}
                  onClick={() => setSel(datum)}
                  className={cn(
                    'flex h-12 flex-col items-center justify-center rounded-md text-sm',
                    sel === datum ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                  )}
                >
                  {d}
                  {heeft && (
                    <span
                      className={cn(
                        'mt-0.5 h-1.5 w-1.5 rounded-full',
                        sel === datum ? 'bg-primary-foreground' : 'bg-primary',
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="mb-2 text-sm font-semibold text-muted-foreground">{sel}</p>
        <div className="space-y-2">
          {selItems.map((i) => (
            <Card key={i.id}>
              <CardContent className="flex items-center justify-between p-3 text-sm">
                <span>
                  <span className="font-medium">{i.tijd ?? ''}</span> {i.titel}
                  {i.locatie && <span className="text-muted-foreground"> · {i.locatie}</span>}
                </span>
                <Badge variant={i.type === 'herinnering' ? 'outline' : 'secondary'}>{i.type}</Badge>
              </CardContent>
            </Card>
          ))}
          {selItems.length === 0 && (
            <p className="text-sm text-muted-foreground">Geen items op deze dag.</p>
          )}
        </div>
      </div>
    </div>
  );
}
