/**
 * Email magic-link landing (2026-07-10): outbound emails link here with ?token_hash=&next=.
 * The token is exchanged only on a HUMAN CLICK (mail scanners prefetch links and would consume
 * one-time tokens), then we replace to `next`. Expired/used tokens fall back to the email-code
 * sign-in, which lands the user in the same place.
 */
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import NavBar from '@/components/NavBar';
import EmailSignIn from '@/components/EmailSignIn';
import { supabase } from '@/core/supabase';
import { palette } from '@/constants/Colors';
import { capture } from '@/lib/analytics';

// Only same-origin paths — never absolute URLs (open-redirect guard).
function safeNext(raw: unknown): string {
  const n = typeof raw === 'string' ? raw : '';
  return n.startsWith('/') && !n.startsWith('//') ? n : '/plan';
}

export default function AuthConfirmScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token_hash, next } = useLocalSearchParams<{ token_hash?: string; next?: string }>();
  const dest = safeNext(next);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirm() {
    if (busy || typeof token_hash !== 'string' || !token_hash) { setFailed(true); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash });
    capture('email_link_confirmed', { ok: !error, next: dest });
    if (error) { setBusy(false); setFailed(true); return; }
    router.replace(dest as never);
  }

  return (
    <View style={styles.flex}>
      <NavBar />
      <View style={styles.center}>
        {!failed ? (
          <>
            <Text style={styles.headline}>{t('authConfirm.headline')}</Text>
            <Text style={styles.sub}>{t('authConfirm.sub')}</Text>
            <TouchableOpacity style={styles.btn} onPress={confirm} disabled={busy} accessibilityRole="button">
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>{t('authConfirm.continue')}</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.headline}>{t('authConfirm.expiredHeadline')}</Text>
            <Text style={styles.sub}>{t('authConfirm.expiredSub')}</Text>
            <View style={styles.signin}>
              <EmailSignIn context="plan_page" onVerified={() => router.replace(dest as never)} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:     { flex: 1, backgroundColor: palette.cal },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  headline: { fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: palette.indigo, textAlign: 'center', marginBottom: 12 },
  sub:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.muted, textAlign: 'center', lineHeight: 23, marginBottom: 28, maxWidth: 420 },
  btn:      { backgroundColor: palette.cobalt, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 36, minWidth: 220, alignItems: 'center' },
  btnText:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: '#FFFFFF' },
  signin:   { width: '100%', maxWidth: 420 },
});
