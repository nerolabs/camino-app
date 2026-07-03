import { defineConfig } from 'vitest/config';

// Vitest owns tests/ (engine + API contract). Playwright owns tests-e2e/ — keep them separate so
// `vitest run` never tries to execute Playwright specs.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
