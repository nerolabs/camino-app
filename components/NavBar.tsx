import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';

export default function NavBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    // Pad the top by the safe-area inset so the bar clears the Dynamic Island / notch /
    // status bar on device. On web the inset is 0, so the layout is unchanged.
    <View style={[styles.nav, { paddingTop: insets.top + 18, paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right }]}>
      <TouchableOpacity onPress={() => router.push('/')}>
        <Text style={styles.logo}>Camino: Your Road to Spain</Text>
      </TouchableOpacity>
      <View style={styles.right}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.ghost}>
          <Text style={styles.ghostText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/how-it-works')} style={styles.ghost}>
          <Text style={styles.ghostText}>How it works</Text>
        </TouchableOpacity>
        {user ? (
          <>
            <TouchableOpacity onPress={() => router.push('/plan')} style={styles.cta}>
              <Text style={styles.ctaText}>My roadmap</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut} style={styles.ghost}>
              <Text style={styles.ghostText}>Sign out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={signInWithGoogle} style={styles.ghost}>
              <Text style={styles.ghostText}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/interview')} style={styles.cta}>
              <Text style={styles.ctaText}>Get your roadmap</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 18, backgroundColor: palette.cal, flexWrap: 'wrap', gap: 8, borderBottomWidth: 1, borderBottomColor: '#E8E4DC' },
  logo:      { fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: palette.indigo },
  right:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cta:       { backgroundColor: palette.cobalt, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  ctaText:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cal },
  ghost:     { paddingVertical: 8, paddingHorizontal: 10 },
  ghostText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: palette.cobalt },
});
