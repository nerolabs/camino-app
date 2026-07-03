import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';

// Signed-out auth control (native). The NavBar shows a single "Sign in" link — the inline Apple
// button wrecked the nav layout (build-15 finding) — and tapping it opens a dialog offering the
// OFFICIAL Apple button (App Review guideline 4.8 + Apple's branded-button rule) plus Google.
// Android gets the same dialog minus Apple (4.8 doesn't apply there).

export default function SignInButtons() {
  const { signInWithGoogle, signInWithApple, appleSignInAvailable } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.ghost}>
        <Text style={styles.ghostText}>Sign in</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          {/* Stop card taps from closing the dialog */}
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>Sign in to Camino</Text>
            <Text style={styles.sub}>Save your roadmap and pick it up on any device.</Text>

            {appleSignInAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={10}
                style={styles.appleBtn}
                onPress={() => { setOpen(false); signInWithApple().catch(() => {}); }}
              />
            )}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => { setOpen(false); signInWithGoogle().catch(() => {}); }}
            >
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  ghost:         { paddingVertical: 8, paddingHorizontal: 10 },
  ghostText:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: palette.cobalt },

  overlay:       { flex: 1, backgroundColor: 'rgba(21,36,59,0.55)', justifyContent: 'center', padding: 28 },
  card:          { backgroundColor: palette.cal, borderRadius: 18, padding: 24, gap: 12 },
  title:         { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: palette.indigo },
  sub:           { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 20, color: palette.indigo, marginBottom: 6 },
  appleBtn:      { width: '100%', height: 48 },
  googleBtn:     { width: '100%', height: 48, borderRadius: 10, backgroundColor: palette.cobalt, alignItems: 'center', justifyContent: 'center' },
  googleBtnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cal },
  cancel:        { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: palette.muted, textAlign: 'center', paddingVertical: 8 },
});
