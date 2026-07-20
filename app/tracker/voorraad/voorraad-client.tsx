'use client';

import { useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatEuro } from '@/lib/pricing/margin';
import { useFlag } from '@/components/tracker/flags-provider';
import type { ToestelRow, Filiaal } from '@/lib/tracker/queries';
import { vmsSyncAction } from './actions';

function voorraadTone(n: number) {
  return n === 0
    ? 'bg-red-100 text-red-800'
    : n <= 2
      ? 'bg-orange-100 text-orange-800'
      : 'bg-slate-100 text-slate-800';
}

export function VoorraadClient({
  toestellen,
  filialen,
}: {
  toestellen: ToestelRow[];
  filialen: Filiaal[];
}) {
  const vmsSync = useFlag('voorraad.vms_sync');
  const vmsAfwijking = useFlag('voorraad.vms_afwijking');
  const [filiaal, setFiliaal] = useState('alle');
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const aantalVoor = (t: ToestelRow) =>
    filiaal === 'alle' ? t.voorraadTotaal : (t.voorraad[filiaal] ?? 0);

  const rows = useMemo(
    () => [...toestellen].sort((a, b) => aantalVoor(a) - aantalVoor(b)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toestellen, filiaal],
  );

  const kpis = useMemo(() => {
    const totaal = rows.reduce((s, t) => s + aantalVoor(t), 0);
    const laag = rows.filter((t) => aantalVoor(t) <= 2).length;
    const afw = rows.filter((t) => t.wijktAfVms).length;
    return { modellen: rows.length, totaal, laag, afw };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filiaal]);

  function sync() {
    setMsg(null);
    start(async () => {
      const res = await vmsSyncAction();
      setMsg(res.ok ? `VMS gesynchroniseerd — ${res.bijgewerkt} regels.` : res.error);
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Voorraad</h1>
        {vmsSync && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">VMS verbonden</Badge>
            <Button size="sm" variant="secondary" onClick={sync} disabled={pending}>
              {pending ? 'Synchroniseren…' : 'Nu synchroniseren'}
            </Button>
          </div>
        )}
      </div>
      {msg && <p className="text-sm font-medium text-green-700">{msg}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'Modellen', v: kpis.modellen },
          { l: 'Voorraad', v: kpis.totaal },
          { l: 'Laag (≤2)', v: kpis.laag },
          ...(vmsAfwijking ? [{ l: 'Wijkt af VMS', v: kpis.afw }] : []),
        ].map((k) => (
          <Card key={k.l}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{k.l}</p>
              <p className="mt-1 text-2xl font-bold">{k.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ id: 'alle', naam: 'Alle filialen' }, ...filialen].map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filiaal === f.id ? 'default' : 'outline'}
            onClick={() => setFiliaal(f.id)}
          >
            {f.naam}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2">Model</th>
              <th className="p-2">Klasse</th>
              <th className="p-2">Voorraad</th>
              <th className="p-2">Marge%</th>
              <th className="p-2">Ticket</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-2">
                  {t.model}
                  <span className="ml-2 text-xs text-muted-foreground">{t.merk}</span>
                  {vmsAfwijking && t.wijktAfVms && (
                    <Badge variant="destructive" className="ml-2">
                      ≠ VMS
                    </Badge>
                  )}
                </td>
                <td className="p-2">{t.klasse}</td>
                <td className="p-2">
                  <span
                    className={`rounded px-2 py-0.5 font-medium ${voorraadTone(aantalVoor(t))}`}
                  >
                    {aantalVoor(t)}
                  </span>
                </td>
                <td className="p-2">{t.margePct}%</td>
                <td className="p-2">{formatEuro(t.ticket_c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
