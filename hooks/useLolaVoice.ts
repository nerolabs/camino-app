import { useCallback, useRef, useState } from 'react';

// Web: fetch Lola's spoken audio from /api/tts (ElevenLabs, key server-side) and play it.
// Off by default — no surprise audio; the user opts in. Native counterpart is a no-op stub.

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const STORAGE_KEY = 'lola-voice-enabled';

// A tiny silent WAV. Playing this on the shared <audio> element *during a user gesture* "unlocks"
// it, so the next real clip — which plays after an async /api/tts fetch, too late to count as
// gesture-initiated — isn't blocked by the browser autoplay policy. This is why the voice used to
// need a toggle off/on to start: the first fetched clip was blocked; the cached retry played.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAAAAAAAAAAAAAAAAAA==';

export type LolaVoice = {
  supported: boolean;
  enabled: boolean;
  toggle: () => void;
  unlock: () => void;
  speak: (text: string) => void;
  stop: () => void;
};

export function useLolaVoice(): LolaVoice {
  const supported = typeof window !== 'undefined' && typeof Audio !== 'undefined';
  const [enabled, setEnabled] = useState(() =>
    typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === '1');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cache = useRef<Map<string, string>>(new Map()); // text -> object URL (same text = same audio)
  const lastRef = useRef<string>('');

  // One reusable <audio> element. Reusing a single element that a gesture has unlocked is what
  // lets later fetched clips play without tripping autoplay — a fresh `new Audio()` each time does not.
  const getAudio = useCallback((): HTMLAudioElement | null => {
    if (!supported) return null;
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  }, [supported]);

  const stop = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
  }, []);

  // Call from inside a user gesture (button press / toggle) to prime playback. Cheap and idempotent.
  const unlock = useCallback(() => {
    const a = getAudio();
    if (!a) return;
    try {
      a.src = SILENT_WAV;
      a.play()?.then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
    } catch { /* best-effort */ }
  }, [getAudio]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      if (next) unlock(); // enabling is a gesture — bless the audio element right now
      else stop();
      return next;
    });
  }, [stop, unlock]);

  const speak = useCallback(async (text: string) => {
    const t = text?.trim();
    if (!supported || !enabled || !t || t === lastRef.current) return;
    lastRef.current = t;
    stop();
    try {
      let url = cache.current.get(t);
      if (!url) {
        const res = await fetch(`${API_BASE}/api/tts`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: t }),
        });
        if (!res.ok) { lastRef.current = ''; return; }
        url = URL.createObjectURL(await res.blob());
        cache.current.set(t, url);
      }
      const a = getAudio();
      if (!a) return;
      a.src = url;
      a.currentTime = 0;
      try {
        await a.play();
      } catch {
        // Blocked (no gesture unlock yet) — clear lastRef so a later gesture/turn can retry this text.
        lastRef.current = '';
      }
    } catch {
      /* audio is a nicety — never let it break the flow */
      lastRef.current = '';
    }
  }, [supported, enabled, stop, getAudio]);

  return { supported, enabled, toggle, unlock, speak, stop };
}
