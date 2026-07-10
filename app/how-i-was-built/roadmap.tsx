import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { palette } from '@/constants/Colors';
import Seo from '@/components/Seo';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// The product roadmap — the outward-facing twin of TODO.md's "Product roadmap" section.
// Public since 3 Jul 2026 (user decision): linked from the nav menu and in the sitemap; companion
// to the build story (how it got here) and the build log (the receipts).
//
// ⚠️ MAINTENANCE CONTRACT: update this page AND /how-i-was-built/log with EVERY PR, so what we
// tell users matches what we actually shipped. Source of truth is TODO.md's roadmap section —
// this page is its user-readable rendering (no internal jargon, honest about what we're NOT
// building and why).

type Item = { title: string; note?: string; date?: string };
type Section = { h: string; intro?: string; items: Item[] };

const UPDATED = 'July 2026';

const SECTIONS: Section[] = [
  {
    h: 'Just shipped',
    items: [
      { title: 'The interview builds your roadmap live', date: '10 Jul 2026', note: 'Answers are taps now, every question explains why it\'s asked, and your roadmap grows on screen while you talk to Lola — steps appearing, already dated, as each answer lands. Leave halfway and your progress waits for you. Born from watching the first real users: the data said the interview was the wall, so the interview became the product.' },
      { title: 'An honest income check', date: '10 Jul 2026', note: 'If your answers suggest your income can\'t reach a visa route\'s requirement, the roadmap now says so early — and conservatively, only when even the top of your range falls short — so you find out at the planning stage, not at the consulate.' },
      { title: 'Five languages, now on the iPhone too', date: '5 Jul 2026', note: 'A day after the web learned five languages, the iOS app caught up: a new TestFlight build carries the full localization and the mid-interview language switch onto the phone, verified on a real device. It shipped the disciplined way — the native user-flow tests had to pass before a single build was cut.' },
      { title: 'Saved roadmaps that actually save', date: '5 Jul 2026', note: 'A database permission change had quietly stopped signed-in roadmaps from persisting — and the failure was being swallowed, so it hid for days. Fixed on the live databases, verified end to end, and any future save failure now raises an alarm instead of vanishing. If you sign in, your roadmap is safe on every device again.' },
      { title: 'Cinco idiomas en un día', date: '5 Jul 2026', note: 'The whole experience now ships in five languages — English, Español, Français, Deutsch, Italiano. Lola interviews in yours, all sixty steps and guides read natively, emails and the printable roadmap follow your language, and each language meets its own sample couple. The web has real per-language pages for search engines, and your language choice follows you from browser to inbox.' },
      { title: 'The tests got a fresh-eyes audit', date: '5 Jul 2026', note: 'Before translating anything, every safety net was re-checked against reality: ten critical user journeys got honest coverage verdicts, the interview proved it already understands Spanish answers, and every email and the printable report are now snapshot-frozen so a translation can\'t quietly break them.' },
      { title: 'A safer name: Get Camino', date: '4 Jul 2026', note: 'The app and site now go by Get Camino — a distinctive compound matching the domain we already own, chosen deliberately before any brand spend on a crowded word.' },
      { title: 'Voice that takes turns', date: '4 Jul 2026', note: 'Opening the mic stops Lola mid-sentence; closing it keeps your last words; the cue appears when the mic is actually hot; the answer box grows as you dictate; and no spinner is allowed to live past 35 seconds — Lola owns the retry.' },
      { title: 'The app tests itself now', date: '4 Jul 2026', note: 'Twelve automated web journeys — including signing in and reworking a real roadmap — plus iOS simulator flows on every release train. The first run caught a bug on every page load that humans had scrolled straight past.' },
      { title: 'Every official source link, click-tested', date: '4 Jul 2026', note: 'All 55 government links checked against their steps; two were quietly broken (a retired portal, a cookie wall) and now point where they should.' },
      { title: 'Region-aware steps', date: '4 Jul 2026', note: 'The interview now asks which comunidad you\'re settling in, and the steps whose rules vary by region — transfer tax, wealth tax, school admissions, property tax — say so and name yours. Region-by-region rates come next as a sourced content pass.' },
      { title: 'Privacy, terms & delete-my-account', date: '4 Jul 2026', note: 'The grown-up pages: plain-language privacy policy and terms in every footer, cookieless analytics (no banner needed), and one-tap permanent account deletion in the menu.' },
      { title: 'Every guide got a written explainer', date: '4 Jul 2026', note: 'Sixty pages now tell you what each step actually is and how it feels in practice — with a build rule that the prose can never introduce a number the step itself doesn\'t carry.' },
      { title: 'Roadmap PDF export', date: '3 Jul 2026', note: 'One tap turns your roadmap into a clean printable report — estimated vs firm dates, official sources included. For the fridge door, or the gestor.' },
      { title: 'Report a problem', date: '3 Jul 2026', note: 'A quiet line in the menu, one text box, straight to us. Every report makes the roadmap better.' },
      { title: '“This week” view', date: '3 Jul 2026', note: 'One tap on your roadmap and you see just what needs your attention now — what’s slipped and what’s due in the next seven days. A clear week says so, honestly.' },
      { title: 'A free guide for every step', date: '3 Jul 2026', note: 'Sixty public pages — one per step in the catalog, each with when it’s due, why it matters, and the official source. The same facts your roadmap is built from, open to everyone.' },
      { title: 'One calmer nav everywhere', date: '3 Jul 2026', note: 'Desktop now matches mobile: browsing lives in the ☰ menu, the bar keeps just the actions.' },
      { title: 'The weekly roundup + welcome email', date: '3 Jul 2026', note: 'What’s overdue and what’s coming up, never more than a handful of tasks, each with a concrete tip. A welcome note when you join, one-click unsubscribe, and silence when there’s nothing pressing.' },
      { title: 'Passwordless email sign-in', date: '3 Jul 2026', note: 'A link (or one-time code) lands in your inbox and signs you in — no password to invent, works across devices.' },
      { title: '“Email me my roadmap”', date: '3 Jul 2026', note: 'One field on your fresh roadmap: saves it, creates your account silently, and the emailed link brings you back signed in.' },
      { title: 'Overdue tracking', date: '3 Jul 2026', note: 'Steps past their date now say so, in red — and Lola helps you re-flow the plan instead of letting it quietly rot.' },
      { title: 'Sample plan', date: '3 Jul 2026', note: 'See a real, full roadmap (Susan & Tom’s) before answering a single question.' },
      { title: 'Sign in with Apple + a cleaner sign-in dialog', date: '3 Jul 2026', note: 'One tap on iOS; Google everywhere.' },
      { title: 'iOS app in TestFlight', date: '1 Jul 2026', note: 'Full parity with the web: voice, dictation, the living roadmap.' },
    ],
  },
  {
    h: 'In progress',
    items: [
      { title: 'The languages get their human pass', note: 'Machine-drafted, mechanically linted — and now verified by native speakers, sentence by sentence, before launch. Corrections land as reviewable diffs against frozen snapshots.' },
      { title: 'Family testing & edge-case cleanup', note: 'Real relatives, real phones, real bug reports — the app earns its release the honest way.' },
    ],
  },
  {
    h: 'Next',
    items: [
      { title: 'The public launch — web, iOS, and Android together', note: 'Android moved up from "later": launching on all three. What remains is honest: native-speaker verification of the new languages, more family testing, and the grown-up paperwork.' },
      { title: 'Region-by-region specifics', note: 'The rates and windows for each comunidad, verified against each region\'s own official sources — the content pass behind the region flags.' },
    ],
  },
  {
    h: 'Later',
    items: [
      { title: 'More languages', note: 'Dutch and Portuguese look likeliest next, by who actually moves to Spain.' },
    ],
  },
  {
    h: 'What we’ve decided not to build (for now)',
    intro: 'A roadmap is also the things you say no to.',
    items: [
      { title: 'A document vault', note: 'Your passport and visa papers are exactly the documents we don’t want to be a honeypot for. We’ll point you to the right storage; we won’t be it.' },
      { title: 'Push notifications', note: 'The weekly email already tells you what needs attention, and we’d rather not be another icon buzzing your pocket. If email ever isn’t enough, we’ll revisit.' },
      { title: 'A second country', note: 'Spain, done properly, before anywhere else.' },
      { title: 'Household sharing', note: 'Waiting until real users tell us they need it — not building it on spec.' },
    ],
  },
];

