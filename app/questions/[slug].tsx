import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { palette } from '@/constants/Colors';
import { QUESTIONS, questionBySlug } from '@/core/questions';
import { guideById, shortClause } from '@/core/guide-content';
import Seo from '@/components/Seo';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { capture } from '@/lib/analytics';

// One statically-rendered page per curated question (core/questions.ts). Answers are
// hand-written from catalog facts under a mechanical digit guard (invariant 3); the
// sourced depth lives in the linked guides, the personal version in the interview.

export function generateStaticParams(): Record<string, string>[] {
  return QUESTIONS.map(q => ({ slug: q.slug }));
}

export default function QuestionPage() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = questionBySlug.get(typeof slug === 'string' ? slug : '') ?? QUESTIONS[0];
  const related = q.related.map(id => guideById.get(id)).filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer.join('\n\n') },
    }],
  };

  return (
    <ScrollView style={styles.flex}>
      <Seo
        title={`${q.question} | Get Camino`}
        description={q.answer[0].slice(0, 155)}
        canonical={`https://getcamino.app/questions/${q.slug}`}
        jsonLd={jsonLd}
      />
      <NavBar />
      <View style={styles.column}>
        <Text style={styles.eyebrow}>MOVING TO SPAIN · QUESTIONS</Text>
        <Text style={styles.title} accessibilityRole="header">{q.question}</Text>
        {q.answer.map((p, i) => <Text key={i} style={styles.p}>{p}</Text>)}

        {related.length > 0 && (
          <View style={styles.relatedCard}>
            <Text style={styles.relatedLabel}>THE STEPS BEHIND THIS ANSWER</Text>
            {related.map(g => (
              <Link key={g!.id} href={`/guide/${g!.id}` as never} style={styles.relatedLink}>
                {shortClause(g!.title)} →
              </Link>
            ))}
          </View>
        )}

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Which of this applies to you?</Text>
          <Text style={styles.ctaBody}>
            Answer a short interview and Get Camino builds your personal roadmap — the steps
            that apply to your situation, in order, with real deadlines and official sources.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => { capture('question_cta_clicked', { slug: q.slug }); router.push(`/interview?from=${q.related[0] ?? ''}` as never); }}
          >
            <Text style={styles.ctaBtnText}>Build my free roadmap</Text>
          </TouchableOpacity>
        </View>

        <Link href="/questions" style={styles.backLink}>All questions →</Link>
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: palette.cal },
  column:       { alignSelf: 'center', width: '100%', maxWidth: 680, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 56 },
  eyebrow:      { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 2, color: palette.amber, marginBottom: 14 },
  title:        { fontFamily: 'Fraunces_600SemiBold', fontSize: 34, lineHeight: 41, color: palette.indigo, marginBottom: 18 },
  p:            { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 26, color: palette.indigo, marginBottom: 14 },
  relatedCard:  { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 12, padding: 16, marginTop: 12, gap: 8 },
  relatedLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 1, color: palette.muted },
  relatedLink:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, lineHeight: 21, color: palette.cobalt },
  ctaCard:      { backgroundColor: '#EEF2F9', borderWidth: 1, borderColor: palette.cobalt, borderRadius: 14, padding: 20, marginTop: 22 },
  ctaTitle:     { fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: palette.indigo, marginBottom: 6 },
  ctaBody:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 21, color: palette.indigo, marginBottom: 14 },
  ctaBtn:       { backgroundColor: palette.cobalt, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, alignSelf: 'flex-start' },
  ctaBtnText:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },
  backLink:     { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cobalt, marginTop: 22 },
});
