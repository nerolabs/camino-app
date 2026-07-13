import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import { supabase } from '@/core/supabase';
import { SUPPORTED_LOCALES, setAppLocale, type LocaleCode } from '@/lib/i18n';
import Seo from '@/components/Seo';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import SignInButtons from '@/components/SignInButtons';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';

// "My account" (Phase 6 #27): email prefs + language + delete, consolidated out of the hamburger.
// noindex — it's personal, signed-in-only. All writes go to Supabase auth user_metadata, the same
// place the weekly-email engine + the language switcher already read.
export default function AccountScreen() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const meta = (user?.user_metadata ?? {}) as { weekly_optout?: boolean };
  const [roundup, setRoundup] = useState(meta.weekly_optout !== true);
  const [saving, setSaving] = useState(false);

  function toggleRoundup(on: boolean) {
    setRoundup(on);
    setSaving(true);
    supabase.auth.updateUser({ data: { weekly_optout: !on } })
      .then(({ error }) => { if (error) setRoundup(!on); })
      .catch(() => setRoundup(!on))
      .finally(() => setSaving(false));
  }
  function chooseLang(code: LocaleCode) {
    setAppLocale(code);
    if (user) supabase.auth.updateUser({ data: { lang: code } }).catch(() => {});
  }

  return (
    <ScrollView style={styles.scroll}>
      <Seo noindex title={`${t('account.title')} | Get Camino`}
        description="Manage your Get Camino account — email preferences, language, and account deletion."
        canonical="https://getcamino.app/account" />
      <NavBar />
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">{t('account.title')}</Text>

        {!user ? (
          <View style={styles.card}>
            <Text style={styles.body}>{t('account.signedOut')}</Text>
            <View style={styles.signInWrap}><SignInButtons /></View>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.smallLabel}>{t('account.email')}</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>

            <Text style={styles.sectionH}>{t('account.emailPrefsH')}</Text>
            <View style={styles.rowCard}>
              <View style={styles.rowText}>
                <Text style={styles.value}>{t('account.roundup')}</Text>
                <Text style={styles.hint}>{t('account.roundupHint')}</Text>
              </View>
              <Switch value={roundup} onValueChange={toggleRoundup} disabled={saving}
                trackColor={{ true: palette.cobalt }} accessibilityLabel={t('account.roundup')} />
            </View>

            <Text style={styles.sectionH}>{t('account.languageH')}</Text>
            <View style={styles.card}>
              {SUPPORTED_LOCALES.map(l => (
                <TouchableOpacity key={l.code} style={styles.langRow} onPress={() => chooseLang(l.code)} accessibilityRole="button">
                  <Text style={[styles.value, i18n.language === l.code && styles.langActive]}>{l.name}</Text>
                  {i18n.language === l.code && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionH}>{t('account.accountH')}</Text>
            <TouchableOpacity style={styles.action} onPress={() => signOut()} accessibilityRole="button">
              <Text style={styles.actionText}>{t('nav.menu.signOut')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={() => setDeleteOpen(true)} accessibilityRole="button">
              <Text style={styles.deleteText}>{t('nav.menu.deleteAccount')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <DeleteAccountDialog visible={deleteOpen} onClose={() => setDeleteOpen(false)} />
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: palette.cal },
  content:   { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  title:     { fontFamily: 'Fraunces_600SemiBold', fontSize: 32, lineHeight: 40, color: palette.indigo, marginBottom: 20 },
  body:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 23, color: palette.indigo },
  signInWrap:{ marginTop: 14 },
  card:      { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 12, padding: 16, marginBottom: 8 },
  rowCard:   { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText:   { flex: 1 },
  smallLabel:{ fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 1.2, color: palette.muted, textTransform: 'uppercase', marginBottom: 4 },
  value:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, color: palette.indigo },
  hint:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, lineHeight: 18, color: palette.muted, marginTop: 3 },
  sectionH:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 1.4, color: palette.muted, textTransform: 'uppercase', marginTop: 22, marginBottom: 8 },
  langRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  langActive:{ color: palette.cobalt },
  check:     { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cobalt },
  action:    { paddingVertical: 12 },
  actionText:{ fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cobalt },
  deleteText:{ fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: '#C0392B' },
});
