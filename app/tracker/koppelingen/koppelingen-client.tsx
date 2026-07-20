'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { IntegratieRow } from '@/lib/tracker/queries';
import { updateKoppelingAction, testKoppelingAction } from './actions';

const META: Record<
  string,
  { titel: string; omschrijving: string; velden: Array<{ key: string; label: string; secret?: boolean }> }
> = {
  vms: {
    titel: 'Vendit VMS',
    omschrijving: 'Bron van waarheid voor voorraad, prijzen en marges.',
    velden: [
      { key: 'base_url', label: 'API-URL' },
      { key: 'api_key', label: 'API-sleutel', secret: true },
    ],
  },
  email: {
    titel: 'E-mail (aanbiedingen)',
    omschrijving: 'Verstuurt bonnen/aanbiedingen naar klanten.',
    velden: [
      { key: 'afzender', label: 'Afzender' },
      { key: 'reply_to', label: 'Antwoordadres' },
      { key: 'api_key', label: 'API-sleutel', secret: true },
    ],
  },
  drive: {
    titel: 'Google Drive',
    omschrijving: 'Archiveert bonnen en rapportages.',
    velden: [
      { key: 'folder_id', label: 'Map-ID' },
      { key: 'service_account', label: 'Service-account', secret: true },
    ],
  },
};

const STATUS_TONE: Record<string, string> = {
  verbonden: 'bg-green-100 text-green-800',
  'niet-verbonden': 'bg-muted text-muted-foreground',
  fout: 'bg-red-100 text-red-800',
};

export function KoppelingenClient({
  integraties,
  isManager,
}: {
  integraties: IntegratieRow[];
  isManager: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Koppelingen</h1>
        <p className="text-sm text-muted-foreground">
          Verbind Sales Tracker met externe systemen.
          {!isManager && ' Alleen een manager kan wijzigen.'}
        </p>
      </div>

      {integraties.map((i) => (
        <KoppelingKaart key={i.id} integratie={i} isManager={isManager} />
      ))}
      {integraties.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Geen koppelingen geconfigureerd. Draai de tracker-seed om ze aan te maken.
        </p>
      )}
    </div>
  );
}

function KoppelingKaart({
  integratie,
  isManager,
}: {
  integratie: IntegratieRow;
  isManager: boolean;
}) {
  const meta = META[integratie.soort] ?? {
    titel: integratie.soort,
    omschrijving: '',
    velden: [],
  };
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(integratie.status);
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const c: Record<string, string> = {};
    for (const v of meta.velden) c[v.key] = String(integratie.config_json?.[v.key] ?? '');
    return c;
  });
  const [msg, setMsg] = useState<string | null>(null);

  function opslaan() {
    setMsg(null);
    start(async () => {
      const res = await updateKoppelingAction({ id: integratie.id, status, config });
      setMsg(res.ok ? 'Opgeslagen.' : res.error);
      if (res.ok) router.refresh();
    });
  }

  function test() {
    setMsg(null);
    start(async () => {
      const res = await testKoppelingAction(integratie.soort);
      setMsg(res.bericht);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">{meta.titel}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{meta.omschrijving}</p>
        </div>
        <Badge className={STATUS_TONE[status] ?? ''} variant="secondary">
          {status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {meta.velden.map((v) => (
          <div key={v.key} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{v.label}</label>
            <Input
              type={v.secret ? 'password' : 'text'}
              value={config[v.key] ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, [v.key]: e.target.value }))}
              disabled={!isManager || pending}
              placeholder={v.secret ? '••••••••' : ''}
            />
          </div>
        ))}

        {isManager && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={pending}
              className="h-10 rounded-md border bg-background px-2 text-sm md:h-9"
            >
              <option value="verbonden">verbonden</option>
              <option value="niet-verbonden">niet-verbonden</option>
              <option value="fout">fout</option>
            </select>
            <Button size="sm" onClick={opslaan} disabled={pending}>
              Opslaan
            </Button>
            <Button size="sm" variant="outline" onClick={test} disabled={pending}>
              Test verbinding
            </Button>
            {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
