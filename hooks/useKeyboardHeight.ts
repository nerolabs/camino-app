import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, type KeyboardEvent } from 'react-native';

// Deterministic keyboard overlap, replacing KeyboardAvoidingView for the interview composer.
// KAV's geometry inference (frames + keyboardVerticalOffset guesswork) clipped the composer twice
// on device (builds 11 & 15) — the offset math depends on where the view sits relative to
// safe-area padding, and it silently under-pads when that changes. This hook instead uses the
// number the OS actually reports: the keyboard's top edge in screen coordinates. Our screens run
// to the bottom of the window (the root SafeAreaView only clips the TOP edge), so the exact
// overlap is windowHeight − keyboardTop. Pad by that; nothing can clip.
//
// iOS uses keyboardWillChangeFrame so QuickType-bar toggles and orientation resizes track too.
// Web: no RN keyboard events (the browser manages its own viewport) → always 0.

export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const onChange = (e: KeyboardEvent) => {
      const windowHeight = Dimensions.get('window').height;
      setHeight(Math.max(0, windowHeight - e.endCoordinates.screenY));
    };
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, onChange);
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  return height;
}
