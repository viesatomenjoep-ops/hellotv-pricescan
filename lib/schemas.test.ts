import { describe, it, expect } from 'vitest';
import { epcSchema, ean13Schema, isValidEan13 } from './schemas';

describe('epcSchema', () => {
  it('accepteert en normaliseert een geldige EPC met scheidingstekens', () => {
    const r = epcSchema.safeParse('e2:80-11 70 0000 0200 0000 000a');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('E2801170000002000000000A');
  });

  it('accepteert de grenzen 16 en 32 hex', () => {
    expect(epcSchema.safeParse('0'.repeat(16)).success).toBe(true);
    expect(epcSchema.safeParse('f'.repeat(32)).success).toBe(true);
  });

  it('weigert te kort, te lang en niet-hex', () => {
    expect(epcSchema.safeParse('A'.repeat(15)).success).toBe(false);
    expect(epcSchema.safeParse('A'.repeat(33)).success).toBe(false);
    expect(epcSchema.safeParse('G'.repeat(16)).success).toBe(false);
  });
});

describe('isValidEan13 / ean13Schema', () => {
  it('accepteert een EAN met correcte checksum', () => {
    expect(isValidEan13('8600000000004')).toBe(true);
    expect(ean13Schema.safeParse('8600000000004').success).toBe(true);
  });

  it('weigert een foute checksum', () => {
    expect(isValidEan13('8600000000005')).toBe(false);
    expect(ean13Schema.safeParse('8600000000005').success).toBe(false);
  });

  it('weigert niet-13-cijferige invoer', () => {
    expect(isValidEan13('860000000000')).toBe(false); // 12
    expect(isValidEan13('86000000000045')).toBe(false); // 14
    expect(isValidEan13('86000000000a4')).toBe(false); // letter
  });

  it('valideert een tweede EAN met correct berekend controlecijfer', () => {
    // eerste 12 cijfers 004549642001 → controlecijfer 7
    expect(isValidEan13('0045496420017')).toBe(true);
    expect(isValidEan13('0045496420018')).toBe(false);
  });
});
