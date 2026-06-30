import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Anthropic from '@anthropic-ai/sdk';
import NavBar from '@/components/NavBar';
import { palette } from '@/constants/Colors';
import { nextSlot, derive, type Slot, type Profile } from '@/core/interview-controller';
import { useProfile } from '@/core/ProfileContext';
import { useAuth } from '@/core/AuthContext';
import { saveProfile as saveProfileDb } from '@/core/profileDb';
import { TEST_PERSONAS, type Persona } from '@/core/test-personas';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

type Turn = { role: 'lola' | 'user'; text: string };

async function phraseQuestion(slot: Slot): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    system: `You are Lola, a warm relocation guide helping someone move to Spain.
Ask the user ONE short, friendly question to learn: ${slot.prompt_hint}.
${slot.sensitive ? 'Acknowledge this is personal and they only need to pick a range.' : ''}
${slot.options ? `Their options will be shown as buttons: ${slot.options.join(', ')}. Don't list them in your question.` : ''}
Speak directly. One or two sentences max. No bullet points.`,
    messages: [{ role: 'user', content: 'Ask me the next question.' }],
  });
  return (msg.content[0] as { text: string }).text;
}

async function extractAnswer(
  slot: Slot, userText: string
): Promise<{ value: unknown } | { clarify: string }> {
  const typeInstructions =
    slot.field === 'nationalities'
      ? 'Return an array of ISO 2-letter country codes. Map country names and nationalities to codes (e.g. "American" or "United States" → "US", "Spanish" or "Spain" → "ES", "British" → "GB", "Colombian" → "CO", "Japanese" → "JP"). Include ALL nationalities mentioned.'
      : slot.type === 'bool'
      ? 'Return true if yes/affirmative, false if no/negative. Be generous — "we do drive", "yes we have kids", "currently in the US" etc. are true.'
      : slot.options
      ? `Return the single most appropriate option string exactly as written from this list: ${slot.options.join(', ')}. Infer from context — e.g. "I work remotely for a US company" → "employed_remote", "I\'m self-employed" → "self_employed", "we live off investments" → "passive_income".`
      : 'Return the value as a string.';

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    system: `You are extracting a structured value from a user's natural-language answer.
Field: "${slot.field}" (type: ${slot.type})
${typeInstructions}
Respond ONLY with valid JSON in one of these two shapes — nothing else:
  {"value": <typed value>}
  {"clarify": "<one short question if genuinely ambiguous>"}
Do not add explanation. If you can make a reasonable inference, do so and return {"value": ...}.`,
    messages: [{ role: 'user', content: userText }],
  });
  try {
    const raw = (msg.content[0] as { text: string }).text.trim();
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
  has_spanish_address:                      "Do you already have a place lined up, rented or owned?",
  owns_or_drives:                           "Will anyone be driving while you're there?",
  foreign_assets_eur_band:                  "Slightly personal — and you only pick a range — roughly how much do you hold outside Spain?",
  us_resident:                              "Are you currently based in the US? (Consulate wait times are quite long right now.)",
  previously_ex_spanish_colony_nationality: "Are you a national of a former Spanish colony — most of Latin America, or the Philippines?",
};

export default function InterviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setProfile: saveProfile } = useProfile();

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
    setStarted(true);
    setLoading(true);
    const slot = nextSlot({});
    if (!slot) { setDone(true); setLoading(false); return; }
    const lola = await phraseQuestion(slot);
    setCurrentSlot(slot);
    setTurns([{ role: 'lola', text: lola }]);
    setLoading(false);
  }

  async function submit(text: string) {
    if (!currentSlot || !text.trim() || loading) return;
    setInput('');
    setLoading(true);
    setTurns(prev => [...prev, { role: 'user', text }]);

    const result = await extractAnswer(currentSlot, text);

    if ('clarify' in result) {
      setTurns(prev => [...prev, { role: 'lola', text: result.clarify }]);
      setLoading(false);
      return;
    }

    const next_profile: Profile = { ...profile, [currentSlot.field]: result.value };
    derive(next_profile);
    setProfile(next_profile);

    const next = nextSlot(next_profile);
    if (!next) {
      await persist(next_profile);
      setTurns(prev => [...prev, {
        role: 'lola',
        text: "That's everything I need — your roadmap is ready.",
      }]);
      setDone(true);
      setTimeout(() => router.push('/plan'), 1800);
      setLoading(false);
      return;
    }

    const lola = await phraseQuestion(next);
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
          <Text style={styles.headline}>Hola, I'm Lola.</Text>
          <Text style={styles.sub}>
            I'll help you figure out everything you need to do to move to Spain —
            in the right order, with real deadlines.
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={start}>
            <Text style={styles.startBtnText}>Let's get started</Text>
          </TouchableOpacity>

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
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <NavBar />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
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
      </ScrollView>

      {!done && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your answer…"
            placeholderTextColor={palette.muted}
            onSubmitEditing={() => submit(input)}
            returnKeyType="send"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => submit(input)}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: palette.cal },
  center:      { flex: 1, backgroundColor: palette.cal, justifyContent: 'center', alignItems: 'center', padding: 32 },
  headline:    { fontFamily: 'Fraunces_600SemiBold', fontSize: 34, color: palette.indigo, textAlign: 'center', marginBottom: 16 },
  sub:         { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, color: palette.indigo, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  startBtn:    { backgroundColor: palette.cobalt, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40 },
  startBtnText:{ fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cal },
  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 16 },
  lolaBubble: {
    alignSelf: 'flex-start', backgroundColor: '#FFFFFF',
    borderRadius: 18, borderBottomLeftRadius: 4,
    padding: 14, marginBottom: 12, maxWidth: '82%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  },
  userBubble: {
    alignSelf: 'flex-end', backgroundColor: palette.cobalt,
    borderRadius: 18, borderBottomRightRadius: 4,
    padding: 14, marginBottom: 12, maxWidth: '82%',
  },
  lolaText:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.indigo, lineHeight: 22 },
  userText:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.cal,   lineHeight: 22 },
  inputRow:  {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderTopWidth: 1, borderTopColor: '#E8E4DC',
    backgroundColor: palette.cal,
  },
  input: {
    flex: 1, backgroundColor: '#FFFFFF',
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.indigo,
    borderWidth: 1, borderColor: '#E0DCD4',
  },
  sendBtn:         { marginLeft: 10, backgroundColor: palette.cobalt, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: palette.muted },
  sendBtnText:     { color: palette.cal, fontSize: 20, lineHeight: 24 },
  devToggle:       { marginTop: 32, padding: 8 },
  devToggleText:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.muted },
  devPanel:        { width: '100%', marginTop: 8, gap: 8 },
  personaBtn:      { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E0DCD4' },
  personaName:     { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.indigo, marginBottom: 2 },
  personaDesc:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted },
});
