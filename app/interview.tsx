import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import NavBar from '@/components/NavBar';
import RoadmapPane from '@/components/RoadmapPane';
import { palette } from '@/constants/Colors';
import { nextSlot, derive, interviewProgress, SLOTS, type Slot, type Profile } from '@/core/interview-controller';
import { interviewCompleteness } from '@/core/completeness';
import { buildPlan } from '@/core/engine-controller';
import { diffPlans } from '@/core/plan-delta';
import { regionLabel, REGION_OPTIONS } from '@/core/regions';
import { useProfile } from '@/core/ProfileContext';
import { useAuth } from '@/core/AuthContext';
import { saveProfile as saveProfileDb } from '@/core/profileDb';
import { saveDraft, clearDraft } from '@/lib/interviewDraft';
import { TEST_PERSONAS, type Persona } from '@/core/test-personas';
import { askAnthropic } from '@/lib/lola';
import { buildExtractionSystem, parseExtraction, type Extraction } from '@/lib/extractionPrompt';
import { useTranslation } from 'react-i18next';
import i18n, { languageDirective } from '@/lib/i18n';
import { useDictation } from '@/hooks/useDictation';
import { useLolaVoice } from '@/hooks/useLolaVoice';
import { capture } from '@/lib/analytics';
import { captureError } from '@/lib/monitoring';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

type Turn = { role: 'lola' | 'user'; text: string };

// Render the conversation so far as a plain transcript the model can reason over.
// Drops the dev-persona marker line so it never leaks into a real prompt.
function transcriptOf(turns: Turn[]): string {
  return turns
    .filter(t => !t.text.startsWith('Test persona:'))
    .map(t => `${t.role === 'lola' ? 'Lola' : 'User'}: ${t.text}`)
    .join('\n');
}

async function extractAnswer(
  slot: Slot, userText: string, turns: Turn[], remaining: Slot[]
): Promise<Extraction> {
  const rawText = await askAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    system: buildExtractionSystem({ slot, transcript: transcriptOf(turns), remaining }),
    messages: [{ role: 'user', content: userText }],
  });
  return parseExtraction(rawText);
}

// When the user replies with a QUESTION instead of an answer ("what do you mean?", "why do
// you ask?"), a canned "sorry, didn't catch that" reads as deaf (build-25 family finding).
// This is the phrasing surface, extended: Lola may explain what the question means and why
// it's asked, then re-ask — but she may NOT state legal facts, thresholds, deadlines, costs,
// or eligibility rules here (invariant 3: those live in the roadmap's sourced steps).
async function phraseClarify(
  slot: Slot, userText: string, turns: Turn[], extractorHint: string | undefined, reask: string,
): Promise<string> {
  const rawText = await askAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 220,
    system: `You are Lola, Get Camino's warm, honest relocation guide, mid-interview. You asked about
"${slot.prompt_hint}" and the user replied with a question or confusion rather than an answer.
${transcriptOf(turns) ? `Conversation so far:\n${transcriptOf(turns)}\n` : ''}
${extractorHint ? `What seems ambiguous: ${extractorHint}\n` : ''}
Reply in 1–3 short, warm sentences: first help them — explain what the question means in plain
words, or why you're asking it — then naturally re-ask (you can adapt: "${reask}").
HARD RULES: never state legal facts, deadlines, income thresholds, costs, or eligibility rules —
if they ask for those, say their personalized roadmap right after this interview covers it with
official sources. Never invent an answer for them. Plain text only.${languageDirective()}`,
    messages: [{ role: 'user', content: userText }],
  });
  return rawText.trim();
}

