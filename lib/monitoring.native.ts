// Native monitoring is a fast follow (@sentry/react-native + its Expo config plugin, which needs a
// native rebuild). No-op stub for now so the shared interface resolves on iOS/Android without
// pulling the browser SDK into the native bundle.
export function initMonitoring() {}
export function captureError(_err: unknown, _context?: Record<string, unknown>) {}
