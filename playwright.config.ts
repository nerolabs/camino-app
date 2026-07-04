import { defineConfig } from '@playwright/test';

// Web E2E runs against a DEPLOYED environment (default: staging) — no local server.
// `npm run test:e2e` or E2E_BASE_URL=https://getcamino.app npm run test:e2e.
//
// Projects:
//  - public: the signed-out smoke suite (smoke.spec.ts) — runs anywhere, no secrets.
//  - setup → authed: seeds the staging E2E user (needs E2E_SUPABASE_SERVICE_ROLE_KEY in env;
//    skips cleanly without it) and runs the signed-in journeys with the captured session.
export default defineConfig({
  testDir: './tests-e2e',
  timeout: 60_000,
  retries: 1, // deployed env → tolerate one network flake
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://camino--staging.expo.app',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'public', testMatch: /smoke\.spec\.ts/, use: { browserName: 'chromium' } },
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { browserName: 'chromium' } },
    {
      name: 'authed',
      testMatch: /authed\.spec\.ts/,
      dependencies: ['setup'],
      use: { browserName: 'chromium' },
    },
  ],
});
