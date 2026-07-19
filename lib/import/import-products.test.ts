import { describe, it, expect } from 'vitest';
import { parseImportRecords, canonicalBrand } from './import-products';
import { SEED_EANS } from '@/lib/catalog/eans';

describe('canonicalBrand', () => {
  it('canonicaliseert merknamen', () => {
    expect(canonicalBrand('LG Electronics')).toBe('LG');
    expect(canonicalBrand('Onbekend Merk')).toBe('Onbekend Merk');
  });
});

describe('parseImportRecords', () => {
  it('parseert een geldige rij (vrije kolomvolgorde)', () => {
    const res = parseImportRecords([
      {
        segment: 'premium',
        modelnaam: 'LG OLED 55 C5',
        merk: 'LG Electronics',
        modeljaar: '2026',
        modelnummer: 'oled55c5',
        ean: SEED_EANS[0],
        schermmaat: '55',
        paneltype: 'OLED',
      },
    ]);
    expect(res.invalid).toHaveLength(0);
    expect(res.valid[0].row.brand).toBe('LG');
    expect(res.valid[0].row.modelNumber).toBe('OLED55C5');
    expect(res.valid[0].row.panelType).toBe('OLED');
  });

  it('markeert ongeldig modeljaar', () => {
    const res = parseImportRecords([
      { merk: 'Sony', modelnaam: 'X', modelnummer: 'Y', modeljaar: '2024' },
    ]);
    expect(res.valid).toHaveLength(0);
    expect(res.invalid).toHaveLength(1);
  });

  it('markeert ongeldige EAN-checksum', () => {
    const bad = SEED_EANS[0].slice(0, 12) + String((Number(SEED_EANS[0][12]) + 1) % 10);
    const res = parseImportRecords([
      { merk: 'Sony', modelnaam: 'X', modelnummer: 'Y', modeljaar: '2025', ean: bad },
    ]);
    expect(res.invalid.some((i) => i.reason.includes('EAN'))).toBe(true);
  });
});
