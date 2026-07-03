import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';

// Signed-out auth controls (native). iOS shows the OFFICIAL Apple button first (App Review
// guideline 4.8: a third-party login must be accompanied by Sign in with Apple, and Apple
// wants their branded button) plus Google. Android: Google only — 4.8 doesn't apply there.

export default function SignInButtons() {
  const { signInWithGoogle, signInWithApple, appleSignInAvailable } = useAuth();

  return (
    <View style={styles.row}>
      {appleSignInAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.appleBtn}
          onPress={() => { signInWithApple().catch(() => {}); }}
        />
      )}
      <TouchableOpacity onPress={signInWithGoogle} style={styles.ghost}>
        <Text style={styles.ghostText}>{appleSignInAvailable ? 'Sign in with Google' : 'Sign in'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  appleBtn:  { width: 140, height: 34 },
  ghost:     { paddingVertical: 8, paddingHorizontal: 10 },
  ghostText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: palette.cobalt },
});
