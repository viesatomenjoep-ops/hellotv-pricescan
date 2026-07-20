'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScanListener, type Scan } from '@/lib/rfid/use-scan-listener';
import type { ProductListItem } from '@/lib/supabase/queries';
import { searchAction, coupleAction, moveAction, unlinkAction } from './actions';

interface TagRow {
  epc: string;
  state: 'linked' | 'moved';
}

export function KoppelWizard({ initialEpc }: { initialEpc: string | null }) {
  const [step, setStep] = useState<'model' | 'tags'>('model');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [model, setModel] = useState<ProductListItem | null>(null);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [handEpc, setHandEpc] = useState('');
  const pendingEpc = useRef<string | null>(initialEpc);

  const coupleOne = useCallback(async (epc: string, modelId: string) => {
    const res = await coupleAction(epc, modelId);
    if (res.ok) {
      setTags((prev) =>
        prev.some((t) => t.epc === res.data.epc)
          ? prev
          : [{ epc: res.data.epc, state: 'linked' }, ...prev],
      );
      setMsg(null);
    } else if (res.error.includes('al gekoppeld')) {
      setConflict(epc);
    } else {
      setMsg(res.error);
    }
  }, []);

  function selectModel(p: ProductListItem) {
    setModel(p);
    setStep('tags');
    setResults([]);
    setQuery('');
    if (pendingEpc.current) {
      void coupleOne(pendingEpc.current, p.id);
      pendingEpc.current = null;
    }
  }

  const onSearch = useCallback(async (q: string) => {
    const res = await searchAction(q);
    if (res.ok) setResults(res.data);
    else setMsg(res.error);
  }, []);

  // Scanner: in stap 'model' selecteert een EAN-scan het model; in stap 'tags' koppelt elke RFID-scan.
  const onScan = useCallback(
    (scan: Scan) => {
      if (step === 'model' && scan.type === 'ean') {
        setQuery(scan.value);
        void onSearch(scan.value);
      } else if (step === 'tags' && scan.type === 'rfid' && model) {
        void coupleOne(scan.value, model.id);
      }
    },
    [step, model, onSearch, coupleOne],
  );
  const { flash } = useScanListener({ enabled: true, onScan });

  useEffect(() => {
    if (query.trim().length >= 2) void onSearch(query);
  }, [query, onSearch]);

  async function onUnlink(epc: string) {
    const res = await unlinkAction(epc);
    if (res.ok) setTags((prev) => prev.filter((t) => t.epc !== epc));
    else setMsg(res.error);
  }

  async function resolveConflict(move: boolean) {
    const epc = conflict;
    setConflict(null);
    if (!move || !epc || !model) return;
    const res = await moveAction(epc, model.id);
    if (res.ok) setTags((prev) => [{ epc, state: 'moved' }, ...prev]);
    else setMsg(res.error);
  }

  function reset() {
    setModel(null);
    setTags([]);
    setStep('model');
    setMsg(null);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      {flash && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 ${flash === 'ok' ? 'bg-green-400/20' : 'bg-red-400/20'}`}
        />
      )}
      <h1 className="text-2xl font-bold tracking-tight">Koppelen</h1>

      {step === 'model' && (
        <Card>
          <CardHeader>
            <CardTitle>1 · Kies model</CardTitle>
            <p className="text-sm text-muted-foreground">
              Zoek op merk, modelnummer of EAN — of scan de EAN-barcode van de doos.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek model of scan EAN…"
              className="h-12 text-base"
            />
            {msg && <p className="text-sm font-medium text-destructive">{msg}</p>}
            <ul className="divide-y rounded-md border">
              {results.map((p) => (
                <li key={p.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{p.model_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.brand} · {p.model_number} · {p.model_year}
                    </p>
                  </div>
                  <Button size="lg" onClick={() => selectModel(p)}>
                    Kies
                  </Button>
                </li>
              ))}
              {results.length === 0 && (
                <li className="p-3 text-sm text-muted-foreground">Nog geen resultaten.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {step === 'tags' && model && (
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>2 · Scan tags</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {model.model_name} — scan achtereenvolgens de RFID-tags.
              </p>
            </div>
            <Button variant="secondary" onClick={reset}>
              Volgend model
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Scan-modus aan · {tags.length} gekoppeld
            </div>

            {/* Handmatige invoer (testen zonder reader). */}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const epc = handEpc.trim();
                if (!epc || !model) return;
                setHandEpc('');
                void coupleOne(epc, model.id);
              }}
            >
              <Input
                value={handEpc}
                onChange={(e) => setHandEpc(e.target.value)}
                placeholder="EPC handmatig…"
                aria-label="EPC handmatig"
                className="font-mono"
              />
              <Button type="submit" disabled={handEpc.trim() === ''}>
                Koppel
              </Button>
            </form>
            {msg && <p className="text-sm font-medium text-destructive">{msg}</p>}

            {conflict && (
              <div className="space-y-2 rounded-md border border-orange-300 bg-orange-50 p-3 text-sm">
                <p className="font-medium text-orange-800">
                  EPC <span className="font-mono">{conflict}</span> is al aan een ander model
                  gekoppeld.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolveConflict(true)}>
                    Verplaatsen naar dit model
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resolveConflict(false)}>
                    Annuleren
                  </Button>
                </div>
              </div>
            )}

            <ul className="divide-y rounded-md border">
              {tags.map((t) => (
                <li key={t.epc} className="flex items-center justify-between p-3">
                  <span className="font-mono text-sm">{t.epc}</span>
                  <span className="flex items-center gap-2">
                    {t.state === 'moved' && <Badge variant="secondary">verplaatst</Badge>}
                    <Button size="sm" variant="ghost" onClick={() => onUnlink(t.epc)}>
                      Ontkoppel
                    </Button>
                  </span>
                </li>
              ))}
              {tags.length === 0 && (
                <li className="p-3 text-sm text-muted-foreground">Nog geen tags gescand.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