// Conversational reaction to an answer (interview redesign — "contextual reaction", user decision
// 2026-07-10). Runs async and NON-BLOCKING: the next question is already on screen (static/instant);
// this reaction slots in above it a beat later, or silently no-ops on any error/slowness. Like
// phraseClarify it may NOT state facts/numbers/deadlines/rules (invariant 3) — just warmth.
async function phraseAck(slot: Slot, userText: string): Promise<string> {
  const raw = await askAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 40,
    system: `You are Lola, a warm relocation guide helping someone move to Spain. They were asked about
"${slot.prompt_hint}" and answered: "${userText}".
React in ONE brief, natural sentence — at most 10 words. Warm but UNDERSTATED: a light acknowledgement,
never gushing, never over-complimentary ("Got it", "Nice", "Makes sense", "Perfect"). No emoji.
HARD RULES: do NOT ask a question. Do NOT state any legal fact, deadline, income figure, cost, number,
or eligibility rule — those live in their roadmap. Plain text.${languageDirective()}`,
    messages: [{ role: 'user', content: 'React to my answer.' }],
  });
  return raw.trim();
}

// The deterministic question fallbacks now live in locales/<lang>/interview.json ("static.*") —
// same interview, less charm, any language. Reads via the i18n singleton (these are used in
// async flows, not render). Fields without a static entry fall through to the callers' generic
// prompt_hint fallback, exactly as the old Record<string,string> lookup did.
const staticQuestion = (field: string): string | undefined =>
  i18n.exists(`interview:static.${field}`) ? i18n.t(`interview:static.${field}`) : undefined;

// A slot is answered by tapping chips when it's a yes/no or has a fixed option set — everything
// except open free-text (nationalities) and dates, which use the composer. This is the friction
// fix: the top clarify offenders (work_situation, income, driving) become a single tap.
function slotUsesChips(slot: Slot | null): boolean {
  return !!slot && (slot.type === 'bool' || (slot.options?.length ?? 0) > 0)
    && slot.input !== 'date' && slot.input !== 'typeahead';
}

// Comunidad suggestions for the region type-ahead, filtered by a case-insensitive substring of
// the label. "not_sure" is offered separately as a persistent row, so it's excluded here.
function regionSuggestions(query: string): { slug: string; label: string }[] {
  const q = query.trim().toLowerCase();
  return REGION_OPTIONS
    .filter(s => s !== 'not_sure')
    .map(s => ({ slug: s, label: regionLabel(s) ?? s }))
    .filter(r => !q || r.label.toLowerCase().includes(q));
}

