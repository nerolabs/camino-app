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
// and explicitly deactivate the shared session when dictation ends.
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

// Clipping postmortem (build 28, both ends of the utterance):
//  - FIRST words lost: `listening` used to flip true the moment start() was CALLED, so the
//    "Listening…" cue appeared while the recognizer was still spinning up — anyone who spoke
//    on cue lost their opening words (speaking slowly "fixed" it). It now flips on the
//    recognizer's real 'start' event: when the UI says listening, the mic is genuinely hot.
//  - LAST words lost: stop() used to gate results AND deactivate the audio session
//    immediately, discarding the recognizer's final async flush — the tail of the utterance.
//    Now stop() lets recognition wind down naturally (results keep landing until 'end');
//    only cancel() — used when an answer is SENT — discards the flush, because there it
//    would re-fill the input the send just cleared.
export function useDictation(onText: (text: string) => void): Dictation {
  const [listening, setListening] = useState(false);
  const baseRef = useRef('');
  const activeRef = useRef(false);
  // Keep the latest callback in a ref — the event subscriptions below register once, so a
  // captured `onText` could go stale between renders.
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useSpeechRecognitionEvent('start', () => {
    if (activeRef.current) setListening(true); // the honest cue: mic is actually hot now
  });
  useSpeechRecognitionEvent('result', (event) => {
    if (!activeRef.current) return; // cancelled — the flush belongs to an answer already sent
    const transcript = event.results?.[0]?.transcript ?? '';
    const prefix = baseRef.current ? baseRef.current.trim() + ' ' : '';
    onTextRef.current(prefix + transcript);
  });
  useSpeechRecognitionEvent('end', () => {
    activeRef.current = false;
    setListening(false);
    releaseAudioSessionIOS();
  });
  useSpeechRecognitionEvent('error', () => {
    activeRef.current = false;
    setListening(false);
    releaseAudioSessionIOS();
  });

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
    // NOTE: setListening(true) happens in the 'start' event above, not here.
  }

  // User toggles the mic off mid-thought: let the final flush land (it's the last words of
  // their answer), then 'end' cleans up. The UI stops saying "Listening…" right away.
  function stop() {
    setListening(false);
    try { ExpoSpeechRecognitionModule.stop(); } catch { /* not running — fine */ }
  }

  // The answer was sent: whatever the recognizer still has buffered must NOT reach the input.
  function cancel() {
    activeRef.current = false;
    setListening(false);
    try { ExpoSpeechRecognitionModule.abort(); } catch {
      try { ExpoSpeechRecognitionModule.stop(); } catch { /* not running — fine */ }
    }
    releaseAudioSessionIOS();
  }

  return { supported: true, listening, start, stop, cancel };
}
