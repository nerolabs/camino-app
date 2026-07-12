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
  await expect(page.getByText(/when are you planning to arrive/i)).toBeVisible();
  // One real /api/lola round-trip: answer the date; the next question (Spanish level) should
  // arrive with its chips. Give the extraction + the reaction race room.
  const composer = page.getByPlaceholder(/type your answer/i);
  await composer.fill('January 2028');
  await composer.press('Enter');
  await expect(page.getByText(/your Spanish/i).last()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('None yet')).toBeVisible();
  expect(errors).toEqual([]);
});

test('arriving from a guide page personalizes the greeting (regression 2026-07-10)', async ({ page }) => {
  // The guide CTA carries ?from=<guide-id>; the greeting must name the guide. This context
  // silently vanished once before, when the LLM opener became static copy — hence this test.
  const errors = trackErrors(page);
  await page.goto('/interview?from=choose-visa-type');
  await expect(page.getByText(/I see you've been reading about/i)).toBeVisible();
  await expect(page.getByText(/when are you planning to arrive/i)).toBeVisible();
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
  // how-it-works folded into the landing page (2026-07-10): the old URL redirects home,
  // where the content now lives as the live demo section.
  await page.goto('/how-it-works');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Watch a roadmap build itself.')).toBeVisible();
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

test('contact page renders; Report-a-problem deep link pre-selects the topic', async ({ page }) => {
  // The hamburger's "Report a problem" rides /contact?topic=problem (2026-07-11). The page
  // must render the topic chips and honor the pre-selection. RN-Web doesn't surface
  // accessibilityState.selected as aria-selected on buttons, so assert what the user sees:
  // the selected chip carries the cobalt fill (#2B5AA3), the others the neutral one.
  const errors = trackErrors(page);
  await page.goto('/contact?topic=problem');
  await expect(page.getByText('Contact us')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Report a problem' })).toHaveCSS('background-color', 'rgb(43, 90, 163)');
  await expect(page.getByRole('button', { name: 'General', exact: true })).not.toHaveCSS('background-color', 'rgb(43, 90, 163)');
  await expect(page.getByPlaceholder(/write your message/i)).toBeVisible();
  expect(errors).toEqual([]);
});

test('changelog page renders entries + guide stamps carry the verified date', async ({ page }) => {
  // The trust surface (2026-07-12): /changelog lists dated corrections, and every guide
  // page stamps when its facts were last checked, linking back here.
  const errors = trackErrors(page);
  await page.goto('/changelog');
  await expect(page.getByText('RULES CHANGE. WE SAY SO.')).toBeVisible();
  await expect(page.getByText('Consulate appointment step neutralized')).toBeVisible();
  await page.goto('/guide/empadronamiento');
  await expect(page.getByText(/Last verified/)).toBeVisible();
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
