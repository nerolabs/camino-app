import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Vitest owns tests/ (engine + API contract + unit). Playwright owns tests-e2e/ — kept separate
// so `vitest run` never tries to execute Playwright specs.
//
// Aliases let us unit-test the DISPLAY layer (formatters, hints — the surfaces localization
// touches most), which imports `@/…` and `react-native`:
//   '@'            → repo root, matching tsconfig paths (so `@/core/…`, `@/constants/…` resolve).
//   'react-native' → a tiny stub (tests/stubs/react-native.ts) — pure logic only, no rendering.
export default defineConfig({
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'tests/stubs/react-native.ts'),
      // lib/i18n (and everything that imports it, e.g. plan-coach/plan-format) pulls these
      // two native modules — stubbed so the display layer stays unit-testable in node, and
      // so tests can changeLanguage() to assert the es surfaces (L1).
      'expo-localization': path.resolve(__dirname, 'tests/stubs/expo-localization.ts'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'tests/stubs/async-storage.ts'),
      '@': path.resolve(__dirname),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
