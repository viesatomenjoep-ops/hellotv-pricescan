'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { formatEuro, adviesPrijs } from '@/lib/pricing/margin';
import { MargeStip } from '@/components/tracker/marge-stip';
import { MultiSelect } from '@/components/tracker/multi-select';
import type { ToestelRow } from '@/lib/tracker/queries';

function margeTone(pct: number) {
  return pct >= 28 ? 'text-green-700' : pct >= 20 ? 'text-orange-700' : 'text-red-700';
}

export function ToestellenClient({ toestellen }: { toestellen: ToestelRow[] }) {
  const [q, setQ] = useState('');
  const [maten, setMaten] = useState<Set<string>>(new Set());
  const [technieken, setTechnieken] = useState<Set<string>>(new Set());
  const [merken, setMerken] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<'marge-hoog' | 'marge-laag' | 'model'>('marge-hoog');

  const maatOpties = useMemo(
    () =>
      Array.from(new Set(toestellen.map((t) => t.inch).filter((n): n is number => n != null)))
        .sort((a, b) => a - b)
        .map((n) => ({ value: String(n), label: `${n}"` })),
    [toestellen],
  );
  const techOpties = useMemo(
    () =>
      Array.from(new Set(toestellen.map((t) => t.klasse).filter((k): k is string => !!k)))
        .sort()
        .map((k) => ({ value: k, label: k })),
    [toestellen],
  );
  const merkOpties = useMemo(
    () =>
      Array.from(new Set(toestellen.map((t) => t.merk)))
        .sort()
        .map((m) => ({ value: m, label: m })),
    [toestellen],
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return toestellen
      .filter(
        (t) =>
          (!term || `${t.model} ${t.type_nr} ${t.ean}`.toLowerCase().includes(term)) &&
          (maten.size === 0 || (t.inch != null && maten.has(String(t.inch)))) &&
          (technieken.size === 0 || (t.klasse != null && technieken.has(t.klasse))) &&
          (merken.size === 0 || merken.has(t.merk)),
      )
      .sort((a, b) =>
        sort === 'model'
          ? a.model.localeCompare(b.model)
          : sort === 'marge-laag'
            ? a.margePct - b.margePct
            : b.margePct - a.margePct,
      );
  }, [toestellen, q, maten, technieken, merken, sort]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Toestellen</h1>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Zoek model, typenummer of EAN…"
        className="max-w-md"
      />
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelect label="Maat" options={maatOpties} selected={maten} onChange={setMaten} />
        <MultiSelect
          label="Techniek"
          options={techOpties}
          selected={technieken}
          onChange={setTechnieken}
        />
        <MultiSelect label="Merk" options={merkOpties} selected={merken} onChange={setMerken} />
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex rounded-full border p-0.5 text-xs">
            {(
              [
                ['Marge ↓', 'marge-hoog'],
                ['Marge ↑', 'marge-laag'],
                ['A–Z', 'model'],
              ] as const
            ).map(([l, s]) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-full px-2.5 py-1 font-medium ${sort === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{rows.length}</span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((t) => (
          <Link
            key={t.id}
            href={`/tracker/toestellen/${t.id}`}
            className="flex items-center gap-3 rounded-xl border bg-card p-3 elev-1 hover:bg-muted/50"
          >
            <MargeStip margePct={t.margePct} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.model}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t.merk} · {t.type_nr} · {t.inch}&quot; · {t.klasse}
              </p>
            </div>
            <div className="shrink-0 text-right text-sm">
              <p className={`font-semibold ${margeTone(t.margePct)}`}>{t.margePct}%</p>
              <p className="text-xs">
                <span className="text-muted-foreground line-through">
                  {formatEuro(adviesPrijs(t.ticket_c, t.type_nr))}
                </span>{' '}
                <span className="font-medium">{formatEuro(t.ticket_c)}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">{t.voorraadTotaal} st</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
