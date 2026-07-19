'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MatchQueueItem } from '@/lib/supabase/reports';
import type { ProductListItem } from '@/lib/supabase/queries';
import { confirmMatchAction, searchAction } from './actions';

export function MatchRow({ item }: { item: MatchQueueItem }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function confirm(productId: string) {
    start(async () => {
      const res = await confirmMatchAction(item.id, productId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  function search() {
    start(async () => {
      const res = await searchAction(query);
      if (res.ok) setResults(res.data);
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm">
          <p className="font-medium">{item.vendit_description || item.vendit_article_id}</p>
          <p className="text-xs text-muted-foreground">
            Vendit {item.vendit_article_id}
            {item.vendit_ean ? ` · EAN ${item.vendit_ean}` : ''}
            {item.match_confidence != null ? ` · confidence ${item.match_confidence}` : ''}
          </p>
        </div>
        {item.suggestedId && (
          <Button size="sm" onClick={() => confirm(item.suggestedId!)} disabled={pending}>
            Bevestig: {item.suggestedName}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ander model zoeken…"
          className="h-9"
        />
        <Button size="sm" variant="secondary" onClick={search} disabled={pending}>
          Zoek
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {results.length > 0 && (
        <ul className="divide-y rounded border text-sm">
          {results.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-2">
              <span>
                {p.model_name}{' '}
                <span className="text-xs text-muted-foreground">{p.model_number}</span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => confirm(p.id)} disabled={pending}>
                Kies
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
