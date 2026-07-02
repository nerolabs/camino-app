import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk';
import { ProfileProvider } from '@/core/ProfileContext';
import { AuthProvider } from '@/core/AuthContext';
import { initAnalytics } from '@/lib/analytics';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_400Regular, Fraunces_600SemiBold,
    HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold,
  });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  useEffect(() => { initAnalytics(); }, []); // web: PostHog; native: no-op for now

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          {/* Dark status-bar glyphs read well over the app's light cream/white surfaces. */}
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="how-it-works" />
            <Stack.Screen name="interview" />
            <Stack.Screen name="plan" />
          </Stack>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
