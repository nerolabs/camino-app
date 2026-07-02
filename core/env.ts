// Runtime environment.
//
// EXPO_PUBLIC_ENV is baked per build/deploy: 'production' on getcamino.app / the production
// EAS environment, 'staging' everywhere else (preview deploys, native preview builds, local
// dev). Defaults to 'staging'.

export const APP_ENV = (process.env.EXPO_PUBLIC_ENV ?? 'staging').toLowerCase();
export const IS_PRODUCTION = APP_ENV === 'production';

// Staff gating now lives in the database: the `is_staff` column on the profiles table, surfaced
// through ProfileContext (useProfile().isStaff). It defaults false and is set by an admin — no
// hardcoded user-id allowlist in the client anymore. See docs/STAFF.md.
