import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import Seo from '@/components/Seo';
import { palette } from '@/constants/Colors';
import { useWide } from '@/lib/useWide';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const STEPS = [
  {
    num: '01',
    title: 'Tell Lola your situation',
    body: 'A short conversation — not a form. Lola asks only what matters: your nationality, family, work situation, budget, and what kind of life you\'re imagining in Spain.',
  },
  {
    num: '02',
    title: 'Get your personal roadmap',
    body: 'Every decision and step that applies to you, in the right order. Visa type, where to live, schools, banking, bureaucracy — all sequenced so nothing blocks something else.',
  },
  {
    num: '03',
    title: 'Work through it together',
    body: 'Lola coaches you step by step. Your roadmap updates as you make decisions and your situation becomes clearer — and a short weekly email keeps what\'s due in view, never more than a handful of tasks.',
  },
];

const TOPICS = [
  { icon: '🗺️', title: 'Where to live', body: 'Beach or mountains? City or village? International or authentically Spanish? Lola helps you think it through and can suggest a scouting trip as a first step.' },
  { icon: '🛂', title: 'Visa & immigration', body: 'Non-Lucrative Visa, Digital Nomad Visa, family reunification, student visa — the right one depends on your income, work situation, and timeline. Lola finds your path.' },
  { icon: '🏫', title: 'Schools & education', body: 'Public bilingual, international private, home country curriculum — the options vary enormously by city. Lola maps what\'s available where you\'re looking.' },
  { icon: '💼', title: 'Work & remote income', body: 'Working remotely, starting a Spanish job search, or freelancing — each has different visa and tax implications. Lola builds the right path for your situation.' },
  { icon: '🏦', title: 'Banking & money', body: 'How to open a Spanish bank account, which services (Wise, Revolut) make sense for currency exchange, and how to transfer larger sums without losing money.' },
  { icon: '📋', title: 'Bureaucracy, in order', body: 'NIE, empadronamiento, TIE, health card, Modelo 720, driving licence — all the paperwork, sequenced correctly, with real deadlines surfaced before they sneak up on you.' },
];

const PROBLEMS = [
  { icon: '🔀', text: 'Some steps unlock others — getting the sequence right saves you weeks of backtracking.' },
  { icon: '📅', text: 'Some steps have real windows. Knowing them in advance means no surprises.' },
  { icon: '🧩', text: 'What applies to you depends on your nationality, family, budget, work situation, and more.' },
  { icon: '📋', text: 'There\'s no single source of truth — it\'s scattered across forums, Facebook groups, and outdated blog posts.' },
];

