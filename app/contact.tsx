import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/core/AuthContext';
import { capture } from '@/lib/analytics';
import { getSessionToken } from '@/lib/turnstile';
import { currentLang } from '@/lib/i18n';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Seo from '@/components/Seo';

// The general "Contact us" page (grew out of the Report-a-problem dialog, user decision
// 2026-07-11): one place to reach us, with a topic selector so reports stay routable.
// The hamburger's "Report a problem" deep-links here with ?topic=problem pre-selected.
// Same transport as before: POST /api/feedback → team inbox via Resend, context attached.

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TOPICS = ['general', 'feedback', 'problem'] as const;
type Topic = (typeof TOPICS)[number];

// The server answers in <0.5s, but on some devices/networks the fetch stalls on the RESPONSE
// long after the request landed (build-24 family finding). After the grace period we thank
// the user and move on — a genuinely failed send (offline) rejects fast and still errors.
const SEND_GRACE_MS = 10_000;

export default function Contact() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ topic?: string }>();
  const [topic, setTopic] = useState<Topic>('general');
  // On the static web export the search params only exist AFTER hydration — a one-shot
  // useState initializer never sees them (?topic=problem landed on General; caught by
  // smoke #7 on its first run). React to the param instead.
  useEffect(() => {
    if (TOPICS.includes(params.topic as Topic)) setTopic(params.topic as Topic);
  }, [params.topic]);
  const [email, setEmail] = useState(user?.email ?? '');
  // Auth loads async — same late-hydration class as the topic param above: on a cold
  // signed-in load the initializer runs before the session exists. Prefill only while
  // the field is untouched, so we never clobber what the user typed.
  useEffect(() => {
    if (user?.email) setEmail(prev => prev || user.email!);
  }, [user?.email]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true); setErr(null);
    try {
      // C2b: attach the Turnstile-derived session token on web (solved invisibly, cached —
      // with the visible-challenge fallback for webviews that refuse the invisible solve).
      const session = await getSessionToken({ interactive: true });
      const request = fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(session ? { 'x-camino-session': session } : {}) },
        body: JSON.stringify({
          message: text.trim(),
          topic,
          email: email.trim(),
          lang: currentLang(), // C9a: the auto-ack email follows the app language
          platform: Platform.OS,
          // nativeBuildVersion reads the built Info.plist / versionCode (EAS remote
          // versioning never writes buildNumber into expoConfig); null on web.
          version: `${Constants.expoConfig?.version ?? '?'} (${Constants.nativeBuildVersion ?? 'web'})`,
          route: '/contact',
        }),
      });
      const res = await Promise.race([
        request,
        new Promise<'slow'>(resolve => setTimeout(() => resolve('slow'), SEND_GRACE_MS)),
      ]);
      if (res !== 'slow' && !res.ok) throw new Error(String(res.status));
      if (res === 'slow') request.catch(() => {}); // finish (or fail) quietly in the background
      capture('contact_sent', { topic, slow: res === 'slow' });
      setSent(true);
      setText('');
    } catch {
      setErr(t('contact.errSend'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <Seo
        title={`${t('contact.title')} — Get Camino`}
        description={t('contact.sub')}
        canonical="https://getcamino.app/contact"
      />
      <NavBar />
      <View style={styles.column}>
        <Text style={styles.title} accessibilityRole="header">{t('contact.title')}</Text>
        <Text style={styles.sub}>{t('contact.sub')}</Text>

        {sent ? (
          <View style={styles.card}>
            <Text style={styles.thanksTitle}>{t('contact.thanksTitle')}</Text>
            <Text style={styles.sub}>{t('contact.thanksSub')}</Text>
            <TouchableOpacity onPress={() => setSent(false)}>
              <Text style={styles.again}>{t('contact.again')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>{t('contact.topicLabel')}</Text>
            <View style={styles.topicRow}>
              {TOPICS.map(k => (
                <TouchableOpacity
                  key={k}
                  style={[styles.topicChip, topic === k && styles.topicChipOn]}
                  onPress={() => setTopic(k)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: topic === k }}
                >
                  <Text style={[styles.topicChipText, topic === k && styles.topicChipTextOn]}>
                    {t(`contact.topics.${k}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('contact.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('contact.emailPlaceholder')}
              placeholderTextColor={palette.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />

            <TextInput
              style={styles.message}
              accessibilityLabel={t('contact.messageA11y')}
              value={text}
              onChangeText={setText}
              placeholder={t('contact.messagePlaceholder')}
              placeholderTextColor={palette.muted}
              multiline
              editable={!busy}
            />
            {err && <Text style={styles.err}>{err}</Text>}
            <TouchableOpacity
              style={[styles.btn, (!text.trim() || busy) && styles.btnDim]}
              onPress={send}
              disabled={!text.trim() || busy}
              accessibilityRole="button"
            >
              {busy ? <ActivityIndicator color={palette.cal} /> : <Text style={styles.btnText}>{t('contact.send')}</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:            { flex: 1, backgroundColor: palette.cal },
  scroll:          { flexGrow: 1, justifyContent: 'space-between' },
  column:          { alignSelf: 'center', width: '100%', maxWidth: 560, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },
  title:           { fontFamily: 'Fraunces_600SemiBold', fontSize: 34, lineHeight: 40, color: palette.indigo, marginBottom: 10 },
  sub:             { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 22, color: palette.muted },
  card:            { marginTop: 22, gap: 12 },
  label:           { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: palette.indigo, marginTop: 4 },
  topicRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip:       { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#F2EDE6' },
  topicChipOn:     { backgroundColor: palette.cobalt },
  topicChipText:   { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, color: palette.indigo },
  topicChipTextOn: { color: palette.cal },
  input:           { height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#D8D2C6', backgroundColor: '#FFFFFF',
                     paddingHorizontal: 12, fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.indigo },
  message:         { minHeight: 130, borderRadius: 10, borderWidth: 1, borderColor: '#D8D2C6', backgroundColor: '#FFFFFF',
                     padding: 12, fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.indigo,
                     textAlignVertical: 'top' },
  btn:             { height: 46, borderRadius: 10, backgroundColor: palette.cobalt, alignItems: 'center', justifyContent: 'center' },
  btnDim:          { opacity: 0.5 },
  btnText:         { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },
  thanksTitle:     { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: palette.indigo },
  again:           { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cobalt, paddingVertical: 8 },
  err:             { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: '#C0392B' },
});
