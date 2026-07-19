'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { previewImport, commitImport, type Preview } from './actions';

// Minimale CSV-parser (komma-gescheiden, eerste rij = headers, quotes ondersteund).
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];
  const split = (line: string) =>
    line
      .match(/("([^"]|"")*"|[^,]*)(,|$)/g)
      ?.slice(0, -1)
      .map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()) ?? [];
  const headers = split(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = split(line);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
  });
}

export function ImportForm() {
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setPreview(null);
    setError(null);
    file.text().then((text) => {
      const recs = parseCsv(text);
      setRecords(recs);
      start(async () => {
        const res = await previewImport(recs);
        if (res.ok) setPreview(res.data);
        else setError(res.error);
      });
    });
  }

  function commit() {
    start(async () => {
      const res = await commitImport(records);
      if (res.ok) {
        setResult(
          `${res.data.created} nieuw, ${res.data.updated} bijgewerkt, ${res.data.invalid} ongeldig.`,
        );
        setPreview(null);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        className="block text-sm"
        disabled={pending}
      />
      <p className="text-xs text-muted-foreground">
        Kolommen: merk, modelnaam, modelnummer, modeljaar, ean, schermmaat, paneltype, segment,
        hellotv-sku, opvolger-ean. Vrije kolomvolgorde (op headernaam).
      </p>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      {result && <p className="text-sm font-medium text-green-700">{result}</p>}

      {preview && (
        <Card>
          <CardContent className="space-y-3 pt-6 text-sm">
            <p>
              <strong>{preview.toCreate}</strong> nieuw · <strong>{preview.toUpdate}</strong>{' '}
              bijgewerkt · <strong>{preview.invalid.length}</strong> ongeldig
            </p>
            {preview.invalid.length > 0 && (
              <ul className="max-h-40 overflow-y-auto text-xs text-destructive">
                {preview.invalid.map((iv) => (
                  <li key={iv.line}>
                    Regel {iv.line}: {iv.reason}
                  </li>
                ))}
              </ul>
            )}
            <Button
              onClick={commit}
              disabled={pending || preview.toCreate + preview.toUpdate === 0}
            >
              {pending ? 'Bezig…' : 'Importeren bevestigen'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
