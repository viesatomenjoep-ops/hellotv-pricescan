'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { approveAction, rejectAction } from './actions';

export function ReviewButtons({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(fn: typeof approveAction) {
    start(async () => {
      const res = await fn(id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => run(approveAction)} disabled={pending}>
          Goedkeuren
        </Button>
        <Button size="sm" variant="ghost" onClick={() => run(rejectAction)} disabled={pending}>
          Afwijzen
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
