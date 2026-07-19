// Gedeelde, geldige EAN-13's voor de seed én de mock-adapter (zodat matching op EAN werkt).
// De check-digit wordt berekend zodat elke EAN de checksum-validatie doorstaat.

function checkDigit(ean12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(ean12[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}

/** 24 geldige EAN-13's: base '860000000' + 3-cijferige index + check-digit. */
export const SEED_EANS: string[] = Array.from({ length: 24 }, (_, i) => {
  const base = '860000000' + String(i).padStart(3, '0');
  return base + checkDigit(base);
});
