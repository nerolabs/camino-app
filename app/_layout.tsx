import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk';
import { ProfileProvider, useProfile } from '@/core/ProfileContext';
import { AuthProvider, useAuth } from '@/core/AuthContext';
import { loadProfileRow } from '@/core/profileDb';
import { derive } from '@/core/interview-controller';
import { initAnalytics } from '@/lib/analytics';
import { initMonitoring } from '@/lib/monitoring';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

// Load the signed-in user's saved profile + staff flag at the root, so every route has them —
// including on a direct load or a browser reload of /plan or /interview (not just the home screen,
// where this used to live). This is why reloading the roadmap showed "No roadmap yet" and why the
// staff-only webinar links could vanish: the in-memory context reset and nothing reloaded it.
function SessionSync() {
  const { user } = useAuth();
  const { setProfile, setIsStaff } = useProfile();
  useEffect(() => {
    if (!user) { setIsStaff(false); return; }
    loadProfileRow(user.id).then(({ answers, isStaff }) => {
      setIsStaff(isStaff);
      if (answers) { derive(answers); setProfile(answers); }
    });
  }, [user]);
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

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <SessionSync />
          {/* Dark status-bar glyphs read well over the app's light cream/white surfaces. */}
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="how-it-works" />
            <Stack.Screen name="interview" />
            <Stack.Screen name="plan" />
            <Stack.Screen name="how-i-was-built" />{/* unlisted: direct link only, not in nav */}
          </Stack>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
