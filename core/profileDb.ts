import { supabase } from './supabase';
import { captureError } from '@/lib/monitoring';
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
  const { data, error } = await supabase
    .from('profiles').select('answers').eq('user_id', userId).maybeSingle();
  if (error) {
    // The answers-only read failed too — so this is NOT the benign is_staff-migration gap but a
    // real read failure (RLS/grants/outage). A signed-in user would see "no roadmap" for saved
    // answers. Alert instead of hiding it (2026-07-05 — the sibling swallow masked a data-loss bug).
    captureError(new Error(`loadProfileRow failed: ${error.code ?? '?'} ${error.message}`),
      { op: 'loadProfileRow', code: error.code });
  }
  return { answers: (data?.answers as Profile) ?? null, isStaff: false };
}

export async function saveProfile(userId: string, answers: Profile): Promise<void> {
  // Intentionally only writes user_id / answers / updated_at — never is_staff, so a client can't
  // elevate itself. Column-level grants in the DB enforce this too (see docs/STAFF.md).
  const { error } = await supabase.from('profiles').upsert(
    { user_id: userId, answers, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) {
    // A completed roadmap failing to persist is silent DATA LOSS. This once happened for EVERY
    // signed-in user for days, unnoticed, because the error was swallowed here: a STAFF.md grant
    // change left `authenticated` without UPDATE(user_id), which PostgREST's upsert needs (it puts
    // the conflict key in ON CONFLICT DO UPDATE SET) → 42501 on every save (2026-07-05). Never
    // swallow this again — always alert. In-memory state still serves the session; Sentry tells us.
    captureError(new Error(`saveProfile failed: ${error.code ?? '?'} ${error.message}`),
      { op: 'saveProfile', code: error.code });
  }
}
