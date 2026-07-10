# Landing redesign — content spec + variant lab (2026-07-10)

**Status:** DECIDED — **variant C won** (user verdict 2026-07-10) and is promoted to `/`:
postcard hero (rotating photos restored) + the demo loop / proof / trust / final-CTA scroll,
fully localized (5 languages). `/how-it-works` redirects to `/`. Lab variants deleted; this doc
is the design record. Post-verdict tweaks: demo pane never empty (pre-populated, cumulative);
"You leave with this. 100% free. No catch."; trust section as a card grid.

**Goals (user, 2026-07-10):** 1) instant value comprehension · 2) primary CTA = the interview ·
3) unsure → sample plan · 4) scroll depth absorbs how-it-works for skeptics/curious · Guides stay
separate (SEO doorways + `?from=` context into the interview).

**Audience is bimodal** (funnel-proven: Reddit ~60% start→finish, LinkedIn 0/17): the first
viewport must let the convinced leave immediately AND give skeptics a reason to scroll.

**Measurement:** stamp `landing_version: 2` (same pattern as `interview_version`); the metric the
landing owns is home pageview → `interview_started`.

---

## Shared scroll skeleton (identical in all variants; only the hero differs)

### S2 — How it works = THE DEMO (the new asset: the mechanism is watchable now)
- Title: **"Watch a roadmap build itself."**
- A looping, scripted two-pane demo (~15s, no LLM, no engine calls — hardcoded beats with REAL
  step titles/dates so it's honest):
  - Beat 1: Lola "When are you hoping to arrive?" → "January 2027" → 3 dated steps slide in, "+3 steps"
  - Beat 2: "What passports does your household hold?" → "We're both Canadian" → visa cluster lands, "+9 steps"
  - Beat 3: "Any children coming with you?" → "Yes — two" → school step lands, counter reads "27 steps · dated · sourced"
  - Reset, loop.
- Under it, the old page's three steps compressed to one line each:
  **Tell Lola your situation → Get your personal roadmap → Work through it together** (weekly
  email keeps what's due in view).

### S3 — Proof: "You leave with this."
- A mini sample roadmap card: 4 REAL steps + dates (live `buildPlan(sampleProfile())`, never stale).
- Caption: "This is Susan & Tom's — retirees heading for the non-lucrative visa. Yours will be yours."
- CTA: **Open the full sample roadmap →** (G3 promoted from consolation link to proof block).

### S4 — What it covers
- The six capability cards compressed to a tight band (Where to live · Visa & immigration ·
  Schools · Work & remote income · Banking · Bureaucracy-in-order).
- One quiet line: "Explore all 60 free guides →" (the ONLY guides mention on the page).

### S5 — Why trust it
- Every official step cites its government source (link one as an example).
- Honest by construction: the app can't invent numbers or deadlines — specifics live behind sources.
- Built in public → /how-i-was-built.
- Free, cookieless, no account to start.

### S6 — Final CTA
- "Ready? Lola's first question is waiting." **[Build my free roadmap →]** · sample link repeat.

---

## Hero variants (the theory each one tests)

### A — The Conversation (`/home-a`) — *the product is the pitch*
- One framing line: "Moving to Spain? Lola builds your roadmap while you talk."
- Lola's REAL opener bubble + coarse chips (This year / Next year / Just exploring) → tap lands
  in the interview. Zero-friction start; weakest cold-traffic comprehension; app-like homepage
  is a worse SEO surface. A/B candidate later, not a blind launch.
- NOTE for a real launch: coarse chips should prefill/skip the arrival question — lab version
  just deep-links to /interview.

### B — The Living Roadmap (`/home-b`) — *show the aha, not the claim*
- Split hero: promise + CTAs left, the S2 demo loop promoted INTO the hero right.
- Strongest single-viewport G1+G4; costs the Spain-photo warmth; hero motion must be excellent
  or it's noise. S2 below becomes just the three compressed steps (no double demo).

### C — The Postcard, deepened (`/home-c`) — **recommended frame**
- Today's emotional hero kept (rotating Spain photos, warm headline), with one addition: a scroll
  cue ("Not sure yet? Watch it work ↓") tying the hero to the demo below.
- Copy upgrade: H1 "Your move to Spain, planned in one conversation." — verbs the differentiator
  (alt kept: current "Your personalized roadmap for moving to Spain.").
- Emotion opens the door; the demo one scroll down converts skeptics where they actually are.

### D — Proof First (`/home-d`) — *people buy the deliverable, not the chat*
- Hero object = the S3 mini-roadmap card, headline "Leave with this. It takes about three minutes."
- Interview CTA directly beneath; full-sample link on the card.
- Strongest for skeptics + guide/SEO arrivals; risks reading as a static checklist (undersells
  the living quality); weakest emotional pull.

## Promotion checklist (winner only)
1. Replace `app/index.tsx` hero + append skeleton sections; delete the three losers + this lab.
2. Localize all copy (5 locales), i18n digit-lint (spell out "three minutes").
3. `/how-it-works` → redirect to `/#how-it-works`; update Seo/canonical + sitemap.
4. `landing_version: 2` super-property; watch home→interview_started on dashboard 808581.
5. E2E: update smoke home test if hero copy/CTA changes; homework pages row; TEST-COVERAGE.
