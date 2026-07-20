'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatEuro } from '@/lib/pricing/margin';
import type { ToestelRow } from '@/lib/tracker/queries';

function margeTone(pct: number) {
  return pct >= 25 ? 'text-green-700' : pct >= 15 ? 'text-orange-700' : 'text-red-700';
}

export function ToestellenClient({ toestellen }: { toestellen: ToestelRow[] }) {
  const [q, setQ] = useState('');
  const [klasse, setKlasse] = useState<string | null>(null);
  const [merk, setMerk] = useState<string | null>(null);

  const merken = useMemo(
    () => Array.from(new Set(toestellen.map((t) => t.merk))).sort(),
    [toestellen],
  );
  const klassen = ['OLED', 'QLED', 'Mini-LED', 'LED'];

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return toestellen.filter(
      (t) =>
        (!term || `${t.model} ${t.type_nr} ${t.ean}`.toLowerCase().includes(term)) &&
        (!klasse || t.klasse === klasse) &&
        (!merk || t.merk === merk),
    );
  }, [toestellen, q, klasse, merk]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Toestellen</h1>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Zoek model, typenummer of EAN…"
        className="max-w-md"
      />
      <div className="flex flex-wrap gap-2">
        {klassen.map((k) => (
          <Button
            key={k}
            size="sm"
            variant={klasse === k ? 'default' : 'outline'}
            onClick={() => setKlasse(klasse === k ? null : k)}
          >
            {k}
          </Button>
        ))}
        <span className="mx-1 text-muted-foreground">·</span>
        {merken.map((m) => (
          <Button
            key={m}
            size="sm"
            variant={merk === m ? 'default' : 'outline'}
            onClick={() => setMerk(merk === m ? null : m)}
          >
            {m}
          </Button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">{rows.length} toestellen</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((t) => (
          <Link
            key={t.id}
            href={`/tracker/scan?toestel=${t.id}`}
            className="flex items-center justify-between rounded-lg border bg-background p-3 hover:bg-muted"
          >
            <div>
              <p className="text-sm font-medium">{t.model}</p>
              <p className="text-xs text-muted-foreground">
                {t.merk} · {t.type_nr} · {t.inch}&quot; · {t.klasse}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className={`font-semibold ${margeTone(t.margePct)}`}>{t.margePct}%</p>
              <p className="text-xs text-muted-foreground">
                {formatEuro(t.ticket_c)} · {t.voorraadTotaal} st
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
