'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatEuro, formatPct } from '@/lib/pricing/margin';
import type { Model, ScanResult } from '@/lib/supabase/queries';
import { scanAction, searchAction, coupleAction } from './actions';

export default function ScanPage() {
  const [epcInput, setEpcInput] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onScan(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const epc = epcInput;
    start(async () => {
      const res = await scanAction(epc);
      if (res.ok) setResult(res.data);
      else setError(res.error);
    });
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Scannen</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Home
        </Link>
      </div>

      <form onSubmit={onScan} className="flex gap-2">
        <Input
          autoFocus
          value={epcInput}
          onChange={(e) => setEpcInput(e.target.value)}
          placeholder="Scan of typ een EPC…"
          aria-label="EPC"
          className="font-mono"
        />
        <Button type="submit" disabled={pending || epcInput.trim() === ''}>
          {pending ? 'Bezig…' : 'Scan'}
        </Button>
      </form>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {result?.matched && <ScanResultCard result={result} />}

      {result && !result.matched && (
        <CouplePanel
          epc={result.epc}
          onCoupled={() => {
            setResult(null);
            setEpcInput('');
          }}
        />
      )}
    </main>
  );
}

function ScanResultCard({ result }: { result: Extract<ScanResult, { matched: true }> }) {
  const { model, price, role } = result;
  const showMargin = price?.margin_cents !== undefined;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{model.name}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {model.brand} · {model.model_code}
          </p>
        </div>
        <div className="flex gap-2">
          {model.panel_type && <Badge variant="secondary">{model.panel_type}</Badge>}
          <Badge variant="outline">{model.model_year}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!price && (
          <p className="text-sm text-muted-foreground">
            Gekoppeld model zonder prijsinformatie (nog geen Vendit-artikel).
          </p>
        )}
        {price && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Row label="Verkoopprijs">{formatEuro(price.sale_price_cents)}</Row>
            <Row label="Voorraad">
              {price.stock_qty} {price.stock_qty === 1 ? 'stuk' : 'stuks'}
            </Row>
            <Row label="Excl. btw">{formatEuro(price.sale_price_excl_vat_cents)}</Row>
            {showMargin ? (
              <>
                <Row label="Inkoop">{formatEuro(price.purchase_price_cents!)}</Row>
                <Row label="Marge">
                  <span className={price.margin_cents! < 0 ? 'text-destructive' : ''}>
                    {formatEuro(price.margin_cents!)}
                    {price.margin_pct != null && ` · ${formatPct(price.margin_pct)}`}
                  </span>
                </Row>
              </>
            ) : (
              <Row label="Marge">
                <span className="text-muted-foreground">verborgen ({role})</span>
              </Row>
            )}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function CouplePanel({ epc, onCoupled }: { epc: string; onCoupled: () => void }) {
  const [query, setQuery] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await searchAction(query);
      if (res.ok) setModels(res.data);
      else setMsg(res.error);
    });
  }

  function onSelect(model: Model) {
    start(async () => {
      const res = await coupleAction(epc, model.id);
      if (res.ok) {
        setMsg(`Gekoppeld: ${model.name}`);
        setTimeout(onCoupled, 1200);
      } else {
        setMsg(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onbekende tag — koppelen</CardTitle>
        <p className="text-sm text-muted-foreground">
          EPC <span className="font-mono">{epc}</span> hoort nog bij geen model. Kies een model.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={onSearch} className="flex gap-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op merk, model of EAN…"
          />
          <Button type="submit" variant="secondary" disabled={pending}>
            Zoek
          </Button>
        </form>

        {msg && <p className="text-sm font-medium">{msg}</p>}

        <ul className="divide-y rounded-md border">
          {models.map((m) => (
            <li key={m.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.brand} · {m.model_code} · {m.model_year}
                </p>
              </div>
              <Button size="sm" onClick={() => onSelect(m)} disabled={pending}>
                Koppel
              </Button>
            </li>
          ))}
          {models.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">Nog geen resultaten.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
