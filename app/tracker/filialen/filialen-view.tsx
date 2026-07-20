'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatEuro } from '@/lib/pricing/margin';
import { useFlag } from '@/components/tracker/flags-provider';
import { FilialenMap } from '@/components/tracker/filialen-map';
import type { getFilialenOverzicht } from '@/lib/tracker/queries';

type Filiaal = Awaited<ReturnType<typeof getFilialenOverzicht>>[number];

export function FilialenView({ filialen }: { filialen: Filiaal[] }) {
  const kaartAan = useFlag('filialen.kaart');
  const [weergave, setWeergave] = useState<'lijst' | 'kaart'>('lijst');
  const xl = filialen.filter((f) => f.type === 'xl');
  const standaard = filialen.filter((f) => f.type !== 'xl');
  const open = filialen.filter((f) => !f.opent).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Filialen</h1>
          {kaartAan && (
            <div className="inline-flex rounded-full border p-0.5">
              <Button
                size="sm"
                variant={weergave === 'lijst' ? 'default' : 'ghost'}
                className="h-9 rounded-full px-4 md:h-7"
                onClick={() => setWeergave('lijst')}
              >
                Lijst
              </Button>
              <Button
                size="sm"
                variant={weergave === 'kaart' ? 'default' : 'ghost'}
                className="h-9 rounded-full px-4 md:h-7"
                onClick={() => setWeergave('kaart')}
              >
                Kaart
              </Button>
            </div>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {filialen.length} vestigingen · {open} open · {xl.length} XL
        </span>
      </div>

      {kaartAan && weergave === 'kaart' ? (
        <FilialenMap filialen={filialen} />
      ) : (
        <>
          <Groep titel="XL-filialen" items={xl} />
          <Groep titel="Standaard & nieuwe filialen" items={standaard} />
        </>
      )}
    </div>
  );
}

function Groep({ titel, items }: { titel: string; items: Filiaal[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {titel} <span className="text-muted-foreground/70">({items.length})</span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <Link key={f.id} href={`/tracker/voorraad?filiaal=${f.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardContent className="space-y-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-tight">{f.naam}</p>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {f.type === 'xl' && <Badge>XL</Badge>}
                    {f.opent ? (
                      <Badge variant="secondary">opent {f.opent}</Badge>
                    ) : (
                      f.aantal <= 10 && <Badge variant="destructive">lage voorraad</Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {f.adres}
                  {f.adres && (f.postcode || f.plaats) ? ', ' : ''}
                  {f.postcode} {f.plaats}
                </p>
                {f.opent ? (
                  <p className="pt-2 text-sm text-muted-foreground">Nog niet geopend</p>
                ) : (
                  <>
                    <p className="pt-2 text-sm">
                      {f.aantal} toestellen · {formatEuro(f.waardeC)}
                    </p>
                    <p className="text-xs text-muted-foreground">Top-marge {f.topMarge}%</p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
