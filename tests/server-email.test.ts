import { describe, it, expect, afterEach } from 'vitest';
import { siteOrigin } from '../lib/serverEmail';

// siteOrigin decides the canonical origin baked into every user-facing email link. Getting it
// wrong leaked the per-deploy *.expo.app host once (the reason it exists) — so pin it per env.
// It must NEVER derive the origin from request.url in staging/production (that's the leak).

const req = () => new Request('https://camino--somedeploy.expo.app/api/email/weekly');

afterEach(() => { delete process.env.EXPO_PUBLIC_ENV; });

describe('siteOrigin', () => {
  it('is the canonical production host in production (ignores request.url)', () => {
    process.env.EXPO_PUBLIC_ENV = 'production';
    expect(siteOrigin(req())).toBe('https://getcamino.app');
  });

  it('is the staging alias in staging (ignores request.url)', () => {
    process.env.EXPO_PUBLIC_ENV = 'staging';
    expect(siteOrigin(req())).toBe('https://camino--staging.expo.app');
  });

  it('falls back to the request origin only in local dev', () => {
    delete process.env.EXPO_PUBLIC_ENV;
    expect(siteOrigin(new Request('http://localhost:8081/api/email/weekly'))).toBe('http://localhost:8081');
  });
});
