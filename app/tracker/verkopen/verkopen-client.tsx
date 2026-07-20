'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatEuro } from '@/lib/pricing/margin';
import type { VerkoopRow } from '@/lib/tracker/queries';
import { advanceVerkoopAction } from './actions';

const FASES: Array<{ key: string; label: string }> = [
  { key: 'lead', label: 'Lead' },
  { key: 'offerte', label: 'Offerte' },
  { key: 'verkocht', label: 'Verkocht' },
  { key: 'geleverd', label: 'Geleverd' },
];

export function VerkopenClient({ verkopen }: { verkopen: VerkoopRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [items] = useState(verkopen);

  function advance(id: string) {
    start(async () => {
      const res = await advanceVerkoopAction(id);
      if (res.ok) router.refresh();
    });
  }

  const waarde = items.reduce((s, v) => s + v.waarde_c, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Verkopen</h1>
        <span className="text-sm text-muted-foreground">
          {items.length} deals · {formatEuro(waarde)}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {FASES.map((f) => {
          const rows = items.filter((v) => v.status === f.key);
          return (
            <div key={f.key} className="space-y-2">
              <p className="text-sm font-semibold">
                {f.label} <span className="text-muted-foreground">({rows.length})</span>
              </p>
              {rows.map((v) => (
                <Card key={v.id}>
                  <CardContent className="space-y-1 p-3">
                    <p className="text-sm font-medium">{v.model}</p>
                    <p className="text-xs text-muted-foreground">{v.klant}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-semibold">{formatEuro(v.waarde_c)}</span>
                      {f.key !== 'geleverd' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => advance(v.id)}
                          disabled={pending}
                        >
                          →
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {rows.length === 0 && (
                <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Leeg
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
