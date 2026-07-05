import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import { capture } from '@/lib/analytics';
import { type Profile } from '@/core/interview-controller';

// Passwordless email flow, shared by the sign-in dialogs (web + native) and the plan page's
// "Email me my roadmap". Two phases: enter email → link sent (with the one-time code as a
// fallback that works cross-device and in simulators). No password exists anywhere.
// The code's LENGTH is Supabase's choice (currently 8; historically 6) — never hardcode it:
// a maxLength={6} silently truncated real 8-digit codes and verification could never succeed.

type Props = {
  // When set, a brand-new account is seeded with this profile (rides in auth metadata;
  // SessionSync adopts it on first sign-in) — the "email me my roadmap" gesture.
  pendingProfile?: Profile | null;
  context: 'dialog' | 'plan_page'; // analytics
  sendLabel?: string;
  onVerified?: () => void;
};

export default function EmailSignIn({ pendingProfile, context, sendLabel, onVerified }: Props) {
  const { t } = useTranslation();
  const { signInWithEmail, verifyEmailCode } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'input' | 'sent'>('input');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = /.+@.+\..+/.test(email.trim());

  async function send() {
    if (!valid || busy) return;
    setBusy(true); setErr(null);
    try {
      await signInWithEmail(email, pendingProfile ?? undefined);
      capture('email_signin_requested', { context, creates_account: !!pendingProfile });
      setPhase('sent');
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('emailSignIn.errSend'));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (code.trim().length < 6 || busy) return;
    setBusy(true); setErr(null);
    try {
      await verifyEmailCode(email, code);
      capture('email_signin_verified', { context });
      onVerified?.(); // session lands via onAuthStateChange
    } catch {
      setErr(t('emailSignIn.errCode'));
    } finally {
      setBusy(false);
    }
  }

  if (phase === 'sent') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.sentTitle}>{t('emailSignIn.sentTitle')}</Text>
        <Text style={styles.sub}>
          {t('emailSignIn.sentSub', { email: email.trim() })}
        </Text>
        <TextInput
          style={styles.input}
          accessibilityLabel={t('emailSignIn.codeA11y')}
          value={code}
          onChangeText={setCode}
          placeholder="12345678"
          placeholderTextColor={palette.muted}
          keyboardType="number-pad"
          maxLength={10}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
        />
        {err && <Text style={styles.err}>{err}</Text>}
        <TouchableOpacity style={[styles.btn, (code.trim().length < 6 || busy) && styles.btnDim]} onPress={verify} disabled={busy}>
          <Text style={styles.btnText}>{busy ? t('emailSignIn.checking') : t('emailSignIn.verify')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setPhase('input'); setCode(''); setErr(null); }}>
          <Text style={styles.ghost}>{t('emailSignIn.tryAgain')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        accessibilityLabel={t('emailSignIn.emailA11y')}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={palette.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        onSubmitEditing={send}
      />
      {err && <Text style={styles.err}>{err}</Text>}
      <TouchableOpacity style={[styles.btn, (!valid || busy) && styles.btnDim]} onPress={send} disabled={busy}>
        <Text style={styles.btnText}>{busy ? t('emailSignIn.sending') : (sendLabel ?? t('emailSignIn.send'))}</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>{t('emailSignIn.hint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:      { gap: 10 },
  input:     { height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#D8D2C6', backgroundColor: palette.white,
               paddingHorizontal: 14, fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, color: palette.indigo },
  btn:       { width: '100%', height: 48, borderRadius: 10, backgroundColor: palette.cobalt, alignItems: 'center', justifyContent: 'center' },
  btnDim:    { opacity: 0.5 },
  btnText:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cal },
  ghost:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: palette.cobalt, textAlign: 'center', paddingVertical: 6 },
  hint:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted, textAlign: 'center' },
  sentTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: palette.indigo },
  sub:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 20, color: palette.indigo },
  err:       { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: '#C0392B' },
});
