'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PriceBadge } from '@/components/badges/price-badge';
import { MarginBadge } from '@/components/badges/margin-badge';
import { StockBadge } from '@/components/badges/stock-badge';
import type { CatalogRow } from '@/lib/supabase/catalog';

type Toggle = 'noPrice' | 'noTag' | 'underMargin' | 'eol';

export function CatalogTable({ rows, showMargin }: { rows: CatalogRow[]; showMargin: boolean }) {
  const [q, setQ] = useState('');
  const [year, setYear] = useState<number | null>(null);
  const [toggles, setToggles] = useState<Record<Toggle, boolean>>({
    noPrice: false,
    noTag: false,
    underMargin: false,
    eol: false,
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (term && !`${r.model_name} ${r.model_number} ${r.ean}`.toLowerCase().includes(term))
        return false;
      if (year && r.model_year !== year) return false;
      if (toggles.noPrice && r.sale_price_cents != null) return false;
      if (toggles.noTag && r.tag_count > 0) return false;
      if (toggles.underMargin && !(r.margin_pct != null && r.margin_pct < 10)) return false;
      if (toggles.eol && r.status !== 'eol') return false;
      return true;
    });
  }, [rows, q, year, toggles]);

  function toggle(key: Toggle) {
    setToggles((t) => ({ ...t, [key]: !t[key] }));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek model, nummer of EAN…"
          className="max-w-xs"
        />
        {[2025, 2026].map((y) => (
          <Button
            key={y}
            size="sm"
            variant={year === y ? 'default' : 'outline'}
            onClick={() => setYear(year === y ? null : y)}
          >
            {y}
          </Button>
        ))}
        {(
          [
            ['noPrice', 'Zonder prijs'],
            ['noTag', 'Zonder tag'],
            ['underMargin', 'Onder drempel'],
            ['eol', 'EOL'],
          ] as Array<[Toggle, string]>
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={toggles[key] ? 'default' : 'outline'}
            onClick={() => toggle(key)}
          >
            {label}
          </Button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} modellen</span>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2">Model</th>
              <th className="p-2">Jaar</th>
              <th className="p-2">Inkoop</th>
              {showMargin && <th className="p-2">Marge</th>}
              <th className="p-2">Voorraad</th>
              <th className="p-2">Tags</th>
              <th className="p-2">Match</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-2">
                  <Link href={`/catalogus/${r.id}`} className="font-medium hover:underline">
                    {r.model_name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {r.brand_name} · {r.model_number}
                    {r.status === 'eol' && ' · EOL'}
                  </div>
                </td>
                <td className="p-2">{r.model_year}</td>
                <td className="p-2">
                  <PriceBadge cents={r.purchase_price_cents} lastSyncedAt={r.last_synced_at} />
                </td>
                {showMargin && (
                  <td className="p-2">
                    <MarginBadge marginCents={r.margin_cents} marginPct={r.margin_pct} />
                  </td>
                )}
                <td className="p-2">
                  <StockBadge total={r.total_stock ?? 0} byLocation={[]} />
                </td>
                <td className="p-2">{r.tag_count}</td>
                <td className="p-2">
                  {r.matched ? (
                    <Badge variant="secondary">gematcht</Badge>
                  ) : (
                    <Badge variant="outline">geen</Badge>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={showMargin ? 7 : 6} className="p-3 text-muted-foreground">
                  Geen modellen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
