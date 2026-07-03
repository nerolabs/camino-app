import { defineConfig } from '@playwright/test';

// Web smoke tests run against a DEPLOYED environment (default: staging) — no local server, no
// auth. `npm run test:e2e` or E2E_BASE_URL=https://getcamino.app npm run test:e2e.
export default defineConfig({
  testDir: './tests-e2e',
  timeout: 45_000,
  retries: 1, // deployed env → tolerate one network flake
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://camino--staging.expo.app',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
