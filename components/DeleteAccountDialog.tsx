import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import { useProfile } from '@/core/ProfileContext';
import { supabase } from '@/core/supabase';
import { capture, resetAnalytics } from '@/lib/analytics';

// Permanent account deletion (Apple 5.1.1(v) + GDPR erasure): one clear warning, one
// destructive button, immediate hard delete (user decision 2026-07-04 — no grace period).
// On success: local session + in-memory profile are cleared too, so nothing lingers.

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function DeleteAccountDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { setProfile } = useProfile();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const close = () => { onClose(); setErr(null); setDone(false); };

  async function deleteAccount() {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');
      const res = await fetch(`${API_BASE}/api/account/delete`, {
        method: 'POST',
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(String(res.status));
      capture('account_deleted');
      resetAnalytics();
      setProfile(null);
      await signOut().catch(() => {}); // server user is already gone; this clears local state
      setDone(true);
    } catch {
      setErr(t('deleteAccount.err'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={busy ? undefined : close} />
        <View style={styles.card} accessibilityViewIsModal>
          {done ? (
            <>
              <Text style={styles.title}>{t('deleteAccount.doneTitle')}</Text>
              <Text style={styles.sub}>{t('deleteAccount.doneSub')}</Text>
              <TouchableOpacity style={styles.btnNeutral} onPress={close}>
                <Text style={styles.btnNeutralText}>{t('deleteAccount.close')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('deleteAccount.title')}</Text>
              <Text style={styles.sub}>
                {t('deleteAccount.warning')}
              </Text>
              {err && <Text style={styles.err}>{err}</Text>}
              <TouchableOpacity style={[styles.btnDanger, busy && styles.btnDim]} onPress={deleteAccount} disabled={busy}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnDangerText}>{t('deleteAccount.confirm')}</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={close} disabled={busy}>
                <Text style={styles.cancel}>{t('deleteAccount.keep')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(21,36,59,0.55)', justifyContent: 'center', padding: 28 },
  card:           { backgroundColor: palette.cal, borderRadius: 18, padding: 24, gap: 12, maxWidth: 480, width: '100%', alignSelf: 'center' },
  title:          { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: palette.indigo },
  sub:            { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 21, color: palette.indigo },
  btnDanger:      { height: 48, borderRadius: 10, backgroundColor: '#C0392B', alignItems: 'center', justifyContent: 'center' },
  btnDangerText:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  btnNeutral:     { height: 46, borderRadius: 10, backgroundColor: palette.cobalt, alignItems: 'center', justifyContent: 'center' },
  btnNeutralText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },
  btnDim:         { opacity: 0.6 },
  cancel:         { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cobalt, textAlign: 'center', paddingVertical: 6 },
  err:            { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: '#C0392B' },
});
