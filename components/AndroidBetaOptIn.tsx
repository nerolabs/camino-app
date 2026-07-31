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
// LIVE 2026-07-31: recruitment opened once Play Integrity was proven on a real Android install and
// the closed-test release (vc2) was submitted for review. The band points at the contact funnel
// (?topic=android-beta) rather than the Play "Copy link" opt-in URL, because a Google Workspace
// domain can't self-serve a Google Group and the opt-in link only enrolls emails already on the
// tester list — so we COLLECT emails first: the recruit leaves an address, Andrew adds it to the
// Play Console tester list, then sends them the opt-in link. Switch this to the direct opt-in link
// later if we ever pre-authorise open enrolment. Set '' again to take the band dormant.
export const ANDROID_BETA_JOIN_URL = 'https://getcamino.app/contact?topic=android-beta';

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