export default function HowItWorksPage() {
  const router = useRouter();
  const wide = useWide(); // shared hydration-safe breakpoint (raw useWindowDimensions left desktop stuck stacked)

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Seo
        title="How Camino works — moving to Spain, in the right order"
        description="Tell Lola your situation, get a personal roadmap, work through it together. Every official step cites its government source; sequence and deadlines come built in."
        canonical="https://getcamino.app/how-it-works"
      />
      <NavBar />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>How Camino works</Text>
        <Text style={styles.headline}>From first question{'\n'}to clear next step.</Text>
        <Text style={styles.sub}>
          Moving to Spain is manageable when you know what applies to you and what comes first.
          That's all Camino does — in three steps.
        </Text>
      </View>

      {/* Steps */}
      <View style={styles.section}>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNum}>{step.num}</Text>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* What's covered */}
      <View style={[styles.section, styles.sectionAlt]}>
        <Text style={styles.sectionEyebrow}>What's covered</Text>
        <Text style={styles.sectionHeadline}>The full picture, not just the paperwork.</Text>
        <Text style={styles.sectionBody}>
          Most relocation guides stop at bureaucracy. Camino starts with the bigger questions
          and works through the practical steps that follow — and every official step cites the
          government source it comes from, so you can check it yourself.
        </Text>
        <Link href="/guide" style={styles.guidesLink}>Browse all 60 steps as free guides →</Link>
        <View style={[styles.topicGrid, wide && styles.topicGridWide]}>
          {TOPICS.map((t, i) => (
            <View key={i} style={[styles.topicCard, wide && styles.topicCardWide]}>
              <Text style={styles.topicIcon}>{t.icon}</Text>
              <Text style={styles.topicTitle}>{t.title}</Text>
              <Text style={styles.topicBody}>{t.body}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Why it matters */}
      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Why sequence matters</Text>
        <Text style={styles.sectionHeadline}>Moving abroad is a maze with no map.</Text>
        <View style={[styles.problemGrid, wide && styles.problemGridWide]}>
          {PROBLEMS.map((p, i) => (
            <View key={i} style={[styles.problemCard, wide && styles.problemCardWide]}>
              <Text style={styles.problemIcon}>{p.icon}</Text>
              <Text style={styles.problemText}>{p.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Lola */}
      <View style={[styles.section, styles.sectionDark]}>
        <View style={styles.lolaGlyph}><Text style={styles.lolaGlyphStar}>✦</Text></View>
        <Text style={styles.lolaQuote}>"I keep the map. A gestor signs the papers."</Text>
        <Text style={styles.lolaAttrib}>— Lola, your Camino guide</Text>
        <Text style={styles.lolaBody}>
          Lola is your AI guide — warm, bilingual, and always honest.
          She'll never invent a deadline or dress up something important as optional.
          Guidance, not legal advice.
        </Text>
      </View>

      {/* Closing CTA — the page used to explain everything and then ask for nothing. */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaHeadline}>Ready to see your own roadmap?</Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/interview')}>
          <Text style={styles.ctaBtnText}>Build my free roadmap →</Text>
        </TouchableOpacity>
        <Text style={styles.ctaNote}>Free · about 3 minutes · no account needed to start</Text>
        <Link href="/sample-plan" style={styles.ctaSampleLink}>Not sure yet? Peek at a sample roadmap first →</Link>
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: palette.cal },
  content:  { paddingBottom: 0 },

  header:   { backgroundColor: palette.indigo, padding: 40, paddingTop: 64, paddingBottom: 56 },
  eyebrow:  { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.amber, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 },
  headline: { fontFamily: 'Fraunces_600SemiBold', fontSize: 38, color: palette.cal, lineHeight: 46, marginBottom: 16 },
  sub:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, color: 'rgba(251,250,247,0.75)', lineHeight: 25, maxWidth: 520 },

  section:         { padding: 40, paddingVertical: 48 },
  sectionAlt:      { backgroundColor: '#F0F3F8' },
  sectionEyebrow:  { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.cobalt, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  sectionHeadline: { fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: palette.indigo, marginBottom: 12, lineHeight: 36 },
  sectionBody:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.indigo, lineHeight: 24, marginBottom: 28 },

  stepRow:   { flexDirection: 'row', gap: 20, marginBottom: 36 },
  stepNum:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 32, color: palette.amber, width: 48 },
  stepBody:  { flex: 1 },
  stepTitle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 17, color: palette.indigo, marginBottom: 6 },
  stepText:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: '#4A5568', lineHeight: 23 },

  topicGrid:     { gap: 12 },
  topicGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  topicCard:     { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, gap: 6 },
  topicCardWide: { width: '48%' },
  topicIcon:     { fontSize: 24 },
  topicTitle:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.indigo },
  topicBody:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: '#4A5568', lineHeight: 21 },

  problemGrid:     { gap: 12, marginTop: 8 },
  problemGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  problemCard:     { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, gap: 10 },
  problemCardWide: { width: '48%' },
  problemIcon:     { fontSize: 24 },
  problemText:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.indigo, lineHeight: 22 },

  sectionDark: { backgroundColor: palette.indigo, alignItems: 'center', padding: 48 },
  lolaGlyph:      { width: 48, height: 48, borderRadius: 24, backgroundColor: palette.amber, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  lolaGlyphStar:  { fontSize: 20, color: palette.cal },
  lolaQuote:      { fontFamily: 'Fraunces_400Regular', fontSize: 22, color: palette.cal, textAlign: 'center', fontStyle: 'italic', lineHeight: 32, marginBottom: 8, maxWidth: 480 },
  lolaAttrib:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: palette.amber, marginBottom: 20 },
  lolaBody:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: 'rgba(251,250,247,0.75)', textAlign: 'center', lineHeight: 24, maxWidth: 440 },

  guidesLink: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cobalt, marginBottom: 24 },

  ctaSection:    { alignItems: 'center', padding: 48, backgroundColor: palette.cal },
  ctaHeadline:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 26, color: palette.indigo, textAlign: 'center', marginBottom: 20 },
  ctaBtn:        { backgroundColor: palette.cobalt, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 12 },
  ctaBtnText:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cal },
  ctaNote:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted, marginBottom: 12 },
  ctaSampleLink: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cobalt },
});
