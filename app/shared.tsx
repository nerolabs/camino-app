import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/Colors';
import { derive, type Profile } from '@/core/interview-controller';
import { buildPlan, type Objective } from '@/core/engine-controller';
import { decodeShare } from '@/lib/shareLink';
import {
  formatTiming, timingDetail, openExternal,
  phaseLabel, PHASE_ICONS, PHASE_ORDER,
  SEV_COLOR, sevLabel, sevBlurb, SOURCE_COLOR, sourceShort, sourceBlurb,
} from '@/lib/plan-format';
import { displayTitle } from '@/lib/catalogTitles';
import Seo from '@/components/Seo';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { BackToTop, useBackToTop } from '@/components/BackToTop';
import { capture } from '@/lib/analytics';

// A shared roadmap (TODO 24): the link's payload IS the profile (lib/shareLink.ts), the
// real engine renders it read-only — same honest surface as /sample-plan, without the
// stateful/LLM features. noindex: this is someone's personal plan, not content.

export default function SharedPlanScreen() {
  const { t } = useTranslation('plan');
  const router = useRouter();
  const top = useBackToTop();
  // Static-export lesson (smoke #7): search params only exist AFTER hydration — react to
  // them in an effect, never a useState initializer.
  const params = useLocalSearchParams<{ d?: string }>();
  const [profile, setProfile] = useState<Profile | null | 'pending'>('pending');
  useEffect(() => {
    const p = decodeShare(typeof params.d === 'string' ? params.d : undefined);
    setProfile(p);
    if (p) capture('shared_plan_viewed', { steps: buildPlan(p).length });
    else if (params.d !== undefined) capture('shared_plan_invalid');
  }, [params.d]);

  const objectives = useMemo<Objective[]>(() => {
    if (!profile || profile === 'pending') return [];
    const p = { ...profile };
    derive(p);
    return buildPlan(p);
  }, [profile]);
  const titleById = useMemo(() => new Map(objectives.map(o => [o.id, displayTitle(o)])), [objectives]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const lastToggle = useRef(0);

  const byPhase = PHASE_ORDER
    .map(phase => ({ phase, items: objectives.filter(o => o.phase === phase) }))
    .filter(g => g.items.length > 0);
  const requiredCount = objectives.filter(o => o.severity === 'required' || o.severity === 'penalty').length;
  const doneCount = objectives.filter(o => o.done).length;

  const seo = (
    <Seo
      noindex
      title={`${t('shared.title')} | Get Camino`}
      description={t('shared.metaDescription')}
      canonical="https://getcamino.app/shared"
    />
  );

  // Invalid or missing payload → a friendly dead-end with the honest exit.
  if (profile === null) {
    return (
      <ScrollView style={styles.scroll}>
        {seo}
        <NavBar />
        <View style={styles.content}>
          <View style={styles.invalidCard}>
            <Text style={styles.invalidTitle}>{t('shared.invalid')}</Text>
            <Text style={styles.invalidBody}>{t('shared.invalidBody')}</Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/interview')}>
              <Text style={styles.ctaBtnText}>{t('shared.cta')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Footer />
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
    <ScrollView style={styles.scroll} ref={top.ref} onScroll={top.onScroll} scrollEventThrottle={16}>
      {seo}
      <NavBar />
      <View style={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.eyebrow}>{t('shared.eyebrow')}</Text>
          <Text style={styles.title}>{t('shared.title')}</Text>
          <Text style={styles.body}>{t('shared.body', { count: objectives.length })}</Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => { capture('shared_plan_cta_clicked'); router.push('/interview'); }}
          >
            <Text style={styles.ctaBtnText}>{t('shared.cta')}</Text>
          </TouchableOpacity>
        </View>

        {profile !== 'pending' && (
        <>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{objectives.length}</Text>
            <Text style={styles.statLabel}>{t('stats.totalSteps')}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statNum, { color: palette.cobalt }]}>{requiredCount}</Text>
            <Text style={styles.statLabel}>{t('stats.required')}</Text>
          </View>
          {doneCount > 0 && (
            <View style={styles.statChip}>
              <Text style={[styles.statNum, { color: palette.olive }]}>{doneCount}</Text>
              <Text style={styles.statLabel}>{t('stats.done')}</Text>
            </View>
          )}
        </View>

        {byPhase.map(({ phase, items }) => (
          <View key={phase} style={styles.section}>
            <View style={styles.phaseHeader}>
              <Text style={styles.phaseIcon}>{PHASE_ICONS[phase]}</Text>
              <Text style={styles.phaseLabel}>{phaseLabel(phase)}</Text>
              <Text style={styles.phaseCount}>{items.length}</Text>
            </View>
            {items.map((obj: Objective) => {
              const expanded = expandedId === obj.id;
              const deps = obj.depends_on.map(d => titleById.get(d)).filter((x): x is string => !!x);
              return (
                <TouchableOpacity
                  key={obj.id}
                  style={[styles.card, obj.done && styles.cardDone]}
                  activeOpacity={0.85}
                  onPress={() => {
                    const now = Date.now();
                    if (now - lastToggle.current < 350) return;
                    lastToggle.current = now;
                    setExpandedId(expanded ? null : obj.id);
                  }}
                >
                  <View style={[styles.sevBar, { backgroundColor: obj.done ? palette.olive : SEV_COLOR[obj.severity] }]} />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{obj.done ? '✓ ' : ''}{displayTitle(obj)}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={[styles.sevText, { color: SEV_COLOR[obj.severity] }]}>{sevLabel(obj.severity)}</Text>
                      <Text style={styles.metaDivider}>·</Text>
                      <Text style={styles.timingText}>{formatTiming(obj)}</Text>
                      <View style={[styles.srcDot, { backgroundColor: SOURCE_COLOR[obj.source] }]} />
                      <Text style={styles.srcText}>{sourceShort(obj.source)}</Text>
                      <Text style={styles.expandHint}>{expanded ? '▴' : '▾'}</Text>
                    </View>
                    {expanded && (
                      <View style={styles.detail}>
                        <Text style={styles.detailLabel}>{t('sheet.whenLabel')}</Text>
                        <Text style={styles.detailText}>{timingDetail(obj)}</Text>
                        <Text style={styles.detailLabel}>{t('sample.whyLabel')}</Text>
                        <Text style={styles.detailText}>{sevBlurb(obj.severity)} {sourceBlurb(obj.source)}</Text>
                        {deps.length > 0 && (
                          <>
                            <Text style={styles.detailLabel}>{t('shared.depsLabel')}</Text>
                            {deps.map((d, i) => <Text key={i} style={styles.detailDep}>• {d}</Text>)}
                          </>
                        )}
                        {obj.source_url && (
                          <TouchableOpacity onPress={() => openExternal(obj.source_url!)}>
                            <Text style={styles.detailLink}>{t('sample.sourceLink')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={styles.closingCta}>
          <Text style={styles.closingTitle}>{t('shared.closingTitle')}</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => { capture('shared_plan_cta_clicked'); router.push('/interview'); }}>
            <Text style={styles.ctaBtnText}>{t('shared.cta')}</Text>
          </TouchableOpacity>
        </View>
        </>
        )}
      </View>
      <Footer />
    </ScrollView>
    <BackToTop visible={top.visible} scrollToTop={top.scrollToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1 },
  scroll:        { flex: 1, backgroundColor: palette.cal },
  content:       { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 28 },

  banner:        { backgroundColor: '#EEF2F9', borderWidth: 1, borderColor: palette.cobalt, borderRadius: 14, padding: 20, marginBottom: 20 },
  eyebrow:       { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 1.2, color: palette.cobalt, marginBottom: 6 },
  title:         { fontFamily: 'Fraunces_600SemiBold', fontSize: 26, color: palette.indigo, marginBottom: 8 },
  body:          { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 22, color: palette.indigo, marginBottom: 14 },
  ctaBtn:        { backgroundColor: palette.cobalt, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, alignSelf: 'flex-start' },
  ctaBtnText:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },

  invalidCard:   { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 14, padding: 24, marginVertical: 40 },
  invalidTitle:  { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: palette.indigo, marginBottom: 8 },
  invalidBody:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 22, color: palette.muted, marginBottom: 16 },

  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statChip:      { backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
                   borderWidth: 1, borderColor: '#E8E4DC', alignItems: 'center', minWidth: 72 },
  statNum:       { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: palette.indigo },
  statLabel:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted, marginTop: 1 },

  section:       { marginBottom: 22 },
  phaseHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  phaseIcon:     { fontSize: 16 },
  phaseLabel:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, color: palette.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  phaseCount:    { fontFamily: 'HankenGrotesk_500Medium', fontSize: 11, color: palette.muted, backgroundColor: '#EEE9E0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },

  card:          { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E4DC', marginBottom: 8, overflow: 'hidden' },
  cardDone:      { opacity: 0.75 },
  sevBar:        { width: 4 },
  cardBody:      { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  cardTitle:     { fontFamily: 'HankenGrotesk_500Medium', fontSize: 14, lineHeight: 20, color: palette.indigo, marginBottom: 6 },
  cardMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sevText:       { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11 },
  metaDivider:   { color: palette.muted, fontSize: 11 },
  timingText:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted },
  srcDot:        { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
  srcText:       { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted },
  expandHint:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted, marginLeft: 'auto' },

  detail:        { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEE9E0' },
  detailLabel:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 1, color: palette.muted, marginTop: 8, marginBottom: 3 },
  detailText:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, lineHeight: 19, color: palette.indigo },
  detailDep:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, lineHeight: 19, color: palette.indigo },
  detailLink:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: palette.cobalt, marginTop: 10 },

  closingCta:    { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 14, padding: 20, marginTop: 6, alignItems: 'flex-start' },
  closingTitle:  { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: palette.indigo, marginBottom: 12 },
});
