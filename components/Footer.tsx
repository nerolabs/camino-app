import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { palette } from '@/constants/Colors';

// Shared site footer. Kept in one place so every page (home, plan, empty states) matches.
// Legal links live here (privacy / terms / aviso legal) — quiet but on every page, which is
// exactly where reviewers and regulators expect them.
export default function Footer() {
  const router = useRouter();
  const go = (path: string) => router.push(path as never);
  return (
    <View style={styles.footer}>
      <Text style={styles.footerLogo}>Camino</Text>
      <Text style={styles.footerNote}>Guidance only — not legal or tax advice.</Text>
      <View style={styles.links}>
        <TouchableOpacity onPress={() => go('/privacy')}><Text style={styles.link}>Privacy</Text></TouchableOpacity>
        <Text style={styles.dot}>·</Text>
        <TouchableOpacity onPress={() => go('/terms')}><Text style={styles.link}>Terms</Text></TouchableOpacity>
        <Text style={styles.dot}>·</Text>
        <TouchableOpacity onPress={() => go('/aviso-legal')}><Text style={styles.link}>Aviso legal</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer:     { backgroundColor: palette.indigo, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  footerLogo: { fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: palette.cal },
  footerNote: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: 'rgba(251,250,247,0.5)' },
  links:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  link:       { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: 'rgba(251,250,247,0.65)' },
  dot:        { color: 'rgba(251,250,247,0.35)', fontSize: 12 },
});
