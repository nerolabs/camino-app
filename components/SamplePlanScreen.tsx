import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/Colors';
import { derive } from '@/core/interview-controller';
import { buildPlan, type Objective } from '@/core/engine-controller';
import { personaById, DEFAULT_PERSONA_ID, SAMPLE_PERSONAS } from '@/core/sample-personas';
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

// The payoff, before the ask: a real roadmap — the actual engine run on a canned persona — shown
// read-only to anyone, so visitors see what they're building BEFORE investing in the interview.
// No mark-done / re-plan / coach here; the interview is the only path to a personalized plan.
// Since 2026-07-12 (SEO expansion): several personas — /sample-plan renders the default
// (Susan & Tom), /sample-plan/<id> the others. Same component, different canned profile.

export default function SamplePlanScreen({ personaId = DEFAULT_PERSONA_ID }: { personaId?: string }) {
  const { t } = useTranslation('plan');
  const router = useRouter();
  const top = useBackToTop();
  const persona = personaById.get(personaId) ?? personaById.get(DEFAULT_PERSONA_ID)!;
  useEffect(() => { capture('sample_plan_viewed', { persona: persona.id }); }, [persona.id]);

  // Display name/blurb: the default persona keeps its original keys (translated 2026-07-05);
  // the newer personas live under sample.personas.<id>.
  const kName  = persona.id === DEFAULT_PERSONA_ID ? 'sample.name'  : `sample.personas.${persona.id}.name`;
  const kBlurb = persona.id === DEFAULT_PERSONA_ID ? 'sample.blurb' : `sample.personas.${persona.id}.blurb`;
  const canonical = persona.id === DEFAULT_PERSONA_ID
    ? 'https://getcamino.app/sample-plan'
    : `https://getcamino.app/sample-plan/${persona.id}`;

  const objectives = useMemo(() => {
    const p = persona.profile();
    derive(p);
    return buildPlan(p);
  }, [persona]);
  const titleById = useMemo(() => new Map(objectives.map(o => [o.id, displayTitle(o)])), [objectives]);

  // Tap-to-expand: deterministic detail only (timing, severity, prerequisites, official source).
  // The stateful/LLM features (mark done, re-plan, Lola's coach) are deliberately absent — they're
  // personal + would make a public page a free LLM endpoint; the expanded card teases them instead.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const lastToggle = useRef(0); // rageclick guard: double-taps made cards flicker open/closed

  const byPhase = PHASE_ORDER
    .map(phase => ({ phase, items: objectives.filter(o => o.phase === phase) }))
    .filter(g => g.items.length > 0);
  const requiredCount = objectives.filter(o => o.severity === 'required' || o.severity === 'penalty').length;

  const startInterview = (from: string) => {
    capture('sample_plan_cta_clicked', { from });
    router.push('/interview');
  };

  return (
    <View style={styles.screen}>
    <ScrollView style={styles.scroll} ref={top.ref} onScroll={top.onScroll} scrollEventThrottle={16}>
      <Seo
        localized
        title={persona.id === DEFAULT_PERSONA_ID
          ? 'A sample roadmap for moving to Spain | Get Camino'
          : `${t(kName)}'s roadmap for moving to Spain — a real sample plan | Get Camino`}
        description={persona.id === DEFAULT_PERSONA_ID
          ? "Susan & Tom's real, engine-built relocation roadmap — every step, deadline and official source — so you can see what Get Camino builds before answering a single question."
          : `${t(kName)} — ${t(kBlurb)}. A real, engine-built relocation roadmap: every step, deadline and official source.`}
        canonical={canonical}
      />
      <NavBar />
      <View style={styles.content}>

        {/* ── Sample framing: whose plan this is + how to get yours ── */}
        <View style={styles.sampleBanner}>
          <Text style={styles.sampleEyebrow}>{t('sample.eyebrow')}</Text>
          <Text style={styles.sampleTitle}>{t('sample.title', { name: t(kName) })}</Text>
          <Text style={styles.sampleBody}>
            {t('sample.body', { name: t(kName), blurb: t(kBlurb), count: objectives.length })}
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => startInterview('banner')}>
            <Text style={styles.ctaBtnText}>{t('sample.cta')}</Text>
          </TouchableOpacity>
          <Text style={styles.ctaNote}>{t('sample.ctaNote')}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{objectives.length}</Text>
            <Text style={styles.statLabel}>{t('stats.totalSteps')}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statNum, { color: palette.cobalt }]}>{requiredCount}</Text>
            <Text style={styles.statLabel}>{t('stats.required')}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statNum, { color: palette.olive }]}>{byPhase.length}</Text>
            <Text style={styles.statLabel}>{t('sample.lifePhases')}</Text>
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SOURCE_COLOR.official }]} />
            <Text style={styles.legendText}>{t('legend.official')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SOURCE_COLOR.recommendation }]} />
            <Text style={styles.legendText}>{t('legend.recommendation')}</Text>
          </View>
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
              const deps = obj.depends_on.map(d => titleById.get(d)).filter((t): t is string => !!t);
              return (
                <TouchableOpacity
                  key={obj.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => {
                    const now = Date.now();
                    if (now - lastToggle.current < 350) return; // ignore rapid double-taps
                    lastToggle.current = now;
                    if (!expanded) capture('sample_plan_step_expanded', { objective_id: obj.id });
                    setExpandedId(expanded ? null : obj.id);
                  }}
                >
                  <View style={[styles.sevBar, { backgroundColor: SEV_COLOR[obj.severity] }]} />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{displayTitle(obj)}</Text>
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
                            <Text style={styles.detailLabel}>{t('sample.depsLabel', { name: t(kName).toUpperCase() })}</Text>
                            {deps.map((d, i) => <Text key={i} style={styles.detailDep}>• {d}</Text>)}
                          </>
                        )}
                        {obj.source_url && (
                          <TouchableOpacity onPress={() => openExternal(obj.source_url!)}>
                            <Text style={styles.detailLink}>{t('sample.sourceLink')}</Text>
                          </TouchableOpacity>
                        )}
                        <Text style={styles.detailTease}>
                          {t('sample.tease')}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* ── Closing CTA ── */}
        <View style={styles.closingCta}>
          <Text style={styles.closingTitle}>{t('sample.closingTitle', { name: t(kName) })}</Text>
          <Text style={styles.closingBody}>
            {t('sample.closingBody')}
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => startInterview('footer')}>
            <Text style={styles.ctaBtnText}>{t('sample.closingCta')}</Text>
          </TouchableOpacity>
        </View>

        {/* Other sample situations (SEO expansion 2026-07-12): each persona lights up a
            different branch of the catalog — EU path, digital-nomad visa, property cluster. */}
        <View style={styles.moreRow}>
          <Text style={styles.moreLabel}>{t('sample.moreLabel')}</Text>
          {SAMPLE_PERSONAS.filter(p => p.id !== persona.id).map(p => (
            <Link
              key={p.id}
              href={(p.id === DEFAULT_PERSONA_ID ? '/sample-plan' : `/sample-plan/${p.id}`) as never}
              style={styles.moreLink}
            >
              {t(p.id === DEFAULT_PERSONA_ID ? 'sample.name' : `sample.personas.${p.id}.name`)} — {t(`sample.personas.${p.id}.tag`)} →
            </Link>
          ))}
        </View>
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
  expandHint:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted, marginLeft: 'auto' },

  detail:        { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEE9E0' },
  detailLabel:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 1, color: palette.muted, marginTop: 8, marginBottom: 3 },
  detailText:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, lineHeight: 19, color: palette.indigo },
  detailDep:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, lineHeight: 19, color: palette.indigo },
  detailLink:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: palette.cobalt, marginTop: 10 },
  detailTease:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, lineHeight: 18, color: palette.amber, marginTop: 10, fontStyle: 'italic' },

  closingCta:    { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 14, padding: 20, marginTop: 6, alignItems: 'flex-start' },
  moreRow:       { marginTop: 22, gap: 8 },
  moreLabel:     { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 1.2, color: palette.muted, textTransform: 'uppercase', marginBottom: 2 },
  moreLink:      { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cobalt },
  closingTitle:  { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: palette.indigo, marginBottom: 8 },
  closingBody:   { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 22, color: palette.indigo, marginBottom: 14 },
});
