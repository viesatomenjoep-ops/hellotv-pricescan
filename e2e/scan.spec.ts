import { test, expect, type Page } from '@playwright/test';

// E2E van de kern-scanflow (H1). Vereist geseede lokale DB + gebruikers (pnpm db:seed-users).
// Seed-EPC's: eerste gekoppelde tag hoort bij "Samsung Neo QLED 55".

const LINKED_EPC = 'E2801170000002000000000A';
const LINKED_EAN = '8600000000004';
const UNKNOWN_EPC = 'FFFFFFFFFFFFFFFF';
const PASSWORD = 'PriceScan!2026';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByPlaceholder('E-mailadres').fill(email);
  await page.getByPlaceholder('Wachtwoord').fill(PASSWORD);
  await page.getByRole('button', { name: 'Inloggen' }).click();
  await page.waitForURL('**/');
}

async function scan(page: Page, code: string) {
  await page.goto('/scan');
  await page.getByLabel('EPC of EAN').fill(code);
  await page.getByRole('button', { name: 'Zoek' }).click();
}

test('sales scant een bekende EPC en ziet model, prijs, marge', async ({ page }) => {
  await login(page, 'sales@hellotv.local');
  await scan(page, LINKED_EPC);
  await expect(page.getByText('Samsung Neo QLED 55" QN90F')).toBeVisible();
  await expect(page.getByText('Marge')).toBeVisible();
  await expect(page.getByText('Verkoop')).toBeVisible();
});

test('warehouse scant dezelfde EPC en ziet GEEN marge/verkoop', async ({ page }) => {
  await login(page, 'warehouse@hellotv.local');
  await scan(page, LINKED_EPC);
  await expect(page.getByText('Samsung Neo QLED 55" QN90F')).toBeVisible();
  await expect(page.getByText('Inkoop')).toBeVisible();
  await expect(page.getByText('Verkoop')).toHaveCount(0);
  await expect(page.getByText('Marge')).toHaveCount(0);
});

test('EAN-scan van een model zonder tag geeft dezelfde resultaatkaart', async ({ page }) => {
  await login(page, 'sales@hellotv.local');
  await scan(page, LINKED_EAN);
  await expect(page.getByText('Samsung Neo QLED 55" QN90F')).toBeVisible();
});

test('onbekende EPC toont de koppel-kaart', async ({ page }) => {
  await login(page, 'warehouse@hellotv.local');
  await scan(page, UNKNOWN_EPC);
  await expect(page.getByText('Onbekende tag')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nu koppelen' })).toBeVisible();
});
