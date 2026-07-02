# Staff flag (`profiles.is_staff`)

Staff/dev tooling in the app (currently: the **dev test personas** on the interview form and the
**▶ Webinar source** cross-check link in the roadmap drawer) is gated on a server-owned flag:
the `is_staff` boolean on the `profiles` table. It **defaults to `false`**, and only an admin can
set it (in the Supabase SQL editor / dashboard). There is no hardcoded user-id allowlist in the
client anymore — the old `EXPO_PUBLIC_STAFF_USER_IDS` env var is retired.

The app reads it via `loadProfileRow()` → `ProfileContext` (`useProfile().isStaff`). The client
**never writes** it (`saveProfile` only writes `answers`).

> The gated features are non-sensitive (test data + public YouTube links), so this is about tidy
> access, not protecting secrets. The column grants below are defense-in-depth against a user
> flipping their own flag.

## 1. Add the column — run on **both** databases (staging `gsnsg…` and production `oftrp…`)

```sql
alter table public.profiles
  add column if not exists is_staff boolean not null default false;
```

## 2. Recommended hardening — stop clients writing `is_staff`

RLS is row-level; column-level writes are controlled with GRANTs. Restrict the `authenticated`
role to the columns the app actually writes, so even a crafted client request can't set `is_staff`.
Verify these are the only columns your `profiles` table needs on insert/update before running.

```sql
revoke insert, update on public.profiles from authenticated;
grant  insert (user_id, answers, updated_at) on public.profiles to authenticated;
grant  update (answers, updated_at)          on public.profiles to authenticated;
-- SELECT is left intact so the client can still read is_staff for its own row (under RLS).
```

## 3. Grant a tester staff access

Get the tester's `user_id` from **Supabase → Authentication → Users**, then:

```sql
insert into public.profiles (user_id, is_staff)
values ('<AUTH_USER_ID>', true)
on conflict (user_id) do update set is_staff = true;
```

To revoke: `update public.profiles set is_staff = false where user_id = '<AUTH_USER_ID>';`

Changes take effect the next time that user loads the app (the flag is read on the home screen
after sign-in).
