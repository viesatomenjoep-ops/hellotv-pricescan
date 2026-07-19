import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionUser, canSeeMargin } from '@/lib/auth';
import { getProductDetail } from '@/lib/supabase/catalog';
import { getAlternatives } from '@/lib/supabase/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceBadge } from '@/components/badges/price-badge';
import { MarginBadge } from '@/components/badges/margin-badge';
import { formatEuro } from '@/lib/pricing/margin';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const detail = await getProductDetail(params.id);
  if (!detail) notFound();
  const showMargin = canSeeMargin(user?.role ?? null);
  const alternatives = await getAlternatives(params.id);
  const p = detail.product;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{p.model_name}</h1>
        <Link href="/catalogus" className="text-sm text-muted-foreground hover:underline">
          ← Catalogus
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specificaties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Merk: {p.brand_name}</p>
            <p>Modelnummer: {p.model_number}</p>
            <p>Jaar: {p.model_year}</p>
            <p>
              Scherm: {p.screen_size_inch}&quot; · {p.panel_type}
            </p>
            <p>Segment: {p.segment}</p>
            <p>EAN: {p.ean ?? '—'}</p>
            {p.status === 'eol' && <Badge variant="destructive">EOL</Badge>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prijs &amp; voorraad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              Inkoop: <PriceBadge cents={p.purchase_price_cents} lastSyncedAt={p.last_synced_at} />
            </div>
            {showMargin && (
              <>
                <p>Verkoop: {p.sale_price_cents != null ? formatEuro(p.sale_price_cents) : '—'}</p>
                <div className="flex items-center gap-2">
                  Marge: <MarginBadge marginCents={p.margin_cents} marginPct={p.margin_pct} />
                </div>
              </>
            )}
            <p>Totale voorraad: {p.total_stock}</p>
            <ul className="text-xs text-muted-foreground">
              {detail.stockByLocation.map((s) => (
                <li key={s.location_code}>
                  {s.location_name ?? s.location_code}: {s.qty}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">RFID-tags ({detail.tags.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs">
          {detail.tags.map((t) => (
            <span key={t.epc} className="rounded bg-muted px-2 py-1 font-mono">
              {t.epc}
            </span>
          ))}
          {detail.tags.length === 0 && <span className="text-muted-foreground">Geen tags.</span>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prijshistorie</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {detail.history.map((h, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {h.field === 'sale' ? 'Verkoop' : 'Inkoop'} ·{' '}
                  {new Date(h.changed_at).toLocaleDateString('nl-NL')}
                </span>
                <span>
                  {h.old_cents != null ? formatEuro(h.old_cents) : '—'} →{' '}
                  {h.new_cents != null ? formatEuro(h.new_cents) : '—'}
                </span>
              </li>
            ))}
            {detail.history.length === 0 && (
              <li className="text-muted-foreground">Nog geen wijzigingen.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alternatieven</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {alternatives.map((a) => (
              <Link key={a.product_id} href={`/catalogus/${a.product_id}`}>
                <div className="rounded-md border p-3 transition-colors hover:bg-muted/50">
                  {a.is_successor && <Badge className="mb-1">Opvolger</Badge>}
                  <p className="text-sm font-medium">{a.model_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.brand_name} · {a.screen_size_inch}&quot;
                  </p>
                  <p className="text-sm">
                    {a.sale_price_cents != null ? formatEuro(a.sale_price_cents) : '—'}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
