'use client';

import { useMemo, useState, useTransition } from 'react';
import { Tv, Boxes, TriangleAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatEuro } from '@/lib/pricing/margin';
import { useFlag } from '@/components/tracker/flags-provider';
import { FiliaalSelect } from '@/components/tracker/filiaal-select';
import { MargeStip } from '@/components/tracker/marge-stip';
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
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const aantalVoor = (t: ToestelRow) =>
    filiaal === 'alle' ? t.voorraadTotaal : (t.voorraad[filiaal] ?? 0);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...toestellen]
      .filter((t) => !term || `${t.model} ${t.type_nr} ${t.merk}`.toLowerCase().includes(term))
      .sort((a, b) => aantalVoor(a) - aantalVoor(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toestellen, filiaal, q]);

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
          { l: 'Modellen', v: kpis.modellen, icon: Tv, tint: 'bg-blue-100 text-blue-700' },
          { l: 'Voorraad', v: kpis.totaal, icon: Boxes, tint: 'bg-teal-100 text-teal-700' },
          { l: 'Laag (≤2)', v: kpis.laag, icon: TriangleAlert, tint: 'bg-red-100 text-red-700' },
          ...(vmsAfwijking
            ? [{ l: 'Wijkt af VMS', v: kpis.afw, icon: RefreshCw, tint: 'bg-amber-100 text-amber-700' }]
            : []),
        ].map((k) => (
          <Card key={k.l}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${k.tint}`}>
                <k.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs text-muted-foreground">{k.l}</span>
                <span className="block text-2xl font-bold leading-tight">{k.v}</span>
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <FiliaalSelect
          filialen={filialen}
          value={filiaal}
          onChange={setFiliaal}
          className="w-full sm:w-64"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek model, typenummer of merk…"
          className="w-full rounded-full sm:max-w-xs"
        />
        <span className="text-sm text-muted-foreground sm:ml-auto">{rows.length} modellen</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card elev-1">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-2">Model</th>
              <th className="p-2">Klasse</th>
              <th className="p-2">Voorraad</th>
              <th className="p-2">Marge%</th>
              <th className="p-2">Ticketprijs</th>
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
                <td className="p-2">
                  <MargeStip margePct={t.margePct} showPct />
                </td>
                <td className="p-2">{formatEuro(t.ticket_c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
