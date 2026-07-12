import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { palette } from '@/constants/Colors';
import { QUESTIONS } from '@/core/questions';
import Seo from '@/components/Seo';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// The question index — the honest FAQ, each answer built strictly from catalog facts.

export default function QuestionsIndex() {
  return (
    <ScrollView style={styles.flex}>
      <Seo
        title="Moving to Spain — the questions everyone asks | Get Camino"
        description="Visas, income requirements, the padrón, the NIE, apostilles, Modelo 720 — straight answers built from official sources, with the sourced step behind each one."
        canonical="https://getcamino.app/questions"
      />
      <NavBar />
      <View style={styles.column}>
        <Text style={styles.eyebrow}>MOVING TO SPAIN</Text>
        <Text style={styles.title} accessibilityRole="header">The questions everyone asks</Text>
        <Text style={styles.dek}>
          Straight answers, built from the same officially-sourced catalog your roadmap is —
          each with the real steps behind it.
        </Text>
        <View style={styles.rule} />
        {QUESTIONS.map(q => (
          <Link key={q.slug} href={`/questions/${q.slug}` as never} style={styles.qLink}>
            {q.question} →
          </Link>
        ))}
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: palette.cal },
  column:  { alignSelf: 'center', width: '100%', maxWidth: 680, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 56 },
  eyebrow: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 2, color: palette.amber, marginBottom: 14 },
  title:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 38, lineHeight: 44, color: palette.indigo, marginBottom: 14 },
  dek:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 17, lineHeight: 26, color: palette.muted },
  rule:    { height: 2, width: 48, backgroundColor: palette.amber, marginVertical: 26, borderRadius: 2 },
  qLink:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 17, lineHeight: 30, color: palette.cobalt, marginBottom: 10 },
});
