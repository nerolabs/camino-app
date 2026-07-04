import { useState } from 'react';
import { Alert, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import EmailSignIn from '@/components/EmailSignIn';

// Signed-out auth control (native). The NavBar shows a single "Sign in" link — the inline Apple
// button wrecked the nav layout (build-15 finding) — and tapping it opens a dialog offering the
// OFFICIAL Apple button (App Review guideline 4.8 + Apple's branded-button rule), Google, and
// passwordless email. Android gets the same dialog minus Apple (4.8 doesn't apply there).

export default function SignInButtons() {
  const { signInWithGoogle, signInWithApple, appleSignInAvailable } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'providers' | 'email'>('providers');
  const kb = useKeyboardHeight(); // email mode has an input — keep the card above the keyboard

  const close = () => { setOpen(false); setMode('providers'); };

  // Never swallow sign-in failures (the silent .catch hid the build-16 Apple failure).
  // AuthContext has already logged to Sentry + PostHog; here we tell the human.
  const failed = (provider: string) => (e: unknown) => {
    const code = (e as { code?: string })?.code;
    const detail = e instanceof Error ? e.message : String(e);
    Alert.alert(`${provider} sign-in failed`, code ? `${detail} (${code})` : detail);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.ghost}>
        <Text style={styles.ghostText} numberOfLines={1} maxFontSizeMultiplier={1.2}>Sign in</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={[styles.overlay, kb > 0 && { paddingBottom: kb + 16 }]} onPress={close}>
          {/* Stop card taps from closing the dialog */}
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>Sign in to Get Camino</Text>
            <Text style={styles.sub}>Save your roadmap and pick it up on any device.</Text>

            {mode === 'providers' ? (
              <>
                {appleSignInAvailable && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={10}
                    style={styles.appleBtn}
                    onPress={() => { close(); signInWithApple().catch(failed('Apple')); }}
                  />
                )}
                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={() => { close(); signInWithGoogle().catch(failed('Google')); }}
                >
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.emailBtn} onPress={() => setMode('email')}>
                  <Text style={styles.emailBtnText}>Continue with email</Text>
                </TouchableOpacity>
              </>
            ) : (
              <EmailSignIn context="dialog" onVerified={close} />
            )}

            <TouchableOpacity onPress={mode === 'email' ? () => setMode('providers') : close}>
              <Text style={styles.cancel}>{mode === 'email' ? '← All sign-in options' : 'Cancel'}</Text>
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
  emailBtn:      { width: '100%', height: 48, borderRadius: 10, borderWidth: 1.5, borderColor: palette.cobalt, alignItems: 'center', justifyContent: 'center' },
  emailBtnText:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cobalt },
  cancel:        { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: palette.muted, textAlign: 'center', paddingVertical: 8 },
});
