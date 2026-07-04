import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { palette } from '@/constants/Colors';

// Store-availability band. Until the apps are actually published we render an HONEST
// "coming soon" stub — deliberately NOT Apple/Google's official badge artwork (their brand
// guidelines forbid it without a live listing, and a real "Download" badge that can't
// download would be a lie). When the listings go live, pass iosUrl / androidUrl: the caption
// flips to "Download on the …" and the pills become links. That's the only change needed.

type Props = { iosUrl?: string; androidUrl?: string };

function Badge({ store, url }: { store: string; url?: string }) {
  const body = (
    <View style={[styles.badge, !url && styles.badgeSoon]}>
      <Text style={styles.badgeSmall}>{url ? 'Download on the' : 'Coming soon to'}</Text>
      <Text style={styles.badgeBig}>{store}</Text>
    </View>
  );
  return url ? (
    <TouchableOpacity onPress={() => Linking.openURL(url)} accessibilityRole="link" accessibilityLabel={`Get Get Camino on the ${store}`}>
      {body}
    </TouchableOpacity>
  ) : (
    <View accessible accessibilityLabel={`${store} — coming soon`}>{body}</View>
  );
}

export default function StoreBadges({ iosUrl, androidUrl }: Props) {
  const live = !!(iosUrl || androidUrl);
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>TAKE IT WITH YOU</Text>
      <Text style={styles.title} accessibilityRole="header">
        {live ? 'Get Get Camino on your phone.' : 'The web app works today. The phone apps are coming.'}
      </Text>
      <Text style={styles.sub}>
        {live
          ? 'Your roadmap, voice and all, on iPhone and Android.'
          : 'Everything runs right here in your browser — no install needed. Native iPhone and Android apps are in the works.'}
      </Text>
      <View style={styles.row}>
        <Badge store="App Store" url={iosUrl} />
        <Badge store="Google Play" url={androidUrl} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { backgroundColor: palette.cal, paddingVertical: 44, paddingHorizontal: 24, alignItems: 'center', gap: 10 },
  eyebrow:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 2, color: palette.amber },
  title:      { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 31, color: palette.indigo, textAlign: 'center', maxWidth: 560 },
  sub:        { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 23, color: palette.muted, textAlign: 'center', maxWidth: 500 },
  row:        { flexDirection: 'row', gap: 14, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge:      { minWidth: 150, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: palette.indigo },
  badgeSoon:  { backgroundColor: palette.indigo, opacity: 0.55 }, // visibly not-yet-tappable
  badgeSmall: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: 'rgba(251,250,247,0.75)' },
  badgeBig:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 18, color: palette.cal, marginTop: 1 },
});
