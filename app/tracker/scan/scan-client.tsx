'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Radio, ScanLine, CircleCheck, TriangleAlert, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatEuro, toestelMarge, adviesPrijs } from '@/lib/pricing/margin';
import { useFlag } from '@/components/tracker/flags-provider';
import { useScanListener } from '@/lib/rfid/use-scan-listener';
import { classifyScan, type Scan } from '@/lib/rfid/classify';
import { isWebSerialSupported, startSerialScan } from '@/lib/rfid/serial-adapter';
import type { ScanData, ScanToestel } from '@/lib/tracker/scan-data';
import { FiliaalSelect } from '@/components/tracker/filiaal-select';
import { MargeRadar, margeVerdict, margeVibratie } from '@/components/tracker/marge-radar';
import { MargeStip } from '@/components/tracker/marge-stip';
import { DealExtras } from '@/components/tracker/deal-extras';
import { gekozenExtras, type ExtraSelectie } from '@/lib/tracker/extras-catalog';
import { CASHBACK_BY_MODELNR } from '@/lib/catalog/real-prices';
import { CampagneBanner } from '@/components/tracker/campagne-banner';
import { koppelToestelTagAction } from './actions';
import { AanbiedingSheet } from './aanbieding-sheet';

const SERVICE = [
  'Pixelgarantie',
  'Bezorging + installatie',
  '5 jaar garantie',
  '30 dagen omruilen',
];

function margeTone(pct: number) {
  return pct >= 28 ? 'text-green-700' : pct >= 20 ? 'text-orange-700' : 'text-red-700';
}

