import Link from 'next/link';
import { getFilialenOverzicht } from '@/lib/tracker/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatEuro } from '@/lib/pricing/margin';

export const dynamic = 'force-dynamic';

export default async function FilialenPage() {
  const filialen = await getFilialenOverzicht();
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Filialen</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filialen.map((f) => (
          <Link key={f.id} href={`/tracker/voorraad?filiaal=${f.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardContent className="space-y-1 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{f.naam}</p>
                  {f.aantal <= 10 && <Badge variant="destructive">laag</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{f.plaats}</p>
                <p className="pt-2 text-sm">
                  {f.aantal} toestellen · {formatEuro(f.waardeC)}
                </p>
                <p className="text-xs text-muted-foreground">Top-marge {f.topMarge}%</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
