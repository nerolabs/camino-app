// Native analytics stub — no-op for now (posthog-react-native is a fast follow). Keeps the same
// interface as lib/analytics.ts so app code stays platform-agnostic and native builds don't break.

export function initAnalytics() {}
export function capture(_event: string, _props?: Record<string, unknown>) {}
export function identify(_userId: string, _props?: Record<string, unknown>) {}
export function resetAnalytics() {}
