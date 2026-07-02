import { useCallback, useRef, useState } from 'react';

// Web: fetch Lola's spoken audio from /api/tts (ElevenLabs, key server-side) and play it.
// Off by default — no surprise audio; the user opts in. Native counterpart is a no-op stub.

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const STORAGE_KEY = 'lola-voice-enabled';

export type LolaVoice = {
  supported: boolean;
  enabled: boolean;
  toggle: () => void;
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

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      if (!next) stop();
      return next;
    });
  }, [stop]);

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
        if (!res.ok) return;
        url = URL.createObjectURL(await res.blob());
        cache.current.set(t, url);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play().catch(() => {});
    } catch {
      /* audio is a nicety — never let it break the flow */
    }
  }, [supported, enabled, stop]);

  return { supported, enabled, toggle, speak, stop };
}
