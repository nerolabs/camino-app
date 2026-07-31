import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/Colors';

// Android closed-beta recruitment band. Google's production-access gate for a new personal
// developer account = a CLOSED test with 12 testers opted-in 14 continuous days (internal and
// open testing don't count). Rather than spam an iPhone-heavy personal network, we recruit real
// target users straight off the site: this band appears ONLY to Android web visitors and offers
// them early access. iPhone/desktop visitors never see it (they'd get an app they can't install).
//
// DORMANT BY DESIGN: with ANDROID_BETA_JOIN_URL === '' the band renders nothing, so this is safe
// to ship before recruitment opens. Flip it live by setting the URL below to the closed-test
// join link (Play Console → Closed testing → Testers → "Copy link", or the Google Group join URL)
// — but ONLY after the interview is proven working on a real Android install (else recruits hit a
// dead Lola) and the store listing/screenshots are in so the closed release can complete.
export const ANDROID_BETA_JOIN_URL = '';

// Web-only + this-device-is-Android + recruitment actually open (a join URL is set). joinUrl is a
// param so both branches are unit-testable; it defaults to the module constant for the real call.
export function androidBetaVisible(
  os: typeof Platform.OS,
  isAndroidUA: boolean,
  joinUrl: string = ANDROID_BETA_JOIN_URL,
): boolean {
  return os === 'web' && isAndroidUA && joinUrl.length > 0;
}

export default function AndroidBetaOptIn() {
  const { t } = useTranslation();
  // Detect after mount only: keeps this off the static-export/SSR path (no `navigator` there) and
  // avoids any hydration mismatch — it's purely a client-side, this-device affordance.
  const [isAndroidUA, setIsAndroidUA] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)) {
      setIsAndroidUA(true);
    }
  }, []);

  if (!androidBetaVisible(Platform.OS, isAndroidUA)) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{t('androidBeta.eyebrow')}</Text>
      <Text style={styles.title} accessibilityRole="header">{t('androidBeta.title')}</Text>
      <Text style={styles.sub}>{t('androidBeta.sub')}</Text>
      <TouchableOpacity
        style={styles.cta}
        onPress={() => Linking.openURL(ANDROID_BETA_JOIN_URL)}
        accessibilityRole="link"
        accessibilityLabel={t('androidBeta.ctaA11y')}
      >
        <Text style={styles.ctaText}>{t('androidBeta.cta')}</Text>
      </TouchableOpacity>
      <Text style={styles.fine}>{t('androidBeta.fine')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:    { backgroundColor: palette.indigo, paddingVertical: 44, paddingHorizontal: 24, alignItems: 'center', gap: 10 },
  eyebrow: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 2, color: palette.amber },
  title:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 31, color: palette.cal, textAlign: 'center', maxWidth: 560 },
  sub:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 23, color: 'rgba(251,250,247,0.85)', textAlign: 'center', maxWidth: 500 },
  cta:     { backgroundColor: palette.amber, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 30, marginTop: 8 },
  ctaText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.indigo },
  fine:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: 'rgba(251,250,247,0.6)', textAlign: 'center', maxWidth: 460, marginTop: 2 },
});
