// Runtime environment + staff gating.
//
// EXPO_PUBLIC_ENV is baked per build/deploy: 'production' on getcamino.app / the production
// EAS environment, 'staging' everywhere else (preview deploys, native preview builds, local
// dev). Defaults to 'staging' so dev tooling is never hidden by accident in development.

export const APP_ENV = (process.env.EXPO_PUBLIC_ENV ?? 'staging').toLowerCase();
export const IS_PRODUCTION = APP_ENV === 'production';

// Staff allowlist (Supabase user ids), comma-separated in EXPO_PUBLIC_STAFF_USER_IDS. Only used
// to reveal non-sensitive dev tooling (e.g. test personas) in production for the team. These ids
// gate nothing sensitive, so shipping them in the client bundle is acceptable.
const STAFF_IDS = (process.env.EXPO_PUBLIC_STAFF_USER_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function isStaff(userId?: string | null): boolean {
  return !!userId && STAFF_IDS.includes(userId);
}

// Dev tools show outside production, or for signed-in staff anywhere.
export function showDevTools(userId?: string | null): boolean {
  return !IS_PRODUCTION || isStaff(userId);
}
