import { View, Text, StyleSheet } from 'react-native';
import { palette } from '@/constants/Colors';

// Shared site footer. Kept in one place so every page (home, plan, empty states) matches.
export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerLogo}>Camino</Text>
      <Text style={styles.footerNote}>Guidance only — not legal or tax advice.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer:     { backgroundColor: palette.indigo, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  footerLogo: { fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: palette.cal },
  footerNote: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: 'rgba(251,250,247,0.5)' },
});
