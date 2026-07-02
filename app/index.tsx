import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, useWindowDimensions, Animated, Platform,
} from 'react-native';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import NavBar from '@/components/NavBar';

const PHOTOS = [
  { src: require('@/assets/images/spain-gothic-quarter-barcelona.jpg'), label: 'Gothic Quarter, Barcelona' },
  { src: require('@/assets/images/spain-madrid.jpg'),                   label: 'Madrid' },
  { src: require('@/assets/images/spain-plaza-de-espana-in-sevilla.jpg'), label: 'Plaza de España, Sevilla' },
  { src: require('@/assets/images/spain-sevilla-sunset.jpg'),           label: 'Sevilla at sunset' },
];

function RotatingPhoto({ wide }: { wide: boolean }) {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  const containerStyle = wide ? styles.photoContainerWide : styles.photoContainerMobile;
  // Explicit pixel height, not '100%': expo-image's wrapper collapses to height 0 in the
  // static web build when the height comes from a percentage inside a flex child.
  const h = wide ? 600 : 280;
  const imgStyle = { width: '100%' as const, height: h };

  return (
    <View style={containerStyle}>
      {/* Base layer — current photo */}
      <Image source={PHOTOS[current].src} style={imgStyle} resizeMode="cover" />
      {/* Fade layer — next photo */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <Image source={PHOTOS[next].src} style={imgStyle} resizeMode="cover" />
      </Animated.View>
      {/* Label */}
      <View style={styles.photoLabel}>
        <Text style={styles.photoLabelText}>{PHOTOS[current].label}</Text>
      </View>
    </View>
  );
}

export default function LandingPage() {
  const router = useRouter();
  // useWindowDimensions() reports a fallback width during static (server) rendering and
  // doesn't reliably update after hydration on web — which left the desktop hero stuck in
  // the mobile (stacked) layout. Read the real window width on the client instead, and
  // default to the wide layout when the width is unknown (SSR / first paint).
  const { width: rnWidth } = useWindowDimensions();
  const [webWidth, setWebWidth] = useState<number | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const update = () => setWebWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const width = Platform.OS === 'web' ? webWidth : rnWidth;
  const wide = width == null ? true : width >= 768;
  const { user, signInWithGoogle, signOut } = useAuth();
  // Profile + staff flag are loaded at the root (SessionSync in app/_layout.tsx), so they're
  // available on every route and survive reloads — no per-screen loading here.

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      <NavBar />

      {/* ── Hero + Rotating Photo ────────────────────────── */}
      <View style={[styles.heroSection, wide && styles.heroSectionWide]}>

        <View style={[styles.heroText, wide && styles.heroTextWide]}>
          <View style={styles.lolaGlyph}>
            <Text style={styles.lolaGlyphStar}>✦</Text>
          </View>
          <Text style={styles.heroEyebrow}>Moving to Spain</Text>
          <Text style={styles.heroHeadline}>
            Your personalized roadmap for moving to Spain.
          </Text>
          <Text style={styles.heroSub}>
            From choosing the right visa to finding the right city, enrolling your kids in school,
            and getting your paperwork in order — Camino figures out what applies to you
            and what to do first.
          </Text>
          <TouchableOpacity style={styles.heroCta} onPress={() => router.push('/interview')}>
            <Text style={styles.heroCtaText}>Build my free roadmap →</Text>
          </TouchableOpacity>
          <Text style={styles.heroDisclaimer}>Free · Takes about 3 minutes · No account needed to start</Text>
        </View>

        <RotatingPhoto wide={wide} />
      </View>

      {/* ── Topic strip ─────────────────────────────────── */}
      <View style={styles.strip}>
        <Text style={styles.stripText}>
          Visas · Where to live · Schools · Banking · NIE · TIE · Empadronamiento · Modelo 720 · Driving · Remote work · and more
        </Text>
      </View>

      {/* ── Footer ──────────────────────────────────────── */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>Camino</Text>
        <Text style={styles.footerNote}>Guidance only — not legal or tax advice.</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: palette.cal },
  content:  { paddingBottom: 0 },


  // Hero section
  heroSection:     { backgroundColor: palette.cal },
  heroSectionWide: { flexDirection: 'row', alignItems: 'stretch', minHeight: 600 },
  heroText:        { padding: 32, paddingTop: 40, paddingBottom: 48 },
  heroTextWide:    { flex: 1, padding: 56, justifyContent: 'center', maxWidth: 560 },
  lolaGlyph:       { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.amber, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  lolaGlyphStar:   { fontSize: 22, color: palette.cal },
  heroEyebrow:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.cobalt, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 },
  heroHeadline:    { fontFamily: 'Fraunces_600SemiBold', fontSize: 40, color: palette.indigo, lineHeight: 50, marginBottom: 18 },
  heroSub:         { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, color: palette.indigo, lineHeight: 26, marginBottom: 32, maxWidth: 460 },
  heroCta:         { backgroundColor: palette.cobalt, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 14, alignSelf: 'flex-start' },
  heroCtaText:     { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cal },
  heroDisclaimer:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted },

  // Rotating photo
  photoFill:            { width: '100%', height: '100%' },
  photoContainerWide:   { flex: 1, position: 'relative', height: 600, overflow: 'hidden' },
  photoContainerMobile: { height: 280, position: 'relative', overflow: 'hidden' },
  photoLabel:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(21,36,59,0.5)', paddingHorizontal: 16, paddingVertical: 10 },
  photoLabelText:       { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.cal },

  // Strip
  strip:     { backgroundColor: palette.cobalt, paddingVertical: 14, paddingHorizontal: 24 },
  stripText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  // Footer
  footer:     { backgroundColor: palette.indigo, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  footerLogo: { fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: palette.cal },
  footerNote: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: 'rgba(251,250,247,0.5)' },
});
