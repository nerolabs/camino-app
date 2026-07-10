import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Animated,
} from 'react-native';
import Seo from '@/components/Seo';
import { palette } from '@/constants/Colors';
import { useWide } from '@/lib/useWide';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { siteJsonLd } from '@/core/guide-content';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import StoreBadges from '@/components/StoreBadges';
import HomeSections from '@/components/landing/HomeSections';

// Labels are i18n keys (common:home.photos.*) so captions localize with the rest of the chrome.
const PHOTOS = [
  { src: require('@/assets/images/spain-gothic-quarter-barcelona.jpg'), labelKey: 'home.photos.gothicQuarter' },
  { src: require('@/assets/images/spain-madrid.jpg'),                   labelKey: 'home.photos.madrid' },
  { src: require('@/assets/images/spain-plaza-de-espana-in-sevilla.jpg'), labelKey: 'home.photos.plazaEspana' },
  { src: require('@/assets/images/spain-sevilla-sunset.jpg'),           labelKey: 'home.photos.sevillaSunset' },
];

function RotatingPhoto({ wide }: { wide: boolean }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return; // rest on the current photo — no endless cross-fade (a11y)
    const interval = setInterval(() => {
      // fade in the next photo over the current
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start(() => {
        // swap current → next, reset overlay to transparent
        setCurrent(c => {
          const n = (c + 1) % PHOTOS.length;
          setNext((n + 1) % PHOTOS.length);
          return n;
        });
        fadeAnim.setValue(0);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  const containerStyle = wide ? styles.photoContainerWide : styles.photoContainerMobile;
  // Explicit pixel height, not '100%': expo-image's wrapper collapses to height 0 in the
  // static web build when the height comes from a percentage inside a flex child.
  const h = wide ? 380 : 280;
  const imgStyle = { width: '100%' as const, height: h };

  return (
    <View style={containerStyle}>
      {/* Base layer — current photo */}
      <Image source={PHOTOS[current].src} style={imgStyle} resizeMode="cover" accessible accessibilityRole="image" accessibilityLabel={t('home.photoA11y', { label: t(PHOTOS[current].labelKey) })} />
      {/* Fade layer — next photo */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <Image source={PHOTOS[next].src} style={imgStyle} resizeMode="cover" />
      </Animated.View>
      {/* Label */}
      <View style={styles.photoLabel}>
        <Text style={styles.photoLabelText}>{t(PHOTOS[current].labelKey)}</Text>
      </View>
    </View>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const wide = useWide(); // shared hydration-safe breakpoint (see lib/useWide.ts)
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Seo
        localized
        title="Get Camino — your personalized roadmap for moving to Spain"
        description="Get Camino turns moving to Spain into a step-by-step roadmap: the right visa, residency, schools, banking and bureaucracy — sequenced for your situation, every official step backed by its government source. Free, about 3 minutes."
        canonical="https://getcamino.app/"
        jsonLd={siteJsonLd()}
      />

      <NavBar />

      {/* ── Hero + Rotating Photo ────────────────────────── */}
      <View style={[styles.heroSection, wide && styles.heroSectionWide]}>

        <View style={[styles.heroText, wide && styles.heroTextWide]}>
          <View style={styles.lolaGlyph}>
            <Text style={styles.lolaGlyphStar}>✦</Text>
          </View>
          <Text style={styles.heroEyebrow}>{t('home.eyebrow')}</Text>
          <Text style={styles.heroHeadline} accessibilityRole="header">
            {t('home.headline')}
          </Text>
          <Text style={styles.heroSub}>
            {t('home.sub')}
          </Text>
          <TouchableOpacity style={styles.heroCta} onPress={() => router.push('/interview')}>
            <Text style={styles.heroCtaText}>{t('home.cta')}</Text>
          </TouchableOpacity>
          <Text style={styles.heroDisclaimer}>{t('home.disclaimer')}</Text>
          {/* Show the payoff before the ask: a real engine-built roadmap for a sample persona. */}
          <TouchableOpacity onPress={() => router.push('/sample-plan')}>
            <Text style={styles.heroSampleLink}>{t('home.sampleLink')}</Text>
          </TouchableOpacity>
        </View>

        <RotatingPhoto wide={wide} />
      </View>

      {/* ── Topic strip → the guides (these topics are real pages now) ── */}
      <TouchableOpacity style={styles.strip} onPress={() => router.push('/guide')} accessibilityLabel={t('home.browseGuidesA11y')}>
        <Text style={styles.stripText}>
          {t('home.strip')}
          <Text style={styles.stripLink}>{t('home.stripLink')}</Text>
        </Text>
      </TouchableOpacity>

      {/* Variant C won the 2026-07-10 landing lab: how-it-works now lives HERE as a live demo,
          followed by proof, trust, and a final CTA (docs/LANDING-REDESIGN.md). */}
      <HomeSections />

      <StoreBadges />

      <Footer />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: palette.cal },
  content:  { paddingBottom: 0 },


  // Hero section
  heroSection:     { backgroundColor: palette.cal },
  heroSectionWide: { flexDirection: 'row', alignItems: 'center', maxWidth: 1080, width: '100%', alignSelf: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 28 },
  heroText:        { padding: 32, paddingTop: 40, paddingBottom: 48 },
  heroTextWide:    { flex: 1, padding: 0, justifyContent: 'center', maxWidth: 520 },
  lolaGlyph:       { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.amber, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  lolaGlyphStar:   { fontSize: 22, color: palette.cal },
  heroEyebrow:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.cobalt, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 },
  heroHeadline:    { fontFamily: 'Fraunces_600SemiBold', fontSize: 40, color: palette.indigo, lineHeight: 50, marginBottom: 18 },
  heroSub:         { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, color: palette.indigo, lineHeight: 26, marginBottom: 32, maxWidth: 460 },
  heroCta:         { backgroundColor: palette.cobalt, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 14, alignSelf: 'flex-start' },
  heroCtaText:     { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cal },
  heroDisclaimer:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted },
  heroSampleLink:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cobalt, marginTop: 12 },

  // Rotating photo
  photoFill:            { width: '100%', height: '100%' },
  photoContainerWide:   { flex: 1, position: 'relative', height: 380, borderRadius: 18, overflow: 'hidden' },
  photoContainerMobile: { height: 280, position: 'relative', overflow: 'hidden' },
  photoLabel:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(21,36,59,0.5)', paddingHorizontal: 16, paddingVertical: 10 },
  photoLabelText:       { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.cal },

  // Strip
  strip:     { backgroundColor: palette.cobalt, paddingVertical: 14, paddingHorizontal: 24 },
  stripText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  stripLink: { fontFamily: 'HankenGrotesk_600SemiBold', color: '#FFFFFF' },
});
