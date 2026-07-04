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
    work: 'This whole section — the essay, this log, the roadmap — left the unlisted shadows: it\'s in the nav menu and the sitemap now, and every entry carries its ship date. And the links in Camino\'s emails gained universal links, so tapping "Open your roadmap" on an iPhone opens the app (signed in) instead of a logged-out browser tab.',
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
    work: 'All sixty guide pages gained a written explainer — what the step actually is, how the process feels, who\'s involved — in Camino\'s voice. Each page\'s search snippet now uses its own opening sentence instead of a shared template.',
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
      'Camino\'s links will live in WhatsApp threads and expat Facebook groups — a bare gray link and a branded card are different products there.',
      'The share card is generated from the same brand-mark code as the app icons: one geometry, every surface.',
    ],
  },
];

export default function BuildLogScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.scroll}>
      <Seo
        title="The Camino build log — every feature, dated, with decisions"
        description="Every major piece of Camino in the order the work happened: what shipped, when, and the decisions that shaped it."
        canonical="https://getcamino.app/how-i-was-built/log"
      />
      <NavBar />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>HOW I WAS BUILT — THE RECEIPTS</Text>
        <Text style={styles.title}>The build log</Text>
        <Text style={styles.dek}>
          The essay tells the story; this is the homework. Every major piece of Camino — newest
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
