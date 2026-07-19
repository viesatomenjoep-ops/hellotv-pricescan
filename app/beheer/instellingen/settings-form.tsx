'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateSettingAction } from './actions';

const FIELDS: Array<{ key: string; label: string; suffix: string }> = [
  { key: 'margin_alert_threshold_pct', label: 'Marge-alert drempel', suffix: '%' },
  { key: 'quarantine_delta_pct', label: 'Quarantaine-delta', suffix: '%' },
  { key: 'vat_pct', label: 'Btw-percentage', suffix: '%' },
  {
    key: 'alternatives_size_tolerance_inch',
    label: 'Schermmaat-tolerantie alternatieven',
    suffix: 'inch',
  },
];

export function SettingsForm({ initial }: { initial: Record<string, number> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, String(initial[f.key] ?? '')])),
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    start(async () => {
      for (const f of FIELDS) {
        const num = Number(values[f.key]);
        if (!Number.isFinite(num)) continue;
        const res = await updateSettingAction(f.key, num);
        if (!res.ok) {
          setMsg(res.error);
          return;
        }
      }
      setMsg('Opgeslagen.');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {FIELDS.map((f) => (
        <div key={f.key} className="flex items-center justify-between gap-4">
          <label className="text-sm">{f.label}</label>
          <div className="flex w-40 items-center gap-2">
            <Input
              type="number"
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
            <span className="text-sm text-muted-foreground">{f.suffix}</span>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? 'Bezig…' : 'Opslaan'}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
