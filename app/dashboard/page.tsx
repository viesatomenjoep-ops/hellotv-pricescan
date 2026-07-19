import { requireRole } from '@/lib/auth';
import { getDashboardData, getMarginByBrand } from '@/lib/supabase/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { MarginBarChart } from '@/components/charts/margin-bar-chart';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await requireRole(['admin']);
  const [data, marginByBrand] = await Promise.all([getDashboardData(), getMarginByBrand()]);

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
    </main>
  );
}
