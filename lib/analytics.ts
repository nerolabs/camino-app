// Product analytics (web) via PostHog. The native counterpart (lib/analytics.native.ts) is a
// no-op stub for now — native analytics (posthog-react-native) is a fast follow. Same interface
// both sides so callers are platform-agnostic.
//
// The key is only present in the staging/production web bundles (set in the EAS envs, NOT in the
// local .env), so local dev sends nothing and never pollutes the funnel. Every event carries an
// `environment` super-property (production/staging) so dashboards can filter to real users.
import posthog from 'posthog-js';
import { APP_ENV } from '@/core/env';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';
let ready = false;

export function initAnalytics() {
  if (ready || !KEY || typeof window === 'undefined') return;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'always',   // include anonymous visitors so the home→roadmap funnel + retention work
    capture_pageview: true,      // SPA route views (home / interview / plan)
    capture_pageleave: true,
    autocapture: true,
  });
  posthog.register({ environment: APP_ENV }); // stamped on every event
  ready = true;
}

export function capture(event: string, props?: Record<string, unknown>) {
  if (ready) posthog.capture(event, props);
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (ready) posthog.identify(userId, props);
}

export function resetAnalytics() {
  if (ready) posthog.reset();
}
