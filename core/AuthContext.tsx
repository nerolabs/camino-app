import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { type Session, type User } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Lets the auth browser session close cleanly after the OAuth redirect (no-op harm on native).
WebBrowser.maybeCompleteAuthSession();

// Turn an OAuth redirect URL into a Supabase session. Handles both flows: PKCE (a `code` to
// exchange) and implicit (access/refresh tokens in the URL). Used by the native sign-in flow.
async function completeSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  if (params.code) {
    await supabase.auth.exchangeCodeForSession(params.code);
  } else if (params.access_token && params.refresh_token) {
    await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
  }
}

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null, user: null, loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    if (Platform.OS === 'web') {
      // Web: full-page redirect; `detectSessionInUrl` (set on the client) completes it on return.
      // RN also defines a global `window` (without `.location`), so gate on Platform.OS not typeof.
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      return;
    }

    // Native: open the OAuth URL in an in-app browser and complete the session from the deep-link
    // redirect ourselves (detectSessionInUrl is off on native). redirectTo resolves to the app's
    // custom scheme, e.g. caminoapp://auth-callback — allowlisted in Supabase's redirect URLs.
    const redirectTo = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) throw error ?? new Error('no OAuth url');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) {
      await completeSessionFromUrl(result.url);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
