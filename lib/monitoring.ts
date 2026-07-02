// Error + performance monitoring (web) via Sentry. The native counterpart
// (lib/monitoring.native.ts) is a no-op stub for now — @sentry/react-native lands with the next
// native build. Same interface both sides so callers stay platform-agnostic.
//
// The DSN is only set in the staging/production web bundles (EAS envs, NOT the local .env), so
// local dev reports nothing. Events are tagged with environment (production/staging) + platform=web
// so one Sentry project serves web, native, and the backend, filtered by tag.
import * as Sentry from '@sentry/browser';
import { APP_ENV } from '@/core/env';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
let ready = false;

export function initMonitoring() {
  if (ready || !DSN || typeof window === 'undefined') return;
  Sentry.init({
    dsn: DSN,
    environment: APP_ENV,
    // browserTracing captures the page-load + navigation transactions and Web Vitals
    // (LCP / CLS / INP) — the "time to load / product health" signal, per platform.
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: APP_ENV === 'production' ? 0.2 : 1.0,
    initialScope: { tags: { platform: 'web' } },
  });
  ready = true;
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (ready) Sentry.captureException(err, context ? { extra: context } : undefined);
}
