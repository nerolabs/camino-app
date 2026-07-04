import { useRef, useState, useCallback } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Platform, ScrollView,
  type NativeSyntheticEvent, type NativeScrollEvent,
} from 'react-native';
import { palette } from '@/constants/Colors';
import { useReducedMotion } from '@/lib/useReducedMotion';

// A "back to top" floating button for long scrolls (the roadmap, the guides list). Appears
// after you've scrolled roughly a screen down; taps smooth-scroll back to the top (instant
// when the user prefers reduced motion). Established pattern; requested for long roadmaps.
//
// Usage: const t = useBackToTop(); put t.ref + t.onScroll on the ScrollView (with
// scrollEventThrottle), and render <BackToTop {...t} /> as a SIBLING of the ScrollView inside
// a flex:1 parent — so it pins to the screen, not the scroll content.

const THRESHOLD = 700; // px scrolled before the button appears (~one phone screen)

export function useBackToTop() {
  const ref = useRef<ScrollView>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setVisible(prev => (prev ? y > THRESHOLD * 0.5 : y > THRESHOLD)); // hysteresis: no flicker at the edge
  }, []);

  const scrollToTop = useCallback(() => {
    ref.current?.scrollTo({ y: 0, animated: !reduced });
  }, [reduced]);

  return { ref, visible, onScroll, scrollToTop };
}

export function BackToTop({ visible, scrollToTop }: { visible: boolean; scrollToTop: () => void }) {
  if (!visible) return null;
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={scrollToTop}
      accessibilityRole="button"
      accessibilityLabel="Back to top"
    >
      <Text style={styles.icon}>↑</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    // fixed on web (viewport-anchored regardless of scroll); absolute on native, pinned to
    // the flex:1 screen parent.
    position: Platform.OS === 'web' ? ('fixed' as 'absolute') : 'absolute',
    bottom: 22, right: 22,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: palette.indigo,
    justifyContent: 'center', alignItems: 'center',
    boxShadow: '0 3px 12px rgba(21,36,59,0.28)',
    zIndex: 50,
  },
  icon: { color: palette.cal, fontSize: 22, lineHeight: 26, fontWeight: '600' },
});
