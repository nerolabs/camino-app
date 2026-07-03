import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';

// Signed-out auth controls (web): Google only — Sign in with Apple is native-only for now
// (guideline 4.8 applies to the iOS app; web Apple OAuth needs extra Supabase config).
// The .native twin renders the official Apple button alongside Google on iOS.

export default function SignInButtons() {
  const { signInWithGoogle } = useAuth();
  return (
    <TouchableOpacity onPress={signInWithGoogle} style={styles.ghost}>
      <Text style={styles.ghostText}>Sign in</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ghost:     { paddingVertical: 8, paddingHorizontal: 10 },
  ghostText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: palette.cobalt },
});
