/**
 * Web smoke suite (B5, layer 3) — runs against a deployed environment (staging by default).
 * No auth, no destructive actions. Covers: the public pages render, the interview actually
 * starts (one real /api/lola round-trip → Lola's first question appears), the plan empty state
 * is a real page, and no page throws uncaught JS errors.
 */
import { test, expect, type Page } from '@playwright/test';

// Collect uncaught page errors so any spec can assert the page didn't blow up.
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

test('home renders hero + CTA and the footer disclaimer', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByText('Camino', { exact: false }).first()).toBeVisible();
  await expect(page.getByText(/Guidance only — not legal or tax advice/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('interview auto-starts; a typed answer round-trips /api/lola and advances (live)', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/interview');
  // Living-roadmap redesign (2026-07-10): no start button — the page opens straight into the
  // conversation with Lola's greeting and the arrival-date opener.
  await expect(page.getByText("Hola, I'm Lola", { exact: false })).toBeVisible();
  await expect(page.getByText(/when are you hoping to arrive/i)).toBeVisible();
  await expect(page.getByText(/voice (on|off)/i)).toBeVisible();
  // One real /api/lola round-trip: answer the date; the next question (Spanish level) should
  // arrive with its chips. Give the extraction + the reaction race room.
  const composer = page.getByPlaceholder(/type your answer/i);
  await composer.fill('January 2028');
  await composer.press('Enter');
  await expect(page.getByText(/your Spanish/i).last()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('None yet')).toBeVisible();
  expect(errors).toEqual([]);
});

test('plan (signed out): real page with nav, footer, and the empty state', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/plan');
  await expect(page.getByText('No roadmap yet')).toBeVisible();
  await expect(page.getByText(/Guidance only — not legal or tax advice/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('how-it-works, the unlisted blog, and the build log load', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/how-it-works');
  await expect(page).toHaveURL(/how-it-works/);
  await page.goto('/how-i-was-built');
  await expect(page.getByText('How I was built')).toBeVisible();
  await page.goto('/how-i-was-built/log');
  await expect(page.getByText('The build log')).toBeVisible();
  await expect(page.getByText('The walking skeleton')).toBeVisible();
  expect(errors).toEqual([]);
});

test('sample plan renders the full read-only roadmap + interview CTA', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/sample-plan');
  await expect(page.getByText('SAMPLE ROADMAP')).toBeVisible();
  await expect(page.getByText(/This is Susan & Tom's plan/)).toBeVisible();
  await expect(page.getByText('Before you go', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Build my own roadmap →')).toBeVisible();
  // A few signature obligations that the sample persona must surface:
  await expect(page.getByText(/non-lucrative/i).first()).toBeVisible();
  await expect(page.getByText(/Empadronamiento/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('robots.txt is open (blog un-gated 2026-07-03) and points at the sitemap', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  const body = await robots.text();
  expect(body).not.toContain('Disallow: /how-i-was-built'); // public by user decision
  expect(body).toContain('Sitemap:');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('/guide/');
  const autoSitemap = await request.get('/_sitemap'); // Expo's route index stays off
  expect(autoSitemap.status()).toBe(404);
});
