'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatEuro } from '@/lib/pricing/margin';
import { useFlag } from '@/components/tracker/flags-provider';
import { useScanListener } from '@/lib/rfid/use-scan-listener';
import { classifyScan, type Scan } from '@/lib/rfid/classify';
import { isWebSerialSupported, startSerialScan } from '@/lib/rfid/serial-adapter';
import type { ScanData, ScanToestel } from '@/lib/tracker/scan-data';
import { koppelToestelTagAction } from './actions';
import { AanbiedingSheet } from './aanbieding-sheet';

const SERVICE = [
  'Pixelgarantie',
  'Bezorging + installatie',
  '5 jaar garantie',
  '30 dagen omruilen',
];

function margeTone(pct: number) {
  return pct >= 25 ? 'text-green-700' : pct >= 15 ? 'text-orange-700' : 'text-red-700';
}
const KLASSE_KLEUR: Record<string, string> = {
  OLED: 'bg-[#EFEAF7] text-[#6B4EAA]',
  QLED: 'bg-[#E4EEFA] text-[#2563B8]',
  'Mini-LED': 'bg-[#FEF1E1] text-[#B85C00]',
  LED: 'bg-muted text-muted-foreground',
};

export function ScanClient({
  data,
  initieelToestelId = null,
}: {
  data: ScanData;
  initieelToestelId?: number | null;
}) {
  const autoDetectie = useFlag('scan.auto_detectie');
  const privacyscherm = useFlag('scan.privacyscherm');
  const combideals = useFlag('scan.combideals');
  const alternatievenAan = useFlag('scan.alternatieven');
  const centraalAan = useFlag('scan.centraal_magazijn');
  const serviceAan = useFlag('scan.toon_service');

  const [selected, setSelected] = useState<ScanToestel | null>(null);
  const [scanning, setScanning] = useState(false);
  const [klantView, setKlantView] = useState(false);
  const [dealPrice, setDealPrice] = useState(0);
  const [extras, setExtras] = useState<Set<string>>(new Set());
  const [filiaal, setFiliaal] = useState(data.filialen[0]?.id ?? '');
  const [sheet, setSheet] = useState(false);

  // Chip-koppelingen: start met server-data, groeit lokaal bij nieuwe koppelingen.
  const [tags, setTags] = useState(() => new Map(data.tags.map((t) => [t.epc, t.toestel_id])));
  const [scanMsg, setScanMsg] = useState<{ tone: 'ok' | 'warn' | 'error'; text: string } | null>(
    null,
  );
  const [pendingEpc, setPendingEpc] = useState<string | null>(null);
  const [handmatig, setHandmatig] = useState('');
  const [zoekKoppel, setZoekKoppel] = useState('');
  const [serialStop, setSerialStop] = useState<(() => void) | null>(null);
  const toestelById = useMemo(
    () => new Map(data.toestellen.map((t) => [t.id, t])),
    [data.toestellen],
  );
  const eanIndex = useMemo(() => {
    const m = new Map<string, ScanToestel>();
    for (const t of data.toestellen) if (t.ean) m.set(t.ean.trim(), t);
    return m;
  }, [data.toestellen]);

  const kies = useCallback((t: ScanToestel) => {
    setSelected(t);
    setDealPrice(t.ticket_c);
    setExtras(new Set());
    setKlantView(false);
    setSheet(false);
    setPendingEpc(null);
  }, []);

  // Verwerk een binnengekomen scan (HID, Web Serial of handmatig).
  const verwerkScan = useCallback(
    (scan: Scan) => {
      if (scan.type === 'ean') {
        const t = eanIndex.get(scan.value);
        if (t) {
          setScanMsg({ tone: 'ok', text: `Herkend via barcode: ${t.model}` });
          kies(t);
        } else {
          setScanMsg({ tone: 'error', text: `Geen toestel met barcode ${scan.value}` });
        }
        return;
      }
      // rfid/epc
      const id = tags.get(scan.value);
      const t = id != null ? toestelById.get(id) : undefined;
      if (t) {
        setScanMsg({ tone: 'ok', text: `Chip herkend: ${t.model}` });
        kies(t);
      } else {
        setPendingEpc(scan.value);
        setScanMsg({
          tone: 'warn',
          text: `Onbekende chip ${scan.value} — koppel hem aan een toestel.`,
        });
      }
    },
    [eanIndex, tags, toestelById, kies],
  );

  const onScan = useCallback((scan: Scan) => verwerkScan(scan), [verwerkScan]);
  const { flash } = useScanListener({ enabled: !selected, onScan });

  // Handmatige invoer (typen/plakken van EPC of EAN) — cruciaal om te testen zonder reader.
  function handmatigZoek() {
    const scan = classifyScan(handmatig);
    if (!scan) {
      setScanMsg({ tone: 'error', text: 'Ongeldige code (verwacht EAN-13 of 16–32 hex EPC).' });
      return;
    }
    setHandmatig('');
    verwerkScan(scan);
  }

  async function koppelPending(toestelId: number) {
    if (!pendingEpc) return;
    const res = await koppelToestelTagAction(pendingEpc, toestelId);
    if (!res.ok) {
      setScanMsg({ tone: 'error', text: res.error });
      return;
    }
    setTags((m) => new Map(m).set(res.epc, toestelId));
    const t = toestelById.get(toestelId);
    setScanMsg({ tone: 'ok', text: `Chip gekoppeld aan ${t?.model ?? 'toestel'}.` });
    setPendingEpc(null);
    if (t) kies(t);
  }

  // Web Serial (voor readers die geen keyboard-wedge zijn).
  const serialRef = useRef<(() => void) | null>(null);
  serialRef.current = serialStop;
  useEffect(() => () => serialRef.current?.(), []);

  async function toggleSerial() {
    if (serialStop) {
      serialStop();
      setSerialStop(null);
      return;
    }
    try {
      const stop = await startSerialScan({ baudRate: 9600 }, onScan);
      setSerialStop(() => stop);
      setScanMsg({ tone: 'ok', text: 'Web Serial verbonden — scan maar.' });
    } catch (e) {
      setScanMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Serial mislukt' });
    }
  }

  // Voorselectie vanuit toesteldetail (?toestel=id) — één keer bij het laden.
  useEffect(() => {
    if (initieelToestelId == null) return;
    const t = data.toestellen.find((x) => x.id === initieelToestelId);
    if (t) kies(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initieelToestelId]);

  // Demo zonder hardware: pakt een willekeurig toestel op voorraad.
  function demoScan() {
    setScanning(true);
    const opVoorraad = data.toestellen.filter((t) => t.voorraadTotaal > 0);
    setTimeout(() => {
      const pick = opVoorraad[Math.floor(Math.random() * opVoorraad.length)] ?? data.toestellen[0];
      setScanning(false);
      if (pick) kies(pick);
    }, 900);
  }

  const suggesties = useMemo(
    () => [...data.toestellen].sort((a, b) => b.voorraadTotaal - a.voorraadTotaal).slice(0, 6),
    [data.toestellen],
  );

  const calc = useMemo(() => {
    if (!selected) return null;
    const basisMarge = dealPrice - selected.inkoop_c;
    const margePct = dealPrice > 0 ? (basisMarge / dealPrice) * 100 : 0;
    const speling = dealPrice - selected.min_marge_c;
    const korting =
      selected.ticket_c > 0 ? ((selected.ticket_c - dealPrice) / selected.ticket_c) * 100 : 0;
    const extraPrijs = data.bijverkoop
      .filter((b) => extras.has(b.id))
      .reduce((s, b) => s + b.prijs_c, 0);
    const extraMarge = data.bijverkoop
      .filter((b) => extras.has(b.id))
      .reduce((s, b) => s + b.marge_c, 0);
    return {
      basisMarge,
      margePct,
      speling,
      korting,
      onderMin: dealPrice < selected.min_marge_c,
      totaalPrijs: dealPrice + extraPrijs,
      totaalMarge: basisMarge + extraMarge,
    };
  }, [selected, dealPrice, extras, data.bijverkoop]);

  const alternatieven = useMemo(() => {
    if (!selected) return [];
    return data.toestellen
      .filter((t) => t.klasse === selected.klasse && t.id !== selected.id && t.voorraadTotaal > 0)
      .map((t) => ({
        ...t,
        margePct: t.ticket_c > 0 ? ((t.ticket_c - t.inkoop_c) / t.ticket_c) * 100 : 0,
      }))
      .sort((a, b) => b.margePct - a.margePct)
      .slice(0, 3);
  }, [selected, data.toestellen]);

  function adjust(deltaEuro: number) {
    setDealPrice((p) => Math.max(0, p + deltaEuro * 100));
  }

  const geselecteerdeExtras = data.bijverkoop
    .filter((b) => extras.has(b.id))
    .map((b) => ({ naam: b.naam, prijs_c: b.prijs_c }));

  // ── Nog geen toestel gekozen: scan-scherm ──────────────────────────────
  if (!selected) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Scan toestel</h1>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
                flash === 'ok'
                  ? 'bg-green-100'
                  : flash === 'error'
                    ? 'bg-red-100'
                    : 'bg-primary/15'
              } ${scanning ? 'animate-pulse' : ''}`}
            >
              {scanning ? '📡' : flash === 'ok' ? '✅' : flash === 'error' ? '⚠️' : '📺'}
            </div>
            <p className="text-sm text-muted-foreground">
              Scan een RFID-chip of barcode met de handheld — of voer de code hieronder in.
            </p>

            {/* Handmatige invoer: werkt zonder reader, ideaal om te testen. */}
            <div className="flex w-full max-w-sm gap-2">
              <Input
                value={handmatig}
                onChange={(e) => setHandmatig(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handmatigZoek()}
                placeholder="EPC of EAN-13…"
                className="font-mono"
                aria-label="EPC of EAN"
              />
              <Button onClick={handmatigZoek} disabled={!handmatig.trim()}>
                Zoek
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {isWebSerialSupported() && (
                <Button variant="outline" size="sm" onClick={toggleSerial}>
                  {serialStop ? 'Serial stoppen' : 'Web Serial verbinden'}
                </Button>
              )}
              {autoDetectie && (
                <Button variant="ghost" size="sm" onClick={demoScan} disabled={scanning}>
                  {scanning ? 'Bezig…' : 'Demo (willekeurig)'}
                </Button>
              )}
            </div>

            {scanMsg && (
              <p
                className={`text-sm font-medium ${
                  scanMsg.tone === 'ok'
                    ? 'text-green-700'
                    : scanMsg.tone === 'warn'
                      ? 'text-orange-700'
                      : 'text-red-700'
                }`}
              >
                {scanMsg.text}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Onbekende chip → koppelen aan een toestel */}
        {pendingEpc && (
          <Card className="border-orange-300">
            <CardContent className="space-y-3 p-4">
              <p className="text-sm">
                Chip <span className="font-mono font-semibold">{pendingEpc}</span> is nog niet
                gekoppeld. Kies het toestel:
              </p>
              <Input
                value={zoekKoppel}
                onChange={(e) => setZoekKoppel(e.target.value)}
                placeholder="Zoek model of typenummer…"
                aria-label="Zoek toestel om te koppelen"
              />
              <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                {data.toestellen
                  .filter((t) => {
                    const q = zoekKoppel.trim().toLowerCase();
                    return (
                      !q || `${t.model} ${t.type_nr} ${t.merk}`.toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 12)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => koppelPending(t.id)}
                      className="rounded-lg border bg-background p-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="block font-medium">{t.model}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t.merk} · {t.type_nr}
                      </span>
                    </button>
                  ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPendingEpc(null)}>
                Annuleren
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Vandaag op voorraad</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggesties.map((t) => (
              <button
                key={t.id}
                onClick={() => kies(t)}
                className="flex items-center justify-between rounded-lg border bg-background p-3 text-left hover:bg-muted"
              >
                <span>
                  <span className="block text-sm font-medium">{t.model}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t.merk} · {t.inch}&quot; · {t.klasse}
                  </span>
                </span>
                <Badge variant="secondary">{t.voorraadTotaal}</Badge>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Toestel gekozen: resultaat + calculator ────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">{selected.model}</h1>
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
          Opnieuw
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selected.klasse && (
          <Badge className={KLASSE_KLEUR[selected.klasse] ?? ''}>{selected.klasse}</Badge>
        )}
        <span className="text-sm text-muted-foreground">
          {selected.merk} · {selected.type_nr} · {selected.inch}&quot;
        </span>
        {privacyscherm && (
          <div className="ml-auto flex rounded-full border p-0.5 text-xs">
            <button
              onClick={() => setKlantView(false)}
              className={`rounded-full px-3 py-1 ${!klantView ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Verkoper
            </button>
            <button
              onClick={() => setKlantView(true)}
              className={`rounded-full px-3 py-1 ${klantView ? 'bg-foreground text-background' : ''}`}
            >
              Klant
            </button>
          </div>
        )}
      </div>

      {/* Verkoper-view: marges */}
      {!klantView && calc && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-2 p-4 text-sm sm:gap-4">
            <div className="col-span-2 rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Lifetime-marge (dit model)</p>
              <p className="text-2xl font-bold">{formatEuro(selected.lifetimeMargeC)}</p>
            </div>
            <Field label="Marge nu">
              <span className={`font-semibold ${margeTone(calc.margePct)}`}>
                {formatEuro(calc.basisMarge)} · {calc.margePct.toFixed(1)}%
              </span>
            </Field>
            <Field label="Speling tot min">
              <span className={calc.speling < 0 ? 'text-red-700' : ''}>
                {formatEuro(calc.speling)}
              </span>
            </Field>
            <Field label="Inkoop">{formatEuro(selected.inkoop_c)}</Field>
            <Field label="Min-marge prijs">{formatEuro(selected.min_marge_c)}</Field>
          </CardContent>
        </Card>
      )}

      {/* Klant-view: schoon */}
      {klantView && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">{selected.specs}</p>
            <p className="text-3xl font-bold">
              {formatEuro(calc?.totaalPrijs ?? dealPrice)}
              <span className="ml-2 text-base font-normal text-muted-foreground line-through">
                {formatEuro(selected.ticket_c)}
              </span>
            </p>
            {serviceAan && (
              <ul className="grid grid-cols-2 gap-1 pt-2 text-sm">
                {SERVICE.map((s) => (
                  <li key={s} className="flex items-center gap-1">
                    <span className="text-primary">✓</span> {s}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prijs-calculator */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Dealprijs</span>
            <span className="text-lg font-bold">{formatEuro(dealPrice)}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[-200, -100, -50, 50].map((d) => (
              <Button
                key={d}
                variant="outline"
                onClick={() => adjust(d)}
                className="h-11 px-0 text-base tabular-nums"
              >
                {d > 0 ? `+${d}` : d}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            inputMode="numeric"
            value={Math.round(dealPrice / 100)}
            onChange={(e) => setDealPrice(Math.max(0, Number(e.target.value) * 100))}
            className="h-11 w-full text-base"
            aria-label="Dealprijs in euro"
          />
          {calc && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <span>Korting: {calc.korting.toFixed(1)}%</span>
              {!klantView && <span>Speling: {formatEuro(calc.speling)}</span>}
              {calc.onderMin && (
                <span className="font-semibold text-red-700">⚠︎ Onder min-marge</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Combideal */}
      {combideals && data.bijverkoop.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold">Combideal</p>
            {data.bijverkoop.map((b) => (
              <label key={b.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={extras.has(b.id)}
                    onChange={(e) =>
                      setExtras((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(b.id);
                        else next.delete(b.id);
                        return next;
                      })
                    }
                  />
                  {b.naam} <span className="text-xs text-muted-foreground">{b.categorie}</span>
                </span>
                <span>{formatEuro(b.prijs_c)}</span>
              </label>
            ))}
            {calc && (
              <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                <span>Totaal: {formatEuro(calc.totaalPrijs)}</span>
                {!klantView && (
                  <span className={margeTone(0)}>marge {formatEuro(calc.totaalMarge)}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voorraad */}
      <Card>
        <CardContent className="space-y-2 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Voorraad</span>
            <select
              value={filiaal}
              onChange={(e) => setFiliaal(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              {data.filialen.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.naam}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-between">
            <span>Dit filiaal</span>
            <span className="font-medium">{selected.voorraad[filiaal] ?? 0} stuks</span>
          </div>
          {centraalAan && (
            <div className="flex justify-between text-muted-foreground">
              <span>
                Centraal magazijn {selected.centraalEta != null && `· ETA ${selected.centraalEta}d`}
              </span>
              <span>{selected.centraalAantal} stuks</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Andere filialen:{' '}
            {data.filialen
              .filter((f) => f.id !== filiaal)
              .map((f) => `${f.naam} ${selected.voorraad[f.id] ?? 0}`)
              .join(' · ')}
          </div>
        </CardContent>
      </Card>

      {/* Alternatieven */}
      {alternatievenAan && alternatieven.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">
            Alternatieven ({selected.klasse})
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {alternatieven.map((a) => (
              <button
                key={a.id}
                onClick={() => kies(a)}
                className="rounded-lg border bg-background p-3 text-left hover:bg-muted"
              >
                <span className="block text-sm font-medium">{a.model}</span>
                <span className="block text-xs text-muted-foreground">
                  {a.merk} · {a.inch}&quot;
                </span>
                {!klantView && (
                  <span className={`text-xs font-semibold ${margeTone(a.margePct)}`}>
                    {a.margePct.toFixed(0)}% marge
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-16 flex gap-2 md:bottom-0">
        <Button className="flex-1" onClick={() => setSheet(true)}>
          Maak aanbieding
        </Button>
        <Button variant="secondary" onClick={() => setSelected(null)}>
          Opnieuw
        </Button>
      </div>

      {sheet && (
        <AanbiedingSheet
          toestel={selected}
          startPrijs={dealPrice}
          extras={geselecteerdeExtras}
          klanten={data.klanten}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{children}</p>
    </div>
  );
}
