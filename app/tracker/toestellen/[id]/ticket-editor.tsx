'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useFlag } from '@/components/tracker/flags-provider';
import { formatEuro } from '@/lib/pricing/margin';
import { updateTicketAction } from '../actions';

export function TicketEditor({ id, ticketC }: { id: number; ticketC: number }) {
  const kanBewerken = useFlag('toestel.prijs_bewerken');
  const router = useRouter();
  const [waarde, setWaarde] = useState(String(Math.round(ticketC / 100)));
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!kanBewerken) {
    return <span className="font-medium">{formatEuro(ticketC)}</span>;
  }

  function save() {
    setMsg(null);
    start(async () => {
      const res = await updateTicketAction(id, Number(waarde) * 100);
      setMsg(res.ok ? 'Opgeslagen.' : res.error);
      if (res.ok) router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Input
        type="number"
        inputMode="numeric"
        value={waarde}
        onChange={(e) => setWaarde(e.target.value)}
        onBlur={save}
        aria-label="Ticketprijs in euro"
        className="h-10 w-28 md:h-9 md:w-24"
      />
      <span className="text-xs text-muted-foreground">€ · via Ticketdashboard</span>
      {pending && <span className="text-xs text-muted-foreground">…</span>}
      {msg && <span className="text-xs text-green-700">{msg}</span>}
    </span>
  );
}
