// Native error + performance monitoring (iOS/Android) via @sentry/react-native. Mirrors the web
// module's interface (lib/monitoring.ts). Reports to the SAME Sentry project as web, tagged by
// platform (ios/android) + environment, so everything sits in one view.
//
// DSN is baked from the EAS environment (preview/production) at build time; a dev build has no DSN
// and reports nothing. Source maps upload during EAS Build when SENTRY_AUTH_TOKEN is set (see the
// @sentry/react-native/expo plugin in app.config.ts).
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import { APP_ENV } from '@/core/env';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
let ready = false;

export function initMonitoring() {
  if (ready || !DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: APP_ENV,
    tracesSampleRate: APP_ENV === 'production' ? 0.2 : 1.0, // app-start + navigation perf
    sendDefaultPii: false,
  });
  Sentry.setTag('platform', Platform.OS); // ios / android
  ready = true;
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (ready) Sentry.captureException(err, context ? { extra: context } : undefined);
}
