'use client';

import { isValidEan13 } from '@/lib/schemas';
import { normalizeEpc } from './epc';
import type { Scan } from './use-scan-listener';

// Optionele Web Serial-invoerbron (E1b, CONFIG-1). Alleen nodig als de handheld niet in
// keyboard-wedge-modus kan. Zelfde onScan-callback als de HID-hook, zodat de rest niets merkt.

export interface SerialConfig {
  baudRate: number;
  prefix?: string;
  suffix?: string; // frame-einde; default newline
}

// Minimale Web Serial-typing (staat niet in de standaard TS lib).
interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
}
interface SerialLike {
  requestPort(): Promise<SerialPortLike>;
}

function getSerial(): SerialLike | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as unknown as { serial?: SerialLike }).serial ?? null;
}

export function isWebSerialSupported(): boolean {
  return getSerial() !== null;
}

function classify(raw: string): Scan | null {
  const trimmed = raw.trim();
  if (/^\d{13}$/.test(trimmed) && isValidEan13(trimmed)) return { type: 'ean', value: trimmed };
  const epc = normalizeEpc(trimmed);
  if (/^[0-9A-F]{16,32}$/.test(epc)) return { type: 'rfid', value: epc };
  return null;
}

/**
 * Start de Web Serial-leesloop. Vraagt de gebruiker een poort te kiezen, parset frames tot
 * `suffix` en roept onScan aan per geldige code. Geeft een stop-functie terug.
 */
export async function startSerialScan(
  config: SerialConfig,
  onScan: (scan: Scan) => void,
): Promise<() => void> {
  const serial = getSerial();
  if (!serial)
    throw new Error('Web Serial wordt niet ondersteund in deze browser (gebruik Chrome/Edge).');

  const port = await serial.requestPort();
  await port.open({ baudRate: config.baudRate });
  const suffix = config.suffix ?? '\n';

  let stopped = false;
  let buffer = '';
  const decoder = new TextDecoder();

  (async () => {
    const readable = port.readable;
    if (!readable) return;
    const reader = readable.getReader();
    try {
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf(suffix)) >= 0) {
          let frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + suffix.length);
          if (config.prefix && frame.startsWith(config.prefix))
            frame = frame.slice(config.prefix.length);
          const scan = classify(frame);
          if (scan) onScan(scan);
        }
      }
    } finally {
      reader.releaseLock();
    }
  })();

  return () => {
    stopped = true;
    void port.close();
  };
}
