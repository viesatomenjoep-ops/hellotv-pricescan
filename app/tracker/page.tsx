import Link from 'next/link';
import { Tv, Boxes, Tag, ListChecks } from 'lucide-react';
import { getDashboard, getTarget } from '@/lib/tracker/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatEuro } from '@/lib/pricing/margin';
import { MargeGauge } from '@/components/tracker/marge-gauge';
import { MargeStip } from '@/components/tracker/marge-stip';
import { CampagneBanner } from '@/components/tracker/campagne-banner';

export const dynamic = 'force-dynamic';

function margeTone(pct: number): string {
  return pct >= 25 ? 'text-green-700' : pct >= 15 ? 'text-orange-700' : 'text-red-700';
}

export default async function TrackerDashboard() {
  const [d, target] = await Promise.all([getDashboard(), getTarget()]);

  const kpis = [
    { label: 'Toestellen', value: d.toestellen, icon: Tv, tint: 'bg-blue-100 text-blue-700' },
    { label: 'Voorraad', value: d.voorraadTotaal, icon: Boxes, tint: 'bg-teal-100 text-teal-700' },
    {
      label: 'Gem. ticket',
      value: formatEuro(d.gemTicketC),
      icon: Tag,
      tint: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Open taken',
      value: d.takenOpen,
      icon: ListChecks,
      tint: 'bg-violet-100 text-violet-700',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overzicht van je vloer vandaag.</p>
      </div>

      <CampagneBanner />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${k.tint}`}>
                <k.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs text-muted-foreground">{k.label}</span>
                <span className="block text-2xl font-bold leading-tight">{k.value}</span>
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <MargeGauge target={target} />

      <div>
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
      </div>
    </div>
  );
}
