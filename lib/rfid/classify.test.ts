import { describe, it, expect } from 'vitest';
import { classifyScan } from './classify';

describe('classifyScan — EPC (RFID)', () => {
  it('herkent een geseede 24-hex EPC-96 tag', () => {
    expect(classifyScan('E2801170000002000000000A')).toEqual({
      type: 'rfid',
      value: 'E2801170000002000000000A',
    });
  });

  it('normaliseert lowercase naar uppercase', () => {
    expect(classifyScan('e2801170000002000000000a')).toEqual({
      type: 'rfid',
      value: 'E2801170000002000000000A',
    });
  });

  it('strippt spaties, dubbele punten en streepjes', () => {
    expect(classifyScan('E280 1170 0000 0200 0000 000A')?.value).toBe('E2801170000002000000000A');
    expect(classifyScan('E2:80:11:70:00:00:02:00:00:00:00:0A')?.value).toBe(
      'E2801170000002000000000A',
    );
    expect(classifyScan('E2801170-00000200-0000000A')?.value).toBe('E2801170000002000000000A');
  });

  it('accepteert de minimale (16) en maximale (32) hex-lengte', () => {
    expect(classifyScan('0'.repeat(16))?.type).toBe('rfid');
    expect(classifyScan('A'.repeat(32))?.type).toBe('rfid');
  });

  it('accepteert een puur numerieke tag van 16 tekens (0-9 zijn geldige hex)', () => {
    expect(classifyScan('1234567890123456')).toEqual({ type: 'rfid', value: '1234567890123456' });
  });

  it('weigert te kort (<16) of te lang (>32)', () => {
    expect(classifyScan('A'.repeat(15))).toBeNull();
    expect(classifyScan('A'.repeat(33))).toBeNull();
  });

  it('weigert niet-hex tekens', () => {
    expect(classifyScan('G2801170000002000000000A')).toBeNull(); // G is geen hex
    expect(classifyScan('E280117000000200000000ZZ')).toBeNull();
  });
});

describe('classifyScan — EAN-13 (barcode)', () => {
  it('herkent een geldige EAN-13 met correcte checksum', () => {
    expect(classifyScan('8600000000004')).toEqual({ type: 'ean', value: '8600000000004' });
  });

  it('weigert een 13-cijferige code met foute checksum', () => {
    // 13 cijfers maar checksum fout → geen EAN, en te kort voor EPC → null
    expect(classifyScan('8600000000005')).toBeNull();
  });

  it('geeft EAN voorrang boven EPC bij 13 geldige cijfers', () => {
    expect(classifyScan('8600000000004')?.type).toBe('ean');
  });
});

describe('classifyScan — ongeldige invoer', () => {
  it('geeft null bij leeg of enkel witruimte', () => {
    expect(classifyScan('')).toBeNull();
    expect(classifyScan('   ')).toBeNull();
  });

  it('geeft null bij losse tekst', () => {
    expect(classifyScan('geen tag')).toBeNull();
  });

  it('trimt omringende witruimte voor classificatie', () => {
    expect(classifyScan('  8600000000004  ')).toEqual({ type: 'ean', value: '8600000000004' });
  });
});
