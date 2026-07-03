import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import NavBar from '@/components/NavBar';
import { palette } from '@/constants/Colors';
import { nextSlot, derive, interviewProgress, SLOTS, type Slot, type Profile } from '@/core/interview-controller';
import { useProfile } from '@/core/ProfileContext';
import { useAuth } from '@/core/AuthContext';
import { saveProfile as saveProfileDb } from '@/core/profileDb';
import { TEST_PERSONAS, type Persona } from '@/core/test-personas';
import { askAnthropic } from '@/lib/lola';
import { useDictation } from '@/hooks/useDictation';
import { useLolaVoice } from '@/hooks/useLolaVoice';
import { capture } from '@/lib/analytics';
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

async function phraseQuestion(slot: Slot, turns: Turn[]): Promise<string> {
  const transcript = transcriptOf(turns);
  const midConversation = transcript.length > 0;
  return askAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    system: `You are Lola, a warm relocation guide helping someone move to Spain.
${midConversation
  ? `You are MID-conversation. Here is everything said so far:
${transcript}

Ask the NEXT question as a natural follow-up. Crucial rules:
- Do NOT greet again — no "Hey!", "Hola!", "Hi!". You've already met.
- Briefly acknowledge what they just told you when it's natural, then move on.
- NEVER re-ask something they've already answered or clearly implied (e.g. if they mentioned "my wife", you already know a partner is coming — don't ask whether one is). Use that context to phrase this as a confirmation instead.`
  : 'This is your very first question, so a short, warm greeting is welcome.'}

Ask ONE short question to learn: ${slot.prompt_hint}.
${slot.sensitive ? 'Acknowledge this is personal and they only need to pick a range.' : ''}
${slot.options ? `Their options will be shown as buttons: ${slot.options.join(', ')}. Don't list them in your question.` : ''}
Speak directly. One or two sentences max. No bullet points.`,
    messages: [{ role: 'user', content: 'Ask me the next question.' }],
  });
}

async function extractAnswer(
  slot: Slot, userText: string, turns: Turn[], remaining: Slot[]
): Promise<{ value: unknown; extras?: Record<string, unknown> } | { clarify: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const transcript = transcriptOf(turns);
  const typeInstructions =
    slot.field === 'nationalities'
      ? 'Return an array of ISO 2-letter country codes. Map country names and nationalities to codes (e.g. "American" or "United States" → "US", "Spanish" or "Spain" → "ES", "British" → "GB", "Colombian" → "CO", "Japanese" → "JP"). Include ALL nationalities mentioned.'
      : slot.type === 'bool'
      ? 'Return true if yes/affirmative, false if no/negative. Be generous — "we do drive", "yes we have kids", "currently in the US" etc. are true.'
      : slot.type === 'date'
      ? `Return an ISO date string "YYYY-MM-DD". Today is ${today}; resolve relative phrases against it. BE GENEROUS — any timeframe at all resolves to a concrete date, never a clarification: "September" → the 1st of that September; "next spring" → March 1 of that year; "next year" → January 1 of next year; "in about 3 months" → today + 3 months; "sometime in 2027" → 2027-01-01; "end of the year" → December 1. An approximate anchor beats re-asking. Only if they say they genuinely don't know ("not sure", "no idea yet") return {"value": null}.`
      : slot.options
      ? `Return the single most appropriate option string exactly as written from this list: ${slot.options.join(', ')}. Infer from context — e.g. "I work remotely for a US company" → "employed_remote", "I\'m self-employed" → "self_employed", "we live off investments" → "passive_income".`
      : 'Return the value as a string.';

  const remainingGuide = remaining.map(s => {
    const t = s.type === 'list' ? 'array of ISO 2-letter country codes'
            : s.type === 'bool' ? 'boolean'
            : s.type === 'date' ? 'YYYY-MM-DD string'
            : s.options ? `one of: ${s.options.join(' | ')}`
            : 'string';
    return `- ${s.field} (${t}): ${s.prompt_hint}`;
  }).join('\n');

  const rawText = await askAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    system: `You are extracting a structured value from a user's natural-language answer.
${transcript ? `Conversation so far — use it to resolve references and avoid clarifying things already established:
${transcript}

` : ''}Field: "${slot.field}" (type: ${slot.type})
${typeInstructions}
Respond ONLY with valid JSON in one of these two shapes — nothing else:
  {"value": <typed value>, "extras": {"<other_field>": <typed value>, ...}}
  {"clarify": "<one short question if genuinely ambiguous>"}
Do not add explanation. Lean on the conversation above: if an earlier answer already implies this value (e.g. they mentioned "my wife", so they are married), infer it and return {"value": ...} rather than clarifying.

"extras" — OPTIONAL, for skipping questions the user has already answered in passing. These other
fields are still unanswered:
${remainingGuide || '(none)'}
Include a field in "extras" ONLY when the user has clearly and explicitly provided it somewhere in
the conversation (e.g. "just me and my wife" → has_spouse_or_partner: true, partner_is_married: true,
has_children: false only if they said it's JUST the two of them; "just me" alone → has_spouse_or_partner: false,
has_children: false). Never guess from vibes — omit anything not actually stated. Omit "extras"
entirely when nothing qualifies.`,
    messages: [{ role: 'user', content: userText }],
  });
  try {
    const raw = rawText.trim();
    // strip markdown code fences if present
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return { clarify: "I didn't quite catch that — could you try again?" };
  }
}

