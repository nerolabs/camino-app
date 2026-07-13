import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Seo from '@/components/Seo';
import { palette } from '@/constants/Colors';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// Shared frame for the legal pages (privacy / terms / aviso legal): same brand, plain
// language, one obvious "last updated" date. Content is data so the pages stay skimmable —
// each page holds an EN and an ES version and selects by the app language (L1); the es
// versions carry an explicit "English prevails" clause (user decision, LOCALIZATION.md §10).

export type LegalSection = { h?: string; body: string[] };
export type LegalContent = { title: string; updated: string; intro?: string; sections: LegalSection[] };

export default function LegalPage({ metaTitle, description, canonical, en, es, summaries }: {
  metaTitle: string; description: string; canonical: string;
  en: LegalContent; es: LegalContent;
  // C5 (Legal #8): a translated "short version" for the fr/de/it pages, shown above the English
  // body (which stays authoritative). Cheap trust win — the summary is what most people read.
  summaries?: Record<string, string>;
}) {
  const { t, i18n } = useTranslation();
  // es has a full courtesy translation; other locales show ENGLISH legal + a one-line native
  // notice (design §7 — industry-normal until each language earns its reviewed translation).
  const { title, updated, intro, sections } = i18n.language === 'es' ? es : en;
  const englishNotice = i18n.language !== 'en' && i18n.language !== 'es';
  // fr/de/it: prefer the localized summary if provided, else the English intro.
  const shownIntro = englishNotice ? (summaries?.[i18n.language] ?? intro) : intro;
  return (
    <ScrollView style={styles.scroll}>
      <Seo localized title={metaTitle} description={description} canonical={canonical} />
      <NavBar />
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        <Text style={styles.updated}>{t('legal.lastUpdated', { date: updated })}</Text>
        {englishNotice && <Text style={styles.intro}>{t('legal.englishNotice')}</Text>}
        {shownIntro && <Text style={styles.intro}>{shownIntro}</Text>}
        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            {s.h && <Text style={styles.h}>{s.h}</Text>}
            {s.body.map((p, j) => <Text key={j} style={styles.p}>{p}</Text>)}
          </View>
        ))}
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: palette.cal },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  title:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 32, lineHeight: 40, color: palette.indigo, marginBottom: 6 },
  updated: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.muted, marginBottom: 18 },
  intro:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 25, color: palette.indigo, marginBottom: 22 },
  section: { marginBottom: 22 },
  h:       { fontFamily: 'Fraunces_600SemiBold', fontSize: 20, lineHeight: 27, color: palette.cobalt, marginBottom: 8 },
  p:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 23, color: palette.indigo, marginBottom: 10 },
});
