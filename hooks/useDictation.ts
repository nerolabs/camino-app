import { useRef, useState } from 'react';
import { Platform } from 'react-native';

// Web dictation via the browser SpeechRecognition API. The native counterpart lives in
// useDictation.native.ts (Metro picks that for iOS/Android), so this file — and the web
// bundle — never imports the native speech-recognition module.
//
// Semantics mirror the native hook (see its clipping postmortem):
//  - `listening` flips on the recognizer's real onstart, so the "Listening…" cue is honest.
//  - stop()  = user toggled the mic off: the final result flush still lands (last words kept).
//  - cancel() = the answer was sent: abort, discarding any pending flush so it can't re-fill
//    the input the send just cleared.

const SpeechRecognitionImpl =
  typeof window !== 'undefined'
    ? ((window as unknown as Record<string, unknown>).SpeechRecognition ??
       (window as unknown as Record<string, unknown>).webkitSpeechRecognition)
    : undefined;

export type Dictation = {
  supported: boolean;
  listening: boolean;
  start: (baseText: string) => void;
  stop: () => void;
  cancel: () => void;
};

type WebRecognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  onstart: () => void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void; onerror: () => void;
  start: () => void; stop: () => void; abort: () => void;
};

export function useDictation(onText: (text: string) => void): Dictation {
  const [listening, setListening] = useState(false);
  const recRef = useRef<WebRecognition | null>(null);
  const activeRef = useRef(false);
  const supported = Platform.OS === 'web' && !!SpeechRecognitionImpl;

  function start(baseText: string) {
    if (!supported) return;
    const Recognition = SpeechRecognitionImpl as new () => WebRecognition;
    const rec = new Recognition();
    rec.lang = 'en-US';
    rec.interimResults = true;   // stream partial results so text appears live as you speak
    rec.continuous = true;       // keep listening until the user taps stop
    const prefix = baseText ? baseText.trim() + ' ' : '';
    rec.onstart = () => { if (activeRef.current) setListening(true); };
    rec.onresult = (e) => {
      if (!activeRef.current) return; // cancelled — flush belongs to an answer already sent
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      onText(prefix + transcript);
    };
    rec.onend = () => { activeRef.current = false; setListening(false); };
    rec.onerror = () => { activeRef.current = false; setListening(false); };
    activeRef.current = true;
    rec.start();
    recRef.current = rec;
    // NOTE: setListening(true) happens in onstart — when the mic is actually hot.
  }

  function stop() {
    setListening(false);
    recRef.current?.stop(); // final flush still lands via onresult; onend cleans up
  }

  function cancel() {
    activeRef.current = false;
    setListening(false);
    try { recRef.current?.abort(); } catch { recRef.current?.stop(); }
  }

  return { supported, listening, start, stop, cancel };
}
