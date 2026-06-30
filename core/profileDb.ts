import { supabase } from './supabase';
import { type Profile } from './interview-controller';

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('answers')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.answers as Profile;
}

export async function saveProfile(userId: string, answers: Profile): Promise<void> {
  await supabase.from('profiles').upsert(
    { user_id: userId, answers, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
}
