import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { openExternal } from '@/lib/plan-format';
import { palette } from '@/constants/Colors';
import Seo from '@/components/Seo';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// Unlisted route: not linked from the nav. Direct link only. A narrative of how Camino was
// built — revised as the product matures.

type Block = { h: string; p: string[] };

const DEK =
  'A relocation-planning app, and a case study in leading an engineering project when your ' +
  'most productive teammate is an AI — architecture first, truth over flash, and infrastructure ' +
  'only once the product had earned it.';

const SECTIONS: Block[] = [
  {
    h: 'The idea, from a suitcase',
    p: [
      'Camino started with my own move to Spain. Not the romantic part — the other part: the ' +
      'hundred small, unglamorous tasks that only work in a specific order. Visa before flight. ' +
      'Padrón before residency. Residency before the health card. Get one wrong and the next ' +
      'three stall for weeks.',
      'The insight wasn’t “make a checklist.” Checklists don’t know you. The insight was a ' +
      'roadmap that is a pure function of your situation, sequenced by real deadlines, and a ' +
      'guide — Lola — who explains the why without ever inventing the what.',
    ],
  },
  {
    h: 'Architecture before features',
    p: [
      'Before a single screen, I wrote down the invariants and refused to break them. The plan ' +
      'engine is deterministic — no LLM decides your deadlines. The interview is derived from the ' +
      'obligation catalog, so we can only ask what the plan can actually use. Lola never invents ' +
      'costs, dates, or laws. And the LLM appears at exactly two surfaces: phrasing a question, ' +
      'and extracting an answer. Everything else is boring, testable code.',
      'This is the part that’s easy to skip when an AI can generate a working feature in seconds. ' +
      'Don’t. The invariants are what let you move fast later without the thing quietly turning ' +
      'into a confident liar.',
    ],
  },
  {
    h: 'One thin thread, all the way through',
    p: [
      'The first real milestone wasn’t impressive. It was the thinnest possible path — a handful ' +
      'of questions to a barely-styled plan — but it ran end to end. A skeleton you can feel is ' +
      'worth more than three polished pieces that don’t connect. Once the thread existed, every ' +
      'improvement had somewhere to land.',
    ],
  },
  {
    h: 'Depth from real sources',
    p: [
      'Then we earned the substance. We mined relocation-webinar transcripts to expand the ' +
      'catalog from a couple of dozen obligations to nearly sixty — then did the unglamorous ' +
      'grounding pass: verifying each against official government sources until the large ' +
      'majority carried a canonical citation, tagging every item with its provenance, and ' +
      'pulling anything we couldn’t stand behind into a backlog until we could.',
      'That discipline caught real errors. A tax-form penalty we’d absorbed from secondary ' +
      'sources had actually been struck down; a form we listed had been abolished. The point of ' +
      '“Lola never invents” isn’t modesty — it’s that a relocation plan people act on has to be ' +
      'right, and “right” is a process, not a vibe.',
    ],
  },
  {
    h: 'Make it real, locally',
    p: [
      'We built the whole experience on the web first, iterating locally: the conversational ' +
      'interview, the living roadmap, the celebratory “I’ve remodelled your plan” moment, the ' +
      'coach in the task drawer. We refined UX until it felt like a companion, not a wizard — ' +
      'and only when it had crossed from MVP into something you’d actually want to use (an MLP, ' +
      'a minimum *lovable* product) did we let it out of the building.',
    ],
  },
  {
    h: 'Then — and only then — infrastructure',
    p: [
      'With something worth shipping, we built the pipes: Expo EAS with real development, staging, ' +
      'and production environments. Separate Supabase databases per environment, so a test never ' +
      'touches a real user’s data. A deploy script that pulls the right environment and clears the ' +
      'bundler cache — because we got burned once when a build silently baked the staging database ' +
      'into production, and turned that scar into a guardrail.',
      'Server-side secrets, a custom domain, and native iOS and Android builds through the same ' +
      'pipeline. Infrastructure is a tax you pay once, deliberately, after the product has earned ' +
      'it — not a yak you shave on day one.',
    ],
  },
  {
    h: 'Knowing how it’s doing',
    p: [
      'You can’t improve what you can’t see. We wired product telemetry — a conversion funnel from ' +
      'first visit to a finished roadmap, and feature-health signals like whether people come back ' +
      'and actually check steps off. Every event is stamped with its environment so real usage ' +
      'never mixes with our own testing. Then we gave it a nervous system: error and performance ' +
      'monitoring across web, backend, and native in one place, tagged by platform, with an uptime ' +
      'monitor that pages us if the site or the API goes dark. A product people depend on deserves ' +
      'to wake someone up when it’s hurting.',
    ],
  },
  {
    h: 'Parity, then a cold-eyed audit',
    p: [
      'Once the web experience had earned its shape, we brought the iOS app to full parity — ' +
      'native sign-in, dictation, Lola’s spoken voice, crash reporting, analytics — three ' +
      'TestFlight builds, each verified on a real device before we called it done.',
      'Then we did something teams skip: we stopped building and audited everything with fresh ' +
      'eyes. The audit found real problems — a language-exam rule that mis-handled Filipino ' +
      'applicants, an interview question whose answer was collected and then silently thrown away, ' +
      'a drift-check that had quietly become dead code. Each fix came with a regression persona, ' +
      'and the contract between the interview and the catalog is now enforced by a script that ' +
      'runs before every deploy. Finding your own bugs before users do isn’t luck — it’s a ' +
      'scheduled activity.',
    ],
  },
  {
    h: 'A living to-do list',
    p: [
      'We keep the backlog in the open and honest — security at the very top, the invariants ' +
      'written down, the gotchas documented next to their fixes. It’s not bureaucracy; it’s memory. ' +
      'When your collaborator is an AI that starts each session cold, the written record is the ' +
      'difference between compounding progress and re-deciding the same thing twice.',
    ],
  },
  {
    h: 'Why this matters, if you lead engineers',
    p: [
      'I built this to prove something to myself: that an engineering leader can direct an AI ' +
      'project the way a principal engineer would — with taste, architecture, and judgment — and ' +
      'go faster for it, not sloppier.',
      'The tools changed; the job didn’t. Someone still has to decide what’s true, what’s in scope, ' +
      'what “done” means, and where never to cut a corner. AI collapses the cost of typing, not the ' +
      'cost of being wrong. The leaders who thrive in this era are the ones who keep their hands on ' +
      'the actual work — who stay close enough to the code to have opinions worth having, and who ' +
      'treat learning this new way of building as the most important skill on their roadmap. Ours ' +
      'included.',
    ],
  },
];

