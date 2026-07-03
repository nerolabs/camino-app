import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/**
 * Is the viewport desktop-wide (≥768px)? On web, useWindowDimensions reports a fallback
 * width during static rendering and doesn't reliably update after hydration — which left
 * desktop layouts stuck in their stacked mobile variant (first found on the landing hero).
 * Measure the real window on the client instead; default to wide when unknown (SSR/first
 * paint), because the static render is overwhelmingly consumed by desktop crawlers/users.
 */
export function useWide(breakpoint = 768): boolean {
  const { width: rnWidth } = useWindowDimensions();
  const [webWidth, setWebWidth] = useState<number | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const update = () => setWebWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const width = Platform.OS === 'web' ? webWidth : rnWidth;
  return width == null ? true : width >= breakpoint;
}
