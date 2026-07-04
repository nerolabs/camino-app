// Shared between auth.setup.ts (writes) and authed.spec.ts (reads) — Playwright forbids
// test files importing each other, so the constant lives here.
export const STATE_PATH = 'tests-e2e/.auth/state.json';
