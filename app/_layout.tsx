import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { palette } from '@/constants/Colors';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk';
import { ProfileProvider, useProfile } from '@/core/ProfileContext';
import { AuthProvider, useAuth } from '@/core/AuthContext';
import { loadProfileRow, saveProfile as saveProfileDb } from '@/core/profileDb';
import { supabase } from '@/core/supabase';
import { derive, type Profile } from '@/core/interview-controller';
import { initAnalytics } from '@/lib/analytics';
import { initMonitoring } from '@/lib/monitoring';
import { applyStoredLocale } from '@/lib/i18n'; // side-effect import: i18next inits synchronously in English

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

// One welcome request per user per page load. Sign-in emits several auth events
// (INITIAL_SESSION, SIGNED_IN, USER_UPDATED from the pending_profile clear below), each with a
// fresh user object whose metadata still lacks welcomed_at — without this guard the effect fired
// the welcome POST once per event, and the server's non-atomic re-check let all of them send
// (observed: 3 welcome emails in one second).
let welcomeRequestedFor: string | null = null;

// Load the signed-in user's saved profile + staff flag at the root, so every route has them —
// including on a direct load or a browser reload of /plan or /interview (not just the home screen,
// where this used to live). This is why reloading the roadmap showed "No roadmap yet" and why the
// staff-only webinar links could vanish: the in-memory context reset and nothing reloaded it.
function SessionSync() {
  const { user } = useAuth();
  const { setProfile, setIsStaff, setProfileLoaded } = useProfile();
  useEffect(() => {
    if (!user) { setIsStaff(false); setProfileLoaded(true); return; }
    setProfileLoaded(false); // (new) signed-in user — the fetch below settles it either way
    (async () => {
      // "Email me my roadmap": a brand-new account carries the signed-out interview answers
      // in auth metadata (set at signInWithOtp time). Adopt them into the profiles table on
      // first sign-in — this is what makes the emailed link work from ANY device — then clear
      // the metadata copy so it can't shadow later edits.
      const md = (user.user_metadata ?? {}) as Record<string, unknown>;
      const pending = md.pending_profile as Profile | undefined;
      if (pending && typeof pending === 'object') {
        await saveProfileDb(user.id, pending).catch(() => {});
        supabase.auth.updateUser({ data: { pending_profile: null } }).catch(() => {});
      }

      const { answers, isStaff } = await loadProfileRow(user.id);
      setIsStaff(isStaff);
      if (answers) { derive(answers); setProfile(answers); }
      setProfileLoaded(true); // settled: either answers landed above, or there's nothing saved

      // Welcome email, once ever — the server re-checks welcomed_at with the service role
      // (claiming it before the send), and the module guard above stops same-page-load refires.
      if (!md.welcomed_at && welcomeRequestedFor !== user.id) {
        welcomeRequestedFor = user.id;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
          fetch(`${API_BASE}/api/email/welcome`, {
            method: 'POST',
            headers: { authorization: `Bearer ${session.access_token}` },
          }).catch(() => {});
        }
      }
    })().finally(() => setProfileLoaded(true)); // throw-safe: the question is settled either way
    // Key on the id, not the object: USER_UPDATED / TOKEN_REFRESHED hand back new user objects
    // for the same account, and re-running this effect for those only invites duplicate work.
  }, [user?.id]);
  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_400Regular, Fraunces_600SemiBold,
    HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold,
  });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  useEffect(() => { initAnalytics(); }, []); // web: PostHog; native: no-op for now
  useEffect(() => { initMonitoring(); }, []); // web: Sentry (errors + Web Vitals); native: no-op for now
  // After mount only (hydration-safe — the static export and first client render are English):
  // saved choice → device/browser language → en. See lib/i18n.ts.
  useEffect(() => { applyStoredLocale(); }, []);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <SessionSync />
          {/* Dark status-bar glyphs read well over the app's light cream/white surfaces. */}
          <StatusBar style="dark" />
          {/* Clip ALL screens below the top safe-area inset (Dynamic Island / notch) at the ROOT,
              so scrolling content can't slide under it — padding only the NavBar wasn't enough
              because the ScrollViews live at screen level. Web insets are 0 → web unchanged. */}
          <SafeAreaView style={{ flex: 1, backgroundColor: palette.cal }} edges={['top']}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="how-it-works" />
              <Stack.Screen name="interview" />
              <Stack.Screen name="plan" />
              <Stack.Screen name="sample-plan" />{/* public: the payoff before the interview */}
              <Stack.Screen name="how-i-was-built/index" />{/* unlisted: direct link only, not in nav */}
              <Stack.Screen name="how-i-was-built/log" />{/* the "show our homework" build log */}
              <Stack.Screen name="how-i-was-built/roadmap" />{/* product roadmap — update with every PR */}
            </Stack>
          </SafeAreaView>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
