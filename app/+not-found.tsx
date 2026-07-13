import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { palette } from '@/constants/Colors';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// C10a: a branded 404 (was the default Expo screen). Honest, on-voice, and points back at the
// real front doors — the interview, the guides, the sample plan — instead of a dead end.
export default function NotFoundScreen() {
  return (
    <ScrollView style={styles.scroll}>
      <Stack.Screen options={{ title: 'Not found · Get Camino' }} />
      <NavBar />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>MOVING TO SPAIN</Text>
        <Text style={styles.title} accessibilityRole="header">This road doesn't lead anywhere.</Text>
        <Text style={styles.body}>
          The page you were after isn't here. No dead ends, though — here's where the real ones are.
        </Text>
        <Link href="/interview" style={styles.primary}>Build my free roadmap →</Link>
        <Link href="/guide" style={styles.link}>Browse the free guides →</Link>
        <Link href="/sample-plan" style={styles.link}>See a sample roadmap →</Link>
        <Link href="/" style={styles.link}>Back to home →</Link>
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: palette.cal },
  content: { alignSelf: 'center', width: '100%', maxWidth: 680, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 48, gap: 10 },
  eyebrow: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 2, color: palette.amber, marginBottom: 6 },
  title:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 34, lineHeight: 41, color: palette.indigo, marginBottom: 8 },
  body:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 25, color: palette.muted, marginBottom: 12 },
  primary: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cobalt, marginTop: 4 },
  link:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cobalt },
});
