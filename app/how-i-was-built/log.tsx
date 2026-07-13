import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { palette } from '@/constants/Colors';
import { openExternal } from '@/lib/plan-format';
import Seo from '@/components/Seo';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// "Show our homework" — the receipts behind the essay at /how-i-was-built. Every roadmap item in
// the order we actually took the work on, with what shipped and the decisions that shaped it.
// Public since 3 Jul 2026 (user decision): linked from the nav menu and in the sitemap.
// Sourced from TODO.md's completed items + the git history, so it stays honest.

type Row = { feature: string; date: string; work: string; decisions: string[] };

const ROWS: Row[] = [
  {
    feature: 'The walking skeleton',
    date: '30 Jun 2026',
    work: 'A deterministic plan engine (~7 obligations), a catalog-derived interview, Lola\'s persona prompt, and a report prototype — the whole pipeline end to end before any real app existed.',
    decisions: [
      'Model obligations, not journeys: ~100 finite atomic units generate the thousands of individual journeys for free.',
      'Four invariants written down before features: deterministic engine, catalog-derived interview, Lola never invents facts, plan = pure function of profile.',
      'The LLM gets exactly two bounded surfaces (phrase a question, extract an answer). Everything load-bearing is boring, testable code.',
    ],
  },
  {
    feature: 'The Expo app + auth + storage',
    date: '1 Jul 2026',
    work: 'Expo Router app targeting web, iOS, and Android from one codebase; Supabase Google sign-in; profiles saved per-user under RLS.',
    decisions: [
      'One codebase, three platforms — platform differences isolated into .native.ts twin modules Metro resolves automatically.',
      'Separate staging and production Supabase databases so a test can never touch a real user\'s data.',
    ],
  },
  {
    feature: 'Server-side LLM proxy',
    date: '1 Jul 2026',
    work: 'All Anthropic calls moved behind /api/lola (Expo API route on the hosting platform\'s Workers runtime); the client bundle no longer contains any key.',
    decisions: [
      'Secrets live only in server env vars — a browser bundle is public by definition.',
      'Layered, fail-open hardening: payload caps are the real enforcement; origin checks and per-IP limits are extra layers that never lock out legitimate users.',
    ],
  },
  {
    feature: 'Catalog expansion by webinar mining',
    date: '2 Jul 2026',
    work: 'Fifteen relocation-webinar transcripts mined by five parallel agents; the catalog grew from ~20 to 54 obligations across tax, property, visas, healthcare, and citizenship.',
    decisions: [
      'Every obligation carries a provenance tag from day one, enforced by the type system.',
      'Anything we couldn\'t ground was pulled to a backlog rather than shipped on vibes — invented precision (fake form numbers, made-up deadlines) got stripped.',
    ],
  },
  {
    feature: 'The living plan',
    date: '2 Jul 2026',
    work: 'Mark steps done (today or back-dated); completions re-anchor downstream deadlines to what actually happened; a free-text "something changed" box re-plans deterministically.',
    decisions: [
      'Progress is just more profile input — the engine stays a pure function.',
      'The LLM translates free text into a profile-field delta ONLY; the diff users see is computed deterministically, never narrated from imagination.',
    ],
  },
  {
    feature: 'Deploy pipeline + environments',
    date: '1 Jul 2026',
    work: 'EAS Hosting with development / staging / production environments, a custom domain, and a deploy script that pulls each environment\'s vars and clears bundler caches.',
    decisions: [
      'One early build silently baked the staging database into production — the fix became a permanent guard: the deploy script sources the pulled env, wipes caches, and prints exactly what it baked.',
      'Infrastructure came after the product had earned it, then all at once.',
    ],
  },
  {
    feature: 'iOS to TestFlight',
    date: '1 Jul 2026',
    work: 'Native builds through EAS with an App Store Connect API key (fully non-interactive), through review rejections to installable TestFlight builds; native Google sign-in, dictation, and Dynamic Island safe-areas verified on device.',
    decisions: [
      'Machine-drivable release infrastructure over click-ops: the API key lets any session cut a build.',
      'Fix rejections at the root (an unused library referencing the photo roll was removed, not excused).',
    ],
  },
  {
    feature: 'Staff tooling & gating',
    date: '2 Jul 2026',
    work: 'Dev test personas and internal cross-check links, first gated by environment + a user-id allowlist, later replaced by a server-owned is_staff flag on the profiles table.',
    decisions: [
      'Feature flags belong in the database, not hardcoded into client bundles — extended testers get access with one SQL update.',
      'The client can never write its own staff flag; column-level grants enforce it.',
    ],
  },
  {
    feature: 'Brand into product',
    date: '2 Jul 2026',
    work: 'The azulejo compass-star became the app icon set (iOS, adaptive Android, splash, favicon), generated from a single SVG by a script.',
    decisions: [
      'One source of truth, regenerated on demand — no hand-exported icon zoo.',
      'Apple rejects icons with alpha channels; the pipeline flattens automatically.',
    ],
  },
  {
    feature: 'Product analytics',
    date: '2 Jul 2026',
    work: 'PostHog on web and later native: a funnel from first visit through interview to roadmap, feature-health events, person profiles.',
    decisions: [
      'Every event stamped with its environment so our own testing never pollutes real usage.',
      'Local dev sends nothing — the key simply doesn\'t exist there.',
    ],
  },
  {
    feature: 'Lola\'s voice',
    date: '2 Jul 2026',
    work: 'ElevenLabs TTS behind /api/tts (key server-side), a warm Spanish-accented English voice, on by default, with a visible mute pill.',
    decisions: [
      'Two failed autoplay fixes are part of the record: browsers block audio without a user gesture. The real fix rides the gesture users already make ("Let\'s get started") to unlock a Web Audio context for the whole session.',
      'The sound control lives with the conversation, not in the reply composer — the composer is for composing.',
    ],
  },
  {
    feature: 'Official sourcing & the source taxonomy',
    date: '2 Jul 2026',
    work: 'Every webinar-derived claim researched against government sources; corrections applied (regional tax ranges, renewal windows, a voluntary-not-mandatory registry); the taxonomy simplified to official | recommendation.',
    decisions: [
      'A tag is not a citation — "official" ultimately came to require a canonical URL the user can check.',
      'Six items stayed honest recommendations rather than being dressed up as law.',
      'Webinar links were kept as staff-only cross-checks with timestamps — ideation material, not user-facing truth.',
    ],
  },
  {
    feature: 'Observability',
    date: '2 Jul 2026',
    work: 'Sentry across web, the API routes, and native iOS — one project tagged by platform and environment — plus an uptime monitor that pages on downtime, and daily budget caps on the paid API routes.',
    decisions: [
      'One Sentry project with tags beats three projects to manage.',
      'The Workers runtime fits no Sentry SDK, so the API routes send minimal envelopes by hand — a smaller correct thing over a bigger wrong one.',
    ],
  },
  {
    feature: 'Native parity',
    date: '2 Jul 2026',
    work: 'Three TestFlight builds brought iOS level with web: spoken Lola (expo-audio streaming a GET variant of the TTS route), native crash reporting with readable stack traces, native analytics.',
    decisions: [
      'Each build verified on a real device before being called done.',
      'Android deliberately deferred to the very end — no test device, no pretend testing.',
    ],
  },
  {
    feature: 'Citizenship vs. renewal — asking instead of assuming',
    date: '2 Jul 2026',
    work: 'A new interview question (do you hope to become a citizen, or keep renewing residence?) now gates the entire citizenship track; a second new question gates the scouting trip to people still choosing a region.',
    decisions: [
      'The engine had silently assumed everyone naturalises — a big assumption belongs to the user, deterministically, not to the catalog.',
    ],
  },
  {
    feature: 'The cold-eyed audit',
    date: '3 Jul 2026',
    work: 'A full fresh-eyes review of architecture, catalog, and interview found real bugs: a language-exam rule mishandling Filipino applicants, two interview answers collected but never read, the drift-check invariant living in dead code, and 28 "official" items with no citation attached.',
    decisions: [
      'Auditing your own product is scheduled work, not luck.',
      'Every fix shipped with a regression persona so it can\'t silently regress.',
      'The invariant checker was revived as a script that gates every deploy.',
    ],
  },
  {
    feature: 'The re-verification pass',
    date: '3 Jul 2026',
    work: 'All 28 uncited official obligations re-verified one by one against their issuing authorities (tax agency procedure pages, ministry information sheets, the BOE, the DGT, the Instituto Cervantes) and given canonical links; a missing EU-registration obligation was discovered and added.',
    decisions: [
      'The catalog reached 60 obligations: 55 official — every single one citable — and 5 honest recommendations.',
      'The audit\'s persona check exposed the EU gap: an empty plan is a finding, not a nuisance.',
    ],
  },
  {
    feature: 'The test suite & CI',
    date: '3 Jul 2026',
    work: 'A deterministic engine suite (15 tests, ~140 ms) runs in CI on every push and inside the deploy gate; API contract tests and a Playwright smoke suite run against the deployed staging site.',
    decisions: [
      'Fast, offline, deterministic tests gate deploys; anything paid or networked is opt-in so CI never burns tokens.',
      'The audit-fix regressions ARE the test fixtures — personas double as executable documentation.',
    ],
  },
  {
    feature: 'The sample plan',
    date: '3 Jul 2026',
    work: 'A public, read-only roadmap for a fictional couple — built by the real engine on a canned profile — with tap-to-expand deterministic detail and interview CTAs.',
    decisions: [
      'Show the payoff before asking for the interview\'s effort.',
      'The sample\'s arrival date floats months ahead so its deadlines never look stale.',
      'The LLM coach stays off the public page — a free anonymous LLM endpoint is an abuse surface, and the plan isn\'t the visitor\'s to edit. The expanded card teases what the real thing does instead.',
    ],
  },
  {
    feature: 'Sign in with Apple',
    date: '3 Jul 2026',
    work: 'The official Apple button on iOS, exchanging Apple\'s identity token directly for a session — no password, no web redirect. Three failed builds taught us Apple\'s provisioning model the hard way.',
    decisions: [
      'Provisioning profiles are immutable snapshots of capabilities — enabling a capability means re-minting the profile, not editing it. The playbook is now written down.',
      'The native token flow needs no Apple client secret — fewer credentials to hold is a feature.',
    ],
  },
  {
    feature: 'Overdue, honestly',
    date: '3 Jul 2026',
    work: 'Steps past their due date now say so in red — on the card, in the stats, and in the step sheet, which nudges: mark it done with the real date, or tell Lola what changed and the plan re-flows.',
    decisions: [
      'One deterministic predicate defines "overdue" everywhere — the roadmap today, the weekly email next.',
      'Due today is NOT overdue — you get until midnight before anything turns red.',
    ],
  },
  {
    feature: 'The keyboard, third time',
    date: '3 Jul 2026',
    work: 'The interview composer clipped behind the iOS keyboard through two attempted fixes. The framework\'s keyboard-avoidance component was removed entirely, replaced by a hook that pads by the exact overlap the OS reports.',
    decisions: [
      'When a framework abstraction guesses geometry and guesses wrong twice, stop tuning it — use the number the OS actually gives you.',
      'The two failed fixes stay in the record: that\'s what "verified on device" is for.',
    ],
  },
  {
    feature: 'A calmer nav',
    date: '3 Jul 2026',
    work: 'Signing in became one link that opens a dialog (Apple + Google, email next); narrow screens got a hamburger menu holding the browse links, leaving the bar to the two actions that matter.',
    decisions: [
      'Actions live on the bar, browsing lives in the menu — and future content sections have a home waiting.',
      'The split is viewport-width, not platform: an iPad earns the full bar, a narrow desktop window earns the burger.',
    ],
  },
  {
    feature: 'The email loop, part one',
    date: '3 Jul 2026',
    work: 'Passwordless sign-in (magic link + one-time code) joined the dialog; a signed-out roadmap can be emailed to yourself — which quietly creates your account, with the roadmap riding along; a welcome email greets new users; and a weekly roundup engine (overdue + upcoming, capped at five, deterministic per-item tips) waits on its cron.',
    decisions: [
      'Email over app-store notifications as the retention loop: everyone has an inbox, and every email doubles as a no-password door back into the roadmap.',
      'The roundup is a pure function of the profile — the same engine math as the roadmap, so the email can never disagree with the app.',
      'Nothing pressing this week → no email. A roundup with nothing to say is spam.',
      'Sending is Resend on our own domain; all bookkeeping (welcomed, nudged, opted out) lives in auth metadata, so no schema migration.',
    ],
  },
  {
    feature: 'The public roadmap',
    date: '3 Jul 2026',
    work: 'This section gained a third page: the product roadmap, updated with every release — shipped, in progress, next, and the things we\'ve said no to.',
    decisions: [
      'Saying no is part of the roadmap: no document vault (we refuse to be a honeypot for passports), no second country yet, no features on spec.',
      'Updating it every release is a standing rule, written into the repo\'s instructions.',
    ],
  },
  {
    feature: 'The email loop, live',
    date: '3 Jul 2026',
    work: 'The welcome email and weekly roundup went live end-to-end: server keys landed, both environments redeployed, a real weekly run fired from the scheduler, and real emails read in a real inbox. The live test caught two bugs no unit test saw: email links leaked the hosting platform\'s per-deploy URL instead of getcamino.app, and one sign-in sent the welcome email three times.',
    decisions: [
      'Test the loop by receiving the email, not by reading the code — both bugs were only visible in an actual inbox.',
      'Links in emails come from one canonical per-environment origin, never from the request URL a proxy hands you.',
      'The triple-send was two races stacked: the client now fires the welcome request once per sign-in, and the server claims the "already welcomed" flag before sending, rolling it back if the send fails.',
    ],
  },
  {
    feature: 'Sixty free guides',
    date: '3 Jul 2026',
    work: 'Every catalog obligation got a public page (/guide/<id>): when it\'s due, why it matters, what comes first, the official source, and a category tip — plus a grouped index, prerendered HTML titles and descriptions for search engines, and a sitemap. The nav also unified: desktop now gets the same ☰ menu as mobile, with Sign out inside.',
    decisions: [
      'The catalog is the single source: pages are generated from the same data the engine plans with, so a guide can never disagree with a roadmap.',
      'Timing is described as the RULE ("due within 30 days of arrival"), never a fabricated date — personal dates only exist in a real roadmap, which is what the page\'s CTA is for.',
      'The sitemap is generated from the catalog too — adding an obligation automatically adds its page to search.',
      'The unlisted "how I was built" section stays out of search; the guides are the front door.',
    ],
  },
  {
    feature: 'The "This week" view',
    date: '3 Jul 2026',
    work: 'The roadmap gained a second lens: a toggle that filters to just what needs attention now — what\'s slipped past, and what\'s due in the next seven days. A clear week gets an honest "nothing needs you this week", with the next dated step so you know what\'s coming.',
    decisions: [
      'It\'s a filter over the same deterministic plan, not a second plan — the buckets keep the dependency-safe order, never re-sorted by date.',
      'Due today is "this week", not overdue — the same midnight-grace rule as everywhere else, one predicate shared with the red treatment and the weekly email.',
      'Steps still waiting on a milestone (no honest date) are never shown as "next up" — no fabricated urgency.',
    ],
  },
  {
    feature: 'Family-testing fixes, round one',
    date: '3 Jul 2026',
    work: 'Real devices found what simulators don\'t: the emailed sign-in code is 8 digits but the app said — and silently truncated to — 6, so codes could never verify; and the step drawer wouldn\'t scroll on iOS, hiding Lola\'s answers.',
    decisions: [
      'Never hardcode another system\'s format: the code length is the auth provider\'s choice, so the app now accepts whatever arrives and the copy just says "one-time code".',
      'The drawer bug was a wrapper stealing the scroll gesture — the tap-to-close backdrop now sits behind the sheet instead of around it.',
    ],
  },
  {
    feature: 'Sign in with Apple, solved',
    date: '3 Jul 2026',
    work: 'A five-build mystery: Apple\'s own sign-in sheet rejected only this app, while every layer we could check was provably correct — the entitlement inside the signed binary, the App ID capability, fresh provisioning profiles, the auth provider config, active developer agreements. The failure lived in none of them: Apple\'s server-side provisioning for the App ID had gone stale. Toggling the capability off and back on forced a re-provision, and sign-in started working — even on the older builds.',
    decisions: [
      'Eliminate by evidence, not vibes: each layer was verified with an artifact (the IPA\'s own entitlements, the portal config, the agreement dates) before moving to the next.',
      'The decisive clue was that an OLD build started working the moment the capability was re-provisioned — proof the broken state lived on Apple\'s servers, not in anything we shipped.',
      'When every checkable layer is correct and the platform still fails, re-provision before you rewrite.',
    ],
  },
  {
    feature: 'The homework goes public + links that open the app',
    date: '3 Jul 2026',
    work: 'This whole section — the essay, this log, the roadmap — left the unlisted shadows: it\'s in the nav menu and the sitemap now, and every entry carries its ship date. And the links in Get Camino\'s emails gained universal links, so tapping "Open your roadmap" on an iPhone opens the app (signed in) instead of a logged-out browser tab.',
    decisions: [
      'Building in the open was already the point — hiding the receipts behind a direct link stopped making sense once the guides made content the front door.',
      'Dates on every entry keep the log honest about pace: this product went from empty repo to sixty guides in four days, and the record should show it.',
      'Universal links are configuration, not code: an entitlement plus a JSON file the domain serves — and Apple caches that file on install, so it only kicks in from the next build.',
    ],
  },
  {
    feature: 'The printable roadmap + a way to talk back',
    date: '3 Jul 2026',
    work: 'The roadmap became a report: one tap renders a clean, print-ready PDF — hero next step, estimated vs firm dates, dateless steps that say what they\'re waiting for, official source URLs printed for the gestor. And a "Report a problem" line joined the menu: one text box, straight to the team inbox with platform, version and route attached. iPad support switched off for the first release.',
    decisions: [
      'The report is a pure function of the plan (the fourth thesis piece, finally shipped) — same honesty rules as the app: estimated says estimated, waiting says waiting, nothing invented.',
      'One HTML generator serves both platforms: the browser\'s own print dialog on web, a real shared PDF file on iOS — no PDF library shipped to anyone.',
      'Feedback goes to email, not a dashboard: at family-testing scale, the inbox IS the triage queue, and the recipient is hardcoded so the route can\'t be abused as a mail relay.',
      'iPad off for launch: fewer screenshots, fewer review surfaces, nothing the phone experience doesn\'t already prove.',
    ],
  },
  {
    feature: 'Polish pass: the front door catches up',
    date: '3 Jul 2026',
    work: 'The home and how-it-works pages predated almost everything shipped this week. Now: every public page has a real title, description and canonical URL (only the guides had them); how-it-works finally ends with a call to action, mentions the weekly email and the sourced guides, and uses the shared footer; the home topic strip links into the sixty guides it was always describing.',
    decisions: [
      'A page that explains everything and asks for nothing is a leak — every marketing page now ends with the same honest CTA.',
      'One shared breakpoint hook replaced two copies of a subtle hydration workaround — the second copy had the bug the first one fixed.',
      'The deploy script now strips iCloud conflict-copy directories from the export: one deploy silently shipped stale pages while the local build was correct.',
    ],
  },
  {
    feature: 'Family-testing fixes, round two',
    date: '4 Jul 2026',
    work: 'A second phone found four more: the feedback spinner could run minutes after the report had already arrived (the response stalls on some networks; a grace period now thanks you once the send is safely away); the step drawer\'s inputs hid under the keyboard (it now slides above it by the exact overlap the OS reports); Lola claimed to have "remodelled your plan" when nothing had moved (a no-op re-plan now says so honestly, and appointment dates are steered to "mark done on a date"); and the nav bar wrapped into two lines at larger iOS text sizes (bar labels now cap their scaling — menu items still scale fully).',
    decisions: [
      'Same phone model, different bug: accessibility text size is a device dimension of its own — test with it.',
      'Never let a celebration outrun the diff: "I\'ve remodelled your plan" is only said when a date actually moved.',
      'When the work is provably done but the network is slow to say so, thank the user and stop the spinner — and count how often it happens.',
    ],
  },
  {
    feature: 'The guides learn to talk',
    date: '4 Jul 2026',
    work: 'All sixty guide pages gained a written explainer — what the step actually is, how the process feels, who\'s involved — in Get Camino\'s voice. Each page\'s search snippet now uses its own opening sentence instead of a shared template.',
    decisions: [
      'The honesty rule became a build gate: a test fails if the prose contains any number that isn\'t already in that step\'s own title — new figures and deadlines can only live behind the official source link.',
      'The lint caught its first violation before shipping (a cross-referenced form number) — the mechanism works.',
      'Narrative explains, data asserts: prose adds context and texture, while every checkable fact stays in the catalog where the audit can see it.',
    ],
  },
  {
    feature: 'Family-testing fixes, round three',
    date: '4 Jul 2026',
    work: 'A former QA engineer joined the testing and it shows: Lola\'s voice dropped to phone-call volume after the first line (the microphone session was rerouting audio to the earpiece — playback now reclaims the loud speaker every time); a clarifying question mid-interview got a canned "sorry, didn\'t catch that" (Lola now answers what you asked, then re-asks — still forbidden from stating legal facts there); "on a date" became "did it earlier? add the date" with a forgiving date field that reads "25 April 2026", Spanish months, and "yesterday" — and shows you what it understood before saving; and the printable report got print-safe contrast and real page margins.',
    decisions: [
      'Date entry is a parser, not an AI: instant, offline, and incapable of hallucinating — and when input is genuinely ambiguous (04/05/2026) it asks rather than guesses.',
      'The conversational interview keeps the honesty wall: Lola can explain what a question means, never what the law says — that lives in the sourced roadmap.',
      'Print is its own medium: colors that read on a screen wash out on paper, and iOS ignores CSS page margins entirely — the report now carries both itself.',
    ],
  },
  {
    feature: 'The boring pages that make a real product',
    date: '4 Jul 2026',
    work: 'Privacy policy, terms of use, and aviso legal — plain language, linked from every footer. Delete my account, in the menu: one warning, one tap, immediate and permanent (tested live, start to finish). And web analytics went cookieless, so there\'s no consent banner because there\'s nothing to consent to.',
    decisions: [
      'Account deletion is both Apple\'s requirement and the GDPR\'s right to erasure — one honest implementation serves both: hard delete, no grace period, no dark patterns to keep you.',
      'No cookie banner by design: analytics that persist nothing client-side beat a banner everyone resents.',
      'Legal pages follow the homework-page rule: if a data flow changes, the privacy page changes in the same PR.',
    ],
  },
  {
    feature: 'Links that dress well',
    date: '4 Jul 2026',
    work: 'Every public page now unfurls properly when shared: a branded card (the compass-star tile, the promise, the domain) plus per-page social titles and descriptions. One Seo component owns the whole tag set, so no page can ship half of it.',
    decisions: [
      'Get Camino\'s links will live in WhatsApp threads and expat Facebook groups — a bare gray link and a branded card are different products there.',
      'The share card is generated from the same brand-mark code as the app icons: one geometry, every surface.',
    ],
  },
  {
    feature: 'Polish: structured data, a smarter front door, and quieter motion',
    date: '4 Jul 2026',
    work: 'Search engines now get structured data (article + breadcrumbs on every guide, the full catalog as a list, the site itself); arriving at the interview from a guide gets acknowledged ("so glad you\'re looking into getting your NIE sorted") before the first question; and an accessibility pass landed — the rotating home photo rests when your system prefers reduced motion, controls carry proper roles and labels, and inputs are named for screen readers.',
    decisions: [
      'The interview greeting may acknowledge WHERE you came from, never facts about the topic — phrasing is the only surface the model owns.',
      'Per-deploy preview URLs are now first-class origins for our own APIs: the hardening was blocking our own pre-production verification.',
    ],
  },
  {
    feature: 'The plan learns geography',
    date: '4 Jul 2026',
    work: 'Spain isn\'t one rulebook: transfer tax, wealth tax, school admission windows and property tax all vary by comunidad autónoma. The interview now asks where you\'re settling (name a city and Lola places it in its region), and every region-varying step says so — on your roadmap, in the guides, and on the printed report — naming your region when it\'s known.',
    decisions: [
      'Honest v1: the plan KNOWS your region and flags what varies there. Shipping 17 regions of rates without per-region official sources would break the no-invented-facts rule — that\'s a sourced content pass, now queued.',
      '"Not sure yet" is a first-class answer: undecided movers get the scouting step and generic flags, not a forced guess.',
    ],
  },
  {
    feature: 'The robots test the app now',
    date: '4 Jul 2026',
    work: 'End-to-end tests grew up: the web suite now signs in as a seeded test user (through the real magic-link machinery, no inbox involved) and walks the journeys that matter — saved roadmap, the week view, mark-done and undo, the no-op honesty gate, sign out. Twelve tests, twelve seconds, against the live staging site. Native flows are written for the iOS simulator and run on a free CI runner with zero build credits. First catch, before it even finished: a React hydration error firing on every page load (the nav wordmark rendered differently on server and client).',
    decisions: [
      'Tests sign in through the same code path real magic links use — a test-only backdoor would test the backdoor.',
      'The test user lives ONLY in staging, and the seed script hard-refuses to run against production.',
      'Runs are manual + pre-release, not per-push: each one spends real LLM calls, and our own rate limits apply to us too.',
    ],
  },
  {
    feature: 'A spinner is a moment, not a destination',
    date: '4 Jul 2026',
    work: 'Family testing round five, all fixed: the app could cold-start into an eternal "Loading your roadmap…" (it now knows when there\'s nothing to load and takes you home); an interview answer could spin forever if the network hung (35-second limit, then Lola owns it and your answer is back in the box to resend); the microphone cue now appears when the mic is actually hot — so fast talkers stop losing their first words — and tapping it off keeps your last words instead of discarding them; and the answer box grows again as you dictate.',
    decisions: [
      'Every waiting state needs an exit: a timeout, a fallback, or a redirect — nothing may wait forever.',
      'Two ways to end dictation, deliberately: mic-off KEEPS the recognizer\'s final flush (your last words); send DISCARDS it (it would refill the box that just cleared).',
    ],
  },
  {
    feature: 'Keyboard focus you can see',
    date: '4 Jul 2026',
    work: 'Tab through any page and an amber ring — the brand\'s waypoint color — shows exactly where you are. Keyboard users get the ring; mouse and touch clicks don\'t.',
    decisions: [
      'Amber over cobalt: the one brand color that reads on both the cream background and the dark indigo bands.',
      ':focus-visible, not :focus — a11y for keyboard users shouldn\'t add visual noise for everyone else.',
    ],
  },
  {
    feature: 'The paid endpoints learned to say no',
    date: '4 Jul 2026',
    work: 'The two endpoints that cost real money per call — Lola\'s brain and Lola\'s voice — now carry real volume limits: a per-visitor per-minute cap and a global daily budget each, counted durably in the database. The in-memory counters they replace reset whenever the platform recycled a worker (a 70-request burst produced zero throttles); the new ones trip at exactly their limit, verified live. Cross-site browsers are locked out too: the platform\'s default wide-open CORS answer is replaced with a strict one pinned to our own origins.',
    decisions: [
      'Fail open, bounded in dollars: if the counter database hiccups, users keep working — and provider spend caps bound the worst case. Availability first at this scale.',
      'Only requests that would actually reach the paid provider consume budget — malformed junk can\'t starve the day\'s capacity.',
      'Measured before believing: the platform rewrites the Origin header and quietly recycles in-memory state, so every layer was burst-tested against the real runtime, not the docs.',
    ],
  },
  {
    feature: 'The microphone and Lola learn turn-taking',
    date: '4 Jul 2026',
    work: 'Family testing round four (build 27) nailed the last voice bug with a precise diagnosis: earlier builds only DUCKED Lola\'s voice while the mic was open — and never released the duck, so everything after went quiet. Build 27 fixed the volume but left her talking over you. Now it\'s explicit turn-taking: opening the mic cuts her line outright, and every later line plays at full volume. Also fixed: your spoken answer no longer reappears in the next question\'s box (the recognizer flushes one last result after it\'s told to stop — that flush was refilling the input the send had just cleared).',
    decisions: [
      'Replace audio-session side-effects with explicit app-level behavior: "mic opens → Lola stops" is one deterministic line, not a hardware mode.',
      'Treat late recognizer events as stale by default — a gate flips before the engine is told to stop, on both web and iOS.',
    ],
  },
  {
    feature: 'A safer name: Get Camino',
    date: '4 Jul 2026',
    work: '"Camino" is a lovely word — which is exactly the problem: plenty of businesses already want a piece of it. Until a proper trademark search happens, the app and site go by Get Camino (matching the domain we already own), extended brand "Get Camino: Your Road to Spain" — which happens to fit the App Store\'s 30-character name limit exactly. Every user-facing surface renamed: the name under the icon, the nav, the emails, the printed report, the legal pages, and how Lola introduces the product.',
    decisions: [
      'Brand defensively before brand spend: a distinctive compound beats a common word you\'d have to fight for.',
      'Identifiers never chase brands: the bundle id, URL scheme, and internal names stay put — a rename should never break sign-in or saved links.',
    ],
  },
  {
    feature: 'Every official source link, click-tested',
    date: '4 Jul 2026',
    work: 'All 55 official source links were fetched and checked against their steps — status, where they redirect, and whether the page is actually about the step. Two failed honestly: the empadronamiento link died when a government portal was retired (now points at the law itself, art. 15 of the Ley de Bases del Régimen Local), and the NIE link landed visitors on a police-site cookie wall instead of NIE content (now the Ministerio del Interior\'s canonical NIE page).',
    decisions: [
      'Trust content, not status codes: administracion.gob.es serves "Error" pages with HTTP 200, so every link was verified by its actual heading, not its response code.',
      'When a government info page is unstable, cite the law itself — BOE links outlive portal redesigns.',
    ],
  },
  {
    feature: 'How-it-works redesign + "the product roadmap"',
    date: '4 Jul 2026',
    work: 'The how-it-works page — untouched since the earliest days — got a layout pass: its sections ran edge-to-edge on desktop while every other page reads in a centered column, so each section\'s content now sits in the same 760px column, and the bureaucracy card says what the plan just learned (rules that differ by comunidad are flagged). This page was also renamed "the product roadmap".',
    decisions: [
      'Full-bleed section backgrounds stay — only the content inside is constrained. The rhythm of alternating bands is the page\'s structure; the fix was readability, not a rebuild.',
      'Renamed to differentiate: "roadmap" is what Get Camino builds FOR YOU in the product; "the product roadmap" is where the product itself is going.',
    ],
  },
  {
    feature: 'A real inbox and a real operator',
    date: '4 Jul 2026',
    work: 'The product stopped using a personal Gmail: feedback@, privacy@ and legal@getcamino.app now route reports and rights requests (delivery tested end-to-end), and the legal pages name the actual operator — AELaboratories, Inc — with governing law updated to match its state. The path to a formal company is deliberately deferred: sole proprietorship until there\'s a proven revenue model.',
    decisions: [
      'Purpose-named addresses over one generic inbox: where an email lands tells you what it is before you open it — and they all route to a single mailbox anyway.',
      'Incorporate when revenue proves the model, not before — the migration is mostly behind-the-scenes store agreements, so waiting costs little.',
    ],
  },
  {
    feature: 'The plan for Spanish',
    date: '4 Jul 2026',
    work: 'A moving-to-Spain product that only speaks English lacks authenticity — so localization moved from "someday" to before launch. The technical design is written and approved: Spanish first (verified by a native-speaking family member), then French, German and Italian as fill-in-the-blanks exercises on the same plumbing. The engine stays language-free; translation is purely presentation.',
    decisions: [
      'Invariant 3 extends to translations, mechanically: a translated step may never carry a number its English source doesn\'t — the digit-lint now guards every language.',
      'The language switcher is a feature, not a setting: each language listed in its own name, visible in the menu, because a Spanish speaker lost in an English UI can always find "Español".',
      'Lola says tú, not usted — warmth is her voice in every language. And "Get Camino" and "Lola" never translate.',
    ],
  },
  {
    feature: 'Take it with you (and get back to the top)',
    date: '4 Jul 2026',
    work: 'The home page now says where the app is headed: a quiet band announcing the iPhone and Android apps — honestly marked "coming soon," not a fake download badge for something you can\'t download yet. And long scrolls got a back-to-top button: on the roadmap, the sample plan, and the sixty-step guide list, a floating arrow appears once you\'ve scrolled a screen down and takes you home in one tap.',
    decisions: [
      'Honest placeholders over impressive-looking lies: no official store badge appears until there\'s a real listing behind it — swapping in the link is a one-line change when the apps ship.',
      'The back-to-top button respects reduced-motion: it jumps instantly instead of animating for anyone who\'s asked their device to calm down.',
    ],
  },
  {
    feature: 'The language plumbing (Spanish is coming)',
    date: '5 Jul 2026',
    work: 'Every button, question, and label in the app\'s core screens moved out of the code and into English string catalogs — the plumbing that lets the whole experience ship in Spanish next. A visible language choice now lives in the menu, and four automatic checks guard every future translation: no missing strings, no translation may ever change a number, placeholders must survive, and the names "Get Camino" and "Lola" stay exactly themselves in every language.',
    decisions: [
      'Prove the plumbing changed nothing: after the extraction, the app renders character-for-character identical — the whole test suite, the frozen plan snapshots, and the prerendered pages all agree.',
      'A translation may never change a number — the catalog\'s oldest rule now applies mechanically to every language file before it can ship.',
      'The language switcher is a feature, not a buried setting: it sits in the menu on every screen, and each language will be listed in its own tongue.',
    ],
  },
  {
    feature: 'Y luego, cuatro idiomas más: the web speaks five languages',
    date: '5 Jul 2026',
    work: 'The same afternoon Spanish shipped, the plumbing proved itself: French, German, and Italian followed — each with the full interview, all sixty step titles and sixty guide explainers, emails, and the printable roadmap. The web grew real per-language pages that search engines can find, every page telling crawlers about its four siblings. And a user question exposed a real gap, fixed the same hour: your language now follows you from the browser into your inbox, so the weekly email never speaks the wrong language.',
    decisions: [
      'One registry, every guardrail: a new language enrolls in all the automatic checks at once — number-preservation, completeness, brand names — or it can\'t ship at all.',
      'The deploy gate earned its keep: a routing change quietly broke every single-segment page on staging, the automated post-deploy tests caught it, and production was never exposed.',
      'German taught the brand rule a lesson: compound words like "Get-Camino-Roadmap" are natural German and still not allowed — the brand check caught them, and the sentences were rewritten around the name.',
      'Legal stays honest per language: Spanish has a reviewed courtesy translation; the newer languages say plainly, in their own words, that the legal pages are in English.',
    ],
  },
  {
    feature: 'Hablamos español',
    date: '5 Jul 2026',
    work: 'In one day, the whole product learned Spanish: Lola interviews in warm, informal Spanish; all sixty roadmap steps and their sixty written guides read natively; dates, emails, and the printable roadmap follow your language; the legal pages carry a faithful courtesy translation; and the sample roadmap belongs to Susana y Tomás. English users see a byte-identical product — proven by frozen snapshots that didn\'t change.',
    decisions: [
      'Tú, not usted — the user chose warmth, and Lola\'s Spanish is instructed to match, never formal.',
      'The engine never learned what a language is: which steps you get, their order, and every date are identical in every language — frozen plan snapshots prove it.',
      'Every legal number survives translation mechanically: the €28,800 threshold, form EX-15, the 90-day validity window — a lint fails the build if any translation changes a digit.',
      'Names belong to languages: each locale meets a sample couple with names native to it, and the brand "Get Camino" and "Lola" stay exactly themselves everywhere.',
      'Ship at 95% and verify in production: the Spanish is machine-drafted and mechanically linted, with a native-speaker pass running against the live site — corrections land as reviewable diffs.',
    ],
  },
  {
    feature: 'The fresh-eyes testing audit',
    date: '5 Jul 2026',
    work: 'Before translating the app into Spanish, every layer of testing was audited with fresh eyes: the coverage map verified against what actually runs, ten critical user paths given honest verdicts, and last week\'s under-pressure scoping decisions re-examined. Three new safety nets landed: live tests proving the interview already understands Spanish answers, pixel-exact snapshots of every email and the printable report, and API checks that now run on every staging deploy.',
    decisions: [
      'A gate that silently doesn\'t run isn\'t a gate: a deploy that can\'t run its test suite now fails loudly instead of shipping unchecked.',
      'The test-database guard became an allowlist — only the staging database may ever be seeded, rather than merely refusing the one known production one.',
      'Prove the hard part before the mechanical part: the interview demonstrably speaks Spanish before a single UI string is translated.',
      'Prior decisions were re-verified, not inherited — the trimmed native test flow and the excluded deep-link flow both survived scrutiny, with the tool version now pinned for reproducible runs.',
    ],
  },
  {
    feature: 'The bug-fix pass — and one that mattered',
    date: '5 Jul 2026',
    work: 'With five languages live and real family testing underway, a round of fixes: the sign-in code email now arrives in your language (it comes from a different system than the other emails and had been missed), the interview responds instantly when you switch languages mid-conversation instead of forcing a reload, and small wording polish across languages. The headline, though, was a silent one caught by an eagle-eyed look at the database: signed-in users\' saved roadmaps had quietly stopped persisting.',
    decisions: [
      'A well-meant security change caused it: locking down which columns a signed-in user may write accidentally blocked the exact save the app performs — and the failure had been swallowed in code, so it hid for days. The fix restored saving on the live databases, and now any save failure raises an alarm instead of vanishing.',
      'Tests can be blind in a specific way: the automated tests checked that the screen looked right, not that the database actually kept the data — so a save that silently failed still passed. The lesson is written down where the next person will see it.',
      'The clue was in the pattern: only older accounts had saved data, and they happened to be a single sign-in method. It looked like a sign-in bug; it was a timing coincidence around when the security change landed. Chasing the real cause beat trusting the obvious story.',
    ],
  },
  {
    feature: 'Five languages reach the iPhone',
    date: '5 Jul 2026',
    work: 'The web had spoken five languages for a day; now the iOS app does too. A new TestFlight build carried the localization work and the mid-interview language fix onto the phone, gated behind the full native release checks first — the simulator user-flows had to pass before a single build credit was spent. Verified on a real device: the interview switches languages mid-conversation, every menu item reads right in all five, and the English-only build story hides itself outside English.',
    decisions: [
      'The native end-to-end tests are a release gate, not a per-change checkpoint — they run before the build that ships, so the phone is never the place a regression is first seen.',
      'Build credits are spent deliberately: the gate goes green first, then one build, verified on device before it counts as done.',
    ],
  },
  {
    feature: 'The first strangers',
    date: '6 Jul 2026',
    work: 'The first public exposure: one plainly-disclosed post in a moving-to-Spain community, web only. About 1,200 views and two complete stranger journeys — first visit to finished roadmap — one in English, one in Spanish, zero user-facing errors. Hours later the post was auto-removed by the community\'s moderation machinery, the standard fate of anything reported as self-promotion. The overnight watch stood down; the always-on error and uptime alerts kept the site paged regardless.',
    decisions: [
      'Ask the moderators first: pre-approval is the only reliable immunity to report-driven removal — now the standing rule for every channel that follows.',
      'The funnel data outlived the post: it said the interview was the wall (the worst question was asked second, completion took twice the promise, most starters never finished) — and that verdict set the next week\'s agenda.',
      'A daily spending cap on the AI budget was raised deliberately ahead of traffic, with the provider\'s own hard limit kept as the real backstop.',
    ],
  },
  {
    feature: 'The interview becomes a living roadmap',
    date: '10 Jul 2026',
    work: 'The first strangers to use Get Camino told us — through the analytics, not in words — exactly where it lost them: the interview. The worst question was the second one asked, finishing took twice the promised time, and most people who started never saw a roadmap at all. So the interview was rebuilt around one idea: show the value while you answer, not after. Your roadmap now builds live beside the conversation — every answer visibly adds steps (on a phone, a step counter grows as you go). Most questions became single taps instead of typed sentences, every question now says why it\'s being asked, and the opener is the question every mover is already asking themselves: when? Fewer questions, too — an audit traced each one to the steps it unlocks, merged two pairs into single taps, and deleted one that turned out to feed nothing at all. And if you leave halfway, your progress now waits for you when you come back.',
    decisions: [
      'Every question must earn its place. The audit traced each question to the roadmap steps it decides; one had quietly been feeding nothing and was deleted, and the income question was kept only by giving it a real job — warning you, conservatively, when a plan looks short of a visa route\'s income requirement.',
      'Taps beat typing. Questions with fixed answers became buttons; the AI now works only where open answers genuinely need it — and "something else" is always one tap away when the buttons don\'t fit.',
      'Measurement has to survive the change it measures: every analytics event is now stamped with the interview version, because a redesign that also redefines its own metrics can tell itself any story it likes.',
    ],
  },
  {
    feature: 'The homepage learns to show, not tell',
    date: '10 Jul 2026',
    work: 'The homepage and the "how it works" page merged into one scrolling story — but not by guessing. Four different homepage philosophies were built as local prototypes and walked side by side: one where the page IS the first interview question, one that demos the product in the hero, one that leads with the finished roadmap, and one that keeps the postcard warmth of Spain up top with the demo one scroll below. The postcard won. The new page keeps the rotating photos, then shows a roadmap literally building itself as questions get answered, then the proof: a real sample roadmap and the promise that matters — 100% free, no catch.',
    decisions: [
      'Show, don\'t tell: the old page needed three paragraphs to explain the product; the new one plays a fifteen-second loop of it working. The redesigned interview made the mechanism watchable, so the marketing gets to stop describing.',
      'Emotion opens the door, mechanics close: people move to Spain with their hearts, so Spain stays above the fold and the machinery lives one scroll down — where the skeptics actually are.',
      'Variants were disposable by design: built outside version control, compared with real hands, and only the winner was ever committed.',
    ],
  },
  {
    feature: 'The night-feedback batch: Lola gets her charm back',
    date: '10 Jul 2026',
    work: 'An evening testing pass by the builder and his wife produced six findings, fixed the same night. The biggest: toning down Lola\'s reactions earlier that day had gone too far — she\'d stopped noticing things. Her reactions now see the whole conversation again, so she can connect your answers ("the whole family is coming, dog included"), while the hard rule stands: she may never state a fact, number, or deadline outside your sourced roadmap. Also: arriving from a guide page is acknowledged again ("I see you\'ve been reading about the padrón…"), the first question opens with the move itself instead of a clever framing, voice is now opt-in rather than on-by-default, a stale menu item went away, and the roadmap sheet no longer hides its close button under the iPhone\'s Dynamic Island.',
    decisions: [
      'Warmth needs memory: a reaction that can\'t see earlier answers can only be generic. The fix wasn\'t "write warmer prompts" — it was giving the bounded surface the transcript.',
      'Personalization without the LLM: the guide-page greeting is a deterministic template around a localized title — the charm of context, none of the variance.',
      'Voice flipped to opt-in: taps made turns fast enough that auto-playing audio read as noise, not warmth.',
    ],
  },
  {
    feature: 'Voice retired, a calmer finish, and a real contact page',
    date: '11 Jul 2026',
    work: 'A full fresh-eyes pass (Cristina) closed the week: Lola\'s spoken voice is gone entirely — opt-in wasn\'t enough; text-to-speech never fit the fast chip interview — while microphone dictation stays for those who need it. The marketing copy caught up ("a short interview", not "a conversation"). The interview\'s ending got its missing beat: your final note is acknowledged, then "Getting your roadmap ready — 3… 2… 1" hands over to the roadmap instead of an abrupt jump. The mic button now draws the standard dictation glyph instead of an emoji. And "Report a problem" grew into a proper Contact page — general questions, feedback, or problem reports, one form, linked from every footer.',
    decisions: [
      'Kill features by verdict, not sunk cost: TTS had server proxying, caching, and autoplay-unlock engineering behind it — and none of that argued against the observed experience.',
      'Endings deserve design: the countdown isn\'t decoration, it\'s the acknowledgment that the user just gave you their story and something is being built from it.',
      'One contact surface, topics not channels: the topic selector collapses server-side to a fixed list, so the email subject can never be attacker-chosen text.',
    ],
  },
  {
    feature: 'The engine audit: one night, fifteen findings, and a catalog that grew to 73',
    date: '13 Jul 2026',
    work: 'A real household using the product found what no test had: a Spanish passport holder offered the foreigner registration, a mixed household whose American spouse had no residence step at all. So the whole rule engine got audited in one sitting — every condition on every obligation, against a new tool that builds plans for 181 realistic profiles and checks class-level expectations. Fifteen findings; the fixes shipped the same night: the padrón no longer vanishes for movers still choosing housing, job seekers aren\'t routed to the no-work visa, short-stay tourists don\'t get the residence-visa roadmap, EU licences aren\'t sent to the driving exam, EU citizens can finally say they want citizenship. Then the audit\'s backlog: nine new officially-sourced steps (employer-sponsored work visas, self-employment, students, the Schengen clock, the EHIC — and the one-year citizenship fast-track for spouses of Spanish citizens), the driving-licence exchange list corrected against the DGT\'s own table, corporate tax gated behind one new question, and verified regional tax figures completed for every region on the map, foral territories included.',
    decisions: [
      'The audit\'s sharpest lesson: FOUR tests were found asserting bugs as correct behavior — including a persona modeled on the reporting household. Tests encode beliefs; the fix discipline now includes auditing the tests too.',
      'The verification habit paid three times in one pass: Valencia\'s transfer tax, Murcia\'s transfer tax, and Valencia\'s wealth exemption had all changed recently — official regional FAQs were stale on two of them; the law as published won.',
      'Every figure that couldn\'t be verified at the source stayed OUT: school windows (they move yearly) and municipal IBI rates show nothing rather than something secondhand.',
      'The matrix tool stays: 181 profiles × 16 expectations run on every future catalog change, so condition bugs of this class can\'t come back quietly.',
    ],
  },
  {
    feature: 'The final note learns to act — and removals speak up',
    date: '12 Jul 2026',
    work: 'The interview\'s closing "anything else I should know?" note is no longer just stored — it\'s distilled through the same bounded extractor as the roadmap\'s "something changed" box, so "the dog is coming too" adds the pet steps before you even reach your roadmap. Answers that simplify your plan now say so: a "−N steps — simpler for you" pill joins the "+N new steps" one, instead of steps vanishing silently. And a UK tester\'s flag fixed a US-centric step title: the consulate-appointment step no longer quotes US wait times to everyone — wait times vary widely by consulate, and the step now says exactly that, in all five languages.',
    decisions: [
      'Same bounded surface, new door: the note extractor emits typed profile fields only — the engine still authors every step and date, and a note that maps to nothing simply stays prose.',
      'Honesty cuts both ways: the live roadmap celebrated additions but hid removals; narrating "simpler for you" is the same truthfulness pointed the other direction.',
      'A soft, country-specific estimate had no place in a universal step title — the consulate\'s own booking page (the step\'s existing official source) is the truth, and the title now defers to it.',
    ],
  },
  {
    feature: 'The trust batch: changelog, verified stamps, share links, four sample lives, real regional rates',
    date: '12 Jul 2026',
    work: 'One afternoon, four features that had waited in the backlog. A public changelog now records every catalog correction, dated and in plain language — and every step carries a "last verified" date linking to it. Your roadmap became shareable: a read-only link that encodes your answers (never your notes) and renders through the same engine, no account needed. The sample plan became four sample lives — US retirees, a German family on the EU path, a Canadian digital nomad, a British couple who already own a home here. And the first verified regional figures shipped: real transfer-tax rates for the four biggest expat regions plus the Madrid/Andalucía wealth-tax reliefs, each checked that day on the region\'s own tax portal.',
    decisions: [
      'The verification pass paid for itself immediately: the Comunitat Valenciana had cut its transfer-tax rate from 10% to 9% six weeks earlier — most summaries on the internet still say 10%. That find is the changelog\'s first regional entry.',
      'Regional digits live in exactly one data file; every language interpolates the same values — a translation cannot change a number by construction.',
      'Share links are stateless on purpose: the plan is a pure function of the profile, so sharing the profile IS sharing the roadmap. No database, no revocation server — and the trade-offs are written down next to the code.',
      'What did NOT ship is recorded too: school-enrollment windows move every year, so they wait for their own verification pass rather than shipping secondhand.',
    ],
  },
  {
    feature: 'Submission-day hardening',
    date: '12 Jul 2026',
    work: 'The morning of the App Store submission, one more fresh-eyes pass — this time over everything around the app. The contact form got volume limits (a human files a few reports; a flood now gets turned away politely), and two small bugs in it were fixed before any user met them: iOS reports mislabeling themselves as web, and a signed-in visitor\'s email not pre-filling. The store screenshots were regenerated from a retake after the review caught one still showing the retired voice button. And the operational side got its own audit: every third-party service behind the app mapped into one document — who charges money, where the renewal notices go — so nothing expires in an unwatched inbox.',
    decisions: [
      'Guard anything that reaches a human inbox, not just anything that costs API money — the same durable counters now protect the feedback route.',
      'Rate limits run after validation, so malformed junk can never burn the budget legitimate users share.',
      'The working to-do list got the same treatment as the product: everything actionable above the fold, the done history frozen below it — a tracker you have to archaeology through is a tracker you stop trusting.',
    ],
  },
  {
    feature: 'The trust review begins: Lola\'s endpoint, locked to its job',
    date: '13 Jul 2026',
    work: 'Five independent reviewers — each starting cold, from tech, legal, PR, marketing, and operations angles — went over the whole product before launch, and their findings became a fix queue. The first one shipped: the server endpoint behind Lola no longer accepts a caller-supplied instruction prompt. The app now sends only a named task — extract this answer, phrase this question, coach this step, distill this note — and the server writes the actual instructions itself, choosing the model and length limit per task. A copied link can no longer be turned into a free, general-purpose AI proxy; it can only ever run Lola\'s five real jobs. Riding the same deploy: a German homepage headline that had drifted into an awkward idiom ("Damit gehen Sie nach Hause") became the clean line it was meant to be ("Das nehmen Sie mit.").',
    decisions: [
      'The instructions are the security boundary: the client fills only bounded data holes (the answer text, the step title, a slot the server re-looks-up from the catalog by name), never the instructions themselves — so a stolen endpoint stays inside Lola\'s guardrails.',
      'An outside review is worth its discomfort: the sharpest findings were the ones the people closest to the code had stopped seeing. The whole queue is being worked in order, hardest-first.',
      'The prompts moved to one server-side module with a test that pins them to the app\'s five real tasks — the same file the language directive is single-sourced against, so the lockdown can\'t silently drift.',
    ],
  },
  {
    feature: 'The trust review, fully worked: the whole fix queue cleared',
    date: '13 Jul 2026',
    work: 'Every fix the five-seat review raised is now done. Lola stops contradicting the roadmap: one shared validator guards every place the AI can touch your profile, the income question is answered by the engine itself (so a band the plan is about to flag never gets praised), a personal-case question in the final note gets an honest "I can\'t assess that — that\'s for a consulate or a lawyer" instead of a bland "got it," and the opening bubble states plainly that Lola is an AI and this is guidance, not legal advice. The AI endpoint got a Cloudflare human-check (solve once, a short-lived token covers the interview) and a budget-drain alarm. Penalty steps like the Modelo 720 foreign-asset declaration are now kept — flagged "may apply" — when you\'d rather not say, instead of silently vanishing. Share links carry your answers in the URL fragment, which never reaches a server. The national legal figures (the €28,800 income floor and friends) live in one registry, with a test that the prose can\'t drift from it. The income threshold counts your real number of dependents. The privacy policy gained lawful-basis, data-transfer and retention detail. And the home page now shows one real, cited, dated step instead of four abstract trust badges.',
    decisions: [
      'Honesty is a property you can test: nearly every fix shipped with a regression — a garbage profile edit rejected field-by-field, a below-threshold income band that must warn, a declined-assets profile that must still surface Modelo 720, the legal figures that must match their prose.',
      'The paper caught up to the engineering: lawful bases, US-transfer mechanisms (Data Privacy Framework / SCCs) and concrete retention periods are now written down — the trust the code earns, the policy no longer undersells.',
      'Show, don\'t tell: the strongest trust signal isn\'t a badge that says "sourced," it\'s the actual NIE step with its government domain and verified date, pulled live from the catalog so it can never go stale.',
    ],
  },
  {
    feature: 'Pre-launch polish: an account page, a faster arrival question, and a freshness robot',
    date: '13 Jul 2026',
    work: 'A batch of polish before the next mobile build. A proper "My account" page pulls email preferences (turn the weekly roundup on or off), language, and account deletion out of the hamburger menu into one clear place. The interview\'s first question got quick chips — "In a few months," "Later this year," "Next year" — so you can tap a timeframe instead of typing one, with the composer still there for a specific month. The household-scope note ("this maps the main applicant; a working partner runs their own quick interview") now shows in the interview too, not just on the finished roadmap. And a monthly "freshness" robot checks every dated official fact against a staleness deadline and pings every government source URL — so the "last verified" stamps stay honest because a machine makes us keep them.',
    decisions: [
      'The remembering is the machine\'s job: the freshness check fails (and emails) when any statutory figure is past its ~180-day re-verify window or a source URL stops resolving. The human still re-verifies — but nothing rots silently behind a stamp that says otherwise.',
      'A fifth invariant, written down and tested: a catalog change must honor every saved profile, so a replan never triggers a new interview; when new information is genuinely needed, the interview asks only the missing question, never the ones already answered.',
      'The arrival chips reuse the proven date extractor instead of mapping to fixed dates in the app — which would have collided ("in six months" and "next year" landing on the same month depending on today\'s date).',
    ],
  },
  {
    feature: 'The iPhone gets the same human-check — invisibly',
    date: '13 Jul 2026',
    work: 'On the web, one Cloudflare human-check protects the AI endpoint. The phone can\'t show that puzzle without nagging you, so the native app proves it\'s a genuine, unmodified install a different way: Apple App Attest. The moment you open the app, the iPhone\'s Secure Enclave signs a hardware-backed certificate that our server verifies — no tap, no puzzle, nothing you ever see — and on success you get exactly the same short-lived token the web earns from the check. We built the full verifier (it walks Apple\'s certificate chain up to their published root and confirms the signed challenge is fresh and bound to this exact device) and proved it end-to-end against a real attestation captured from the actual build on a physical iPhone.',
    decisions: [
      'The same protection, the right ceremony for each platform: a visible puzzle on the web, an invisible hardware attestation on iOS — both mint the identical server token, so the AI endpoint is guarded everywhere without ever taxing a real user.',
      'Trust the math, verify against reality: the certificate-chain check is hand-written to run on the same Web-Crypto-only server the web uses, and it isn\'t trusted until it verifies a genuine device attestation in the test suite — which promptly caught a one-byte bug that had silently blocked the security check.',
      'Ship dark, flip on purpose: the native path stays switched off behind a flag until the verifier is deployed and deliberately turned on — the safe default is that the phone gets no free pass it hasn\'t earned.',
    ],
  },
];

