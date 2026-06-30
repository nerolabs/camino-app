import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { palette } from '@/constants/Colors';
import { useProfile } from '@/core/ProfileContext';
import { buildPlan, type Objective, type Phase } from '@/core/engine-controller';
import NavBar from '@/components/NavBar';

const PHASE_LABELS: Record<Phase, string> = {
  before_you_go: 'Before you go',
  first_weeks:   'First weeks',
  ongoing:       'Ongoing',
  when_settled:  'When settled',
};

const PHASE_ORDER: Phase[] = ['before_you_go', 'first_weeks', 'ongoing', 'when_settled'];

const SEV_COLOR: Record<string, string> = {
  penalty:     '#C0392B',
  required:    palette.cobalt,
  recommended: palette.olive,
  info:        palette.muted,
};

function formatTiming(obj: Objective): string {
  const t = obj.timing;
  if (t.state === 'scheduled') {
    const due = t.due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Due ${due}${t.estimated ? ' (est.)' : ''}`;
  }
  if (t.state === 'recurring') {
    const next = t.nextDue.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Next due ${next} · yearly`;
  }
  return `Starts once ${t.anchor.replace(/_/g, ' ')}`;
}

export default function PlanScreen() {
  const { profile } = useProfile();

  if (!profile) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyHeading}>No roadmap yet</Text>
        <Text style={styles.emptyBody}>Complete the interview and your roadmap will appear here.</Text>
      </View>
    );
  }

  const objectives = buildPlan(profile);
  const byPhase = PHASE_ORDER.map(phase => ({
    phase,
    items: objectives.filter(o => o.phase === phase),
  })).filter(g => g.items.length > 0);

  return (
    <ScrollView style={styles.scroll}>
      <NavBar />
      <View style={styles.content}>
      <Text style={styles.heading}>Your roadmap</Text>
      <Text style={styles.sub}>{objectives.length} things to take care of</Text>
      {/* DEBUG — remove before shipping */}
      <Text style={{ fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted, marginBottom: 16 }}>
        {JSON.stringify(profile, null, 2)}
      </Text>

      {byPhase.map(({ phase, items }) => (
        <View key={phase} style={styles.section}>
          <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
          {items.map(obj => (
            <View key={obj.id} style={styles.card}>
              <View style={[styles.severityBar, { backgroundColor: SEV_COLOR[obj.severity] }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{obj.title}</Text>
                <Text style={styles.cardTiming}>{formatTiming(obj)}</Text>
                <Text style={styles.cardCategory}>{obj.category}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: palette.cal },
  content:       { padding: 24, paddingTop: 32, paddingBottom: 40 },
  empty:         { flex: 1, backgroundColor: palette.cal, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyHeading:  { fontFamily: 'Fraunces_600SemiBold', fontSize: 26, color: palette.indigo, marginBottom: 12 },
  emptyBody:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, color: palette.indigo, textAlign: 'center', lineHeight: 24 },
  heading:       { fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: palette.indigo, marginBottom: 4 },
  sub:           { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: palette.muted, marginBottom: 28 },
  section:       { marginBottom: 28 },
  phaseLabel:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, color: palette.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  card:          { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 10, overflow: 'hidden',
                   boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  severityBar:   { width: 4 },
  cardBody:      { flex: 1, padding: 14 },
  cardTitle:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, color: palette.indigo, marginBottom: 4 },
  cardTiming:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.cobalt, marginBottom: 2 },
  cardCategory:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted, textTransform: 'capitalize' },
});