const tvMargePct = (ticket_c: number, inkoop_c: number) =>
  toestelMarge(ticket_c, inkoop_c).margePct;
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
  const serviceAan = useFlag('scan.toon_service');

  const [selected, setSelected] = useState<ScanToestel | null>(null);
  const [scanning, setScanning] = useState(false);
  const [klantView, setKlantView] = useState(false);
  const [dealPrice, setDealPrice] = useState(0);
  const [extraSel, setExtraSel] = useState<ExtraSelectie>({});
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
    setExtraSel({});
    setKlantView(false);
    setSheet(false);
    setPendingEpc(null);
    // Voelbare 'trigger' met patroon per marge-niveau — voelen zonder kijken.
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(margeVibratie(tvMargePct(t.ticket_c, t.inkoop_c)));
    }
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

  // Live suggesties op typenummer/model terwijl je typt (zonder RFID/barcode).
  const modelSuggesties = useMemo(() => {
    const q = handmatig.trim().toLowerCase();
    if (q.length < 2 || classifyScan(handmatig)) return [];
    return data.toestellen
      .filter((t) => `${t.type_nr} ${t.model} ${t.merk}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [handmatig, data.toestellen]);

  // Handmatige invoer: EPC/EAN óf een typenummer/model.
  function handmatigZoek() {
    const scan = classifyScan(handmatig);
    if (scan) {
      setHandmatig('');
      verwerkScan(scan);
      return;
    }
    // Geen geldige code → probeer op typenummer/model te matchen.
    const q = handmatig.trim().toLowerCase();
    const match =
      data.toestellen.find((t) => t.type_nr.toLowerCase() === q) ??
      data.toestellen.find((t) => `${t.type_nr} ${t.model}`.toLowerCase().includes(q));
    if (match) {
      setHandmatig('');
      setScanMsg({ tone: 'ok', text: `Gekozen via typenummer: ${match.model}` });
      kies(match);
      return;
    }
    setScanMsg({ tone: 'error', text: 'Geen code of typenummer herkend.' });
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

  // Demo zonder hardware: pakt willekeurig een toestel op voorraad, variabel per merk
  // (Samsung/LG/TCL/Philips) zodat elke demo-scan een ander model laat zien.
  function demoScan() {
    setScanning(true);
    const merken = ['Samsung', 'LG', 'TCL', 'Philips'];
    const opVoorraad = data.toestellen.filter((t) => t.voorraadTotaal > 0);
    setTimeout(() => {
      const merk = merken[Math.floor(Math.random() * merken.length)];
      const pool = opVoorraad.filter((t) => t.merk === merk);
      const bron = pool.length ? pool : opVoorraad;
      const pick = bron[Math.floor(Math.random() * bron.length)] ?? data.toestellen[0];
      setScanning(false);
      if (pick) kies(pick);
    }, 800);
  }

  const suggesties = useMemo(
    () => [...data.toestellen].sort((a, b) => b.voorraadTotaal - a.voorraadTotaal).slice(0, 6),
    [data.toestellen],
  );

  const gekozen = useMemo(
    () => gekozenExtras(extraSel, selected?.inch ?? 0),
    [extraSel, selected?.inch],
  );

  const calc = useMemo(() => {
    if (!selected) return null;
    const { margeC: basisMarge, margePct } = toestelMarge(dealPrice, selected.inkoop_c);
    const speling = dealPrice - selected.min_marge_c;
    const korting =
      selected.ticket_c > 0 ? ((selected.ticket_c - dealPrice) / selected.ticket_c) * 100 : 0;
    const extraPrijs = gekozen.reduce((s, e) => s + e.prijs_c * e.aantal, 0);
    const extraMarge = gekozen.reduce((s, e) => s + e.marge_c * e.aantal, 0);
    return {
      basisMarge,
      margePct,
      speling,
      korting,
      onderMin: dealPrice < selected.min_marge_c,
      totaalPrijs: dealPrice + extraPrijs,
      totaalMarge: basisMarge + extraMarge,
    };
  }, [selected, dealPrice, gekozen]);

  const alternatieven = useMemo(() => {
    if (!selected) return [];
    return data.toestellen
      .filter((t) => t.klasse === selected.klasse && t.id !== selected.id && t.voorraadTotaal > 0)
      .map((t) => ({
        ...t,
        margePct: toestelMarge(t.ticket_c, t.inkoop_c).margePct,
      }))
      .sort((a, b) => b.margePct - a.margePct)
      .slice(0, 3);
  }, [selected, data.toestellen]);

  // Marge-radar + slimme alternatieven op marge (deze maat, prijsrange, maat kleiner).
  const margePctVan = (t: ScanToestel) => toestelMarge(t.ticket_c, t.inkoop_c).margePct;

  const slim = useMemo(() => {
    if (!selected) return null;
    const inch = selected.inch;
    const withM = (arr: ScanToestel[]) =>
      arr.map((t) => ({ ...t, m: margePctVan(t) })).sort((a, b) => b.m - a.m);
    const anders = data.toestellen.filter((t) => t.id !== selected.id && t.voorraadTotaal > 0);
    // Uitgaan van dezelfde techniek (klasse). Terugval op alles als er te weinig is.
    const zelfdeTech = anders.filter((t) => t.klasse === selected.klasse);
    const pool = zelfdeTech.length >= 3 ? zelfdeTech : anders;

    // Top 3 beste marge (zelfde techniek).
    const top3 = withM(pool).slice(0, 3);

    // Beste marge per merk (zelfde techniek): per merk het toestel met de hoogste marge.
    const merken = Array.from(new Set(pool.map((t) => t.merk)));
    const perMerk = merken
      .map((merk) => withM(pool.filter((t) => t.merk === merk))[0])
      .filter((t): t is ScanToestel & { m: number } => Boolean(t))
      .sort((a, b) => b.m - a.m);

    // Maat kleiner én groter (beste marge, zelfde techniek waar mogelijk).
    const maten = Array.from(
      new Set(pool.map((t) => t.inch).filter((n): n is number => n != null)),
    );
    const kleinerMaat = inch != null ? maten.filter((n) => n < inch).sort((a, b) => b - a)[0] ?? null : null;
    const groterMaat = inch != null ? maten.filter((n) => n > inch).sort((a, b) => a - b)[0] ?? null : null;
    const maatKleiner = kleinerMaat != null ? withM(pool.filter((t) => t.inch === kleinerMaat)).slice(0, 2) : [];
    const maatGroter = groterMaat != null ? withM(pool.filter((t) => t.inch === groterMaat)).slice(0, 2) : [];

    return { eigenMarge: margePctVan(selected), top3, perMerk, maatKleiner, maatGroter, kleinerMaat, groterMaat };
  }, [selected, data.toestellen]);

  function adjust(deltaEuro: number) {
    setDealPrice((p) => Math.max(0, p + deltaEuro * 100));
  }

  const geselecteerdeExtras = gekozen.map((e) => ({
    naam: e.aantal > 1 ? `${e.naam} ×${e.aantal}` : e.naam,
    prijs_c: e.prijs_c * e.aantal,
  }));

  // ── Nog geen toestel gekozen: scan-scherm ──────────────────────────────
  if (!selected) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Scan toestel</h1>
        <CampagneBanner />

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full ${
                flash === 'ok'
                  ? 'bg-green-100 text-green-700'
                  : flash === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-primary/15 text-foreground'
              } ${scanning ? 'animate-pulse' : ''}`}
            >
              {scanning ? (
                <Radio className="h-9 w-9" strokeWidth={1.75} />
              ) : flash === 'ok' ? (
                <CircleCheck className="h-9 w-9" strokeWidth={1.75} />
              ) : flash === 'error' ? (
                <TriangleAlert className="h-9 w-9" strokeWidth={1.75} />
              ) : (
                <ScanLine className="h-9 w-9" strokeWidth={1.75} />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Scan een RFID-chip of barcode — of voer een typenummer / EPC / EAN in.
            </p>

            {/* Handmatige invoer: chip/barcode (EPC/EAN) of typenummer/model. */}
            <div className="w-full max-w-sm">
              <div className="flex gap-2">
                <Input
                  value={handmatig}
                  onChange={(e) => setHandmatig(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handmatigZoek()}
                  placeholder="Typenummer, EPC of EAN…"
                  aria-label="Typenummer, EPC of EAN"
                />
                <Button onClick={handmatigZoek} disabled={!handmatig.trim()}>
                  Zoek
                </Button>
              </div>
              {modelSuggesties.length > 0 && (
                <div className="mt-1.5 overflow-hidden rounded-xl border bg-card text-left elev-1">
                  {modelSuggesties.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setHandmatig('');
                        kies(t);
                      }}
                      className="flex w-full items-center gap-2 border-b px-3 py-2 last:border-0 hover:bg-muted/50"
                    >
                      <MargeStip margePct={tvMargePct(t.ticket_c, t.inkoop_c)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{t.model}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {t.type_nr} · {t.inch}&quot;
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
                className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left elev-1 hover:bg-muted/50"
              >
                <MargeStip margePct={tvMargePct(t.ticket_c, t.inkoop_c)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t.model}</span>
                  <span className="block truncate text-xs text-muted-foreground">
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
        {(CASHBACK_BY_MODELNR[selected.type_nr] ?? 0) > 0 && (
          <Badge className="bg-green-100 text-green-800">
            {formatEuro(CASHBACK_BY_MODELNR[selected.type_nr])} cashback
          </Badge>
        )}
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

      {/* Marge-radar — eerste, glanceable signaal na de scan (alleen verkoper) */}
      {!klantView && slim && (
        <MargeRadar
          margePct={slim.eigenMarge}
          margeC={toestelMarge(selected.ticket_c, selected.inkoop_c).margeC}
        />
      )}

      {/* Slimme alternatieven op marge (zelfde techniek) */}
      {!klantView && slim && (
        <div className="space-y-3">
          <AltStrip titel={`Top 3 beste marge · ${selected.klasse}`} items={slim.top3} onPick={kies} />
          <AltStrip titel="Beste marge per merk" items={slim.perMerk} onPick={kies} />
          {slim.kleinerMaat != null && (
            <AltStrip
              titel={`Maat kleiner (${slim.kleinerMaat}") · beste marge`}
              items={slim.maatKleiner}
              onPick={kies}
            />
          )}
          {slim.groterMaat != null && (
            <AltStrip
              titel={`Maat groter (${slim.groterMaat}") · beste marge`}
              items={slim.maatGroter}
              onPick={kies}
            />
          )}
        </div>
      )}

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
                {formatEuro(adviesPrijs(selected.ticket_c, selected.type_nr))}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Adviesprijs {formatEuro(adviesPrijs(selected.ticket_c, selected.type_nr))} · ticketprijs{' '}
              {formatEuro(selected.ticket_c)}
            </p>
            {serviceAan && (
              <ul className="grid grid-cols-2 gap-1 pt-2 text-sm">
                {SERVICE.map((s) => (
                  <li key={s} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 shrink-0 text-primary" /> {s}
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
                <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                  <TriangleAlert className="h-3.5 w-3.5" /> Onder min-marge
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Combideal & service — selecteerbare varianten + aantal */}
      {combideals && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold">Combideal &amp; service</p>
            <DealExtras selectie={extraSel} onChange={setExtraSel} inch={selected.inch ?? 0} />
            {calc && gekozen.length > 0 && (
              <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                <span>Totaal incl. extra&apos;s: {formatEuro(calc.totaalPrijs)}</span>
                {!klantView && (
                  <span className={margeTone(0)}>marge {formatEuro(calc.totaalMarge)}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voorraad — kies filiaal; centraal magazijn altijd zichtbaar */}
      <Card>
        <CardContent className="space-y-2.5 p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Voorraad</span>
            <FiliaalSelect
              filialen={data.filialen}
              value={filiaal}
              onChange={setFiliaal}
              includeAll={false}
              className="w-48"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
            <span className="text-muted-foreground">
              {data.filialen.find((f) => f.id === filiaal)?.naam ?? 'Filiaal'} · op voorraad
            </span>
            <span className="text-lg font-bold tabular-nums">
              {selected.voorraad[filiaal] ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
            <span className="text-muted-foreground">
              Centraal magazijn
              {selected.centraalEta != null && ` · ETA ${selected.centraalEta} d`}
            </span>
            <span className="font-semibold tabular-nums">{selected.centraalAantal} stuks</span>
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

// Compacte, horizontaal scrollbare rij met marge-alternatieven (aantikken = wissel toestel).
function AltStrip({
  titel,
  items,
  onPick,
}: {
  titel: string;
  items: Array<ScanToestel & { m: number }>;
  onPick: (t: ScanToestel) => void;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{titel}</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            className="w-40 shrink-0 rounded-xl border bg-background p-2.5 text-left hover:bg-muted active:scale-[0.98]"
          >
            <span className="block truncate text-sm font-medium">{t.model}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {t.merk} · {t.inch}&quot;
            </span>
            <span className={`text-sm font-bold ${margeVerdict(t.m).tekst}`}>
              {t.m.toFixed(0)}% marge
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
