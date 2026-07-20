import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getToestelDetail } from '@/lib/tracker/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatEuro } from '@/lib/pricing/margin';
import { TicketEditor } from './ticket-editor';

export const dynamic = 'force-dynamic';

function margeTone(pct: number) {
  return pct >= 25 ? 'text-green-700' : pct >= 15 ? 'text-orange-700' : 'text-red-700';
}

export default async function ToestelDetailPage({ params }: { params: { id: string } }) {
  const res = await getToestelDetail(Number(params.id));
  if (!res) notFound();
  const { detail: t, filialen } = res;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t.model}</h1>
        <Link href="/tracker/toestellen" className="text-sm text-muted-foreground hover:underline">
          ← Toestellen
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {t.klasse && <Badge variant="secondary">{t.klasse}</Badge>}
        <span className="text-sm text-muted-foreground">
          {t.merk} · {t.type_nr} · {t.inch}&quot; · EAN {t.ean}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prijs &amp; marge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row l="Inkoop">{formatEuro(t.inkoop_c)}</Row>
            <Row l="Ticketprijs">
              <TicketEditor id={t.id} ticketC={t.ticket_c} />
            </Row>
            <Row l="Min-marge prijs">{formatEuro(t.min_marge_c)}</Row>
            <Row l="Marge">
              <span className={margeTone(t.margePct)}>
                {formatEuro(t.margeC)} · {t.margePct}%
              </span>
            </Row>
            <Row l="Lifetime-marge">{formatEuro(t.lifetimeMargeC)}</Row>
            <Row l="Verkoopsnelheid">{t.verkoopsnelheid}/10</Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Voorraad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {filialen.map((f) => (
              <Row key={f.id} l={f.naam}>
                {t.voorraad[f.id] ?? 0} stuks
              </Row>
            ))}
            <Row l="Centraal">
              {t.centraalAantal} {t.centraalEta != null && `· ETA ${t.centraalEta}d`}
            </Row>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Specificaties</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t.specs}</CardContent>
      </Card>

      <Button asChild>
        <Link href={`/tracker/scan?toestel=${t.id}`}>Maak aanbieding</Link>
      </Button>
    </div>
  );
}

function Row({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{l}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
