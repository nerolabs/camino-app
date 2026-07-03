import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { palette } from '@/constants/Colors';
import { openExternal } from '@/lib/plan-format';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// "Show our homework" — the receipts behind the essay at /how-i-was-built. Every roadmap item in
// the order we actually took the work on, with what shipped and the decisions that shaped it.
// Unlisted like the essay (robots disallows the /how-i-was-built prefix; not in the nav).
// Sourced from TODO.md's completed items + the git history, so it stays honest.

type Row = { feature: string; work: string; decisions: string[] };

const ROWS: Row[] = [
  {
    feature: 'The walking skeleton',
    work: 'A deterministic plan engine (~7 obligations), a catalog-derived interview, Lola\'s persona prompt, and a report prototype — the whole pipeline end to end before any real app existed.',
    decisions: [
      'Model obligations, not journeys: ~100 finite atomic units generate the thousands of individual journeys for free.',
      'Four invariants written down before features: deterministic engine, catalog-derived interview, Lola never invents facts, plan = pure function of profile.',
      'The LLM gets exactly two bounded surfaces (phrase a question, extract an answer). Everything load-bearing is boring, testable code.',
    ],
  },
  {
    feature: 'The Expo app + auth + storage',
    work: 'Expo Router app targeting web, iOS, and Android from one codebase; Supabase Google sign-in; profiles saved per-user under RLS.',
    decisions: [
      'One codebase, three platforms — platform differences isolated into .native.ts twin modules Metro resolves automatically.',
      'Separate staging and production Supabase databases so a test can never touch a real user\'s data.',
    ],
  },
  {
    feature: 'Server-side LLM proxy',
    work: 'All Anthropic calls moved behind /api/lola (Expo API route on the hosting platform\'s Workers runtime); the client bundle no longer contains any key.',
    decisions: [
      'Secrets live only in server env vars — a browser bundle is public by definition.',
      'Layered, fail-open hardening: payload caps are the real enforcement; origin checks and per-IP limits are extra layers that never lock out legitimate users.',
    ],
  },
  {
    feature: 'Catalog expansion by webinar mining',
    work: 'Fifteen relocation-webinar transcripts mined by five parallel agents; the catalog grew from ~20 to 54 obligations across tax, property, visas, healthcare, and citizenship.',
    decisions: [
      'Every obligation carries a provenance tag from day one, enforced by the type system.',
      'Anything we couldn\'t ground was pulled to a backlog rather than shipped on vibes — invented precision (fake form numbers, made-up deadlines) got stripped.',
    ],
  },
  {
    feature: 'The living plan',
    work: 'Mark steps done (today or back-dated); completions re-anchor downstream deadlines to what actually happened; a free-text "something changed" box re-plans deterministically.',
    decisions: [
      'Progress is just more profile input — the engine stays a pure function.',
      'The LLM translates free text into a profile-field delta ONLY; the diff users see is computed deterministically, never narrated from imagination.',
    ],
  },
  {
    feature: 'Deploy pipeline + environments',
    work: 'EAS Hosting with development / staging / production environments, a custom domain, and a deploy script that pulls each environment\'s vars and clears bundler caches.',
    decisions: [
      'One early build silently baked the staging database into production — the fix became a permanent guard: the deploy script sources the pulled env, wipes caches, and prints exactly what it baked.',
      'Infrastructure came after the product had earned it, then all at once.',
    ],
  },
  {
    feature: 'iOS to TestFlight',
    work: 'Native builds through EAS with an App Store Connect API key (fully non-interactive), through review rejections to installable TestFlight builds; native Google sign-in, dictation, and Dynamic Island safe-areas verified on device.',
    decisions: [
      'Machine-drivable release infrastructure over click-ops: the API key lets any session cut a build.',
      'Fix rejections at the root (an unused library referencing the photo roll was removed, not excused).',
    ],
  },
  {
    feature: 'Staff tooling & gating',
    work: 'Dev test personas and internal cross-check links, first gated by environment + a user-id allowlist, later replaced by a server-owned is_staff flag on the profiles table.',
    decisions: [
      'Feature flags belong in the database, not hardcoded into client bundles — extended testers get access with one SQL update.',
      'The client can never write its own staff flag; column-level grants enforce it.',
    ],
  },
  {
    feature: 'Brand into product',
    work: 'The azulejo compass-star became the app icon set (iOS, adaptive Android, splash, favicon), generated from a single SVG by a script.',
    decisions: [
      'One source of truth, regenerated on demand — no hand-exported icon zoo.',
      'Apple rejects icons with alpha channels; the pipeline flattens automatically.',
    ],
  },
  {
    feature: 'Product analytics',
    work: 'PostHog on web and later native: a funnel from first visit through interview to roadmap, feature-health events, person profiles.',
    decisions: [
      'Every event stamped with its environment so our own testing never pollutes real usage.',
      'Local dev sends nothing — the key simply doesn\'t exist there.',
    ],
  },
  {
    feature: 'Lola\'s voice',
    work: 'ElevenLabs TTS behind /api/tts (key server-side), a warm Spanish-accented English voice, on by default, with a visible mute pill.',
    decisions: [
      'Two failed autoplay fixes are part of the record: browsers block audio without a user gesture. The real fix rides the gesture users already make ("Let\'s get started") to unlock a Web Audio context for the whole session.',
      'The sound control lives with the conversation, not in the reply composer — the composer is for composing.',
    ],
  },
  {
    feature: 'Official sourcing & the source taxonomy',
    work: 'Every webinar-derived claim researched against government sources; corrections applied (regional tax ranges, renewal windows, a voluntary-not-mandatory registry); the taxonomy simplified to official | recommendation.',
    decisions: [
      'A tag is not a citation — "official" ultimately came to require a canonical URL the user can check.',
      'Six items stayed honest recommendations rather than being dressed up as law.',
      'Webinar links were kept as staff-only cross-checks with timestamps — ideation material, not user-facing truth.',
    ],
  },
  {
    feature: 'Observability',
    work: 'Sentry across web, the API routes, and native iOS — one project tagged by platform and environment — plus an uptime monitor that pages on downtime, and daily budget caps on the paid API routes.',
    decisions: [
      'One Sentry project with tags beats three projects to manage.',
      'The Workers runtime fits no Sentry SDK, so the API routes send minimal envelopes by hand — a smaller correct thing over a bigger wrong one.',
    ],
  },
  {
    feature: 'Native parity',
    work: 'Three TestFlight builds brought iOS level with web: spoken Lola (expo-audio streaming a GET variant of the TTS route), native crash reporting with readable stack traces, native analytics.',
    decisions: [
      'Each build verified on a real device before being called done.',
      'Android deliberately deferred to the very end — no test device, no pretend testing.',
    ],
  },
  {
    feature: 'Citizenship vs. renewal — asking instead of assuming',
    work: 'A new interview question (do you hope to become a citizen, or keep renewing residence?) now gates the entire citizenship track; a second new question gates the scouting trip to people still choosing a region.',
    decisions: [
      'The engine had silently assumed everyone naturalises — a big assumption belongs to the user, deterministically, not to the catalog.',
    ],
  },
  {
    feature: 'The cold-eyed audit',
    work: 'A full fresh-eyes review of architecture, catalog, and interview found real bugs: a language-exam rule mishandling Filipino applicants, two interview answers collected but never read, the drift-check invariant living in dead code, and 28 "official" items with no citation attached.',
    decisions: [
      'Auditing your own product is scheduled work, not luck.',
      'Every fix shipped with a regression persona so it can\'t silently regress.',
      'The invariant checker was revived as a script that gates every deploy.',
    ],
  },
  {
    feature: 'The re-verification pass',
    work: 'All 28 uncited official obligations re-verified one by one against their issuing authorities (tax agency procedure pages, ministry information sheets, the BOE, the DGT, the Instituto Cervantes) and given canonical links; a missing EU-registration obligation was discovered and added.',
    decisions: [
      'The catalog reached 60 obligations: 55 official — every single one citable — and 5 honest recommendations.',
      'The audit\'s persona check exposed the EU gap: an empty plan is a finding, not a nuisance.',
    ],
  },
  {
    feature: 'The test suite & CI',
    work: 'A deterministic engine suite (15 tests, ~140 ms) runs in CI on every push and inside the deploy gate; API contract tests and a Playwright smoke suite run against the deployed staging site.',
    decisions: [
      'Fast, offline, deterministic tests gate deploys; anything paid or networked is opt-in so CI never burns tokens.',
      'The audit-fix regressions ARE the test fixtures — personas double as executable documentation.',
    ],
  },
  {
    feature: 'The sample plan',
    work: 'A public, read-only roadmap for a fictional couple — built by the real engine on a canned profile — with tap-to-expand deterministic detail and interview CTAs.',
    decisions: [
      'Show the payoff before asking for the interview\'s effort.',
      'The sample\'s arrival date floats months ahead so its deadlines never look stale.',
      'The LLM coach stays off the public page — a free anonymous LLM endpoint is an abuse surface, and the plan isn\'t the visitor\'s to edit. The expanded card teases what the real thing does instead.',
    ],
  },
];

export default function BuildLogScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.scroll}>
      <NavBar />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>HOW I WAS BUILT — THE RECEIPTS</Text>
        <Text style={styles.title}>The build log</Text>
        <Text style={styles.dek}>
          The essay tells the story; this is the homework. Every major piece of Camino in the order
          we actually took the work on — what shipped, and the decisions that shaped it.
        </Text>
        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => router.push('/how-i-was-built')}>
            <Text style={styles.backLink}>← Read the essay</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openExternal('https://github.com/nerolabs/camino-app')}>
            <Text style={styles.backLink}>The code on GitHub ↗</Text>
          </TouchableOpacity>
        </View>

        {ROWS.map((row, i) => (
          <View key={i} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowNum}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.rowFeature}>{row.feature}</Text>
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
  label:      { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 1.2, color: palette.muted, marginTop: 10, marginBottom: 4 },
  work:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 21, color: palette.indigo },
  decision:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 21, color: palette.indigo, marginBottom: 4 },

  outro:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.muted, marginTop: 14, fontStyle: 'italic' },
});
