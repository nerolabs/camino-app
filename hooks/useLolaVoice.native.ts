import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { LolaVoice } from './useLolaVoice';

// Native (iOS/Android) counterpart of the web voice hook. Plays Lola's /api/tts audio via
// expo-audio. There's no browser autoplay-gesture restriction here, so it just plays when a new
// turn arrives. expo-audio streams a URL (not a request body), so it hits the GET variant of
// /api/tts. On by default, matching web; the interview's pill toggles/mutes it.

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export function useLolaVoice(): LolaVoice {
  const [enabled, setEnabled] = useState(true);
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const lastRef = useRef<string>('');

  // Release the native player when the screen unmounts.
  useEffect(() => () => { try { playerRef.current?.remove(); } catch { /* noop */ } }, []);

  const stop = useCallback(() => {
    try { playerRef.current?.pause(); } catch { /* noop */ }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (!next) { try { playerRef.current?.pause(); } catch { /* noop */ } }
      return next;
    });
  }, []);

  const speak = useCallback(async (text: string) => {
    const t = text?.trim();
    if (!enabled || !t || t === lastRef.current) return;
    lastRef.current = t;
    try {
      // Re-assert the playback session before EVERY play — not once. Dictation's microphone
      // flips iOS into a record-capable session that routes output to the quiet earpiece
      // receiver, which made the second and every later Lola line come out at phone-call
      // volume (build-25 family finding). allowsRecording:false forces the loud speaker
      // route back; playsInSilentMode keeps her audible past the ringer switch.
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
      const url = `${API_BASE}/api/tts?text=${encodeURIComponent(t)}`;
      if (!playerRef.current) playerRef.current = createAudioPlayer(url);
      else playerRef.current.replace(url);
      playerRef.current.play();
    } catch {
      lastRef.current = '';
    }
  }, [enabled]);

  // unlock() is a no-op on native (audio doesn't need a gesture to start, unlike web browsers).
  return { supported: true, enabled, toggle, unlock: () => {}, speak, stop };
}
