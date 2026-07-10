// Native analytics (iOS/Android) via posthog-react-native. Mirrors lib/analytics.ts so the shared
// funnel events (interview_started/completed, roadmap_viewed, …) fire identically on native.
//
// Key/host come from the EAS environment (preview/production), so a dev build with no key is silent.
// Every event carries an `environment` super-property, matching web, so dashboards filter to real
// users. Same PostHog project as web — native events just carry platform context automatically.
import PostHog from 'posthog-react-native';
import { APP_ENV } from '@/core/env';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';
let posthog: PostHog | null = null;

export function initAnalytics() {
  if (posthog || !KEY) return;
  posthog = new PostHog(KEY, {
    host: HOST,
    captureAppLifecycleEvents: true, // app opened/backgrounded — native engagement signal
  });
  // Stamped on every event; `interview_version: 2` = the living-roadmap redesign — parity with
  // web so iOS events segment correctly in pre/post comparisons.
  posthog.register({ environment: APP_ENV, interview_version: 2, landing_version: 2 });
}

// props are JSON-serializable analytics values in practice; cast to satisfy PostHog's JsonType.
export function capture(event: string, props?: Record<string, unknown>) {
  posthog?.capture(event, props as Record<string, any>);
}

export function identify(userId: string, props?: Record<string, unknown>) {
  posthog?.identify(userId, props as Record<string, any>);
}

export function resetAnalytics() {
  posthog?.reset();
}
