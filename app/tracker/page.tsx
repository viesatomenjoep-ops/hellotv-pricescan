import Link from 'next/link';
import { getDashboard, getTarget } from '@/lib/tracker/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatEuro } from '@/lib/pricing/margin';
import { MargeGauge } from '@/components/tracker/marge-gauge';
import { MargeStip } from '@/components/tracker/marge-stip';

export const dynamic = 'force-dynamic';

function margeTone(pct: number): string {
  return pct >= 25 ? 'text-green-700' : pct >= 15 ? 'text-orange-700' : 'text-red-700';
}

export default async function TrackerDashboard() {
  const [d, target] = await Promise.all([getDashboard(), getTarget()]);

  const kpis = [
    { label: 'Toestellen', value: d.toestellen },
    { label: 'Voorraad totaal', value: d.voorraadTotaal },
    { label: 'Open pipeline', value: d.pipeline.lead + d.pipeline.offerte },
    { label: 'Open taken', value: d.takenOpen },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overzicht van je vloer vandaag.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <MargeGauge target={target} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Beste marge vandaag</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {d.besteMarge.map((t) => (
                <li key={t.id} className="flex items-center gap-2 py-2">
                  <MargeStip margePct={t.margePct} />
                  <Link href={`/tracker/toestellen/${t.id}`} className="min-w-0 flex-1 truncate hover:underline">
                    {t.model}
                    <span className="ml-2 text-xs text-muted-foreground">{t.merk}</span>
                  </Link>
                  <span className={`shrink-0 font-semibold ${margeTone(t.margePct)}`}>
                    {formatEuro(t.margeC)} · {t.margePct}%
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verkoop-pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(['lead', 'offerte', 'verkocht', 'geleverd'] as const).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <span className="capitalize">{s}</span>
                <Badge variant="secondary">{d.pipeline[s]}</Badge>
              </div>
            ))}
            <Link href="/tracker/verkopen" className="mt-2 block text-sm text-primary underline">
              Naar de pipeline →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
