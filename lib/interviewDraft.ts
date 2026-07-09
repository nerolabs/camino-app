/**
 * Anonymous interview draft (interview redesign, Phase 0 — see docs/INTERVIEW-REDESIGN.md).
 *
 * The landing promises "no account needed to start", so most users are anonymous — and today a
 * reload or a come-back-later wipes everything (a real bounce driver in the replays). This
 * persists the in-progress answers to localStorage so an anonymous user can resume, and carries
 * the completeness fraction so the return prompt can say "your roadmap is 60% complete — pick up
 * where you left off?". Signed-in users already persist to the DB via core/profileDb.
 *
 * Pure and storage-injectable (defaults to window.localStorage, guarded for SSR/native). Stores
 * only real slot answers (+ progress) — derived fields are recomputed via derive() on load, so a
 * stale derivation can never be resurrected.
 */
import { SLOTS, derive, type Profile } from '@/core/interview-controller';
import { interviewCompleteness } from '@/core/completeness';

const KEY = 'camino.interview.draft.v1';
const SLOT_FIELDS = new Set(SLOTS.map(s => s.field));

export type InterviewDraft = {
  answers: Profile;            // slot answers only (+ progress)
  lastSlotField: string | null;
  completeness: number;        // 0..1 at time of save
  updatedAt: number;           // epoch ms
};

// Minimal shape we depend on — lets tests inject a fake and keeps native (AsyncStorage) out of v1.
export type SyncStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function defaultStorage(): SyncStorage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch { /* access can throw in sandboxed/SSR contexts */ }
  return null;
}

// Keep only answerable slot fields (+ progress). Drops derived fields and any stray keys.
function pickAnswers(profile: Profile): Profile {
  const out: Profile = {};
  for (const [k, v] of Object.entries(profile))
    if (SLOT_FIELDS.has(k) || k === 'progress') out[k] = v;
  return out;
}

export function saveDraft(
  profile: Profile,
  lastSlotField: string | null,
  storage: SyncStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  const answers = pickAnswers(profile);
  // completeness wants derived fields to judge applicability — derive a throwaway copy.
  const derived: Profile = { ...answers };
  derive(derived);
  const draft: InterviewDraft = {
    answers,
    lastSlotField,
    completeness: interviewCompleteness(derived).pct,
    updatedAt: Date.now(),
  };
  try { storage.setItem(KEY, JSON.stringify(draft)); } catch { /* quota / private mode */ }
}

export function loadDraft(storage: SyncStorage | null = defaultStorage()): InterviewDraft | null {
  if (!storage) return null;
  let raw: string | null;
  try { raw = storage.getItem(KEY); } catch { return null; }
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as InterviewDraft;
    if (!d || typeof d !== 'object' || !d.answers || typeof d.answers !== 'object') return null;
    if (Object.keys(d.answers).length === 0) return null; // nothing worth resuming
    return d;
  } catch { return null; }
}

export function clearDraft(storage: SyncStorage | null = defaultStorage()): void {
  if (!storage) return;
  try { storage.removeItem(KEY); } catch { /* ignore */ }
}
