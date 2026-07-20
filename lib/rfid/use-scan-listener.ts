'use client';

import { useEffect, useRef, useState } from 'react';
import { classifyScan, type Scan, type ScanType } from './classify';

// HID/keyboard-wedge scan-listener (E1). Herkent snelle toetsreeksen als scanner-invoer,
// classificeert EAN-13 of EPC, debounced dubbele scans, en geeft geluid + flash-feedback.

export type { Scan, ScanType };

const MAX_INTERKEY_MS = 35; // sneller dan dit tussen tekens = scanner, geen mens
const DEBOUNCE_MS = 3000; // zelfde waarde binnen 3s negeren
const MIN_LENGTH = 8;
const IDLE_FINALIZE_MS = 120; // reader zonder Enter/Tab-suffix: finaliseer na deze stilte

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
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function clearIdle() {
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }
    }

    function finalize() {
      clearIdle();
      const raw = buffer.current;
      buffer.current = '';
      const fast = wasFast.current;
      wasFast.current = true;
      if (!fast || raw.length < MIN_LENGTH) return;

      const scan = classifyScan(raw);
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

      // Vangnet: readers zonder Enter/Tab-suffix finaliseren na korte stilte.
      clearIdle();
      idleTimer.current = setTimeout(finalize, IDLE_FINALIZE_MS);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearIdle();
    };
  }, [enabled, onScan]);

  return { flash };
}
