import { Medal } from 'lucide-react';
import { getVerkopersPrestaties, getFilialenOverzicht } from '@/lib/tracker/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatEuro } from '@/lib/pricing/margin';

export const dynamic = 'force-dynamic';

// Goud / zilver / brons voor de top-3.
const MEDAILLE_KLEUR = ['text-amber-500', 'text-slate-400', 'text-amber-700'];

export default async function VerkopersPage() {
  const [prestaties, filialen] = await Promise.all([
    getVerkopersPrestaties(),
    getFilialenOverzicht(),
  ]);
  const filiaalNaam = new Map(filialen.map((f) => [f.id, f.naam]));
  const topOmzet = prestaties[0]?.omzetC ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verkopers</h1>
        <p className="text-sm text-muted-foreground">Prestaties op basis van de verkoop-pipeline.</p>
      </div>

      <div className="space-y-2">
        {prestaties.map((v, i) => {
          const conversie = v.deals > 0 ? Math.round((v.gewonnen / v.deals) * 100) : 0;
          const balk = topOmzet > 0 ? (v.omzetC / topOmzet) * 100 : 0;
          return (
            <Card key={v.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex w-6 justify-center text-sm text-muted-foreground">
                      {i < 3 ? (
                        <Medal className={`h-5 w-5 ${MEDAILLE_KLEUR[i]}`} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{v.naam}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.filiaal_id ? (filiaalNaam.get(v.filiaal_id) ?? '—') : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatEuro(v.omzetC)}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.gewonnen}/{v.deals} deals · {conversie}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${balk}%` }} />
                </div>
                {v.openC > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Open pipeline: {formatEuro(v.openC)}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
        {prestaties.length === 0 && (
          <p className="text-sm text-muted-foreground">Nog geen verkopers.</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team-totaal</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-center">
          <Kpi label="Omzet" value={formatEuro(prestaties.reduce((s, v) => s + v.omzetC, 0))} />
          <Kpi label="Gewonnen" value={String(prestaties.reduce((s, v) => s + v.gewonnen, 0))} />
          <Kpi
            label="Open"
            value={formatEuro(prestaties.reduce((s, v) => s + v.openC, 0))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
