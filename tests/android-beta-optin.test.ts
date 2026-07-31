import { describe, it, expect } from 'vitest';
import { androidBetaVisible, ANDROID_BETA_JOIN_URL } from '../components/AndroidBetaOptIn';

// The Android closed-beta recruitment band appears ONLY to Android web visitors, and ONLY once
// recruitment is actually open (a join URL is set). It must never render in the native binaries,
// on iPhone/desktop web, or while dormant — recruits reaching a not-yet-live test is a wasted
// first impression, and rival-store recruitment copy in the iOS binary is a 2.3.10 hazard.
describe('androidBetaVisible', () => {
  const URL = 'https://play.google.com/apps/testing/com.aelaboratories.getcamino';

  it('shows only to an Android web visitor when a join URL is set', () => {
    expect(androidBetaVisible('web', true, URL)).toBe(true);
  });

  it('stays hidden for non-Android web visitors (iPhone/desktop) even when live', () => {
    expect(androidBetaVisible('web', false, URL)).toBe(false);
  });

  it('never renders in the native binaries', () => {
    expect(androidBetaVisible('ios', true, URL)).toBe(false);
    expect(androidBetaVisible('android', true, URL)).toBe(false);
  });

  it('is dormant while no join URL is set, even for an Android web visitor', () => {
    expect(androidBetaVisible('web', true, '')).toBe(false);
  });

  it('is LIVE (2026-07-31): join URL points at the android-beta contact funnel and the band shows for Android web', () => {
    // Tripwire: recruitment is open. If the band is ever taken dormant again, set the URL back
    // to '' and restore the dormant assertion (androidBetaVisible('web', true) === false).
    expect(ANDROID_BETA_JOIN_URL.length).toBeGreaterThan(0);
    expect(ANDROID_BETA_JOIN_URL).toContain('/contact?topic=android-beta');
    expect(androidBetaVisible('web', true)).toBe(true);
  });
});
