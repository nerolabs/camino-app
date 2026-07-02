import type { LolaVoice } from './useLolaVoice';

// Native voice is a fast follow (expo-audio + /api/tts). No-op stub so the interview stays
// platform-agnostic and native builds don't break. `supported: false` hides the toggle off-web.
export function useLolaVoice(): LolaVoice {
  return { supported: false, enabled: false, toggle: () => {}, unlock: () => {}, speak: () => {}, stop: () => {} };
}
