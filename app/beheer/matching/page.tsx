import { CircleCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { getMatchQueue } from '@/lib/supabase/reports';
import { Card, CardContent } from '@/components/ui/card';
import { MatchRow } from './match-row';

export const dynamic = 'force-dynamic';

export default async function MatchingPage() {
  await requireRole(['admin']);
  const items = await getMatchQueue();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Matching-review</h1>
      <p className="text-sm text-muted-foreground">
        Vendit-artikelen zonder (zekere) koppeling. Bevestig de suggestie of kies zelf een model.
      </p>

      {items.length === 0 && (
        <Card>
          <CardContent className="flex items-center gap-2 pt-6 text-sm text-muted-foreground">
            <CircleCheck className="h-4 w-4 text-green-600" /> Geen openstaande matches.
          </CardContent>
        </Card>
      )}

      {items.map((item) => (
        <MatchRow key={item.id} item={item} />
      ))}
    </main>
  );
}
