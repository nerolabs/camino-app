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

test('interview: "Let\'s get started" produces Lola\'s first question (live /api/lola)', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/interview');
  await expect(page.getByText("Hola, I'm Lola", { exact: false })).toBeVisible();
  await page.getByText("Let's get started").click();
  // First turn arrives via the LLM proxy (or its static fallback) — give it room.
  await expect(page.getByText(/passport/i)).toBeVisible({ timeout: 30_000 });
  // The composer and the voice pill should be present once started.
  await expect(page.getByPlaceholder(/type your answer/i)).toBeVisible();
  await expect(page.getByText(/voice (on|off)/i)).toBeVisible();
  expect(errors).toEqual([]);
});

test('plan (signed out): real page with nav, footer, and the empty state', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/plan');
  await expect(page.getByText('No roadmap yet')).toBeVisible();
  await expect(page.getByText(/Guidance only — not legal or tax advice/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('how-it-works and the unlisted blog load', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/how-it-works');
  await expect(page).toHaveURL(/how-it-works/);
  await page.goto('/how-i-was-built');
  await expect(page.getByText('How I was built')).toBeVisible();
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

test('robots.txt disallows the unlisted blog; sitemap route is gone', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Disallow: /how-i-was-built');
  const sitemap = await request.get('/_sitemap');
  expect(sitemap.status()).toBe(404);
});
