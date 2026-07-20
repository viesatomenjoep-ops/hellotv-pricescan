'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFlag } from '@/components/tracker/flags-provider';
import { toggleFlagAction } from './actions';

interface Flag {
  key: string;
  enabled: boolean;
  rol_scope: string | null;
  beschrijving: string | null;
}

function downloadCsv(naam: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
  ].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = naam;
  a.click();
  URL.revokeObjectURL(url);
}

export function OverigClient({
  flags,
  isManager,
  notificaties,
  datasets,
}: {
  flags: Flag[];
  isManager: boolean;
  notificaties: Array<{ id: string; type: string; tekst: string; gelezen: boolean }>;
  datasets: {
    verkopen: Array<Record<string, unknown>>;
    toestellen: Array<Record<string, unknown>>;
  };
}) {
  const router = useRouter();
  const rapportageAan = useFlag('overig.rapportage_csv');
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<'notificaties' | 'instellingen' | 'rapportage'>('instellingen');

  function toggle(key: string, enabled: boolean) {
    start(async () => {
      await toggleFlagAction(key, enabled);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Meer</h1>

      <div className="flex flex-wrap gap-2">
        {(
          [
            'instellingen',
            'notificaties',
            ...(rapportageAan ? (['rapportage'] as const) : []),
          ] as const
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'border'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'rapportage' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rapportage / export</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => downloadCsv('verkopen.csv', datasets.verkopen)}
            >
              Verkopen CSV
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadCsv('toestellen.csv', datasets.toestellen)}
            >
              Toestellen CSV
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'instellingen' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature-flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {!isManager && (
              <p className="pb-2 text-sm text-muted-foreground">
                Alleen beheer/manager kan flags wijzigen. Je ziet de huidige stand.
              </p>
            )}
            {flags.map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between border-b py-2 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{f.key}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.beschrijving}
                    {f.rol_scope && <span className="ml-1">· alleen {f.rol_scope}</span>}
                  </p>
                </div>
                <button
                  disabled={!isManager || pending}
                  onClick={() => toggle(f.key, !f.enabled)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${f.enabled ? 'bg-primary' : 'bg-muted-foreground/30'} ${!isManager ? 'opacity-60' : ''}`}
                  aria-label={`${f.key} ${f.enabled ? 'aan' : 'uit'}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${f.enabled ? 'left-[22px]' : 'left-0.5'}`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'notificaties' && (
        <Card>
          <CardContent className="divide-y pt-6 text-sm">
            {notificaties.map((n) => (
              <div key={n.id} className="flex items-center justify-between py-2">
                <span>{n.tekst}</span>
                <Badge variant="outline">{n.type}</Badge>
              </div>
            ))}
            {notificaties.length === 0 && (
              <p className="py-2 text-muted-foreground">Geen notificaties.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
