import { useState } from 'react';
import { Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import EmailSignIn from '@/components/EmailSignIn';

// Signed-out auth control (web): "Sign in" opens the same dialog as native — Google +
// passwordless email. (Sign in with Apple stays native-only: guideline 4.8 is an iOS-app
// rule, and web Apple OAuth needs extra Supabase config we haven't earned a need for.)

export default function SignInButtons() {
  const { signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'providers' | 'email'>('providers');

  const close = () => { setOpen(false); setMode('providers'); };

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.ghost}>
        <Text style={styles.ghostText} numberOfLines={1} maxFontSizeMultiplier={1.2}>Sign in</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>Sign in to Get Camino</Text>
            <Text style={styles.sub}>Save your roadmap and pick it up on any device.</Text>

            {mode === 'providers' ? (
              <>
                <TouchableOpacity style={styles.googleBtn} onPress={() => { close(); signInWithGoogle().catch(() => {}); }}>
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
  card:          { backgroundColor: palette.cal, borderRadius: 18, padding: 24, gap: 12, maxWidth: 420, width: '100%', alignSelf: 'center' },
  title:         { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: palette.indigo },
  sub:           { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 20, color: palette.indigo, marginBottom: 6 },
  googleBtn:     { width: '100%', height: 48, borderRadius: 10, backgroundColor: palette.cobalt, alignItems: 'center', justifyContent: 'center' },
  googleBtnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cal },
  emailBtn:      { width: '100%', height: 48, borderRadius: 10, borderWidth: 1.5, borderColor: palette.cobalt, alignItems: 'center', justifyContent: 'center' },
  emailBtnText:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cobalt },
  cancel:        { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: palette.muted, textAlign: 'center', paddingVertical: 8 },
});