export default function InterviewScreen() {
  const { t } = useTranslation('interview');
  const router = useRouter();
  // Context-carrying CTA: /interview?from=<guide-id> is still recorded on interview_started for
  // attribution; the opener is now deterministic static copy (no LLM greeting to personalize).
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { user } = useAuth();
  const { setProfile: saveProfile, isStaff } = useProfile();

  async function persist(p: Profile) {
    saveProfile(p);
    if (user) await saveProfileDb(user.id, p);
  }
  const [turns, setTurns] = useState<Turn[]>([]);
  const [profile, setProfile] = useState<Profile>({});
  const [currentSlot, setCurrentSlot] = useState<Slot | null>(null);
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(0); // measured composer content height (auto-grow)
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [showDev, setShowDev] = useState(false);
  // When a chip slot offers "Other", tapping it reveals the free-text/voice composer for this turn.
  const [otherActive, setOtherActive] = useState(false);
  // Ids of roadmap steps the latest answer just added — the live-roadmap pane highlights them,
  // then they settle (cleared on a timer). See docs/INTERVIEW-REDESIGN.md, Phase 2.
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const { width } = useWindowDimensions();
  const twoPane = width >= 900; // web two-pane needs room; phones/tablets stay single-column
  const scrollRef = useRef<ScrollView>(null);
  const progressRef = useRef(0);
  const inputRef = useRef<TextInput>(null);
  // Voice dictation — web uses the browser SpeechRecognition API, native uses
  // expo-speech-recognition (platform-split in hooks/useDictation). Streams into the input.
  const dictation = useDictation(setInput);
  // Lola's spoken voice (web /api/tts → ElevenLabs). Off by default; speaks new Lola turns.
  const voice = useLolaVoice();
  const keyboardHeight = useKeyboardHeight(); // exact OS-reported overlap — see hooks/useKeyboardHeight

  // Speak each new Lola message when voice is on (skips the dev-persona marker).
  useEffect(() => {
    const last = turns[turns.length - 1];
    if (last?.role === 'lola' && !last.text.startsWith('Test persona:')) voice.speak(last.text);
  }, [turns, voice.speak]);

  // When the keyboard opens/resizes, keep the conversation scrolled to the composer.
  useEffect(() => {
    if (keyboardHeight > 0) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [keyboardHeight]);

  // Auto-focus the answer box only when the composer is actually shown (free-text/date/Other) —
  // chip questions are answered by tapping, so focusing a hidden field there is wrong.
  useEffect(() => {
    const composerShown = !slotUsesChips(currentSlot) || otherActive;
    if (started && !done && !loading && currentSlot && composerShown) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [currentSlot, loading, started, done, otherActive]);

  // Auto-start: the interview opens directly into the conversation — the standalone "Hola, I'm
  // Lola" intro screen is now Lola's opening bubble (start()). Fires once on mount.
  useEffect(() => { if (!started) start(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Switching language mid-interview (user finding 2026-07-05): the chrome re-renders via
  // useTranslation, but the CURRENT question is a stored string, generated in the old language —
  // so it looked stranded and users reloaded (losing progress). Re-issue just the active prompt
  // in the new language, instantly and deterministically, via the translated static question.
  // Past turns stay as-generated (you can't retranslate an LLM conversation; they scroll away).
  // Guarded to fire ONLY on a real language change — never clobbers a freshly generated question.
  const langRef = useRef(i18n.language);
  useEffect(() => {
    if (langRef.current === i18n.language) return;
    langRef.current = i18n.language;
    if (!started || done || loading || !currentSlot) return;
    const q = staticQuestion(currentSlot.field);
    if (!q) return;
    setTurns(prev => {
      if (!prev.length || prev[prev.length - 1].role !== 'lola') return prev; // not awaiting an answer
      const copy = [...prev];
      copy[copy.length - 1] = { role: 'lola', text: q };
      return copy;
    });
  }, [i18n.language, started, done, loading, currentSlot]);

  function toggleMic() {
    if (dictation.listening) {
      dictation.stop();
    } else {
      // Lola yields the floor: opening the mic cuts her current line outright (build-27
      // finding — the old behavior only DUCKED her via the recognizer's audio session, and
      // the duck never released; now playback stops here and later turns play at full volume).
      voice.stop();
      dictation.start(input);
    }
  }

  async function loadPersona(persona: Persona) {
    const p: Profile = {};
    const replayTurns: Turn[] = [
      { role: 'lola', text: `Test persona: ${persona.name}` },
    ];

    // replay the interview in slot order, building the transcript
    let slot = nextSlot(p);
    while (slot) {
      const question = staticQuestion(slot.field) ?? slot.prompt_hint;
      const raw = persona.answers[slot.field];
      const answer = Array.isArray(raw) ? (raw as string[]).join(', ') : String(raw ?? '—');
      replayTurns.push({ role: 'lola', text: question });
      replayTurns.push({ role: 'user', text: answer });
      p[slot.field] = raw;
      derive(p);
      slot = nextSlot(p);
    }

    replayTurns.push({ role: 'lola', text: t('done') });

    await persist(p);
    setProfile(p);
    setStarted(true);
    setDone(true);
    setTurns(replayTurns);
    setTimeout(() => router.push('/plan'), 1200);
  }

  // Deterministic question copy — no LLM phrasing call (that's what mangled "still be" and
  // hallucinated "one last question"). Chip questions and free-text questions alike read this.
  const questionText = (slot: Slot): string =>
    staticQuestion(slot.field) ?? t('fallback.question', { hint: slot.prompt_hint });

  // Chip label for an option value. Region names are proper nouns (regionLabel); "not_sure" and
  // yes/no come from `chips.*`; everything else from the localized `options.<field>` map. The
  // stored VALUE is always the canonical option string — only the label is localized.
  function optionLabelFor(field: string, value: string): string {
    if (field === 'region') return regionLabel(value) ?? (value === 'not_sure' ? t('chips.notSure') : value);
    const map = t(`options.${field}`, { returnObjects: true, defaultValue: {} }) as Record<string, string>;
    return (map && map[value]) || value;
  }

  function chipChoices(slot: Slot): { value: unknown; label: string }[] {
    if (slot.type === 'bool') return [{ value: true, label: t('chips.yes') }, { value: false, label: t('chips.no') }];
    return (slot.options ?? []).map(o => ({ value: o, label: optionLabelFor(slot.field, o) }));
  }

  // Fires interview_started on the FIRST answer, not on mount — since the interview auto-starts,
  // landing on the page is a pageview; engaging with a question is the real "started" signal.
  const startedCapturedRef = useRef(false);

  function start() {
    setStarted(true);
    const slot = nextSlot({});
    if (!slot) { setDone(true); return; }
    setCurrentSlot(slot);
    // Fold the old standalone intro screen into Lola's opening: a warm greeting bubble, then the
    // first question. Instant — no network on Q1.
    setTurns([
      { role: 'lola', text: t('landing.greeting') },
      { role: 'lola', text: questionText(slot) },
    ]);
  }

  // Apply a resolved value for `slot` and move to the next question. Shared by the chip path
  // (deterministic) and the free-text path (LLM-extracted). `extras` only arrives from extraction.
  // Fire a contextual reaction to `userText` and MERGE it into `questionTurn` when it arrives, so
  // Lola's turn reads as one bubble ("Got it. <next question>"). Non-blocking and best-effort — the
  // question is already on screen instantly; any error/slowness just leaves it as the bare question.
  function reactTo(slot: Slot, userText: string, questionTurn: Turn) {
    const question = questionTurn.text;
    phraseAck(slot, userText)
      .then(ack => {
        if (!ack) return;
        setTurns(prev => {
          const idx = prev.lastIndexOf(questionTurn); // reference to THIS turn's question
          if (idx < 0) return prev;
          const copy = [...prev];
          copy[idx] = { role: 'lola', text: `${ack} ${question}` };
          return copy;
        });
      })
      .catch(() => { /* reaction is decorative — never surface a failure */ });
  }

  async function advance(
    slot: Slot, value: unknown, userText: string, extras?: Record<string, unknown>, remainingSlots: Slot[] = [],
  ) {
    if (!startedCapturedRef.current) {
      startedCapturedRef.current = true;
      capture('interview_started', { from: typeof from === 'string' ? from : undefined });
    }
    const next_profile: Profile = { ...profile, [slot.field]: value };
    // Opportunistic capture: apply extras the extractor is confident about, into still-unanswered
    // slots only, and only when the value type-checks against the slot's schema.
    const autofilled: string[] = [];
    if (extras && typeof extras === 'object') {
      for (const s of remainingSlots) {
        const v = extras[s.field];
        if (v === undefined || v === null) continue;
        const ok = s.type === 'bool' ? typeof v === 'boolean'
                 : s.type === 'date' ? typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
                 : s.type === 'list' ? Array.isArray(v) && v.every(x => typeof x === 'string')
                 : s.options       ? typeof v === 'string' && s.options.includes(v)
                 : typeof v === 'string';
        if (ok) { next_profile[s.field] = v; autofilled.push(s.field); }
      }
      if (autofilled.length) capture('interview_slots_autofilled', { fields: autofilled, from: slot.field });
    }
    derive(next_profile);
    // Live roadmap: highlight the steps THIS answer added, and keep them lit through the next
    // question — they settle only when the following answer arrives (replacing this set, or
    // clearing it if that answer added nothing).
    const delta = diffPlans(buildPlan(profile), buildPlan(next_profile));
    setHighlightIds(new Set(delta.added.map(o => o.id)));
    setProfile(next_profile);
    setOtherActive(false);
    setInput(''); // clear any typed text (e.g. region type-ahead) before the next question

    const next = nextSlot(next_profile);
    if (!next) {
      await persist(next_profile);
      capture('interview_completed', { answered: interviewProgress(next_profile).answered });
      clearDraft(); // finished — nothing to resume
      setTurns(prev => [...prev, { role: 'lola', text: t('done') }]);
      setDone(true);
      setTimeout(() => router.push('/plan'), 1800);
      return;
    }
    setCurrentSlot(next);
    const questionTurn: Turn = { role: 'lola', text: questionText(next) };
    setTurns(prev => [...prev, questionTurn]);
    reactTo(slot, userText, questionTurn); // non-blocking contextual reaction, slots in above it
    saveDraft(next_profile, next.field); // anonymous resume (signed-in already persists to the DB)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // Chip tap: deterministic, no LLM. The chosen label is echoed as the user's turn.
  async function submitChip(value: unknown, label: string) {
    if (!currentSlot || loading) return;
    if (dictation.listening) dictation.cancel();
    setLoading(true);
    setTurns(prev => [...prev, { role: 'user', text: label }]);
    try {
      await advance(currentSlot, value, label);
    } catch (e) {
      captureError(e instanceof Error ? e : new Error('interview chip turn failed'), {
        route: '/interview', field: currentSlot.field,
      });
      capture('interview_turn_failed', { field: currentSlot.field });
      setTurns(prev => [...prev, { role: 'lola', text: t('fallback.turnFailed') }]);
    } finally {
      setLoading(false);
    }
  }

  // Free-text / voice path: nationalities, dates, and "Other". Runs the LLM extraction (and Lola's
  // contextual clarify reply) — kept precisely because it captures richer data and reduces ambiguity.
  async function submitFreeText(text: string) {
    if (!currentSlot || !text.trim() || loading) return;
    // CANCEL (not stop) dictation: the recognizer's final async flush must be discarded here,
    // or it re-fills the input we're about to clear (build-27/28 family findings).
    if (dictation.listening) dictation.cancel();
    setInput('');
    setInputHeight(0); // shrink the composer back to one line
    setLoading(true);
    setTurns(prev => [...prev, { role: 'user', text }]);

    try {
      const remainingSlots = SLOTS.filter(s => !(s.field in profile) && s.field !== currentSlot.field);
      const result = await extractAnswer(currentSlot, text, turns, remainingSlots);

      if ('clarify' in result) {
        // Monitor these: every clarify is a real user stuck on a question the extractor fumbled.
        capture('interview_clarify_needed', { field: currentSlot.field, answer: text.slice(0, 200) });
        const reask = staticQuestion(currentSlot.field)
          ?? t('fallback.clarifyReask', { hint: currentSlot.prompt_hint });
        // Conversational clarify: answer their meta-question in Lola's voice, then re-ask
        // (no legal facts — see phraseClarify). Falls back to the static re-ask on any error.
        const reply = await phraseClarify(currentSlot, text, turns, result.clarify, reask)
          .catch(() => t('fallback.clarifyPrefix', { reask }));
        setTurns(prev => [...prev, { role: 'lola', text: reply || t('fallback.clarifyPrefix', { reask }) }]);
        return;
      }

      await advance(currentSlot, result.value, text, result.extras, remainingSlots);
    } catch (e) {
      // Extraction failed or timed out: own it, restore their answer so nothing is retyped,
      // and let them send again. The spinner must never be a destination (build-28 finding).
      captureError(e instanceof Error ? e : new Error('interview turn failed'), {
        route: '/interview', field: currentSlot.field,
      });
      capture('interview_turn_failed', { field: currentSlot.field });
      setTurns(prev => [...prev, { role: 'lola', text: t('fallback.turnFailed') }]);
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  // The interview auto-starts on mount; this is the one-frame placeholder before that fires.
  if (!started) return <View style={styles.flex}><NavBar /></View>;

  // Roadmap-anchored % complete (Phase 2 reframe): weighted by how much of the roadmap each answer
  // determines, capped at 95% until nothing's left to ask, and clamped monotonic so opening a
  // heavier branch never moves the bar backward.
  const comp = interviewCompleteness(profile);
  const rawProgress = done ? 1 : Math.min(0.95, comp.pct);
  const progress = done ? 1 : Math.max(progressRef.current, rawProgress);
  progressRef.current = progress;
  const remainingQ = comp.remaining;
  const timeLeft = remainingQ === 0 ? t('progress.almostThere')
                 : remainingQ * 15 < 60 ? t('progress.underAMinute')
                 : t('progress.minutesLeft', { m: Math.round((remainingQ * 15) / 60) });

  return (
    // Exact keyboard avoidance: pad by the OS-reported overlap (hooks/useKeyboardHeight).
    // KeyboardAvoidingView clipped the composer on device twice (builds 11 & 15) — its offset
    // inference breaks whenever the view's position vs safe-area padding changes. This can't.
    <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
      <NavBar />
      {isStaff && (
        <View style={styles.devStrip}>
          <TouchableOpacity onPress={() => setShowDev(v => !v)}>
            <Text style={styles.devToggleText}>{showDev ? 'Hide dev' : 'Dev personas'}</Text>
          </TouchableOpacity>
          {showDev && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.devRow}>
              {TEST_PERSONAS.map(p => (
                <TouchableOpacity key={p.name} style={styles.personaChip} onPress={() => loadPersona(p)}>
                  <Text style={styles.personaChipText}>{p.name.split('—')[0].trim()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
      <View style={twoPane ? styles.twoPaneRow : styles.onePane}>
        <View style={twoPane ? styles.leftPane : styles.onePane}>
      {voice.supported && started && (
        <View style={styles.voiceBar}>
          <TouchableOpacity
            style={styles.voiceToggle}
            onPress={voice.toggle}
            accessibilityLabel={voice.enabled ? t('voice.turnOffA11y') : t('voice.turnOnA11y')}
          >
            <Text style={styles.voiceToggleIcon}>{voice.enabled ? '🔊' : '🔇'}</Text>
            <Text style={styles.voiceToggleText}>{voice.enabled ? t('voice.on') : t('voice.off')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {!done && (
        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{t('progress.complete', { pct: Math.round(progress * 100) })}</Text>
            <Text style={styles.progressLabel}>{timeLeft}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>
          {turns.map((t, i) => (
            <View key={i} style={t.role === 'lola' ? styles.lolaBubble : styles.userBubble}>
              <Text style={t.role === 'lola' ? styles.lolaText : styles.userText}>{t.text}</Text>
            </View>
          ))}
          {loading && (
            <View style={styles.lolaBubble}>
              <ActivityIndicator color={palette.amber} />
            </View>
          )}

          {!done && !loading && slotUsesChips(currentSlot) && !otherActive && (
            <View style={styles.chipsWrap}>
              {chipChoices(currentSlot!).map(c => (
                <TouchableOpacity
                  key={String(c.value)}
                  style={styles.chip}
                  onPress={() => submitChip(c.value, c.label)}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  <Text style={styles.chipText}>{c.label}</Text>
                </TouchableOpacity>
              ))}
              {currentSlot?.allowOther && (
                <TouchableOpacity
                  style={[styles.chip, styles.chipOther]}
                  onPress={() => { setOtherActive(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  <Text style={styles.chipOtherText}>{t('chips.other')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!done && !loading && currentSlot?.input === 'typeahead' && !otherActive && (
            <View style={styles.typeaheadWrap}>
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { height: 38 }]}
                  value={input}
                  onChangeText={setInput}
                  placeholder={t('composer.typeRegion')}
                  placeholderTextColor={palette.muted}
                  onSubmitEditing={() => {
                    const m = regionSuggestions(input);
                    if (m.length) submitChip(m[0].slug, m[0].label);
                    else if (input.trim()) submitFreeText(input); // a city → extraction maps it
                  }}
                  onKeyPress={(e) => {
                    const ne = e.nativeEvent as { key?: string };
                    if (Platform.OS === 'web' && ne.key === 'Enter') {
                      (e as { preventDefault?: () => void }).preventDefault?.();
                      const m = regionSuggestions(input);
                      if (m.length) submitChip(m[0].slug, m[0].label);
                      else if (input.trim()) submitFreeText(input);
                    }
                  }}
                  editable={!loading}
                  returnKeyType="search"
                />
              </View>
              <ScrollView style={styles.suggestions} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {regionSuggestions(input).map(r => (
                  <TouchableOpacity
                    key={r.slug}
                    style={styles.suggestion}
                    onPress={() => submitChip(r.slug, r.label)}
                    disabled={loading}
                    accessibilityRole="button"
                  >
                    <Text style={styles.suggestionText}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.suggestion, styles.suggestionMuted]}
                  onPress={() => submitChip('not_sure', t('chips.notSure'))}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  <Text style={styles.suggestionMutedText}>{t('chips.notSure')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {!done && ((!slotUsesChips(currentSlot) && currentSlot?.input !== 'typeahead') || otherActive) && (
            <View>
              {otherActive && (
                <TouchableOpacity
                  style={styles.otherBack}
                  onPress={() => { setOtherActive(false); setInput(''); }}
                  disabled={loading}
                >
                  <Text style={styles.otherBackText}>← {t('composer.backToChoices')}</Text>
                </TouchableOpacity>
              )}
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { height: Math.min(120, Math.max(38, inputHeight)) }]}
                  value={input}
                  onChangeText={setInput}
                  placeholder={dictation.listening ? t('composer.placeholderListening') : t('composer.placeholder')}
                  placeholderTextColor={palette.muted}
                  // Grows with the answer (regressed at some point — long dictated answers were
                  // stuck in a one-line box). Multiline + measured content height, capped at ~5
                  // lines; Enter still SENDS (submitBehavior on native, key handler on web).
                  multiline
                  onContentSizeChange={e => setInputHeight(e.nativeEvent.contentSize.height + 16)}
                  submitBehavior="submit"
                  onSubmitEditing={() => submitFreeText(input)}
                  onKeyPress={(e) => {
                    const ne = e.nativeEvent as { key?: string; shiftKey?: boolean };
                    if (Platform.OS === 'web' && ne.key === 'Enter' && !ne.shiftKey) {
                      (e as { preventDefault?: () => void }).preventDefault?.();
                      submitFreeText(input);
                    }
                  }}
                  returnKeyType="send"
                  editable={!loading}
                />
                {dictation.supported && (
                  <TouchableOpacity
                    style={[styles.micBtn, dictation.listening && styles.micBtnActive]}
                    onPress={toggleMic}
                    disabled={loading}
                    accessibilityLabel={dictation.listening ? t('composer.micStopA11y') : t('composer.micStartA11y')}
                  >
                    <Text style={[styles.micIcon, dictation.listening && styles.micIconActive]}>{dictation.listening ? '■' : '🎙'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                  accessibilityLabel={t('composer.sendA11y')}
                  onPress={() => submitFreeText(input)}
                  disabled={!input.trim() || loading}
                >
                  <Text style={styles.sendBtnText}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
        </View>
        {twoPane && started && (
          <RoadmapPane profile={profile} highlightIds={highlightIds} pct={progress} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: palette.cal },
  twoPaneRow:  { flex: 1, flexDirection: 'row' },
  onePane:     { flex: 1 },
  leftPane:    { flex: 1, minWidth: 0 },
  devStrip:    { paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EFEAE2', backgroundColor: '#FAF7F2', gap: 6 },
  devRow:      { gap: 8, paddingVertical: 4 },
  personaChip: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E0DCD4', paddingVertical: 6, paddingHorizontal: 12 },
  personaChipText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.indigo },
  center:      { flex: 1, backgroundColor: palette.cal, justifyContent: 'center', alignItems: 'center', padding: 32 },
  eyebrow:     { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 2, color: palette.amber, textAlign: 'center', marginBottom: 12 },
  headline:    { fontFamily: 'Fraunces_600SemiBold', fontSize: 34, color: palette.indigo, textAlign: 'center', marginBottom: 16 },
  sub:         { fontFamily: 'HankenGrotesk_400Regular', fontSize: 17, color: palette.indigo, textAlign: 'center', lineHeight: 26, marginBottom: 16, maxWidth: 460 },
  subQuiet:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.muted, textAlign: 'center', lineHeight: 23, marginBottom: 36, maxWidth: 440 },
  startBtn:    { backgroundColor: palette.cobalt, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40 },
  startBtnText:{ fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cal },
  voiceBar:        { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  voiceToggle:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#F2EDE6' },
  voiceToggleIcon: { fontSize: 14, lineHeight: 18 },
  voiceToggleText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.muted },
  progressWrap:  { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2, gap: 7 },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.muted },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#EAE6DE', overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3, backgroundColor: palette.olive },
  scroll:        { flex: 1 },
  scrollContent: { flexGrow: 1, paddingVertical: 28, paddingHorizontal: 16, alignItems: 'center' },
  column:        { width: '100%', maxWidth: 640 },
  lolaBubble: {
    alignSelf: 'flex-start', backgroundColor: '#FFFFFF',
    borderRadius: 18, borderBottomLeftRadius: 4,
    padding: 14, marginBottom: 12, maxWidth: '88%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  },
  userBubble: {
    alignSelf: 'flex-end', backgroundColor: palette.cobalt,
    borderRadius: 18, borderBottomRightRadius: 4,
    padding: 14, marginBottom: 12, maxWidth: '88%',
  },
  lolaText:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.indigo, lineHeight: 22 },
  userText:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.cal,   lineHeight: 22 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 4 },
  chip: {
    backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: '#D8D2C8',
    paddingVertical: 11, paddingHorizontal: 18,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  chipText:      { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, color: palette.indigo },
  chipOther:     { backgroundColor: '#F2EDE6', borderColor: '#E0DCD4', borderStyle: 'dashed' },
  chipOtherText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, color: palette.muted },
  otherBack:     { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 4, marginTop: 8 },
  otherBackText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: palette.cobalt },
  typeaheadWrap: { marginTop: 12, width: '100%' },
  suggestions:   { maxHeight: 240, marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E0DCD4', overflow: 'hidden' },
  suggestion:      { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EFEAE2' },
  suggestionText:  { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, color: palette.indigo },
  suggestionMuted:     { backgroundColor: '#FAF7F2' },
  suggestionMutedText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, color: palette.muted },
  inputRow:  {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    marginTop: 12, backgroundColor: '#FFFFFF',
    borderRadius: 28, borderWidth: 1, borderColor: '#E0DCD4',
    paddingLeft: 6, paddingRight: 6, paddingVertical: 6,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  input: {
    flex: 1, backgroundColor: 'transparent',
    paddingHorizontal: 14, paddingVertical: 8,
    fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.indigo,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as object : null),
  },
  micBtn:          { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2EDE6' },
  micBtnActive:    { backgroundColor: palette.amber },
  micIcon:         { fontSize: 17, lineHeight: 22 },
  micIconActive:   { color: palette.cal, fontSize: 13 },
  sendBtn:         { backgroundColor: palette.cobalt, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: palette.muted },
  sendBtnText:     { color: palette.cal, fontSize: 20, lineHeight: 24 },
  devToggle:       { marginTop: 32, padding: 8 },
  devToggleText:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.muted },
  devPanel:        { width: '100%', maxWidth: 460, alignSelf: 'center', marginTop: 8, gap: 8 },
  personaBtn:      { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E0DCD4' },
  personaName:     { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.indigo, marginBottom: 2 },
  personaDesc:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted },
});
