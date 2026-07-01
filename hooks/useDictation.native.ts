import { useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import type { Dictation } from './useDictation';

// Native dictation via expo-speech-recognition (iOS SFSpeechRecognizer / Android). Same
// interface as the web hook so app/interview.tsx is platform-agnostic.

export function useDictation(onText: (text: string) => void): Dictation {
  const [listening, setListening] = useState(false);
  const baseRef = useRef('');
  // Keep the latest callback in a ref — the event subscriptions below register once, so a
  // captured `onText` could go stale between renders.
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    const prefix = baseRef.current ? baseRef.current.trim() + ' ' : '';
    onTextRef.current(prefix + transcript);
  });
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', () => setListening(false));

  async function start(baseText: string) {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) return;
    baseRef.current = baseText;
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true, // live partial results
      continuous: true,     // keep listening until the user taps stop
    });
    setListening(true);
  }

  function stop() {
    ExpoSpeechRecognitionModule.stop();
    setListening(false);
  }

  return { supported: true, listening, start, stop };
}