export default function Roadmap() {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <Seo
        title="The Get Camino product roadmap — shipped, next, and honest noes"
        description="Get Camino gives you a roadmap, so it's only fair you see ours: just shipped, in progress, next — and what we've decided not to build."
        canonical="https://getcamino.app/how-i-was-built/roadmap"
      />
      <NavBar />
      <View style={styles.column}>
        <Text style={styles.eyebrow}>WHERE THE PRODUCT IS GOING</Text>
        <Text style={styles.title}>The product roadmap</Text>
        <Text style={styles.dek}>
          Get Camino gives you a roadmap, so it’s only fair you get to see ours. Updated with every
          release — last: {UPDATED}.
        </Text>
        <View style={styles.rule} />

        {SECTIONS.map((s) => (
          <View key={s.h} style={styles.section}>
            <Text style={styles.h}>{s.h}</Text>
            {s.intro && <Text style={styles.intro}>{s.intro}</Text>}
            {s.items.map((it) => (
              <View key={it.title} style={styles.item}>
                <Text style={styles.itemTitle}>{it.title}{it.date ? <Text style={styles.itemDate}>  ·  {it.date}</Text> : null}</Text>
                {it.note && <Text style={styles.itemNote}>{it.note}</Text>}
              </View>
            ))}
          </View>
        ))}

        <View style={styles.rule} />
        <Link href="/how-i-was-built" style={styles.link}>
          Curious how it’s made? Read how Get Camino was built →
        </Link>
        <Link href="/how-i-was-built/log" style={styles.link}>
          Or the full build log — every item above, with the decisions behind it →
        </Link>
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: palette.cal },
  scroll:    { paddingBottom: 80 },
  column:    { alignSelf: 'center', width: '100%', maxWidth: 680, paddingHorizontal: 24, paddingTop: 28 },
  eyebrow:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 2, color: palette.amber, marginBottom: 14 },
  title:     { fontFamily: 'Fraunces_600SemiBold', fontSize: 40, lineHeight: 46, color: palette.indigo, marginBottom: 16 },
  dek:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 18, lineHeight: 28, color: palette.muted },
  rule:      { height: 2, width: 48, backgroundColor: palette.amber, marginVertical: 32, borderRadius: 2 },
  section:   { marginBottom: 32 },
  h:         { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 30, color: palette.cobalt, marginBottom: 14 },
  intro:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 25, color: palette.muted, fontStyle: 'italic', marginBottom: 12 },
  item:      { marginBottom: 14 },
  itemTitle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 17, lineHeight: 26, color: palette.indigo },
  itemDate:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.muted },
  itemNote:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 24, color: palette.muted, marginTop: 2 },
  link:      { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, lineHeight: 23, color: palette.cobalt, marginBottom: 16 },
});