const STATIC_QUESTIONS: Record<string, string> = {
  nationalities:                            "Quick one — where's everyone in the household a citizen?",
  work_situation:                           "Work-wise, when you move — will you be working remotely, freelancing, studying, retired, or something else?",
  employer_country_is_foreign:              "Is your employer based outside Spain?",
  annual_income_eur_band:                   "To find the right visa, I need a rough sense of your annual household income. Which band fits?",
  has_spouse_or_partner:                    "Will a spouse or partner be making this move with you?",
  partner_is_married:                       "Are you two legally married or in a registered civil partnership?",
  has_children:                             "Any kids coming with you?",
  intends_long_stay:                        "Is this a proper long-term move — more than six months a year — or more of an extended stay?",
  arrival_date:                             "Roughly when are you hoping to arrive? Even just a month is fine.",
  has_spanish_address:                      "Do you already have a place lined up, rented or owned?",
  owns_or_drives:                           "Will anyone be driving while you're there?",
  owns_property_in_spain:                   "Are you planning to buy property in Spain, or have you already bought?",
  has_pets:                                 "Any pets making this move with you?",
  foreign_assets_eur_band:                  "Slightly personal — and you only pick a range — roughly how much do you hold outside Spain?",
  us_resident:                              "Are you currently based in the US? (Consulate wait times are quite long right now.)",
  previously_ex_spanish_colony_nationality: "Are you a national of a former Spanish colony — most of Latin America, or the Philippines?",
};

