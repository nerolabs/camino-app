import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Seo from '@/components/Seo';
import { palette } from '@/constants/Colors';
import { GUIDES, CATEGORY_ORDER, shortClause, guideIndexJsonLd } from '@/core/guide-content';
import { categoryLabel } from '@/lib/guideLocale';
import { displayTitle } from '@/lib/catalogTitles';
import { SEV_COLOR, sevLabel } from '@/lib/plan-format';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { BackToTop, useBackToTop } from '@/components/BackToTop';
import { capture } from '@/lib/analytics';

// The guide index: every obligation in the catalog, grouped by category — the public,
// crawlable map of what moving to Spain actually involves. Each row links to its
// /guide/<id> page; the personalized order + dates live behind the interview CTA.

export default function GuideIndex() {
  const { t } = useTranslation('guides');
  const router = useRouter();
  const top = useBackToTop();

  const groups = CATEGORY_ORDER
    .map(cat => ({ cat, items: GUIDES.filter(g => g.category === cat) }))
    .filter(g => g.items.length > 0);

  return (
    <View style={styles.screen}>
    <ScrollView style={styles.scroll} ref={top.ref} onScroll={top.onScroll} scrollEventThrottle={16}>
      <Seo
        localized
        title="Moving to Spain: every step, explained | Get Camino guides"
        description={`All ${GUIDES.length} steps of moving to Spain — visas, residency, tax, healthcare, banking and more. What each one is, when it's due, and the official source.`}
        canonical="https://getcamino.app/guide"
        jsonLd={guideIndexJsonLd()}
      />
      <NavBar />
      <View style={styles.content}>

        <Text style={styles.eyebrow}>{t('index.eyebrow')}</Text>
        <Text style={styles.title} accessibilityRole="header">{t('index.title')}</Text>
        <Text style={styles.dek}>
          {t('index.dek1', { count: GUIDES.length })}<Text style={styles.dekEm}>{t('index.dekYou')}</Text>{t('index.dek2')}
        </Text>

        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => { capture('guide_index_cta_clicked'); router.push('/interview'); }}
        >
          <Text style={styles.ctaBtnText}>{t('index.cta')}</Text>
        </TouchableOpacity>

        {groups.map(({ cat, items }) => (
          <View key={cat} style={styles.section}>
            <Text style={styles.sectionLabel}>{categoryLabel(cat).toUpperCase()}</Text>
            {items.map(g => (
              <Link key={g.id} href={`/guide/${g.id}` as never} asChild>
                <TouchableOpacity style={styles.row}>
                  <View style={[styles.sevDot, { backgroundColor: SEV_COLOR[g.severity] }]} />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{shortClause(displayTitle(g))}</Text>
                    <Text style={styles.rowMeta}>{sevLabel(g.severity)}</Text>
                  </View>
                  <Text style={styles.rowArrow}>→</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        ))}

      </View>
      <Footer />
    </ScrollView>
    <BackToTop visible={top.visible} scrollToTop={top.scrollToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1 },
  scroll:       { flex: 1, backgroundColor: palette.cal },
  content:      { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 28 },

  eyebrow:      { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 1.5, color: palette.amber, marginBottom: 10 },
  title:        { fontFamily: 'Fraunces_600SemiBold', fontSize: 32, lineHeight: 40, color: palette.indigo, marginBottom: 12 },
  dek:          { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 24, color: palette.indigo, marginBottom: 16 },
  dekEm:        { fontStyle: 'italic' },

  ctaBtn:       { backgroundColor: palette.cobalt, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, alignSelf: 'flex-start', marginBottom: 26 },
  ctaBtnText:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },

  section:      { marginBottom: 24 },
  sectionLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 1.2, color: palette.muted, marginBottom: 8 },
  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8, gap: 10 },
  sevDot:       { width: 8, height: 8, borderRadius: 4 },
  rowBody:      { flex: 1 },
  rowTitle:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, lineHeight: 21, color: palette.indigo },
  rowMeta:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted, marginTop: 1 },
  rowArrow:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, color: palette.cobalt },
});
