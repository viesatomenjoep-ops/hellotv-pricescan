'use client';

import { useCallback, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceBadge } from '@/components/badges/price-badge';
import { MarginBadge } from '@/components/badges/margin-badge';
import { StockBadge } from '@/components/badges/stock-badge';
import { formatEuro } from '@/lib/pricing/margin';
import { useScanListener, type Scan } from '@/lib/rfid/use-scan-listener';
import type { ScanProduct, ScanResult, Alternative } from '@/lib/supabase/queries';
import { scanAction, alternativesAction } from './actions';

interface HistoryEntry {
  value: string;
  type: string;
  result: string;
  at: number;
}

export default function ScanPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const runScan = useCallback((value: string) => {
    if (!value.trim()) return;
    start(async () => {
      const res = await scanAction(value);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const r = res.data;
      setError(null);
      setResult(r);
      setInput('');
      setHistory((prev) =>
        [
          { value: r.epc ?? r.ean ?? value, type: r.input_type, result: r.result, at: Date.now() },
          ...prev,
        ].slice(0, 10),
      );
      if (r.result === 'hit' && r.product) {
        const alt = await alternativesAction(r.product.id);
        setAlternatives(alt.ok ? alt.data : []);
      } else {
        setAlternatives([]);
      }
    });
  }, []);

  const onScan = useCallback((scan: Scan) => runScan(scan.value), [runScan]);
  const { flash } = useScanListener({ enabled: true, onScan });

  function onManualSubmit(e: FormEvent) {
    e.preventDefault();
    runScan(input);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      {flash && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 ${flash === 'ok' ? 'bg-green-400/20' : 'bg-red-400/20'}`}
        />
      )}

      <h1 className="text-2xl font-bold tracking-tight">Scannen</h1>
      <p className="text-sm text-muted-foreground">
        Scan een RFID-tag of EAN-barcode — of typ de code. Scan-modus staat aan.
      </p>

      <form onSubmit={onManualSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="EPC of EAN…"
          aria-label="EPC of EAN"
          className="font-mono"
        />
        <Button type="submit" disabled={pending || input.trim() === ''}>
          {pending ? 'Bezig…' : 'Zoek'}
        </Button>
      </form>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {result?.result === 'hit' && result.product && (
        <>
          <ResultCard product={result.product} role={result.role} />
          <AlternativesSection alternatives={alternatives} showMargin={canMargin(result.role)} />
        </>
      )}

      {result && result.result !== 'hit' && <StateCard result={result} />}

      {history.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground">Laatste scans</h2>
          <ul className="divide-y rounded-md border text-sm">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between p-2">
                <span className="font-mono text-xs">{h.value}</span>
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{h.type}</Badge>
                  <span className="text-xs text-muted-foreground">{h.result}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function canMargin(role: ScanResult['role']): boolean {
  return role === 'sales' || role === 'admin';
}

function ResultCard({ product, role }: { product: ScanProduct; role: ScanResult['role'] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{product.model_name}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.brand} · {product.model_number}
            {product.screen_size_inch ? ` · ${product.screen_size_inch}"` : ''}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {product.panel_type && <Badge variant="secondary">{product.panel_type}</Badge>}
          <Badge variant="outline">{product.model_year}</Badge>
          {product.status === 'eol' && <Badge variant="destructive">EOL</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {product.status === 'eol' && product.successor_id && (
          <div className="rounded-md bg-orange-50 p-2 text-sm text-orange-800">
            Dit model loopt uit (EOL) — bekijk de opvolger bij de alternatieven.
          </div>
        )}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Inkoop">
            <PriceBadge
              cents={product.purchase_price_cents}
              lastSyncedAt={product.last_synced_at}
            />
          </Field>
          <Field label="Voorraad">
            <StockBadge total={product.total_stock} byLocation={product.stock_by_location} />
          </Field>
          {canMargin(role) && (
            <>
              <Field label="Verkoop">
                {product.sale_price_cents != null ? formatEuro(product.sale_price_cents) : '—'}
              </Field>
              <Field label="Marge">
                <MarginBadge marginCents={product.margin_cents} marginPct={product.margin_pct} />
              </Field>
            </>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

function AlternativesSection({
  alternatives,
  showMargin,
}: {
  alternatives: Alternative[];
  showMargin: boolean;
}) {
  if (alternatives.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">Alternatieven op voorraad</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {alternatives.map((a) => (
          <Card key={a.product_id}>
            <CardContent className="space-y-2 p-3">
              <div className="aspect-video rounded bg-muted" />
              <div className="flex flex-wrap gap-1">
                {a.is_successor && <Badge>Opvolger</Badge>}
                {a.is_pinned && <Badge variant="secondary">Vastgezet</Badge>}
              </div>
              <p className="text-sm font-medium leading-tight">{a.model_name}</p>
              <p className="text-xs text-muted-foreground">
                {a.brand_name}
                {a.screen_size_inch ? ` · ${a.screen_size_inch}"` : ''}
              </p>
              <p className="text-sm font-semibold">
                {a.sale_price_cents != null ? formatEuro(a.sale_price_cents) : '—'}
              </p>
              <StockBadge total={a.total_stock} byLocation={[]} />
              {showMargin && a.margin_diff_pp != null && (
                <p
                  className={`text-xs font-medium ${a.margin_diff_pp >= 0 ? 'text-green-700' : 'text-red-700'}`}
                >
                  {a.margin_diff_pp >= 0 ? '▲' : '▼'} {Math.abs(a.margin_diff_pp).toFixed(1)} ppt
                  marge
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StateCard({ result }: { result: ScanResult }) {
  if (result.result === 'unlinked') {
    return (
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-red-700">Tag zonder product</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Deze tag (<span className="font-mono">{result.epc}</span>) is niet aan een model
          gekoppeld. Meld dit bij beheer of koppel de tag opnieuw.
        </CardContent>
      </Card>
    );
  }
  if (result.input_type === 'ean') {
    return (
      <Card className="border-orange-300">
        <CardHeader>
          <CardTitle className="text-orange-700">Model niet in catalogus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            EAN <span className="font-mono">{result.ean}</span> hoort bij geen bekend model.
          </p>
          <Link href="/beheer/import" className="text-primary underline">
            Naar import
          </Link>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-orange-300">
      <CardHeader>
        <CardTitle className="text-orange-700">Onbekende tag</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Deze tag (<span className="font-mono">{result.epc}</span>) is nog niet gekoppeld.
        </p>
        <Button asChild>
          <Link href={`/koppelen?epc=${result.epc}`}>Nu koppelen</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
