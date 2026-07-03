import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { palette } from '@/constants/Colors';
import NavBar from '@/components/NavBar';

// The product roadmap — the outward-facing twin of TODO.md's "Product roadmap" section.
// Unlisted like the rest of /how-i-was-built/ (robots-disallowed, direct link only): companion
// to the build story (how it got here) and the build log (the receipts).
//
// ⚠️ MAINTENANCE CONTRACT: update this page AND /how-i-was-built/log with EVERY PR, so what we
// tell users matches what we actually shipped. Source of truth is TODO.md's roadmap section —
// this page is its user-readable rendering (no internal jargon, honest about what we're NOT
// building and why).

type Item = { title: string; note?: string };
type Section = { h: string; intro?: string; items: Item[] };

const UPDATED = 'July 2026';

const SECTIONS: Section[] = [
  {
    h: 'Just shipped',
    items: [
      { title: '“This week” view', note: 'One tap on your roadmap and you see just what needs your attention now — what’s slipped and what’s due in the next seven days. A clear week says so, honestly.' },
      { title: 'A free guide for every step', note: 'Sixty public pages — one per step in the catalog, each with when it’s due, why it matters, and the official source. The same facts your roadmap is built from, open to everyone.' },
      { title: 'One calmer nav everywhere', note: 'Desktop now matches mobile: browsing lives in the ☰ menu, the bar keeps just the actions.' },
      { title: 'The weekly roundup + welcome email', note: 'What’s overdue and what’s coming up, never more than a handful of tasks, each with a concrete tip. A welcome note when you join, one-click unsubscribe, and silence when there’s nothing pressing.' },
      { title: 'Passwordless email sign-in', note: 'A link (or 6-digit code) lands in your inbox and signs you in — no password to invent, works across devices.' },
      { title: '“Email me my roadmap”', note: 'One field on your fresh roadmap: saves it, creates your account silently, and the emailed link brings you back signed in.' },
      { title: 'Overdue tracking', note: 'Steps past their date now say so, in red — and Lola helps you re-flow the plan instead of letting it quietly rot.' },
      { title: 'Sample plan', note: 'See a real, full roadmap (Susan & Tom’s) before answering a single question.' },
      { title: 'Sign in with Apple + a cleaner sign-in dialog', note: 'One tap on iOS; Google everywhere.' },
      { title: 'iOS app in TestFlight', note: 'Full parity with the web: voice, dictation, the living roadmap.' },
    ],
  },
  {
    h: 'In progress',
    items: [
      { title: 'Smoothing out Sign in with Apple', note: 'It works for most people; we’re chasing down an edge case before the next iOS build ships.' },
    ],
  },
  {
    h: 'Next',
    items: [
      { title: 'Roadmap PDF export', note: 'For the fridge door, or the gestor.' },
      { title: 'Region-aware steps', note: 'Some bureaucracy differs by comunidad — the plan should know yours.' },
    ],
  },
  {
    h: 'Later',
    items: [
      { title: 'The public App Store release', note: 'The iOS app is in TestFlight now. The listing goes live after the features above land and the app has survived a lot more family testing.' },
      { title: 'Android app' },
      { title: 'Spanish first, then more languages' },
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
      <NavBar />
      <View style={styles.column}>
        <Text style={styles.eyebrow}>WHERE CAMINO IS GOING</Text>
        <Text style={styles.title}>The roadmap</Text>
        <Text style={styles.dek}>
          Camino gives you a roadmap, so it’s only fair you get to see ours. Updated with every
          release — last: {UPDATED}.
        </Text>
        <View style={styles.rule} />

        {SECTIONS.map((s) => (
          <View key={s.h} style={styles.section}>
            <Text style={styles.h}>{s.h}</Text>
            {s.intro && <Text style={styles.intro}>{s.intro}</Text>}
            {s.items.map((it) => (
              <View key={it.title} style={styles.item}>
                <Text style={styles.itemTitle}>{it.title}</Text>
                {it.note && <Text style={styles.itemNote}>{it.note}</Text>}
              </View>
            ))}
          </View>
        ))}

        <View style={styles.rule} />
        <Link href="/how-i-was-built" style={styles.link}>
          Curious how it’s made? Read how Camino was built →
        </Link>
        <Link href="/how-i-was-built/log" style={styles.link}>
          Or the full build log — every item above, with the decisions behind it →
        </Link>
      </View>
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
  itemNote:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 24, color: palette.muted, marginTop: 2 },
  link:      { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, lineHeight: 23, color: palette.cobalt, marginBottom: 16 },
});
