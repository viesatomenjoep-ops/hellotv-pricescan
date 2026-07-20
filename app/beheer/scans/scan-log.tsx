'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/stat-card';
import type { ScanEventRow } from '@/lib/supabase/reports';

export function ScanLog({ events }: { events: ScanEventRow[] }) {
  const [result, setResult] = useState<string>('all');
  const [inputType, setInputType] = useState<string>('all');

  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = events.filter((e) => new Date(e.scanned_at) >= todayStart).length;
    const rfid = events.filter((e) => e.input_type === 'rfid').length;
    const unknown = events.filter((e) => e.result === 'unknown_tag').length;
    const models = new Set(events.map((e) => e.products?.model_name).filter(Boolean)).size;
    const rfidPct = events.length ? Math.round((rfid / events.length) * 100) : 0;
    const unknownPct = events.length ? Math.round((unknown / events.length) * 100) : 0;
    return { today, models, rfidPct, unknownPct };
  }, [events]);

  const filtered = events.filter(
    (e) =>
      (result === 'all' || e.result === result) &&
      (inputType === 'all' || e.input_type === inputType),
  );

  function exportCsv() {
    const rows = filtered.map((e) => ({
      scanned_at: e.scanned_at,
      input_type: e.input_type,
      code: e.epc ?? e.ean ?? '',
      result: e.result,
      model: e.products?.model_name ?? '',
    }));
    const headers = Object.keys(rows[0] ?? { scanned_at: '' });
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? '')).join(','),
      ),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scans.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Scans (recent)" value={events.length} />
        <StatCard label="Vandaag" value={stats.today} />
        <StatCard
          label="RFID-aandeel"
          value={`${stats.rfidPct}%`}
          tone={stats.rfidPct < 50 ? 'warn' : 'default'}
        />
        <StatCard
          label="Onbekende tag"
          value={`${stats.unknownPct}%`}
          tone={stats.unknownPct > 10 ? 'warn' : 'default'}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={result}
          onChange={(e) => setResult(e.target.value)}
          className="h-10 rounded-md border bg-background px-2 text-sm md:h-9"
        >
          <option value="all">Alle resultaten</option>
          <option value="hit">hit</option>
          <option value="unknown_tag">unknown_tag</option>
          <option value="unlinked">unlinked</option>
        </select>
        <select
          value={inputType}
          onChange={(e) => setInputType(e.target.value)}
          className="h-10 rounded-md border bg-background px-2 text-sm md:h-9"
        >
          <option value="all">RFID + EAN</option>
          <option value="rfid">rfid</option>
          <option value="ean">ean</option>
        </select>
        <Button size="sm" variant="secondary" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2">Tijd</th>
              <th className="p-2">Type</th>
              <th className="p-2">Code</th>
              <th className="p-2">Resultaat</th>
              <th className="p-2">Model</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-2">{new Date(e.scanned_at).toLocaleString('nl-NL')}</td>
                <td className="p-2">
                  <Badge variant="outline">{e.input_type}</Badge>
                </td>
                <td className="p-2 font-mono text-xs">{e.epc ?? e.ean ?? '—'}</td>
                <td className="p-2">{e.result}</td>
                <td className="p-2">{e.products?.model_name ?? '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-muted-foreground">
                  Geen scans.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
