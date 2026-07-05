import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Seo from '@/components/Seo';
import { palette } from '@/constants/Colors';
import {
  guideById, metaDescription, related, shortClause, guideJsonLd,
} from '@/core/guide-content';
import { displayProse, categoryLabel, categoryTip, describeTimingLocalized } from '@/lib/guideLocale';
import { displayTitle } from '@/lib/catalogTitles';
import { sevLabel, sevBlurb, sourceBlurb, openExternal } from '@/lib/plan-format';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { capture } from '@/lib/analytics';

// One public, statically-rendered page per catalog obligation (the "60 free guides").
// Everything on the page is catalog DATA + fixed blurbs — no LLM, no invented facts
// (invariant 3). The personalized version of this step — with real dates, in order —
// is the interview CTA. Same pattern as /sample-plan: the payoff before the ask.

export function generateStaticParams(): Record<string, string>[] {
  return [...guideById.keys()].map(id => ({ id }));
}

export default function GuidePage() {
  const { t } = useTranslation('guides');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const g = guideById.get(id ?? '');

  if (!g) {
    return (
      <ScrollView style={styles.scroll}>
        <NavBar />
        <View style={styles.content}>
          <Text style={styles.title}>{t('detail.notFound')}</Text>
          <Link href="/guide" style={styles.link}>{t('detail.browseAll')}</Link>
        </View>
        <Footer />
      </ScrollView>
    );
  }

  const deps = g.depends_on
    .map(d => { const dep = guideById.get(d); return dep ? { id: d, title: displayTitle(dep) } : null; })
    .filter((d): d is { id: string; title: string } => !!d);
  const more = related(g);

  return (
    <ScrollView style={styles.scroll}>
      <Seo
        localized
        title={`${shortClause(g.title)} — moving to Spain | Get Camino`}
        description={metaDescription(g)}
        canonical={`https://getcamino.app/guide/${g.id}`}
        jsonLd={guideJsonLd(g)}
      />
      <NavBar />
      <View style={styles.content}>

        <Link href="/guide" style={styles.crumb}>{t('detail.crumb')}</Link>
        <Text style={styles.eyebrow}>{categoryLabel(g.category).toUpperCase()} · {sevLabel(g.severity).toUpperCase()}</Text>
        <Text style={styles.title} accessibilityRole="header">{displayTitle(g)}</Text>

        {/* Curated narrative — restates catalog facts + process context only; the digit-lint
            tests guarantee no number appears here that isn't in the title (invariant 3),
            in every language. */}
        {displayProse(g.id) && <Text style={styles.prose}>{displayProse(g.id)}</Text>}

        <View style={styles.factCard}>
          <Text style={styles.factLabel}>{t('detail.whenDue')}</Text>
          <Text style={styles.factText}>{describeTimingLocalized(g)}</Text>

          <Text style={styles.factLabel}>{t('detail.whyMatters')}</Text>
          <Text style={styles.factText}>{sevBlurb(g.severity)} {sourceBlurb(g.source)}</Text>

          {g.regional && (
            <>
              <Text style={styles.factLabel}>{t('detail.regionalLabel')}</Text>
              <Text style={styles.factText}>{t('detail.regionalBody')}</Text>
            </>
          )}

          {deps.length > 0 && (
            <>
              <Text style={styles.factLabel}>{t('detail.whatFirst')}</Text>
              {deps.map(d => (
                <Link key={d.id} href={`/guide/${d.id}` as never} style={styles.depLink}>
                  • {shortClause(d.title)}
                </Link>
              ))}
            </>
          )}

          {g.source_url && (
            <TouchableOpacity onPress={() => openExternal(g.source_url!)}>
              <Text style={styles.sourceLink}>{t('detail.sourceLink')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>{t('detail.tipLabel')}</Text>
          <Text style={styles.tipText}>{categoryTip(g.category)}</Text>
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>{t('detail.ctaTitle')}</Text>
          <Text style={styles.ctaBody}>
            {t('detail.ctaBody')}
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => { capture('guide_cta_clicked', { guide_id: g.id }); router.push(`/interview?from=${g.id}` as never); }}
          >
            <Text style={styles.ctaBtnText}>{t('detail.ctaButton')}</Text>
          </TouchableOpacity>
          <Text style={styles.ctaNote}>{t('detail.ctaNote')}</Text>
        </View>

        {more.length > 0 && (
          <View style={styles.moreBlock}>
            <Text style={styles.moreLabel}>{t('detail.moreIn', { category: categoryLabel(g.category).toUpperCase() })}</Text>
            {more.map(m => (
              <Link key={m.id} href={`/guide/${m.id}` as never} style={styles.moreLink}>
                {shortClause(displayTitle(m))} →
              </Link>
            ))}
          </View>
        )}
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: palette.cal },
  content:    { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 28 },

  crumb:      { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: palette.muted, marginBottom: 18 },
  eyebrow:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 1.5, color: palette.amber, marginBottom: 10 },
  title:      { fontFamily: 'Fraunces_600SemiBold', fontSize: 30, lineHeight: 38, color: palette.indigo, marginBottom: 14 },
  prose:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 25, color: palette.indigo, marginBottom: 20 },
  link:       { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cobalt, marginTop: 12 },

  factCard:   { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 14, padding: 20, marginBottom: 14 },
  factLabel:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 1.2, color: palette.muted, marginTop: 12, marginBottom: 4 },
  factText:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 23, color: palette.indigo },
  depLink:    { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, lineHeight: 24, color: palette.cobalt },
  sourceLink: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cobalt, marginTop: 16 },

  tipCard:    { backgroundColor: '#FBF3E2', borderWidth: 1, borderColor: palette.amber, borderRadius: 14, padding: 18, marginBottom: 14 },
  tipLabel:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 1.2, color: palette.amber, marginBottom: 6 },
  tipText:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 23, color: palette.indigo },

  ctaCard:    { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 14, padding: 20, marginBottom: 22 },
  ctaTitle:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: palette.indigo, marginBottom: 8 },
  ctaBody:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 22, color: palette.indigo, marginBottom: 14 },
  ctaBtn:     { backgroundColor: palette.cobalt, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, alignSelf: 'flex-start' },
  ctaBtnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },
  ctaNote:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted, marginTop: 8 },

  moreBlock:  { marginBottom: 10 },
  moreLabel:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 1.2, color: palette.muted, marginBottom: 10 },
  moreLink:   { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, lineHeight: 30, color: palette.cobalt },
});
