'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatEuro } from '@/lib/pricing/margin';
import { useFlag } from '@/components/tracker/flags-provider';
import type { ScanToestel, ScanKlant } from '@/lib/tracker/scan-data';
import { maakAanbiedingAction } from './actions';

interface ExtraRegel {
  naam: string;
  prijs_c: number;
}

export function AanbiedingSheet({
  toestel,
  startPrijs,
  extras,
  klanten,
  onClose,
}: {
  toestel: ScanToestel;
  startPrijs: number;
  extras: ExtraRegel[];
  klanten: ScanKlant[];
  onClose: () => void;
}) {
  const mailAan = useFlag('aanbieding.mail_klant');
  const spraakAan = useFlag('aanbieding.spraakinvoer');

  const [prijs, setPrijs] = useState(startPrijs);
  const [klantId, setKlantId] = useState<string>('');
  const [notitie, setNotitie] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [luistert, setLuistert] = useState(false);

  const klant = klanten.find((k) => k.id === klantId) ?? null;
  const extrasTotaal = extras.reduce((s, e) => s + e.prijs_c, 0);
  const totaal = prijs + extrasTotaal;
  const klantTotaal = klant ? Math.round(totaal * klant.prijsfactor) : totaal;
  const korting = toestel.ticket_c > 0 ? ((toestel.ticket_c - prijs) / toestel.ticket_c) * 100 : 0;

  function spraak() {
    interface MiniRec {
      lang: string;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void;
      start: () => void;
    }
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => MiniRec;
      SpeechRecognition?: new () => MiniRec;
    };
    const SR = w.webkitSpeechRecognition ?? w.SpeechRecognition;
    if (!SR) {
      setMsg('Spraakinvoer niet ondersteund in deze browser.');
      return;
    }
    const rec = new SR();
    rec.lang = 'nl-NL';
    rec.onresult = (e) => setNotitie((n) => `${n} ${e.results[0][0].transcript}`.trim());
    rec.onend = () => setLuistert(false);
    setLuistert(true);
    rec.start();
  }

  async function bevestig() {
    const res = await maakAanbiedingAction({
      toestelId: toestel.id,
      prijsC: klantTotaal,
      kortingPct: korting,
      extras: extras.map((e) => e.naam),
    });
    setMsg(res.ok ? 'Aanbieding opgeslagen (concept).' : res.error);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background p-5 sm:rounded-2xl">
        {/* Printbare bon */}
        <div className="rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <Image
              src="/hellotv-logo.png"
              alt="helloTV"
              width={90}
              height={38}
              className="h-6 w-auto"
            />
            <span className="text-xs text-muted-foreground">Aanbieding</span>
          </div>
          <p className="text-sm font-semibold">{toestel.model}</p>
          <p className="text-xs text-muted-foreground">
            {toestel.merk} · {toestel.type_nr} · {toestel.inch}&quot;
          </p>
          <div className="mt-3 space-y-1 text-sm">
            <Row l="Ticketprijs">
              <span className="line-through">{formatEuro(toestel.ticket_c)}</span>
            </Row>
            <Row l="Aanbiedingsprijs">
              <span className="font-semibold">{formatEuro(prijs)}</span>
            </Row>
            <Row l="Korting">{korting.toFixed(1)}%</Row>
            {extras.map((e) => (
              <Row key={e.naam} l={e.naam}>
                {formatEuro(e.prijs_c)}
              </Row>
            ))}
            {klant && (
              <Row l="Klant">
                {klant.naam} ({klant.segment})
              </Row>
            )}
            <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
              <span>Totaal</span>
              <span>{formatEuro(klantTotaal)}</span>
            </div>
          </div>
        </div>

        {/* Bediening (niet printen) */}
        <div className="mt-4 space-y-3 print:hidden">
          <div>
            <label className="text-xs text-muted-foreground">
              Prijs binnen speling ({formatEuro(toestel.min_marge_c)} –{' '}
              {formatEuro(toestel.ticket_c)})
            </label>
            <input
              type="range"
              min={toestel.min_marge_c}
              max={toestel.ticket_c}
              step={500}
              value={Math.min(Math.max(prijs, toestel.min_marge_c), toestel.ticket_c)}
              onChange={(e) => setPrijs(Number(e.target.value))}
              aria-label="Prijs binnen speling"
              className="h-8 w-full touch-manipulation accent-[color:hsl(var(--primary))]"
            />
          </div>

          <select
            value={klantId}
            onChange={(e) => setKlantId(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Kies klant (optioneel)…</option>
            {klanten.map((k) => (
              <option key={k.id} value={k.id}>
                {k.naam} — {k.segment}
              </option>
            ))}
          </select>

          {spraakAan && (
            <div className="flex gap-2">
              <Input
                value={notitie}
                onChange={(e) => setNotitie(e.target.value)}
                placeholder="Notitie…"
              />
              <Button type="button" variant="outline" onClick={spraak} disabled={luistert}>
                {luistert ? '🎙️…' : '🎙️'}
              </Button>
            </div>
          )}

          {msg && <p className="text-sm font-medium text-green-700">{msg}</p>}

          <div className="flex flex-wrap gap-2">
            <Button onClick={bevestig}>Bevestig</Button>
            <Button variant="secondary" onClick={() => window.print()}>
              Printen / PDF
            </Button>
            {mailAan && (
              <Button
                variant="secondary"
                onClick={() => setMsg('Mail naar klant verstuurd (stub — Edge Function volgt).')}
              >
                Mail klant
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} className="ml-auto">
              Sluiten
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{l}</span>
      <span>{children}</span>
    </div>
  );
}
