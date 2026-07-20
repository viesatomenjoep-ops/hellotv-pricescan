import Link from 'next/link';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { getDashboardData, getMarginByBrand, getRecentPriceChanges } from '@/lib/supabase/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { MarginBarChart } from '@/components/charts/margin-bar-chart';
import { ChangesPerDayChart } from '@/components/charts/changes-per-day-chart';

const BEHEER = [
  { href: '/beheer/matching', label: 'Matching-review' },
  { href: '/beheer/quarantaine', label: 'Quarantaine' },
  { href: '/beheer/scans', label: 'Scan-log' },
  { href: '/beheer/import', label: 'Modellen importeren' },
  { href: '/beheer/ongematcht', label: 'Ongematcht' },
  { href: '/beheer/instellingen', label: 'Instellingen' },
];

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await requireRole(['admin']);
  const [data, marginByBrand, changes] = await Promise.all([
    getDashboardData(),
    getMarginByBrand(),
    getRecentPriceChanges(500),
  ]);

  // Wijzigingen per dag (30 dagen).
  const perDayMap = new Map<string, number>();
  for (const c of changes) {
    const day = c.changed_at.slice(0, 10);
    perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);
  }
  const perDay = Array.from(perDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), count }));

  // Grootste marge-schadelijke wijzigingen deze week (inkoop omhoog of verkoop omlaag).
  const weekAgo = Date.now() - 7 * 86_400_000;
  const marginDrops = changes
    .filter((c) => new Date(c.changed_at).getTime() >= weekAgo)
    .filter(
      (c) =>
        (c.field === 'purchase' && (c.delta_pct ?? 0) > 0) ||
        (c.field === 'sale' && (c.delta_pct ?? 0) < 0),
    )
    .sort((a, b) => Math.abs(b.delta_pct ?? 0) - Math.abs(a.delta_pct ?? 0))
    .slice(0, 10);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Laatste sync"
          value={data.lastSync ? data.lastSync.status : '—'}
          tone={data.stale ? 'danger' : 'default'}
        />
        <StatCard
          label="Data actueel"
          value={data.stale ? 'Verouderd' : 'Ja'}
          tone={data.stale ? 'danger' : 'default'}
        />
        <StatCard label="Scans vandaag" value={data.scansToday} />
        <StatCard
          label="Openstaande quarantaine"
          value={data.pendingQuarantine}
          href="/beheer/quarantaine"
          tone={data.pendingQuarantine > 0 ? 'warn' : 'default'}
        />
        <StatCard
          label="Match-reviews"
          value={data.pendingMatches}
          href="/beheer/matching"
          tone={data.pendingMatches > 0 ? 'warn' : 'default'}
        />
        <StatCard
          label="Onder marge-drempel"
          value={data.underMargin}
          href="/prijzen"
          tone={data.underMargin > 0 ? 'warn' : 'default'}
        />
        <StatCard label="Zonder prijs" value={data.withoutPrice} href="/beheer/ongematcht" />
        <StatCard label="Zonder tag" value={data.withoutTag} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gemiddelde marge% per merk</CardTitle>
        </CardHeader>
        <CardContent>
          {marginByBrand.length > 0 ? (
            <MarginBarChart data={marginByBrand} />
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen marge-data.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prijswijzigingen per dag (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {perDay.length > 0 ? (
              <ChangesPerDayChart data={perDay} />
            ) : (
              <p className="text-sm text-muted-foreground">Geen wijzigingen.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grootste marge-dalingen (deze week)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {marginDrops.map((c) => (
                <li key={c.id} className="flex justify-between">
                  <span>{c.model_name}</span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    {c.field === 'purchase' ? (
                      <>
                        inkoop <ArrowUp className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        verkoop <ArrowDown className="h-3.5 w-3.5" />
                      </>
                    )}{' '}
                    {c.delta_pct}%
                  </span>
                </li>
              ))}
              {marginDrops.length === 0 && (
                <li className="text-muted-foreground">Geen marge-dalingen deze week.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Beheer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {BEHEER.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {b.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