export default function BuildLogScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.scroll}>
      <Seo
        title="The Get Camino build log — every feature, dated, with decisions"
        description="Every major piece of Get Camino in the order the work happened: what shipped, when, and the decisions that shaped it."
        canonical="https://getcamino.app/how-i-was-built/log"
      />
      <NavBar />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>HOW I WAS BUILT — THE RECEIPTS</Text>
        <Text style={styles.title}>The build log</Text>
        <Text style={styles.dek}>
          The essay tells the story; this is the homework. Every major piece of Get Camino — newest
          first — with what shipped and the decisions that shaped it.
        </Text>
        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => router.push('/how-i-was-built')}>
            <Text style={styles.backLink}>← Read the essay</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openExternal('https://github.com/nerolabs/camino-app')}>
            <Text style={styles.backLink}>The code on GitHub ↗</Text>
          </TouchableOpacity>
        </View>

        {/* Data stays chronological (it reads as history in code); display is newest-first
            (user request 2026-07-04 — the log got long). Numbers stay chronological, so the
            top entry carries the highest number of the running series. */}
        {ROWS.map((row, i) => ({ row, n: i + 1 })).reverse().map(({ row, n }) => (
          <View key={n} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowNum}>{String(n).padStart(2, '0')}</Text>
              <Text style={styles.rowFeature}>{row.feature}</Text>
              <Text style={styles.rowDate}>{row.date}</Text>
            </View>
            <Text style={styles.label}>WORK COMPLETED</Text>
            <Text style={styles.work}>{row.work}</Text>
            <Text style={styles.label}>KEY DECISIONS</Text>
            {row.decisions.map((d, j) => (
              <Text key={j} style={styles.decision}>– {d}</Text>
            ))}
          </View>
        ))}

        <Text style={styles.outro}>
          Still being written — the log grows as the work does.
        </Text>
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: palette.cal },
  content:    { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  eyebrow:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 1.5, color: palette.amber, marginBottom: 10 },
  title:      { fontFamily: 'Fraunces_600SemiBold', fontSize: 40, lineHeight: 46, color: palette.indigo, marginBottom: 12 },
  dek:        { fontFamily: 'HankenGrotesk_400Regular', fontSize: 17, lineHeight: 26, color: palette.indigo, marginBottom: 10 },
  linksRow:   { flexDirection: 'row', gap: 20, flexWrap: 'wrap', marginBottom: 28 },
  backLink:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cobalt },

  row:        { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 14, padding: 20, marginBottom: 14 },
  rowHeader:  { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  rowNum:     { fontFamily: 'Fraunces_600SemiBold', fontSize: 15, color: palette.amber },
  rowFeature: { fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: palette.indigo, flexShrink: 1 },
  rowDate:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted, marginLeft: 'auto' },
  label:      { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 1.2, color: palette.muted, marginTop: 10, marginBottom: 4 },
  work:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 21, color: palette.indigo },
  decision:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 21, color: palette.indigo, marginBottom: 4 },

  outro:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.muted, marginTop: 14, fontStyle: 'italic' },
});
