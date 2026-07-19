import { requireRole } from '@/lib/auth';
import { getPendingQuarantine } from '@/lib/supabase/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatEuro } from '@/lib/pricing/margin';
import { ReviewButtons } from './review-buttons';

export const dynamic = 'force-dynamic';

export default async function QuarantinePage() {
  await requireRole(['admin']);
  const items = await getPendingQuarantine();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Quarantaine</h1>
      <p className="text-sm text-muted-foreground">
        Prijswijzigingen groter dan de drempel — goedkeuren voert de prijs door, afwijzen laat de
        huidige prijs staan.
      </p>

      {items.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Geen openstaande wijzigingen. 🎉
          </CardContent>
        </Card>
      )}

      {items.map((q) => (
        <Card key={q.id}>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{q.products?.model_name ?? '—'}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {q.products?.brands?.name} · {q.field === 'sale' ? 'Verkoopprijs' : 'Inkoopprijs'}
              </p>
            </div>
            <Badge variant="destructive">
              {q.delta_pct != null ? `${q.delta_pct > 0 ? '+' : ''}${q.delta_pct}%` : '—'}
            </Badge>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Huidig </span>
              {q.current_cents != null ? formatEuro(q.current_cents) : '—'}
              <span className="mx-2">→</span>
              <span className="font-semibold">
                {q.proposed_cents != null ? formatEuro(q.proposed_cents) : '—'}
              </span>
            </div>
            <ReviewButtons id={q.id} />
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
