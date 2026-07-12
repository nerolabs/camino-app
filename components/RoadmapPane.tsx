/**
 * Live roadmap pane (interview redesign, Phase 2 — see docs/INTERVIEW-REDESIGN.md).
 *
 * The second column of the two-pane web interview: renders buildPlan(profile) as it grows with
 * each answer, so the interview stops being a cost-before-value gate and becomes the act of
 * building the roadmap. Steps added by the latest answer are highlighted (ids passed in from the
 * Phase-0 plan-delta). Compact by design — the full, dated roadmap is the /plan page.
 */
import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { buildPlan, type Objective } from '@/core/engine-controller';
import { displayTitle } from '@/lib/catalogTitles';
import { type Profile } from '@/core/interview-controller';
import { palette } from '@/constants/Colors';

const SEV_COLOR: Record<Objective['severity'], string> = {
  penalty: '#B4462F',
  required: palette.cobalt,
  recommended: palette.olive,
  info: palette.muted,
};

// The obligation titles are full sentences ("Identify your visa category — match your…"); the
// clause before the em-dash is the concise action, which is what a preview list wants.
function shortLabel(full: string): string {
  const head = full.split('—')[0].trim();
  return head.length >= 12 ? head : full;
}

export default function RoadmapPane({
  profile, highlightIds, pct, sheet = false,
}: {
  profile: Profile;
  highlightIds: Set<string>;
  pct: number;
  // Phase 3: the same pane doubles as the mobile bottom-sheet body — full width, no divider.
  sheet?: boolean;
}) {
  const { t } = useTranslation('interview');
  const plan = useMemo(() => buildPlan(profile), [profile]);

  return (
    <View style={sheet ? styles.sheet : styles.pane}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('roadmap.title')}</Text>
        <Text style={styles.meta}>
          {t('roadmap.steps', { count: plan.length })} · {t('roadmap.complete', { pct: Math.round(pct * 100) })}
        </Text>
      </View>

      {plan.length === 0 ? (
        <View style={styles.empty}>
          {/* EU passports legitimately zero out the early adders (no visa cluster, no NIE) —
              without this line the pane sits silent for most of the interview and reads as
              broken (build-37 shred finding, 2026-07-12). Deterministic: derived flag only. */}
          <Text style={styles.emptyText}>
            {profile.is_eu ? t('roadmap.emptyEu') : t('roadmap.empty')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {plan.map(o => (
            <View key={o.id} style={[styles.step, highlightIds.has(o.id) && styles.stepNew]}>
              <View style={[styles.dot, { backgroundColor: SEV_COLOR[o.severity] ?? palette.muted }]} />
              <Text style={styles.stepText} numberOfLines={2}>{shortLabel(displayTitle(o))}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pane:      { width: 400, borderLeftWidth: 1, borderLeftColor: '#E6E1D8', backgroundColor: '#FBF9F5' },
  sheet:     { flex: 1, width: '100%', backgroundColor: '#FBF9F5' },
  header:    { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#EFEAE2' },
  title:     { fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: palette.indigo },
  meta:      { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.muted, marginTop: 4 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: palette.muted, textAlign: 'center', lineHeight: 21, maxWidth: 260 },
  list:        { flex: 1 },
  listContent: { paddingVertical: 10, paddingHorizontal: 16, gap: 8 },
  step: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#ECE7DE',
    paddingVertical: 12, paddingHorizontal: 14,
  },
  stepNew:   { borderColor: palette.amber, backgroundColor: '#FBF3E2' },
  dot:       { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  stepText:  { flex: 1, fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: palette.indigo, lineHeight: 19 },
});