export default function HowIWasBuilt() {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <Seo
        title="How Camino was built | the story behind the app"
        description="The build story of Camino: an AI guide for moving to Spain, built in the open — the thesis, the decisions, and the receipts."
        canonical="https://getcamino.app/how-i-was-built"
      />
      <NavBar />
      <View style={styles.column}>
        <Text style={styles.eyebrow}>BEHIND THE BUILD</Text>
        <Text style={styles.title}>How I was built</Text>
        <Text style={styles.dek}>{DEK}</Text>
        <View style={styles.rule} />

        {SECTIONS.map((s) => (
          <View key={s.h} style={styles.section}>
            <Text style={styles.h}>{s.h}</Text>
            {s.p.map((para, i) => (
              <Text key={i} style={styles.p}>{para}</Text>
            ))}
          </View>
        ))}

        <View style={styles.rule} />
        <Link href="/how-i-was-built/log" style={styles.logLink}>
          Want the receipts? Read the build log — every roadmap item in work order, with the key
          decisions behind each →
        </Link>
        <Link href="/how-i-was-built/roadmap" style={styles.logLink}>
          Where it’s going next: the product roadmap — updated with every release →
        </Link>
        <Text style={styles.logLink} onPress={() => openExternal('https://github.com/nerolabs/camino-app')}>
          And the code itself is public — github.com/nerolabs/camino-app ↗
        </Text>
        <Text style={styles.footer}>
          A first pass, written while the product is still young. We’ll revise it as Camino grows —
          the same way we built it.
        </Text>
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: palette.cal },
  scroll:  { paddingBottom: 80 },
  column:  { alignSelf: 'center', width: '100%', maxWidth: 680, paddingHorizontal: 24, paddingTop: 28 },
  eyebrow: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 2, color: palette.amber, marginBottom: 14 },
  title:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 40, lineHeight: 46, color: palette.indigo, marginBottom: 16 },
  dek:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 18, lineHeight: 28, color: palette.muted },
  rule:    { height: 2, width: 48, backgroundColor: palette.amber, marginVertical: 32, borderRadius: 2 },
  section: { marginBottom: 32 },
  h:       { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 30, color: palette.cobalt, marginBottom: 14 },
  p:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 17, lineHeight: 28, color: palette.indigo, marginBottom: 14 },
  footer:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 24, color: palette.muted, fontStyle: 'italic', marginTop: 4 },
  logLink: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, lineHeight: 23, color: palette.cobalt, marginBottom: 16 },
});
