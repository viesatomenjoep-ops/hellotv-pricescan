'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatEuro } from '@/lib/pricing/margin';
import type { PriceChange, MarginWatchItem } from '@/lib/supabase/reports';

function downloadCsv(name: string, rows: readonly object[]) {
  if (rows.length === 0) return;
  const records = rows as ReadonlyArray<Record<string, unknown>>;
  const headers = Object.keys(records[0]);
  const csv = [
    headers.join(','),
    ...records.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
  ].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function PricesView({
  changes,
  watchlist,
}: {
  changes: PriceChange[];
  watchlist: MarginWatchItem[];
}) {
  const [tab, setTab] = useState<'changes' | 'watchlist'>('changes');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={tab === 'changes' ? 'default' : 'ghost'}
            onClick={() => setTab('changes')}
          >
            Wijzigingen
          </Button>
          <Button
            size="sm"
            variant={tab === 'watchlist' ? 'default' : 'ghost'}
            onClick={() => setTab('watchlist')}
          >
            Marge-watchlist
          </Button>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            tab === 'changes'
              ? downloadCsv('prijswijzigingen.csv', changes)
              : downloadCsv('marge-watchlist.csv', watchlist)
          }
        >
          Export CSV
        </Button>
      </div>

      {tab === 'changes' ? (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Model</th>
                <th className="p-2">Veld</th>
                <th className="p-2">Oud</th>
                <th className="p-2">Nieuw</th>
                <th className="p-2">Delta%</th>
                <th className="p-2">Datum</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.model_name}</td>
                  <td className="p-2">{c.field === 'sale' ? 'Verkoop' : 'Inkoop'}</td>
                  <td className="p-2">{c.old_cents != null ? formatEuro(c.old_cents) : '—'}</td>
                  <td className="p-2">{c.new_cents != null ? formatEuro(c.new_cents) : '—'}</td>
                  <td
                    className={`p-2 ${(c.delta_pct ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {c.delta_pct != null ? `${c.delta_pct > 0 ? '+' : ''}${c.delta_pct}%` : '—'}
                  </td>
                  <td className="p-2">{new Date(c.changed_at).toLocaleDateString('nl-NL')}</td>
                </tr>
              ))}
              {changes.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-muted-foreground">
                    Geen wijzigingen in de laatste 30 dagen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Model</th>
                <th className="p-2">Merk</th>
                <th className="p-2">Marge%</th>
                <th className="p-2">Marge</th>
                <th className="p-2">Verkoop</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((w) => (
                <tr key={w.product_id} className="border-t">
                  <td className="p-2">{w.model_name}</td>
                  <td className="p-2">{w.brand_name}</td>
                  <td className="p-2">
                    <Badge variant="destructive">{w.margin_pct}%</Badge>
                  </td>
                  <td className="p-2">
                    {w.margin_cents != null ? formatEuro(w.margin_cents) : '—'}
                  </td>
                  <td className="p-2">
                    {w.sale_price_cents != null ? formatEuro(w.sale_price_cents) : '—'}
                  </td>
                </tr>
              ))}
              {watchlist.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-muted-foreground">
                    Geen producten onder de marge-drempel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
