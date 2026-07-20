'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatEuro } from '@/lib/pricing/margin';
import type { ToestelRow } from '@/lib/tracker/queries';

export function ZoekenClient({ toestellen }: { toestellen: ToestelRow[] }) {
  const [q, setQ] = useState('');
  const [maat, setMaat] = useState<string | null>(null);
  const [klasse, setKlasse] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term && !maat && !klasse) return [];
    return toestellen.filter((t) => {
      if (term && !`${t.model} ${t.type_nr} ${t.ean} ${t.merk}`.toLowerCase().includes(term))
        return false;
      if (klasse && t.klasse !== klasse) return false;
      if (maat === '≤50' && (t.inch ?? 0) > 50) return false;
      if (maat === '55-65' && ((t.inch ?? 0) < 55 || (t.inch ?? 0) > 65)) return false;
      if (maat === '≥70' && (t.inch ?? 0) < 70) return false;
      return true;
    });
  }, [toestellen, q, maat, klasse]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Zoeken</h1>
      <Input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Model, typenummer of EAN…"
      />
      <div className="flex flex-wrap gap-2 text-sm">
        {['OLED', 'QLED', 'Mini-LED', 'LED'].map((k) => (
          <Button
            key={k}
            size="sm"
            variant={klasse === k ? 'default' : 'outline'}
            onClick={() => setKlasse(klasse === k ? null : k)}
          >
            {k}
          </Button>
        ))}
        {['≤50', '55-65', '≥70'].map((m) => (
          <Button
            key={m}
            size="sm"
            variant={maat === m ? 'default' : 'outline'}
            onClick={() => setMaat(maat === m ? null : m)}
          >
            {m}&quot;
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border bg-background p-3"
          >
            <div>
              <p className="text-sm font-medium">{t.model}</p>
              <p className="text-xs text-muted-foreground">
                {t.merk} · {t.type_nr} · {t.inch}&quot; · {formatEuro(t.ticket_c)}
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href={`/tracker/scan?toestel=${t.id}`}>Aanbieding</Link>
            </Button>
          </div>
        ))}
        {q.trim() === '' && !maat && !klasse && (
          <p className="text-sm text-muted-foreground">Typ een zoekterm of kies een filter.</p>
        )}
      </div>
    </div>
  );
}
