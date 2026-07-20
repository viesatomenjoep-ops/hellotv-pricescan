'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateWeightsAction } from './actions';

const FIELDS: Array<{ key: string; label: string }> = [
  { key: 'margin', label: 'Marge%' },
  { key: 'stock', label: 'Voorraad' },
  { key: 'brand', label: 'Zelfde merk' },
  { key: 'year', label: 'Nieuwer jaar' },
  { key: 'panel', label: 'Paneltype' },
  { key: 'price', label: 'Prijsnabijheid' },
];
const DEFAULTS: Record<string, number> = {
  margin: 40,
  stock: 20,
  brand: 10,
  year: 10,
  panel: 10,
  price: 10,
};

export function WeightsForm({ initial }: { initial: Record<string, number> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, String(initial[f.key] ?? DEFAULTS[f.key])])),
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    const weights = Object.fromEntries(FIELDS.map((f) => [f.key, Number(values[f.key])]));
    start(async () => {
      const res = await updateWeightsAction(weights);
      setMsg(res.ok ? 'Opgeslagen.' : res.error);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="text-sm">
            <span className="mb-1 block text-muted-foreground">{f.label}</span>
            <Input
              type="number"
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? 'Bezig…' : 'Gewichten opslaan'}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
