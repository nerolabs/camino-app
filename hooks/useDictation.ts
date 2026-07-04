import { useRef, useState } from 'react';
import { Platform } from 'react-native';

// Web dictation via the browser SpeechRecognition API. The native counterpart lives in
// useDictation.native.ts (Metro picks that for iOS/Android), so this file — and the web
// bundle — never imports the native speech-recognition module.

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
};

type WebRecognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void; onerror: () => void;
  start: () => void; stop: () => void;
};

export function useDictation(onText: (text: string) => void): Dictation {
  const [listening, setListening] = useState(false);
  const recRef = useRef<WebRecognition | null>(null);
  // Gate for late results: the recognizer can flush a final onresult AFTER stop() — without
  // this, that flush re-fills the answer box the submit just cleared (see the native twin).
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
    rec.onresult = (e) => {
      if (!activeRef.current) return; // stale flush after stop — the answer was already sent
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      onText(prefix + transcript);
    };
    rec.onend = () => { activeRef.current = false; setListening(false); };
    rec.onerror = () => { activeRef.current = false; setListening(false); };
    activeRef.current = true;
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  function stop() {
    activeRef.current = false; // BEFORE the engine stop — its final flush must not land
    recRef.current?.stop();
    setListening(false);
  }

  return { supported, listening, start, stop };
}
