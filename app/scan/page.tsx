'use client';

import { useState, useTransition, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatEuro, formatPct } from '@/lib/pricing/margin';
import type { ScanProduct, ScanResult, ProductListItem } from '@/lib/supabase/queries';
import { scanAction, searchAction, coupleAction } from './actions';

export default function ScanPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onScan(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const value = input;
    start(async () => {
      const res = await scanAction(value);
      if (res.ok) setResult(res.data);
      else setError(res.error);
    });
  }

  const showCouple =
    result && result.result !== 'hit' && result.input_type === 'rfid' && result.epc;

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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scan een RFID-tag of typ een EAN…"
          aria-label="EPC of EAN"
          className="font-mono"
        />
        <Button type="submit" disabled={pending || input.trim() === ''}>
          {pending ? 'Bezig…' : 'Scan'}
        </Button>
      </form>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {result?.result === 'hit' && result.product && (
        <ResultCard product={result.product} role={result.role} />
      )}

      {showCouple && (
        <CouplePanel
          epc={result!.epc!}
          reason={result!.result}
          onCoupled={() => {
            setResult(null);
            setInput('');
          }}
        />
      )}
    </main>
  );
}

function ResultCard({ product, role }: { product: ScanProduct; role: ScanResult['role'] }) {
  const canSeeMargin = product.margin_cents != null;
  const staleColor = product.is_stale ? 'text-destructive' : 'text-foreground';

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{product.model_name}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.brand} · {product.model_number}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {product.panel_type && <Badge variant="secondary">{product.panel_type}</Badge>}
          <Badge variant="outline">{product.model_year}</Badge>
          {product.status === 'eol' && <Badge variant="destructive">EOL</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Row label="Inkoopprijs">
            <span className={staleColor}>
              {product.purchase_price_cents != null
                ? formatEuro(product.purchase_price_cents)
                : '—'}
              {product.is_stale && ' ⚠︎'}
            </span>
          </Row>
          <Row label="Voorraad">
            <span className={product.total_stock === 0 ? 'text-destructive' : ''}>
              {product.total_stock} {product.total_stock === 1 ? 'stuk' : 'stuks'}
            </span>
          </Row>
          {role === 'sales' || role === 'admin' ? (
            <>
              <Row label="Verkoopprijs">
                {product.sale_price_cents != null ? formatEuro(product.sale_price_cents) : '—'}
              </Row>
              <Row label="Marge">
                {canSeeMargin ? (
                  <span className={product.margin_cents! < 0 ? 'text-destructive' : ''}>
                    {formatEuro(product.margin_cents!)}
                    {product.margin_pct != null && ` · ${formatPct(product.margin_pct / 100)}`}
                  </span>
                ) : (
                  '—'
                )}
              </Row>
            </>
          ) : (
            <Row label="Marge">
              <span className="text-muted-foreground">verborgen ({role ?? 'geen rol'})</span>
            </Row>
          )}
        </dl>

        {product.stock_by_location.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {product.stock_by_location.map((s) => (
              <span key={s.location_code} className="mr-3">
                {s.location_name ?? s.location_code}: {s.qty}
              </span>
            ))}
          </div>
        )}

        {product.status === 'eol' && product.successor_id && (
          <p className="text-sm">
            Opvolger beschikbaar — scan of zoek het opvolgermodel voor het verkoopgesprek.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function CouplePanel({
  epc,
  reason,
  onCoupled,
}: {
  epc: string;
  reason: string;
  onCoupled: () => void;
}) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await searchAction(query);
      if (res.ok) setProducts(res.data);
      else setMsg(res.error);
    });
  }

  function onSelect(p: ProductListItem) {
    start(async () => {
      const res = await coupleAction(epc, p.id);
      if (res.ok) {
        setMsg(`Gekoppeld: ${p.model_name}`);
        setTimeout(onCoupled, 1200);
      } else {
        setMsg(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {reason === 'unlinked' ? 'Tag zonder product' : 'Onbekende tag'} — koppelen
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          EPC <span className="font-mono">{epc}</span> — kies het model om te koppelen.
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
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{p.model_name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.brand} · {p.model_number} · {p.model_year}
                </p>
              </div>
              <Button size="sm" onClick={() => onSelect(p)} disabled={pending}>
                Koppel
              </Button>
            </li>
          ))}
          {products.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">Nog geen resultaten.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
