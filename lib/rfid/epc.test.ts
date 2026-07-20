import { describe, it, expect } from 'vitest';
import { normalizeEpc } from './epc';

describe('normalizeEpc', () => {
  it('zet om naar uppercase', () => {
    expect(normalizeEpc('e2801170000002000000000a')).toBe('E2801170000002000000000A');
  });

  it('verwijdert spaties, dubbele punten en streepjes', () => {
    expect(normalizeEpc('E280 1170 0000 0200')).toBe('E280117000000200');
    expect(normalizeEpc('E2:80:11:70')).toBe('E2801170');
    expect(normalizeEpc('E2801170-00000200')).toBe('E280117000000200');
  });

  it('is idempotent (twee keer normaliseren geeft hetzelfde)', () => {
    const once = normalizeEpc('e2:80-11 70');
    expect(normalizeEpc(once)).toBe(once);
  });

  it('laat een al schone EPC ongemoeid', () => {
    expect(normalizeEpc('ABCDEF0123456789')).toBe('ABCDEF0123456789');
  });

  it('geeft lege string terug bij lege invoer', () => {
    expect(normalizeEpc('')).toBe('');
    expect(normalizeEpc('  ')).toBe('');
  });
});
