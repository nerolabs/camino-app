import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

// Does the user prefer reduced motion? (a11y sweep, 2026-07-04)
// Web: the prefers-reduced-motion media query. Native: the OS accessibility setting.
// Animations should degrade to their resting state when this is true — the rotating
// hero was the first offender (endless cross-fade with no way to opt out).
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setReduced(mq.matches);
      update();
      mq.addEventListener?.('change', update);
      return () => mq.removeEventListener?.('change', update);
    }
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub?.remove();
  }, []);

  return reduced;
}
