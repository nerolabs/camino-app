// Minimal react-native stub for vitest, so display-layer modules (lib/plan-format.ts, etc.)
// that import RN can be unit-tested for their PURE logic (timing/diff formatters — exactly the
// surfaces localization will touch). Only the primitives those pure functions reference are
// stubbed; anything a test actually exercises visually belongs in E2E, not here.

export const Platform = {
  OS: 'web' as 'web' | 'ios' | 'android',
  select: <T,>(spec: { web?: T; ios?: T; android?: T; default?: T }): T | undefined =>
    spec.web ?? spec.default,
};

export const Linking = {
  openURL: async (_url: string): Promise<void> => {},
  canOpenURL: async (_url: string): Promise<boolean> => true,
};
