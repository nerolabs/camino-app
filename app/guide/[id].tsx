import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import Seo from '@/components/Seo';
import { palette } from '@/constants/Colors';
import {
  guideById, titleById, describeTiming, metaDescription, related, shortClause, CATEGORY_LABEL, guideJsonLd,
} from '@/core/guide-content';
import { GUIDE_PROSE } from '@/core/guide-prose';
import { SEV_LABEL, SEV_BLURB, SOURCE_BLURB, openExternal } from '@/lib/plan-format';
import { CATEGORY_TIP } from '@/core/email-digest';
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
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const g = guideById.get(id ?? '');

  if (!g) {
    return (
      <ScrollView style={styles.scroll}>
        <NavBar />
        <View style={styles.content}>
          <Text style={styles.title}>Guide not found</Text>
          <Link href="/guide" style={styles.link}>Browse all guides →</Link>
        </View>
        <Footer />
      </ScrollView>
    );
  }

  const deps = g.depends_on.map(d => ({ id: d, title: titleById.get(d) })).filter(d => d.title);
  const more = related(g);

  return (
    <ScrollView style={styles.scroll}>
      <Seo
        title={`${shortClause(g.title)} — moving to Spain | Camino`}
        description={metaDescription(g)}
        canonical={`https://getcamino.app/guide/${g.id}`}
        jsonLd={guideJsonLd(g)}
      />
      <NavBar />
      <View style={styles.content}>

        <Link href="/guide" style={styles.crumb}>← All guides</Link>
        <Text style={styles.eyebrow}>{CATEGORY_LABEL[g.category].toUpperCase()} · {SEV_LABEL[g.severity].toUpperCase()}</Text>
        <Text style={styles.title} accessibilityRole="header">{g.title}</Text>

        {/* Curated narrative — restates catalog facts + process context only; the digit-lint
            test guarantees no number appears here that isn't in the title (invariant 3). */}
        {GUIDE_PROSE[g.id] && <Text style={styles.prose}>{GUIDE_PROSE[g.id]}</Text>}

        <View style={styles.factCard}>
          <Text style={styles.factLabel}>WHEN IT'S DUE</Text>
          <Text style={styles.factText}>{describeTiming(g)}</Text>

          <Text style={styles.factLabel}>WHY IT MATTERS</Text>
          <Text style={styles.factText}>{SEV_BLURB[g.severity]} {SOURCE_BLURB[g.source]}</Text>

          {g.regional && (
            <>
              <Text style={styles.factLabel}>WHERE YOU LIVE MATTERS</Text>
              <Text style={styles.factText}>The specifics are set by each comunidad autónoma — the official source covers the national rules; your region's own rates and windows apply. Camino's interview asks where you're settling and flags this step accordingly.</Text>
            </>
          )}

          {deps.length > 0 && (
            <>
              <Text style={styles.factLabel}>WHAT COMES FIRST</Text>
              {deps.map(d => (
                <Link key={d.id} href={`/guide/${d.id}` as never} style={styles.depLink}>
                  • {shortClause(d.title!)}
                </Link>
              ))}
            </>
          )}

          {g.source_url && (
            <TouchableOpacity onPress={() => openExternal(g.source_url!)}>
              <Text style={styles.sourceLink}>View the official source ↗</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>LOLA'S TIP</Text>
          <Text style={styles.tipText}>{CATEGORY_TIP[g.category]}</Text>
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Where does this fall in your move?</Text>
          <Text style={styles.ctaBody}>
            Whether this step even applies — and when it's due — depends on your passport, work,
            family and plans. Answer a few questions and Camino builds your full roadmap, every
            step in the right order with real deadlines.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => { capture('guide_cta_clicked', { guide_id: g.id }); router.push(`/interview?from=${g.id}` as never); }}
          >
            <Text style={styles.ctaBtnText}>Build my free roadmap →</Text>
          </TouchableOpacity>
          <Text style={styles.ctaNote}>Free · about 3 minutes · no account needed to start</Text>
        </View>

        {more.length > 0 && (
          <View style={styles.moreBlock}>
            <Text style={styles.moreLabel}>MORE IN {CATEGORY_LABEL[g.category].toUpperCase()}</Text>
            {more.map(m => (
              <Link key={m.id} href={`/guide/${m.id}` as never} style={styles.moreLink}>
                {shortClause(m.title)} →
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
