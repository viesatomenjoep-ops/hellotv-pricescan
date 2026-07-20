import { describe, it, expect } from 'vitest';
import { buildCatalog } from './tv-catalog';
import { SERIES } from './tv-series';
import { isValidEan13 } from '@/lib/schemas';

const cat = buildCatalog(SERIES);

describe('TV-catalogus', () => {
  it('bevat modellen', () => {
    expect(cat.length).toBeGreaterThan(250);
  });

  it('bevat uitsluitend modeljaar 2025 en 2026', () => {
    const jaren = Array.from(new Set(cat.map((c) => c.jaar))).sort();
    expect(jaren).toEqual([2025, 2026]);
  });

  it('verkoopt alleen de vijf helloTV-merken (geen Hisense)', () => {
    const merken = Array.from(new Set(cat.map((c) => c.merk))).sort();
    expect(merken).toEqual(['LG', 'Philips', 'Samsung', 'Sony', 'TCL']);
  });

  it('heeft unieke keys, typenummers en EANs', () => {
    expect(new Set(cat.map((c) => c.key)).size).toBe(cat.length);
    expect(new Set(cat.map((c) => c.model_number)).size).toBe(cat.length);
    expect(new Set(cat.map((c) => c.ean)).size).toBe(cat.length);
  });

  it('genereert geldige EAN-13s', () => {
    for (const c of cat) expect(isValidEan13(c.ean)).toBe(true);
  });

  it('heeft consistente prijzen: inkoop < min-marge ≤ ticket, allemaal positief', () => {
    for (const c of cat) {
      expect(c.ticket_c).toBeGreaterThan(0);
      expect(c.inkoop_c).toBeGreaterThan(0);
      expect(c.inkoop_c).toBeLessThan(c.ticket_c);
      expect(c.min_marge_c).toBeLessThanOrEqual(c.ticket_c);
      expect(c.min_marge_c).toBeGreaterThanOrEqual(c.inkoop_c);
    }
  });

  it('typenummer bevat de maat', () => {
    for (const c of cat) expect(c.model_number).toContain(String(c.inch));
  });
});
