import { useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import type { Dictation } from './useDictation';

// Native dictation via expo-speech-recognition (iOS SFSpeechRecognizer / Android). Same
// interface as the web hook so app/interview.tsx is platform-agnostic.

// Volume-drop postmortem (builds 25–26): the library's DEFAULT iOS audio session for
// recognition is category playAndRecord with mode "measurement" — a mode that bypasses
// iOS's output processing and makes ALL subsequent playback markedly quieter. It also
// leaves the session configured after recognition ends. Result: Lola's first line (before
// any mic use) played at full volume; every line after dictation played quiet — and
// resetting expo-audio's flags before playback wasn't enough to undo the mode. Fix at the
// source: run recognition in mode "default" (same recording quality for SFSpeechRecognizer),
// and explicitly deactivate the shared session when dictation stops.
const IOS_AUDIO_SESSION: Parameters<typeof ExpoSpeechRecognitionModule.setCategoryIOS>[0] = {
  category: 'playAndRecord',
  categoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
  mode: 'default',
};

function releaseAudioSessionIOS() {
  if (Platform.OS !== 'ios') return;
  try {
    ExpoSpeechRecognitionModule.setAudioSessionActiveIOS(false, { notifyOthersOnDeactivation: true });
  } catch { /* session may already be inactive — fine */ }
}

export function useDictation(onText: (text: string) => void): Dictation {
  const [listening, setListening] = useState(false);
  const baseRef = useRef('');
  // Gate for late results: SFSpeechRecognizer flushes a final 'result' event AFTER stop() is
  // called — without this gate, that flush re-fills the answer box the submit just cleared
  // (build-27 finding: the previous spoken answer reappeared in the next question's box).
  const activeRef = useRef(false);
  // Keep the latest callback in a ref — the event subscriptions below register once, so a
  // captured `onText` could go stale between renders.
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useSpeechRecognitionEvent('result', (event) => {
    if (!activeRef.current) return; // stale flush after stop — the answer was already sent
    const transcript = event.results?.[0]?.transcript ?? '';
    const prefix = baseRef.current ? baseRef.current.trim() + ' ' : '';
    onTextRef.current(prefix + transcript);
  });
  useSpeechRecognitionEvent('end', () => { activeRef.current = false; setListening(false); releaseAudioSessionIOS(); });
  useSpeechRecognitionEvent('error', () => { activeRef.current = false; setListening(false); releaseAudioSessionIOS(); });

  async function start(baseText: string) {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) return;
    baseRef.current = baseText;
    activeRef.current = true;
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true, // live partial results
      continuous: true,     // keep listening until the user taps stop
      iosCategory: IOS_AUDIO_SESSION,
    });
    setListening(true);
  }

  function stop() {
    activeRef.current = false; // BEFORE the engine stop — its final flush must not land
    ExpoSpeechRecognitionModule.stop();
    setListening(false);
    releaseAudioSessionIOS();
  }

  return { supported: true, listening, start, stop };
}
