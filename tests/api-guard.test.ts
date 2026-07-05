import { describe, it, expect } from 'vitest';
import { isAllowedOrigin, corsPreflight } from '../lib/apiGuard';

// The abuse guards for the paid routes (/api/lola, /api/tts). These pure/Web-API functions were
// previously only verified by live burst tests; unit-testing them locks the CORS/origin logic so
// a refactor can't quietly reopen the endpoints.

describe('isAllowedOrigin', () => {
  it('accepts our own origins', () => {
    expect(isAllowedOrigin('https://getcamino.app')).toBe(true);
    expect(isAllowedOrigin('https://www.getcamino.app')).toBe(true);
    expect(isAllowedOrigin('https://camino.expo.app')).toBe(true);
    expect(isAllowedOrigin('https://camino--staging.expo.app')).toBe(true);
  });

  it('accepts per-deploy preview URLs (camino--<id>.expo.app over https)', () => {
    expect(isAllowedOrigin('https://camino--abc123.expo.app')).toBe(true);
    expect(isAllowedOrigin('https://camino--xj9u5k7mdw.expo.app')).toBe(true);
    expect(isAllowedOrigin('http://camino--abc123.expo.app')).toBe(false); // https only
  });

  it('accepts any localhost port for dev', () => {
    expect(isAllowedOrigin('http://localhost:8081')).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:19006')).toBe(true);
  });

  it('accepts a Referer (full URL) by its origin', () => {
    expect(isAllowedOrigin('https://getcamino.app/interview?from=nie')).toBe(true);
  });

  it('rejects foreign and look-alike origins, and junk', () => {
    expect(isAllowedOrigin('https://evil.example.com')).toBe(false);
    expect(isAllowedOrigin('https://camino--staging.expo.app.evil.com')).toBe(false);
    expect(isAllowedOrigin('https://getcamino.app.evil.com')).toBe(false);
    expect(isAllowedOrigin('not-a-url')).toBe(false);
    expect(isAllowedOrigin('')).toBe(false);
  });
});

describe('corsPreflight', () => {
  const opt = (origin?: string) =>
    new Request('https://camino--staging.expo.app/api/lola', {
      method: 'OPTIONS',
      headers: origin ? { origin } : {},
    });

  it('grants an allowed origin (echoes it, no wildcard)', async () => {
    const res = corsPreflight(opt('https://getcamino.app'));
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://getcamino.app');
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
  });

  it('denies a foreign origin (204 with NO allow-origin header — browser blocks it)', () => {
    const res = corsPreflight(opt('https://evil.example.com'));
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('sends no allow-origin when there is no Origin header', () => {
    const res = corsPreflight(opt());
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
    expect(res.headers.get('vary')).toBe('Origin');
  });
});
