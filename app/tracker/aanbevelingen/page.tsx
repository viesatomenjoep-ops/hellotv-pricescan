import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { getToestellenMetVoorraad } from '@/lib/tracker/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

function score(t: { margePct: number; verkoopsnelheid: number; voorraadTotaal: number }) {
  const marge = (Math.min(Math.max(t.margePct, 0), 40) / 40) * 100;
  const snelheid = (t.verkoopsnelheid / 10) * 100;
  const voorraad = (Math.min(t.voorraadTotaal, 20) / 20) * 100;
  return Math.round(marge * 0.5 + snelheid * 0.3 + voorraad * 0.2);
}

export default async function AanbevelingenPage() {
  const { toestellen } = await getToestellenMetVoorraad();
  const scored = toestellen
    .map((t) => ({ ...t, score: score(t) }))
    .sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);
  const groepen = [
    { titel: 'Interessant', items: scored.filter((t) => t.score >= 68) },
    { titel: 'Neutraal', items: scored.filter((t) => t.score >= 48 && t.score < 68) },
    { titel: 'Vermijd', items: scored.filter((t) => t.score < 48) },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Aanbevelingen</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        {top3.map((t, i) => (
          <Card key={t.id} className="transition-colors hover:bg-muted/50">
            <Link href={`/tracker/toestellen/${t.id}`} className="block">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Badge className="gap-1">
                  <Trophy className="h-3.5 w-3.5" /> Topper {i + 1}
                </Badge>
                <span className="text-lg font-bold">{t.score}</span>
              </div>
              <p className="mt-2 text-sm font-medium">{t.model}</p>
              <p className="text-xs text-muted-foreground">
                {t.merk} · {t.margePct}% marge · {t.voorraadTotaal} st
              </p>
            </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {groepen.map((g) => (
        <Card key={g.titel}>
          <CardHeader>
            <CardTitle className="text-base">
              {g.titel} <span className="text-muted-foreground">({g.items.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {g.items.map((t) => (
                <li key={t.id} className="py-0">
                  <Link
                    href={`/tracker/toestellen/${t.id}`}
                    className="flex items-center justify-between py-2 hover:underline"
                  >
                    <span>
                      {t.model} <span className="text-xs text-muted-foreground">{t.merk}</span>
                    </span>
                    <span className="text-muted-foreground">
                      score {t.score} · {t.margePct}%
                    </span>
                  </Link>
                </li>
              ))}
              {g.items.length === 0 && <li className="py-2 text-muted-foreground">—</li>}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
