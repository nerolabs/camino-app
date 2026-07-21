import { describe, it, expect } from 'vitest';
import { storeBandVisible } from '../components/StoreBadges';

// Regression for the build-40 App Review rejection (Guideline 2.3.10, 2026-07-21): the
// landing page's store-availability band showed a "Google Play" pill inside the iOS binary.
// The band is a web-only acquisition surface — native must never render rival-store copy.
describe('storeBandVisible', () => {
  it('shows the band on web', () => {
    expect(storeBandVisible('web')).toBe(true);
  });

  it('hides the band in the native binaries (the 2.3.10 rejection)', () => {
    expect(storeBandVisible('ios')).toBe(false);
    expect(storeBandVisible('android')).toBe(false);
  });
});
