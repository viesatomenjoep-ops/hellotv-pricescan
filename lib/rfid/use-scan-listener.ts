'use client';

import { useEffect, useRef, useState } from 'react';
import { isValidEan13 } from '@/lib/schemas';
import { normalizeEpc } from './epc';

// HID/keyboard-wedge scan-listener (E1). Herkent snelle toetsreeksen als scanner-invoer,
// classificeert EAN-13 of EPC, debounced dubbele scans, en geeft geluid + flash-feedback.

export type ScanType = 'rfid' | 'ean';
export interface Scan {
  type: ScanType;
  value: string;
}

const MAX_INTERKEY_MS = 35; // sneller dan dit tussen tekens = scanner, geen mens
const DEBOUNCE_MS = 3000; // zelfde waarde binnen 3s negeren
const MIN_LENGTH = 8;

function classify(raw: string): Scan | null {
  const trimmed = raw.trim();
  if (/^\d{13}$/.test(trimmed) && isValidEan13(trimmed)) return { type: 'ean', value: trimmed };
  const epc = normalizeEpc(trimmed);
  if (/^[0-9A-F]{16,32}$/.test(epc)) return { type: 'rfid', value: epc };
  return null;
}

function beep(ok: boolean) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 880 : 220;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.08 : 0.18));
    osc.onended = () => ctx.close();
  } catch {
    // WebAudio niet beschikbaar — stil doorgaan.
  }
}

export function useScanListener({
  enabled,
  onScan,
}: {
  enabled: boolean;
  onScan: (scan: Scan) => void;
}) {
  const [flash, setFlash] = useState<'ok' | 'error' | null>(null);
  const buffer = useRef('');
  const lastKey = useRef(0);
  const wasFast = useRef(true);
  const lastEmit = useRef<{ value: string; at: number }>({ value: '', at: 0 });

  useEffect(() => {
    if (!enabled) return;

    function finalize() {
      const raw = buffer.current;
      buffer.current = '';
      const fast = wasFast.current;
      wasFast.current = true;
      if (!fast || raw.length < MIN_LENGTH) return;

      const scan = classify(raw);
      const now = Date.now();
      if (!scan) {
        beep(false);
        setFlash('error');
        setTimeout(() => setFlash(null), 250);
        return;
      }
      if (scan.value === lastEmit.current.value && now - lastEmit.current.at < DEBOUNCE_MS) return;
      lastEmit.current = { value: scan.value, at: now };
      beep(true);
      setFlash('ok');
      setTimeout(() => setFlash(null), 250);
      onScan(scan);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (buffer.current.length > 0) {
          e.preventDefault();
          finalize();
        }
        return;
      }
      if (e.key.length !== 1) return; // negeer Shift, Ctrl, pijltjes, etc.

      const now = performance.now();
      const gap = now - lastKey.current;
      if (buffer.current.length > 0 && gap > MAX_INTERKEY_MS) {
        wasFast.current = false; // te traag = mens, niet de scanner
      }
      lastKey.current = now;
      buffer.current += e.key;
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, onScan]);

  return { flash };
}
