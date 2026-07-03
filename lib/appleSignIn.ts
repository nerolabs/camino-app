// Web stub — Sign in with Apple is native-only for now (guideline 4.8 concerns the iOS app).
// Enabling it on web would additionally require the Apple *web* OAuth config in Supabase
// (Services ID + secret); revisit if we ever want it there. Same interface as the .native twin.

export const appleSignInAvailable = false;

export async function signInWithApple(): Promise<void> {
  throw new Error('Sign in with Apple is only available in the iOS app.');
}
