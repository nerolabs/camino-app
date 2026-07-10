import { useCallback, useRef, useState } from 'react';

// Web: fetch Lola's spoken audio from /api/tts (ElevenLabs, key server-side) and play it through
// the Web Audio API. Off by default — no surprise audio; the user opts in. Native = no-op stub.
//
// Why Web Audio (not `new Audio().play()`): the first clip plays AFTER the async /api/tts fetch,
// too late to count as gesture-initiated, so HTMLAudioElement autoplay is blocked (the voice
// wouldn't start until you toggled off/on). An AudioContext, once resumed inside a user gesture
// (the speaker toggle / "Let's get started"), stays unlocked for the session — so every later
// turn plays automatically. That's the fix.

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const STORAGE_KEY = 'lola-voice-enabled';

type AudioCtor = typeof AudioContext;
function audioContextCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
    ?? null;
}

export type LolaVoice = {
  supported: boolean;
  enabled: boolean;
  toggle: () => void;
  unlock: () => void;
  speak: (text: string) => void;
  stop: () => void;
};

export function useLolaVoice(): LolaVoice {
  const supported = audioContextCtor() != null;
  // OFF by default (user decision 2026-07-10): chips made turns fast enough that auto-voice reads
  // as noise, and TTS costs real money. The speaker toggle is the opt-in — it doubles as the
  // autoplay-unlocking gesture browsers require anyway. Anyone who opts in (persisted '1') stays on.
  const [enabled, setEnabled] = useState(() =>
    typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === '1');

  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const cache = useRef<Map<string, AudioBuffer>>(new Map()); // text -> decoded audio
  const lastRef = useRef<string>('');

  const getCtx = useCallback((): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current;
    const Ctor = audioContextCtor();
    if (!Ctor) return null;
    ctxRef.current = new Ctor();
    return ctxRef.current;
  }, []);

  const stop = useCallback(() => {
    if (srcRef.current) {
      try { srcRef.current.stop(); } catch { /* already stopped */ }
      srcRef.current = null;
    }
  }, []);

  // Call from inside a user gesture (speaker toggle, "Let's get started"): create + resume the
  // AudioContext so later fetched clips can play. Cheap and idempotent.
  const unlock = useCallback(() => {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }, [getCtx]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      if (!next) stop();
      return next;
    });
    unlock(); // resume the context within this gesture (kept out of the state updater — no side effects there)
  }, [stop, unlock]);

  const speak = useCallback(async (text: string) => {
    const t = text?.trim();
    if (!supported || !enabled || !t || t === lastRef.current) return;
    lastRef.current = t;
    stop();
    try {
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
      let buf = cache.current.get(t);
      if (!buf) {
        const res = await fetch(`${API_BASE}/api/tts`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: t }),
        });
        if (!res.ok) { lastRef.current = ''; return; }
        buf = await ctx.decodeAudioData(await res.arrayBuffer());
        cache.current.set(t, buf);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      srcRef.current = src;
      src.start();
    } catch {
      // Fetch/decode/play failed — clear lastRef so a later gesture/turn can retry this text.
      lastRef.current = '';
    }
  }, [supported, enabled, stop, getCtx]);

  return { supported, enabled, toggle, unlock, speak, stop };
}
