'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { TaakRow } from '@/lib/tracker/queries';
import { advanceTaakAction, deleteTaakAction, addTaakAction } from './actions';

const FASES: Array<{ key: string; label: string }> = [
  { key: 'te-doen', label: 'Te doen' },
  { key: 'bezig', label: 'Bezig' },
  { key: 'review', label: 'Review' },
  { key: 'klaar', label: 'Klaar' },
];

export function TakenClient({
  taken,
  verkopers,
}: {
  taken: TaakRow[];
  verkopers: Array<{ id: string; naam: string }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [persoon, setPersoon] = useState('alle');
  const [nieuw, setNieuw] = useState('');
  const [nieuwPersoon, setNieuwPersoon] = useState(verkopers[0]?.id ?? '');

  const naam = (id: string | null) => verkopers.find((v) => v.id === id)?.naam ?? '—';
  const zichtbaar = taken.filter((t) => persoon === 'alle' || t.persoon_id === persoon);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Taken</h1>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={persoon === 'alle' ? 'default' : 'outline'}
          onClick={() => setPersoon('alle')}
        >
          Iedereen
        </Button>
        {verkopers.map((v) => (
          <Button
            key={v.id}
            size="sm"
            variant={persoon === v.id ? 'default' : 'outline'}
            onClick={() => setPersoon(v.id)}
          >
            {v.naam}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={nieuw}
          onChange={(e) => setNieuw(e.target.value)}
          placeholder="Nieuwe taak…"
          className="max-w-xs"
        />
        <select
          value={nieuwPersoon}
          onChange={(e) => setNieuwPersoon(e.target.value)}
          className="h-10 rounded-md border bg-background px-2 text-sm"
        >
          {verkopers.map((v) => (
            <option key={v.id} value={v.id}>
              {v.naam}
            </option>
          ))}
        </select>
        <Button
          disabled={pending || !nieuw.trim()}
          onClick={() =>
            run(async () => {
              await addTaakAction(nieuw, nieuwPersoon);
              setNieuw('');
            })
          }
        >
          Toevoegen
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {FASES.map((f) => {
          const rows = zichtbaar.filter((t) => t.status === f.key);
          return (
            <div key={f.key} className="space-y-2">
              <p className="text-sm font-semibold">
                {f.label} <span className="text-muted-foreground">({rows.length})</span>
              </p>
              {rows.map((t) => (
                <Card key={t.id}>
                  <CardContent className="space-y-1 p-3">
                    <p className="text-sm">{t.titel}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{naam(t.persoon_id)}</Badge>
                      <span className="flex gap-1">
                        {f.key !== 'klaar' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => run(() => advanceTaakAction(t.id))}
                            disabled={pending}
                          >
                            →
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Taak verwijderen?')) run(() => deleteTaakAction(t.id));
                          }}
                          disabled={pending}
                        >
                          ×
                        </Button>
                      </span>
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
