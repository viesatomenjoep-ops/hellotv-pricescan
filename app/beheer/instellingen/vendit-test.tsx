'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { testConnectionAction, type TestRow } from './actions';

export function VenditTest() {
  const [rows, setRows] = useState<TestRow[] | null>(null);
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function test() {
    setError(null);
    start(async () => {
      const res = await testConnectionAction();
      if (res.ok && res.data) {
        setRows(res.data.rows);
        setSource(res.data.source);
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button size="sm" variant="secondary" onClick={test} disabled={pending}>
        {pending ? 'Testen…' : 'Verbinding testen (5 artikelen)'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {rows && (
        <div className="text-xs">
          <p className="mb-1 text-muted-foreground">Bron: {source}</p>
          <ul className="divide-y rounded border">
            {rows.map((r) => (
              <li key={r.id} className="flex justify-between p-2 font-mono">
                <span>
                  {r.id} · {r.ean ?? '—'}
                </span>
                <span>
                  in {r.purchase ?? '—'} / uit {r.sale ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