export default function InterviewScreen() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [showDev, setShowDev] = useState(false);
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

  // Auto-focus the answer box each time a new question is ready, so the user can just
  // start typing (or dictating) without clicking into the field first.
  useEffect(() => {
    if (started && !done && !loading && currentSlot) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [currentSlot, loading, started, done]);

  function toggleMic() {
    if (dictation.listening) dictation.stop();
    else dictation.start(input);
  }

  async function loadPersona(persona: Persona) {
    const p: Profile = {};
    const replayTurns: Turn[] = [
      { role: 'lola', text: `Test persona: ${persona.name}` },
    ];

    // replay the interview in slot order, building the transcript
    let slot = nextSlot(p);
    while (slot) {
      const question = STATIC_QUESTIONS[slot.field] ?? slot.prompt_hint;
      const raw = persona.answers[slot.field];
      const answer = Array.isArray(raw) ? (raw as string[]).join(', ') : String(raw ?? '—');
      replayTurns.push({ role: 'lola', text: question });
      replayTurns.push({ role: 'user', text: answer });
      p[slot.field] = raw;
      derive(p);
      slot = nextSlot(p);
    }

    replayTurns.push({ role: 'lola', text: "That's everything I need — your roadmap is ready." });

    await persist(p);
    setProfile(p);
    setStarted(true);
    setDone(true);
    setTurns(replayTurns);
    setTimeout(() => router.push('/plan'), 1200);
  }

  async function start() {
    capture('interview_started');
    voice.unlock(); // within this click gesture, so the first spoken turn can auto-play (autoplay policy)
    setStarted(true);
    setLoading(true);
    const slot = nextSlot({});
    if (!slot) { setDone(true); setLoading(false); return; }
    const lola = await phraseQuestion(slot, []);
    setCurrentSlot(slot);
    setTurns([{ role: 'lola', text: lola }]);
    setLoading(false);
  }

  async function submit(text: string) {
    if (!currentSlot || !text.trim() || loading) return;
    if (dictation.listening) dictation.stop(); // stop dictation when the answer is sent
    setInput('');
    setLoading(true);
    setTurns(prev => [...prev, { role: 'user', text }]);

    const remainingSlots = SLOTS.filter(s => !(s.field in profile) && s.field !== currentSlot.field);
    const result = await extractAnswer(currentSlot, text, turns, remainingSlots);

    if ('clarify' in result) {
      // Monitor these: every clarify is a real user stuck on a question the extractor fumbled.
      // The PostHog trend on this event is the tuning loop for the extraction prompts.
      capture('interview_clarify_needed', { field: currentSlot.field, answer: text.slice(0, 200) });
      // Re-ask in Lola's voice rather than surfacing the extractor's raw clarify
      // string, which leaks internal framing (e.g. "...you'd like me to extract?").
      const reask = STATIC_QUESTIONS[currentSlot.field]
        ?? `Could you tell me a little more about ${currentSlot.prompt_hint}?`;
      setTurns(prev => [...prev, {
        role: 'lola',
        text: `Sorry, I didn't quite catch that. ${reask}`,
      }]);
      setLoading(false);
      return;
    }

    const next_profile: Profile = { ...profile, [currentSlot.field]: result.value };
    // Opportunistic capture: apply extras the extractor is confident about, but ONLY into slots
    // still unanswered, and only when the value type-checks against the slot's schema. This is the
    // same single extraction surface — extras just let nextSlot() skip already-answered questions.
    const autofilled: string[] = [];
    if (result.extras && typeof result.extras === 'object') {
      for (const s of remainingSlots) {
        const v = (result.extras as Record<string, unknown>)[s.field];
        if (v === undefined || v === null) continue;
        const ok = s.type === 'bool' ? typeof v === 'boolean'
                 : s.type === 'date' ? typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
                 : s.type === 'list' ? Array.isArray(v) && v.every(x => typeof x === 'string')
                 : s.options       ? typeof v === 'string' && s.options.includes(v)
                 : typeof v === 'string';
        if (ok) { next_profile[s.field] = v; autofilled.push(s.field); }
      }
      if (autofilled.length) capture('interview_slots_autofilled', { fields: autofilled, from: currentSlot.field });
    }
    derive(next_profile);
    setProfile(next_profile);

    const next = nextSlot(next_profile);
    if (!next) {
      await persist(next_profile);
      capture('interview_completed', { answered: interviewProgress(next_profile).answered });
      setTurns(prev => [...prev, {
        role: 'lola',
        text: "That's everything I need — your roadmap is ready.",
      }]);
      setDone(true);
      setTimeout(() => router.push('/plan'), 1800);
      setLoading(false);
      return;
    }

    const lola = await phraseQuestion(next, [...turns, { role: 'user', text }]);
    setCurrentSlot(next);
    setTurns(prev => [...prev, { role: 'lola', text: lola }]);
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  if (!started) {
    return (
      <ScrollView style={styles.flex}>
        <NavBar />
        <View style={styles.center}>
          <Text style={styles.eyebrow}>YOUR ROAD TO SPAIN</Text>
          <Text style={styles.headline}>Hola, I'm Lola.</Text>
          <Text style={styles.sub}>
            Moving to Spain is a hundred small steps — visas, padrón, taxes, healthcare —
            and they only work in the right order. I've helped others make this move, and
            I'll walk it with you the whole way.
          </Text>
          <Text style={styles.subQuiet}>
            Answer a few questions and I'll build your personal roadmap: real steps, real
            deadlines, nothing you don't need.
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={start}>
            <Text style={styles.startBtnText}>Let's get started</Text>
          </TouchableOpacity>

          {isStaff && (
            <>
              <TouchableOpacity onPress={() => setShowDev(v => !v)} style={styles.devToggle}>
                <Text style={styles.devToggleText}>{showDev ? 'Hide' : 'Dev'} test personas</Text>
              </TouchableOpacity>

              {showDev && (
                <View style={styles.devPanel}>
                  {TEST_PERSONAS.map(p => (
                    <TouchableOpacity key={p.name} style={styles.personaBtn} onPress={() => loadPersona(p)}>
                      <Text style={styles.personaName}>{p.name}</Text>
                      <Text style={styles.personaDesc}>{p.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    );
  }

  const { answered, total } = interviewProgress(profile);
  const rawProgress = total > 0 ? answered / total : 0;
  const progress = done ? 1 : Math.max(progressRef.current, rawProgress);
  progressRef.current = progress;
  const remainingQ = Math.max(total - answered, 0);
  const timeLeft = remainingQ === 0 ? 'Almost there'
                 : remainingQ * 15 < 60 ? 'Under a minute left'
                 : `About ${Math.round((remainingQ * 15) / 60)} min left`;

  return (
    // Exact keyboard avoidance: pad by the OS-reported overlap (hooks/useKeyboardHeight).
    // KeyboardAvoidingView clipped the composer on device twice (builds 11 & 15) — its offset
    // inference breaks whenever the view's position vs safe-area padding changes. This can't.
    <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
      <NavBar />
      {voice.supported && started && (
        <View style={styles.voiceBar}>
          <TouchableOpacity
            style={styles.voiceToggle}
            onPress={voice.toggle}
            accessibilityLabel={voice.enabled ? 'Turn Lola’s voice off' : 'Turn Lola’s voice on'}
          >
            <Text style={styles.voiceToggleIcon}>{voice.enabled ? '🔊' : '🔇'}</Text>
            <Text style={styles.voiceToggleText}>{voice.enabled ? 'Voice on' : 'Voice off'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {!done && (
        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Question {Math.min(answered + 1, total)} of ~{total}</Text>
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

          {!done && (
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder={dictation.listening ? 'Listening…' : 'Type your answer…'}
                placeholderTextColor={palette.muted}
                onSubmitEditing={() => submit(input)}
                returnKeyType="send"
                editable={!loading}
              />
              {dictation.supported && (
                <TouchableOpacity
                  style={[styles.micBtn, dictation.listening && styles.micBtnActive]}
                  onPress={toggleMic}
                  disabled={loading}
                  accessibilityLabel={dictation.listening ? 'Stop dictation' : 'Speak your answer'}
                >
                  <Text style={[styles.micIcon, dictation.listening && styles.micIconActive]}>{dictation.listening ? '■' : '🎙'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                onPress={() => submit(input)}
                disabled={!input.trim() || loading}
              >
                <Text style={styles.sendBtnText}>→</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: palette.cal },
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
  inputRow:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
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
