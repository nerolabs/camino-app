import { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { palette } from '@/constants/Colors';
import { derive } from '@/core/interview-controller';
import { buildPlan, type Objective } from '@/core/engine-controller';
import { sampleProfile, SAMPLE_NAME, SAMPLE_BLURB } from '@/core/sample-profile';
import {
  formatTiming, PHASE_LABELS, PHASE_ICONS, PHASE_ORDER, SEV_COLOR, SEV_LABEL, SOURCE_COLOR, SOURCE_SHORT,
} from '@/lib/plan-format';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { capture } from '@/lib/analytics';

// The payoff, before the ask: a real roadmap — the actual engine run on a canned persona — shown
// read-only to anyone, so visitors see what they're building BEFORE investing in the interview.
// No mark-done / re-plan / coach here; the interview is the only path to a personalized plan.

export default function SamplePlanScreen() {
  const router = useRouter();
  useEffect(() => { capture('sample_plan_viewed'); }, []);

  const objectives = useMemo(() => {
    const p = sampleProfile();
    derive(p);
    return buildPlan(p);
  }, []);

  const byPhase = PHASE_ORDER
    .map(phase => ({ phase, items: objectives.filter(o => o.phase === phase) }))
    .filter(g => g.items.length > 0);
  const requiredCount = objectives.filter(o => o.severity === 'required' || o.severity === 'penalty').length;

  const startInterview = (from: string) => {
    capture('sample_plan_cta_clicked', { from });
    router.push('/interview');
  };

  return (
    <ScrollView style={styles.scroll}>
      <NavBar />
      <View style={styles.content}>

        {/* ── Sample framing: whose plan this is + how to get yours ── */}
        <View style={styles.sampleBanner}>
          <Text style={styles.sampleEyebrow}>SAMPLE ROADMAP</Text>
          <Text style={styles.sampleTitle}>This is {SAMPLE_NAME}'s plan.</Text>
          <Text style={styles.sampleBody}>
            {SAMPLE_NAME} — {SAMPLE_BLURB}. Camino turned their situation into the {objectives.length}-step,
            deadline-aware roadmap below. Yours will look different: a few answers about your own move, and
            the same engine builds it just for you.
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => startInterview('banner')}>
            <Text style={styles.ctaBtnText}>Build my own roadmap →</Text>
          </TouchableOpacity>
          <Text style={styles.ctaNote}>Free · about 3 minutes · no account needed to start</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{objectives.length}</Text>
            <Text style={styles.statLabel}>total steps</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statNum, { color: palette.cobalt }]}>{requiredCount}</Text>
            <Text style={styles.statLabel}>required</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statNum, { color: palette.olive }]}>{byPhase.length}</Text>
            <Text style={styles.statLabel}>life phases</Text>
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SOURCE_COLOR.official }]} />
            <Text style={styles.legendText}>Official requirement</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SOURCE_COLOR.recommendation }]} />
            <Text style={styles.legendText}>Camino recommendation</Text>
          </View>
        </View>

        {byPhase.map(({ phase, items }) => (
          <View key={phase} style={styles.section}>
            <View style={styles.phaseHeader}>
              <Text style={styles.phaseIcon}>{PHASE_ICONS[phase]}</Text>
              <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
              <Text style={styles.phaseCount}>{items.length}</Text>
            </View>
            {items.map((obj: Objective) => (
              <View key={obj.id} style={styles.card}>
                <View style={[styles.sevBar, { backgroundColor: SEV_COLOR[obj.severity] }]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{obj.title}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={[styles.sevText, { color: SEV_COLOR[obj.severity] }]}>{SEV_LABEL[obj.severity]}</Text>
                    <Text style={styles.metaDivider}>·</Text>
                    <Text style={styles.timingText}>{formatTiming(obj)}</Text>
                    <View style={[styles.srcDot, { backgroundColor: SOURCE_COLOR[obj.source] }]} />
                    <Text style={styles.srcText}>{SOURCE_SHORT[obj.source]}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* ── Closing CTA ── */}
        <View style={styles.closingCta}>
          <Text style={styles.closingTitle}>Your move won't look like {SAMPLE_NAME}'s.</Text>
          <Text style={styles.closingBody}>
            Different passport, work, family, or plans — different roadmap. Tell Lola about your move and
            get the version that's actually yours, with real deadlines in the right order.
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => startInterview('footer')}>
            <Text style={styles.ctaBtnText}>Start my 3-minute interview →</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: palette.cal },
  content:       { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 28 },

  sampleBanner:  { backgroundColor: '#FBF3E2', borderWidth: 1, borderColor: palette.amber, borderRadius: 14, padding: 20, marginBottom: 20 },
  sampleEyebrow: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 1.2, color: palette.amber, marginBottom: 6 },
  sampleTitle:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 26, color: palette.indigo, marginBottom: 8 },
  sampleBody:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 22, color: palette.indigo, marginBottom: 14 },
  ctaBtn:        { backgroundColor: palette.cobalt, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, alignSelf: 'flex-start' },
  ctaBtnText:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },
  ctaNote:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted, marginTop: 8 },

  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statChip:      { backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
                   borderWidth: 1, borderColor: '#E8E4DC', alignItems: 'center', minWidth: 72 },
  statNum:       { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: palette.indigo },
  statLabel:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted, marginTop: 1 },

  legend:        { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendText:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted },

  section:       { marginBottom: 22 },
  phaseHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  phaseIcon:     { fontSize: 16 },
  phaseLabel:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, color: palette.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  phaseCount:    { fontFamily: 'HankenGrotesk_500Medium', fontSize: 11, color: palette.muted, backgroundColor: '#EEE9E0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },

  card:          { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E4DC', marginBottom: 8, overflow: 'hidden' },
  sevBar:        { width: 4 },
  cardBody:      { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  cardTitle:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, lineHeight: 20, color: palette.indigo, marginBottom: 6 },
  cardMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sevText:       { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11 },
  metaDivider:   { color: palette.muted, fontSize: 11 },
  timingText:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted },
  srcDot:        { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
  srcText:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted },

  closingCta:    { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 14, padding: 20, marginTop: 6, alignItems: 'flex-start' },
  closingTitle:  { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: palette.indigo, marginBottom: 8 },
  closingBody:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 22, color: palette.indigo, marginBottom: 14 },
});
