import { test, expect, type Page } from '@playwright/test';

// E2E van het geünificeerde scannen: Tracker-herkenning, onbekende chip koppelen, en de
// EAN-brug in beide richtingen. Vereist geseede lokale DB (`pnpm db:seed && db:seed-users &&
// db:seed-tracker`). Scannen wordt gesimuleerd via de handmatige invoervelden.
//
// Seed-koppelingen (BRUG_EANS):
//   toestel #1 "Samsung QLED Q60D"  ↔ EAN 8806090000011 ↔ product "Samsung Neo QLED 55\" QN90F"
//   toestel #2 "Samsung OLED S90D"  ↔ EAN 8806090000012 ↔ product "Samsung Crystal UHD 43\" DU7100"
// Demo-chips: E2801170000002000000A001 → toestel #1, ...A002 → toestel #2

const PASSWORD = 'PriceScan!2026';
const DEMO_CHIP_1 = 'E2801170000002000000A001';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByPlaceholder('E-mailadres').fill(email);
  await page.getByPlaceholder('Wachtwoord').fill(PASSWORD);
  await page.getByRole('button', { name: 'Inloggen' }).click();
  await page.waitForURL('**/');
}

// Handmatige "scan" op het Tracker-scanscherm.
async function trackerScan(page: Page, code: string) {
  await page.goto('/tracker/scan');
  await page.getByLabel('EPC of EAN').fill(code);
  await page.getByRole('button', { name: 'Zoek' }).click();
}

test('Tracker herkent een gekoppelde chip en opent het toestel', async ({ page }) => {
  await login(page, 'sales@hellotv.local');
  await trackerScan(page, DEMO_CHIP_1);
  await expect(page.getByRole('heading', { name: 'Samsung QLED Q60D' })).toBeVisible();
});

test('Tracker: onbekende chip → koppel-UI → toestel opent', async ({ page }) => {
  await login(page, 'sales@hellotv.local');
  const nieuweChip = 'E2801170000002000000C001';
  await trackerScan(page, nieuweChip);

  // Koppel-paneel verschijnt.
  await expect(page.getByText('is nog niet gekoppeld')).toBeVisible();

  // Zoek en kies het toestel om aan te koppelen.
  await page.getByLabel('Zoek toestel om te koppelen').fill('Q60D');
  await page.getByRole('button', { name: /Samsung QLED Q60D/ }).first().click();

  // Toestel opent na koppelen.
  await expect(page.getByRole('heading', { name: 'Samsung QLED Q60D' })).toBeVisible();
});

test('EAN-brug: koppelen in de Tracker → herkend in PriceScan /scan', async ({ page }) => {
  await login(page, 'sales@hellotv.local');
  const chip = 'E2801170000002000000C010';

  // Koppel de chip in de Tracker aan toestel #1 (deelt EAN met product QN90F).
  await trackerScan(page, chip);
  await expect(page.getByText('is nog niet gekoppeld')).toBeVisible();
  await page.getByLabel('Zoek toestel om te koppelen').fill('Q60D');
  await page.getByRole('button', { name: /Samsung QLED Q60D/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Samsung QLED Q60D' })).toBeVisible();

  // Dezelfde chip moet nu in PriceScan het gekoppelde product tonen (via de EAN-brug).
  await page.goto('/scan');
  await page.getByLabel('EPC of EAN').fill(chip);
  await page.getByRole('button', { name: 'Zoek' }).click();
  await expect(page.getByText('Samsung Neo QLED 55" QN90F')).toBeVisible();
});

test('EAN-brug: koppelen in PriceScan /koppelen → herkend in de Tracker', async ({ page }) => {
  await login(page, 'admin@hellotv.local');
  const chip = 'E2801170000002000000D002';

  // Kies product #2 (Crystal UHD DU7100, deelt EAN met toestel #2) en koppel handmatig.
  await page.goto('/koppelen');
  await page.getByPlaceholder('Zoek model of scan EAN…').fill('UE43DU7100');
  await page.getByRole('button', { name: 'Kies' }).first().click();
  await page.getByLabel('EPC handmatig').fill(chip);
  await page.getByRole('button', { name: 'Koppel' }).click();
  await expect(page.getByText(chip)).toBeVisible();

  // Dezelfde chip moet nu in de Tracker toestel #2 openen (via de EAN-brug).
  await trackerScan(page, chip);
  await expect(page.getByRole('heading', { name: 'Samsung OLED S90D' })).toBeVisible();
});
