import { supabase } from './supabase';
import { type Profile } from './interview-controller';

export type ProfileRow = { answers: Profile | null; isStaff: boolean };

// Load the user's profile row: their interview answers plus the server-owned `is_staff` flag.
// `is_staff` is set by an admin in the database (never by the client — see saveProfile, which
// only ever writes `answers`), so it's a trustworthy gate for revealing staff/dev tooling.
export async function loadProfileRow(userId: string): Promise<ProfileRow> {
  // Read the staff flag alongside answers. If the is_staff column doesn't exist yet (migration
  // not run — see docs/STAFF.md), fall back to answers-only so profile loading never breaks. This
  // keeps deploy order independent of the DB migration; until it's run, nobody is staff.
  const withStaff = await supabase
    .from('profiles').select('answers, is_staff').eq('user_id', userId).maybeSingle();
  if (!withStaff.error) {
    const d = withStaff.data;
    return d
      ? { answers: (d.answers as Profile) ?? null, isStaff: d.is_staff === true }
      : { answers: null, isStaff: false };
  }
  const { data } = await supabase
    .from('profiles').select('answers').eq('user_id', userId).maybeSingle();
  return { answers: (data?.answers as Profile) ?? null, isStaff: false };
}

export async function saveProfile(userId: string, answers: Profile): Promise<void> {
  // Intentionally only writes user_id / answers / updated_at — never is_staff, so a client can't
  // elevate itself. Column-level grants in the DB enforce this too (see docs/STAFF.md).
  await supabase.from('profiles').upsert(
    { user_id: userId, answers, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
}
