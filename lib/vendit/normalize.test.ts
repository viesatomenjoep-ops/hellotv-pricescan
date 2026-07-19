import { describe, it, expect } from 'vitest';
import { normalizePriceToCents, normalizeEan } from './normalize';
import { SEED_EANS } from '@/lib/catalog/eans';

const VALID_EAN = SEED_EANS[0];
const INVALID_EAN = VALID_EAN.slice(0, 12) + String((Number(VALID_EAN[12]) + 1) % 10);

describe('normalizePriceToCents', () => {
  it('parseert "123.45" naar 12345 centen', () => {
    expect(normalizePriceToCents('123.45')).toEqual({ cents: 12345, ambiguous: false });
  });
  it('parseert "123,45" (komma) naar 12345', () => {
    expect(normalizePriceToCents('123,45')).toEqual({ cents: 12345, ambiguous: false });
  });
  it('parseert decimaal getal 123.45 naar 12345', () => {
    expect(normalizePriceToCents(123.45)).toEqual({ cents: 12345, ambiguous: false });
  });
  it('behandelt heel getal 12345 als centen bij unit "cents"', () => {
    expect(normalizePriceToCents(12345, 'cents')).toEqual({ cents: 12345, ambiguous: false });
  });
  it('behandelt heel getal 12345 als euro bij unit "euros"', () => {
    expect(normalizePriceToCents(12345, 'euros')).toEqual({ cents: 1234500, ambiguous: false });
  });
  it('markeert heel getal als dubbelzinnig bij "auto"', () => {
    expect(normalizePriceToCents(12345)).toEqual({ cents: 12345, ambiguous: true });
  });
  it('geeft null bij lege input', () => {
    expect(normalizePriceToCents(null)).toEqual({ cents: null, ambiguous: false });
  });
});

describe('normalizeEan', () => {
  it('accepteert geldige EAN-13', () => {
    expect(normalizeEan(VALID_EAN)).toBe(VALID_EAN);
  });
  it('verwerpt ongeldige checksum als null', () => {
    expect(normalizeEan(INVALID_EAN)).toBeNull();
  });
  it('verwerpt niet-13-cijferige input', () => {
    expect(normalizeEan('123')).toBeNull();
  });
});
