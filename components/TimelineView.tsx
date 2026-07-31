/**
 * The "Timing" view on /plan — the timeline-simulation differentiator (increment 2).
 *
 * A pure view over core/timeline.ts: pick an arrival month and the real roadmap re-computes. The
 * headline is the 183-day TAX-RESIDENCY YEAR (which calendar year Spain first taxes you, and thus
 * your first Modelo 100) — computed, not guessed. School windows show as a FLAG, never a fabricated
 * date. Ships WEB-ONLY behind TIMELINE_ENABLED (same platform-gate as the budget view: native stays
 * dark until we're well into web testing; EXPO_PUBLIC_TIMELINE_ENABLED=0 is a kill switch).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { palette } from '@/constants/Colors';
import { dateLocale } from '@/lib/i18n';
import type { Profile } from '@/core/interview-controller';
import { simulateArrival, taxResidencyFirstYear } from '@/core/timeline';
import { capture } from '@/lib/analytics';

export const TIMELINE_ENABLED = Platform.OS === 'web' && process.env.EXPO_PUBLIC_TIMELINE_ENABLED !== '0';

const pad2 = (n: number) => String(n).padStart(2, '0');
const monthName = (iso: string, style: 'short' | 'long') =>
  new Date(iso + 'T00:00:00').toLocaleDateString(dateLocale(), { month: style });
const fmtDate = (d: Date) => d.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' });

const MK_DOT: Record<string, string> = {
  arrival: palette.cobalt, tax_resident: palette.amber, visa: palette.olive,
  padron: palette.olive, tie: palette.olive, licence: palette.olive, school: palette.amber,
};

export default function TimelineView({ profile }: { profile: Profile }) {
  const { t } = useTranslation('plan');

  const baseISO = typeof profile.arrival_date === 'string'
    ? profile.arrival_date
    : `${new Date().getFullYear() + 1}-03-01`;
  const year = Number(baseISO.slice(0, 4));
  const baseMonth = Number(baseISO.slice(5, 7));

  const [selectedISO, setSelectedISO] = useState(`${year}-${pad2(baseMonth)}-01`);
  const scenario = simulateArrival(profile, selectedISO);
  const taxYear = scenario.taxYear;
  const arrivedByPivot = taxYear === year; // arrived on/before ~2 July → resident this year

  const months = Array.from({ length: 12 }, (_, i) => {
    const iso = `${year}-${pad2(i + 1)}-01`;
    return { iso, label: monthName(iso, 'short'), taxYear: taxResidencyFirstYear(iso) };
  });

  function pick(iso: string) {
    setSelectedISO(iso);
    capture('timeline_arrival_picked', { month: iso.slice(5, 7) });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('timeline.title')}</Text>
      <Text style={styles.sub}>{t('timeline.sub')}</Text>

      {/* Month scrubber — dot colour flips at the ~2 July tax-residency pivot */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowInner}>
        {months.map(m => {
          const on = m.iso === selectedISO;
          return (
            <TouchableOpacity key={m.iso} onPress={() => pick(m.iso)} style={[styles.chip, on && styles.chipOn]} activeOpacity={0.8}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{m.label}</Text>
              <View style={[styles.chipDot, { backgroundColor: m.taxYear === year ? palette.olive : palette.amber }]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* The insight — the wow */}
      <View style={styles.taxCard}>
        <Text style={styles.taxEyebrow}>{t('timeline.tax.eyebrow').toUpperCase()}</Text>
        <Text style={styles.taxLine}>{t('timeline.tax.line', { month: monthName(selectedISO, 'long'), year: taxYear })}</Text>
        <Text style={styles.taxFiles}>{t('timeline.tax.files', { year: taxYear + 1 })}</Text>
        <View style={styles.taxPivot}>
          <Text style={styles.taxPivotText}>
            {arrivedByPivot
              ? t('timeline.tax.pivotLater', { year: year + 1 })
              : t('timeline.tax.pivotEarlier', { year })}
          </Text>
        </View>
      </View>

      {/* The timeline */}
      <Text style={styles.heading}>{t('timeline.heading').toUpperCase()}</Text>
      <View style={styles.timeline}>
        {scenario.milestones.map((m, i) => {
          const last = i === scenario.milestones.length - 1;
          return (
            <View key={m.key} style={styles.mrow}>
              <View style={styles.mrail}>
                <View style={[styles.mdot, { backgroundColor: MK_DOT[m.key] ?? palette.muted }]} />
                {!last && <View style={styles.mline} />}
              </View>
              <View style={styles.mbody}>
                <Text style={styles.mdate}>{fmtDate(m.due)}{m.estimated ? ` · ${t('timeline.estimated')}` : ''}</Text>
                <Text style={styles.mlabel}>{t(`timeline.milestones.${m.key}`)}</Text>
                {m.key === 'school' && scenario.schoolRisk && (
                  <Text style={[styles.mflag, scenario.schoolRisk === 'off_cycle' && styles.mflagWarn]}>
                    {scenario.schoolRisk === 'off_cycle' ? t('timeline.schoolOffCycle') : t('timeline.schoolOrdinary')}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.note}>{t('timeline.note')}</Text>
    </View>
  );
}

const HAIR = 'rgba(21,36,59,0.10)';
const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 2, paddingTop: 6, width: '100%', maxWidth: 640, alignSelf: 'center' },
  title: { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: palette.indigo, marginBottom: 4 },
  sub: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: palette.muted, marginBottom: 14 },

  chipRow: { marginBottom: 16 },
  chipRowInner: { gap: 7, paddingRight: 12 },
  chip: { alignItems: 'center', gap: 5, backgroundColor: palette.white, borderColor: HAIR, borderWidth: 1, borderRadius: 11, paddingVertical: 8, paddingHorizontal: 12 },
  chipOn: { backgroundColor: palette.cobalt, borderColor: palette.cobalt },
  chipText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12.5, color: palette.indigo, textTransform: 'capitalize' },
  chipTextOn: { color: palette.white },
  chipDot: { width: 6, height: 6, borderRadius: 3 },

  taxCard: { backgroundColor: palette.indigo, borderRadius: 16, padding: 18 },
  taxEyebrow: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10.5, letterSpacing: 1.3, color: '#8FB0DA' },
  taxLine: { fontFamily: 'Fraunces_600SemiBold', fontSize: 20, lineHeight: 27, color: palette.white, marginTop: 8 },
  taxFiles: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13.5, lineHeight: 20, color: '#C4D0E0', marginTop: 10 },
  taxPivot: { marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' },
  taxPivotText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, lineHeight: 19, color: '#E7B24B' },

  heading: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 0.8, color: palette.muted, textTransform: 'uppercase', marginTop: 22, marginBottom: 12, marginLeft: 3 },
  timeline: {},
  mrow: { flexDirection: 'row', gap: 13 },
  mrail: { alignItems: 'center', width: 12 },
  mdot: { width: 12, height: 12, borderRadius: 6, marginTop: 2 },
  mline: { flex: 1, width: 2, backgroundColor: HAIR, marginTop: 2, minHeight: 22 },
  mbody: { flex: 1, paddingBottom: 18 },
  mdate: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11.5, color: palette.cobalt },
  mlabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14.5, color: palette.indigo, marginTop: 2 },
  mflag: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.olive, marginTop: 4 },
  mflagWarn: { color: '#B0413E' },

  note: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, lineHeight: 18, color: palette.muted, marginTop: 6, fontStyle: 'italic' },
});
