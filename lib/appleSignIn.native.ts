import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/core/supabase';

// Native Sign in with Apple (App Review guideline 4.8 — required alongside Google sign-in).
// Uses Supabase's documented native flow: Apple returns an identityToken JWT, which
// signInWithIdToken exchanges for a Supabase session — no Apple client secret needed for
// native-only; the app's bundle ID just has to be listed under the Apple provider's
// "Authorized Client IDs" in the Supabase dashboard (both projects). Android has no Apple
// sign-in requirement, so this stays iOS-only.

export const appleSignInAvailable = Platform.OS === 'ios';

export async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('No identity token returned from Apple.');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
  // Session propagates via supabase.auth.onAuthStateChange in AuthContext — nothing else to do.
}
