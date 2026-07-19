import { describe, it, expect } from 'vitest';
import { exclVat, computeMargin } from './margin';

describe('exclVat', () => {
  it('haalt 21% btw eruit (round-half-up)', () => {
    expect(exclVat(12100, 0.21)).toBe(10000);
    expect(exclVat(179900, 0.21)).toBe(148678);
  });
});

describe('computeMargin', () => {
  it('marge = verkoop_excl - inkoop; marge% = marge / verkoop_excl', () => {
    expect(computeMargin(10000, 8000)).toEqual({ marginCents: 2000, marginPct: 0.2 });
  });
  it('geeft marginPct null bij verkoop_excl 0', () => {
    expect(computeMargin(0, 5000)).toEqual({ marginCents: -5000, marginPct: null });
  });
  it('staat negatieve marge toe', () => {
    expect(computeMargin(10000, 12000).marginCents).toBe(-2000);
  });
});
