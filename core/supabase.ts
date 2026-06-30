import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const storage = Platform.OS === 'web'
  ? undefined  // web uses localStorage via the default browser storage
  : (() => {
      // lazy require so SSR never imports AsyncStorage
      const AS = require('@react-native-async-storage/async-storage').default;
      return AS;
    })();

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      ...(storage ? { storage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);
