import { defineConfig, devices } from '@playwright/test';

// E2E-tests (H1). Vereist: lokale Supabase (`pnpm db:start` + seed + seed-users) en de app.
// Draai: `pnpm db:seed && pnpm db:seed-users` daarna `pnpm e2e`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/login',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
