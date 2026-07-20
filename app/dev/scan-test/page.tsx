'use client';

import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useScanListener, type Scan } from '@/lib/rfid/use-scan-listener';

interface Entry extends Scan {
  at: number;
  sinceMs: number | null;
}

export default function ScanTestPage() {
  const [entries, setEntries] = useState<Entry[]>([]);

  const onScan = useCallback((scan: Scan) => {
    setEntries((prev) => {
      const now = Date.now();
      const sinceMs = prev[0] ? now - prev[0].at : null;
      return [{ ...scan, at: now, sinceMs }, ...prev].slice(0, 50);
    });
  }, []);

  const { flash } = useScanListener({ enabled: true, onScan });

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Scan-test (HID)</h1>
      <p className="text-sm text-muted-foreground">
        Scan RFID-tags of EAN-barcodes met de handheld in keyboard-wedge-modus. Focus is niet nodig.
      </p>

      <div
        className={
          'rounded-lg border p-4 text-center text-sm transition-colors ' +
          (flash === 'ok'
            ? 'border-green-400 bg-green-50'
            : flash === 'error'
              ? 'border-red-400 bg-red-50'
              : 'bg-muted/30')
        }
      >
        {flash === 'ok' ? 'Scan herkend' : flash === 'error' ? 'Ongeldige code' : 'Wachten op scan…'}
      </div>

      <ul className="divide-y rounded-md border">
        {entries.map((e, i) => (
          <li key={i} className="flex items-center justify-between p-3 text-sm">
            <span className="font-mono">{e.value}</span>
            <span className="flex items-center gap-2">
              <Badge variant={e.type === 'rfid' ? 'default' : 'secondary'}>{e.type}</Badge>
              <span className="text-xs text-muted-foreground">
                {e.sinceMs != null ? `+${e.sinceMs} ms` : 'eerste'}
              </span>
            </span>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="p-3 text-sm text-muted-foreground">Nog geen scans.</li>
        )}
      </ul>
    </main>
  );
}
