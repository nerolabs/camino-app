import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { usePathname } from 'expo-router';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { capture } from '@/lib/analytics';

// "Report a problem / send feedback" — subtle but always at hand (lives in the ☰ menu).
// One text box, fire to /api/feedback (→ team inbox via Resend), say gracias. Context
// (platform, version, route, signed-in email) rides along so reports are actionable
// without interrogating the reporter.

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

// The server answers in <0.5s, but on some devices/networks the native fetch stalls on the
// RESPONSE long after the request landed (build-24 family finding: email arrived instantly,
// spinner ran 1–2 min). After this grace period we thank the user and move on — a genuinely
// failed send (offline) rejects fast and still shows the error.
const SEND_GRACE_MS = 10_000;

export default function FeedbackDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const kb = useKeyboardHeight(); // keep the dialog above the keyboard (it autofocuses)
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const close = () => { onClose(); setSent(false); setErr(null); setText(''); };

  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true); setErr(null);
    try {
      const request = fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          email: user?.email ?? '',
          platform: Platform.OS,
          version: `${Constants.expoConfig?.version ?? '?'} (${Constants.expoConfig?.ios?.buildNumber ?? 'web'})`,
          route: pathname,
        }),
      });
      const res = await Promise.race([
        request,
        new Promise<'slow'>(resolve => setTimeout(() => resolve('slow'), SEND_GRACE_MS)),
      ]);
      if (res === 'slow') {
        request.catch(() => {}); // let it finish (or fail) quietly in the background
        capture('feedback_send_slow', { route: pathname });
        setSent(true);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      capture('feedback_sent', { route: pathname });
      setSent(true);
    } catch {
      setErr('That didn’t go through — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={[styles.overlay, kb > 0 && { paddingBottom: kb + 16 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View style={styles.card} accessibilityViewIsModal>
          {sent ? (
            <>
              <Text style={styles.title}>Gracias — got it.</Text>
              <Text style={styles.sub}>Every report makes the roadmap better. We read them all.</Text>
              <TouchableOpacity style={styles.btn} onPress={close}>
                <Text style={styles.btnText}>Done</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Report a problem</Text>
              <Text style={styles.sub}>Something broken, confusing, or missing? Tell us — a sentence is plenty.</Text>
              <TextInput
                style={styles.input}
                accessibilityLabel="Describe the problem"
                value={text}
                onChangeText={setText}
                placeholder="What happened?"
                placeholderTextColor={palette.muted}
                multiline
                editable={!busy}
                autoFocus
              />
              {err && <Text style={styles.err}>{err}</Text>}
              <TouchableOpacity
                style={[styles.btn, (!text.trim() || busy) && styles.btnDim]}
                onPress={send}
                disabled={!text.trim() || busy}
              >
                {busy ? <ActivityIndicator color={palette.cal} /> : <Text style={styles.btnText}>Send</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={close}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(21,36,59,0.55)', justifyContent: 'center', padding: 28 },
  card:    { backgroundColor: palette.cal, borderRadius: 18, padding: 24, gap: 12, maxWidth: 480, width: '100%', alignSelf: 'center' },
  title:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: palette.indigo },
  sub:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 20, color: palette.indigo },
  input:   { minHeight: 96, borderRadius: 10, borderWidth: 1, borderColor: '#D8D2C6', backgroundColor: '#FFFFFF',
             padding: 12, fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.indigo,
             textAlignVertical: 'top' },
  btn:     { height: 46, borderRadius: 10, backgroundColor: palette.cobalt, alignItems: 'center', justifyContent: 'center' },
  btnDim:  { opacity: 0.5 },
  btnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },
  cancel:  { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: palette.muted, textAlign: 'center', paddingVertical: 6 },
  err:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: '#C0392B' },
});
