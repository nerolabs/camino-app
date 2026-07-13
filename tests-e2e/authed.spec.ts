/**
 * Authed web suite (B5 follow-through, 2026-07-04): the signed-in journeys the smoke suite
 * can't reach — saved roadmap, This-week view, mark-done re-flow, the no-op re-model honesty
 * gate (1 live /api/lola call), sign-out. Runs against staging with the storageState captured
 * by auth.setup.ts; serial because the specs share one seeded user (reset on every setup run).
 */
import { test, expect } from '@playwright/test';
import { STATE_PATH } from './authState';

// Same condition that makes auth.setup skip — checked here at collection time (the state file
// itself doesn't exist until the setup project runs, so its existence can't be the guard).
test.skip(
  !process.env.E2E_SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY,
  'no service key in env — authed suite skipped',
);
test.use({ storageState: STATE_PATH });
test.describe.configure({ mode: 'serial' });

test('saved roadmap loads signed-in with fixture steps and stats', async ({ page }) => {
  await page.goto('/plan');
  await expect(page.getByText('Your roadmap', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Obtain your NIE/).first()).toBeVisible();
  await expect(page.getByText('total steps')).toBeVisible();
  await expect(page.getByText('required', { exact: true })).toBeVisible();
});

test('"This week" view toggles and shows an honest week', async ({ page }) => {
  await page.goto('/plan');
  await expect(page.getByText('Your roadmap', { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByText(/^This week/).click();
  // Fixture arrival is 2026-10-15: either something slipped/is due, or the week is honestly clear.
  await expect(
    page.getByText(/SLIPPED PAST|DUE THIS WEEK|Nothing needs you this week\./).first(),
  ).toBeVisible();
  await page.getByText('Full roadmap').click();
  await expect(page.getByText(/Obtain your NIE/).first()).toBeVisible();
});

test('mark done flips the step and Undo restores it', async ({ page }) => {
  await page.goto('/plan');
  await expect(page.getByText(/Obtain your NIE/).first()).toBeVisible({ timeout: 20_000 });

  // Mark done — the sheet closes itself and a "done" stat chip appears.
  await page.getByText(/Obtain your NIE/).first().click();
  await expect(page.getByText('✓ Mark done')).toBeVisible();
  await page.getByText('✓ Mark done').click();
  await expect(page.getByText('done', { exact: true })).toBeVisible();

  // Reopen the same step: it now shows the done state, and Undo restores it (leave the
  // world as we found it — setup also resets, but be a good citizen).
  await page.getByText(/Obtain your NIE/).first().click();
  await expect(page.getByRole('dialog').getByText('✓ Done')).toBeVisible();
  await page.getByText('Undo').click();
  await expect(page.getByText('done', { exact: true })).not.toBeVisible();
});

test('no-op re-model stays honest (live extractor call)', async ({ page }) => {
  await page.goto('/plan');
  await expect(page.getByText(/Obtain your NIE/).first()).toBeVisible({ timeout: 20_000 });
  await page.getByText(/Obtain your NIE/).first().click();
  await page.getByText(/Something changed\? Tell Lola/).click();
  await page.locator('textarea').last().fill('Nothing changed, just checking in.');
  await page.getByText('Tell Lola', { exact: true }).click();
  // Either honest outcome is a pass; a celebratory "remodelled" over a no-op is the bug.
  await expect(
    page.getByText(/Thanks for the update|Thanks — noted\./).first(),
  ).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/remodelled your plan/)).not.toBeVisible();
});

test('sign out returns to the signed-out app', async ({ page }) => {
  // Sign out + delete moved from the hamburger to the account page (2026-07-13); the menu now
  // just links to /account, where the actions live.
  await page.goto('/account');
  await page.getByText('Sign out', { exact: true }).click();
  await expect(page.getByText('Sign in', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
});
