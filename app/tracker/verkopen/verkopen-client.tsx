'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatEuro } from '@/lib/pricing/margin';
import type { VerkoopRow } from '@/lib/tracker/queries';
import { setVerkoopStatusAction } from './actions';

const FASES: Array<{ key: string; label: string }> = [
  { key: 'lead', label: 'Lead' },
  { key: 'offerte', label: 'Offerte' },
  { key: 'verkocht', label: 'Verkocht' },
  { key: 'geleverd', label: 'Geleverd' },
];
const VOLGORDE = FASES.map((f) => f.key);

export function VerkopenClient({ verkopen }: { verkopen: VerkoopRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [items, setItems] = useState(verkopen);
  const [sleep, setSleep] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  function verplaats(id: string, status: string) {
    const huidig = items.find((v) => v.id === id);
    if (!huidig || huidig.status === status) return;
    // optimistisch
    const vorige = items;
    setItems((xs) => xs.map((v) => (v.id === id ? { ...v, status } : v)));
    start(async () => {
      const res = await setVerkoopStatusAction(id, status);
      if (!res.ok) {
        setItems(vorige); // terugdraaien
      } else {
        router.refresh();
      }
    });
  }

  function advance(id: string) {
    const huidig = items.find((v) => v.id === id);
    if (!huidig) return;
    const idx = VOLGORDE.indexOf(huidig.status);
    verplaats(id, VOLGORDE[Math.min(idx + 1, VOLGORDE.length - 1)]);
  }

  function terug(id: string) {
    const huidig = items.find((v) => v.id === id);
    if (!huidig) return;
    const idx = VOLGORDE.indexOf(huidig.status);
    verplaats(id, VOLGORDE[Math.max(idx - 1, 0)]);
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
      <p className="text-xs text-muted-foreground">
        Sleep een kaart (desktop) of gebruik de knoppen ‹ Volgende › om een deal te verplaatsen.
      </p>

      <div className="grid gap-3 md:grid-cols-4">
        {FASES.map((f) => {
          const rows = items.filter((v) => v.status === f.key);
          const kolomWaarde = rows.reduce((s, v) => s + v.waarde_c, 0);
          const isOver = over === f.key;
          return (
            <div
              key={f.key}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(f.key);
              }}
              onDragLeave={() => setOver((o) => (o === f.key ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData('text/plain') || sleep;
                if (id) verplaats(id, f.key);
                setSleep(null);
              }}
              className={`space-y-2 rounded-lg p-1 transition-colors ${
                isOver ? 'bg-primary/10 ring-2 ring-primary/40' : ''
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-semibold">
                  {f.label} <span className="text-muted-foreground">({rows.length})</span>
                </p>
                <span className="text-xs text-muted-foreground">{formatEuro(kolomWaarde)}</span>
              </div>
              {rows.map((v) => (
                <Card
                  key={v.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', v.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setSleep(v.id);
                  }}
                  onDragEnd={() => setSleep(null)}
                  className={`cursor-grab active:cursor-grabbing ${
                    sleep === v.id ? 'opacity-50' : ''
                  }`}
                >
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{v.model}</p>
                        <p className="truncate text-xs text-muted-foreground">{v.klant}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatEuro(v.waarde_c)}
                      </span>
                    </div>
                    {/* Touch-bediening: op mobiel werkt slepen niet, dus knoppen. */}
                    <div className="flex items-center gap-2">
                      {f.key !== 'lead' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 px-2 text-muted-foreground"
                          onClick={() => terug(v.id)}
                          disabled={pending}
                          aria-label="Vorige fase"
                        >
                          ‹
                        </Button>
                      )}
                      {f.key !== 'geleverd' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 flex-1"
                          onClick={() => advance(v.id)}
                          disabled={pending}
                        >
                          Volgende ›
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {rows.length === 0 && (
                <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Sleep hierheen
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
