/**
 * The landing page's scroll body (variant C won the 2026-07-10 lab — see docs/LANDING-REDESIGN.md):
 * the folded-in how-it-works as a live demo, the proof block, trust, and the final CTA. The hero
 * stays in app/index.tsx. Fully localized via common:home.*.
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/Colors';
import { buildPlan, CATALOG } from '@/core/engine-controller';
import { sampleProfile } from '@/core/sample-profile';
import { verifiedOn } from '@/core/changelog';
import { displayTitle } from '@/lib/catalogTitles';
import { dateLocale } from '@/lib/i18n';
import { useReducedMotion } from '@/lib/useReducedMotion';

/** Scripted ~17s loop of the living interview. The roadmap pane is NEVER empty — it opens
 * pre-populated and each answered question APPENDS steps (accumulation is the pitch). Step
 * titles/dates are honest hardcodes of real catalog steps; no LLM, no engine calls. */
function DemoLoop() {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reducedMotion) { setTick(10); return; } // rest on the fullest state (a11y)
    const timer = setInterval(() => setTick(v => (v + 1) % 12), 1400);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  const BASE: [string, string][] = [[t('home.demo.b1'), t('home.demo.b1d')], [t('home.demo.b2'), t('home.demo.b2d')]];
  const BEATS = [
    { q: t('home.demo.q1'), a: t('home.demo.a1'), add: 3, total: 5,
      steps: [[t('home.demo.s1'), t('home.demo.s1d')], [t('home.demo.s2'), t('home.demo.s2d')], [t('home.demo.s3'), t('home.demo.s3d')]] as [string, string][] },
    { q: t('home.demo.q2'), a: t('home.demo.a2'), add: 9, total: 14,
      steps: [[t('home.demo.s4'), t('home.demo.s4d')], [t('home.demo.s5'), t('home.demo.s5d')], [t('home.demo.s6'), t('home.demo.s6d')]] as [string, string][] },
    { q: t('home.demo.q3'), a: t('home.demo.a3'), add: 1, total: 27,
      steps: [[t('home.demo.s7'), t('home.demo.s7d')]] as [string, string][] },
  ];
  const MAX_VISIBLE = 7;

  const beatIdx = Math.min(Math.floor(tick / 4), 2);
  const beat = BEATS[beatIdx];
  const phase = tick % 4; // 0 question · 1 answer · 2-3 steps landed
  const answered = phase >= 2 ? beatIdx + 1 : beatIdx;
  const steps = [...BASE, ...BEATS.slice(0, answered).flatMap(b => b.steps)];
  const newFrom = phase >= 2 ? steps.length - beat.steps.length : steps.length + 1;
  const total = answered === 0 ? BASE.length : BEATS[answered - 1].total;
  const visible = steps.slice(-MAX_VISIBLE);
  const hiddenAbove = steps.length - visible.length;

  return (
    <View style={s.demoWrap}>
      <View style={s.chat}>
        <View style={s.lola}><Text style={s.lolaText}>{beat.q}</Text></View>
        {phase >= 1 && <View style={s.user}><Text style={s.userText}>{beat.a}</Text></View>}
        {phase >= 2 && <View style={s.pill}><Text style={s.pillText}>{t('home.demo.pill', { n: beat.add })}</Text></View>}
      </View>
      <View style={s.pane}>
        <Text style={s.paneTitle}>{t('home.demo.paneTitle')}</Text>
        <Text style={s.paneMeta}>{t('home.demo.paneMeta', { n: total })}</Text>
        {hiddenAbove > 0 && <Text style={s.moreAbove}>{t('home.demo.earlier', { n: hiddenAbove })}</Text>}
        {visible.map(([title, due], i) => {
          const isNew = hiddenAbove + i >= newFrom - 1 && phase >= 2;
          return (
            <View key={title} style={[s.step, isNew && s.stepNew]}>
              <View style={[s.dot, isNew && s.dotNew]} />
              <Text style={s.stepText} numberOfLines={1}>{title}</Text>
              <Text style={s.stepDue}>{due}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Four REAL steps from the live engine (never stale) — the proof object. */
function MiniRoadmap() {
  const steps = useMemo(() => buildPlan(sampleProfile())
    .filter(o => o.timing.state === 'scheduled')
    // Show the SOONEST steps, not the first in dependency order — otherwise the preview surfaced
    // Susan & Tom's far-future citizenship track (CCSE 2032, naturalisation 2037) and read as
    // "everything's a decade out." The near-term steps are the compelling "you start here" proof.
    .sort((a, b) => (a.timing.state === 'scheduled' ? a.timing.due.getTime() : 0)
                  - (b.timing.state === 'scheduled' ? b.timing.due.getTime() : 0))
    .slice(0, 4)
    .map(o => ({
      title: displayTitle(o).split('—')[0].trim(),
      due: o.timing.state === 'scheduled'
        ? o.timing.due.toLocaleDateString(dateLocale(), { month: 'short', year: 'numeric' }) : '',
    })), []);
  return (
    <View style={s.mini}>
      {steps.map(st => (
        <View key={st.title} style={s.miniRow}>
          <View style={s.miniDot} />
          <Text style={s.miniTitle} numberOfLines={1}>{st.title}</Text>
          <Text style={s.miniDue}>{st.due}</Text>
        </View>
      ))}
    </View>
  );
}

export default function HomeSections() {
  const { t } = useTranslation();
  const router = useRouter();
  // C10a: don't hardcode "27 steps" — compute the sample roadmap's real length from the live
  // engine (same home-strip precedent as the "all N guides" count), so it can never drift.
  const sampleStepCount = useMemo(() => buildPlan(sampleProfile()).length, []);

  // C10d: a real, verbatim cited step (the NIE) pulled live from the catalog — title, government
  // domain, and verified date all straight from the source of truth, so it can never go stale.
  const nie = useMemo(() => CATALOG.find(o => o.id === 'nie')!, []);
  const NIE_TITLE = displayTitle(nie);
  const NIE_DOMAIN = (() => { try { return new URL(nie.source_url!).hostname.replace(/^www\./, ''); } catch { return ''; } })();
  const NIE_VERIFIED = new Date(verifiedOn(nie)).toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric' });
  return (
    <View>
      {/* How it works = the demo */}
      <View style={s.section}>
        <Text style={s.h2} accessibilityRole="header">{t('home.demo.title')}</Text>
        <DemoLoop />
        <View style={s.stepsRow}>
          <Text style={s.stepLine}><Text style={s.stepNum}>1 </Text>{t('home.demo.step1')}</Text>
          <Text style={s.stepLine}><Text style={s.stepNum}>2 </Text>{t('home.demo.step2')}</Text>
          <Text style={s.stepLine}><Text style={s.stepNum}>3 </Text>{t('home.demo.step3')}</Text>
        </View>
        {/* C10b: answer the AI skeptic exactly where the AI is on screen. */}
        <Text style={s.engineLine}>{t('home.engineLine')}</Text>
      </View>

      {/* Proof */}
      <View style={[s.section, s.sectionAlt]}>
        <Text style={s.h2} accessibilityRole="header">{t('home.proof.title')}</Text>
        <Text style={s.freeLine}>{t('home.proof.free')}</Text>
        <MiniRoadmap />
        <Text style={s.moreLine}>{t('home.proof.more', { count: sampleStepCount })}</Text>
        <Text style={s.caption}>{t('home.proof.caption')}</Text>
        <TouchableOpacity onPress={() => router.push('/sample-plan')}>
          <Text style={s.link}>{t('home.proof.cta')}</Text>
        </TouchableOpacity>
      </View>

      {/* Trust */}
      <View style={s.section}>
        <Text style={s.h2} accessibilityRole="header">{t('home.trust.title')}</Text>
        {/* C10d: show, don't tell — one REAL cited step from the live catalog, verbatim, with its
            government source + verified stamp, before the abstract trust bullets. */}
        <View style={s.citedStep}>
          <Text style={s.citedLabel}>{t('home.cited.label')}</Text>
          <Text style={s.citedTitle}>{NIE_TITLE}</Text>
          <Text style={s.citedSource}>{t('home.cited.source', { domain: NIE_DOMAIN, date: NIE_VERIFIED })}</Text>
        </View>
        <View style={s.cards}>
          {([1, 2, 3, 4] as const).map(i => (
            <View key={i} style={s.trustCard}>
              <Text style={s.trustT}>{t(`home.trust.t${i}`)}</Text>
              {i === 3
                ? <Text style={s.trustB}><Link href="/how-i-was-built" style={s.inlineLink}>{t(`home.trust.b${i}`)}</Link></Text>
                : <Text style={s.trustB}>{t(`home.trust.b${i}`)}</Text>}
            </View>
          ))}
        </View>
      </View>

      {/* C10c: the last objections, answered plainly — the catch, and how it's free. */}
      <View style={s.section}>
        <Text style={s.h2} accessibilityRole="header">{t('home.catch.title')}</Text>
        <Text style={s.catchBody}>{t('home.catch.body')}</Text>
        <Text style={s.catchFree}>{t('home.catch.free')}</Text>
      </View>

      {/* Final CTA */}
      <View style={[s.section, s.sectionAlt, s.final]}>
        <Text style={s.h2} accessibilityRole="header">{t('home.finalCta.title')}</Text>
        <TouchableOpacity style={s.cta} onPress={() => router.push('/interview')}>
          <Text style={s.ctaText}>{t('home.cta')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/sample-plan')}>
          <Text style={s.linkQuiet}>{t('home.finalCta.sample')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center', gap: 16 },
  sectionAlt: { backgroundColor: '#F4F0E9' },
  engineLine: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, lineHeight: 22, color: palette.cobalt, textAlign: 'center', maxWidth: 560, marginTop: 8 },
  citedStep: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderLeftWidth: 4, borderLeftColor: palette.cobalt, borderRadius: 12, padding: 16, maxWidth: 560, width: '100%', gap: 6 },
  citedLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 1.2, color: palette.muted, textTransform: 'uppercase' },
  citedTitle: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, lineHeight: 22, color: palette.indigo },
  citedSource: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted },
  catchBody: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 25, color: palette.indigo, textAlign: 'center', maxWidth: 560 },
  catchFree: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, lineHeight: 21, color: palette.muted, textAlign: 'center', maxWidth: 560 },
  h2: { fontFamily: 'Fraunces_600SemiBold', fontSize: 27, color: palette.indigo, textAlign: 'center' },
  demoWrap: { flexDirection: 'row', gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  chat: { flex: 1, gap: 8, justifyContent: 'center' },
  lola: { backgroundColor: '#FFFFFF', borderRadius: 14, borderBottomLeftRadius: 4, padding: 12, alignSelf: 'flex-start', maxWidth: '95%', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' },
  lolaText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.indigo, lineHeight: 19 },
  user: { backgroundColor: palette.cobalt, borderRadius: 14, borderBottomRightRadius: 4, padding: 12, alignSelf: 'flex-end' },
  userText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: '#FFFFFF' },
  pill: { alignSelf: 'flex-end', backgroundColor: palette.olive, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, color: '#FFFFFF' },
  pane: { flex: 1.15, backgroundColor: '#FBF9F5', borderRadius: 14, borderWidth: 1, borderColor: '#E6E1D8', padding: 14, minHeight: 300 },
  paneTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 15, color: palette.indigo },
  paneMeta: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 11, color: palette.muted, marginBottom: 10 },
  moreAbove: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 10.5, color: palette.muted, marginBottom: 6, fontStyle: 'italic' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFFFF', borderRadius: 9, borderWidth: 1, borderColor: '#ECE7DE', paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6 },
  stepNew: { borderColor: palette.amber, backgroundColor: '#FBF3E2' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.cobalt },
  dotNew: { backgroundColor: palette.amber },
  stepText: { flex: 1, fontFamily: 'HankenGrotesk_500Medium', fontSize: 11.5, color: palette.indigo },
  stepDue: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 10.5, color: palette.muted },
  stepsRow: { gap: 8, maxWidth: 640, marginTop: 8 },
  stepLine: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14.5, color: palette.indigo, lineHeight: 22 },
  stepNum: { fontFamily: 'Fraunces_600SemiBold', color: palette.amber },
  freeLine: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.olive, marginTop: -8 },
  mini: { width: '100%', maxWidth: 560, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E6E1D8', padding: 16, gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.cobalt },
  miniTitle: { flex: 1, fontFamily: 'HankenGrotesk_500Medium', fontSize: 13.5, color: palette.indigo },
  miniDue: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.muted },
  moreLine: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted },
  caption: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.muted, textAlign: 'center', maxWidth: 460 },
  link: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cobalt },
  linkQuiet: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 13.5, color: palette.muted },
  inlineLink: { color: palette.cobalt },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 700 },
  trustCard: { width: 320, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#ECE7DE', padding: 16, gap: 5 },
  trustT: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14.5, color: palette.indigo },
  trustB: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.muted, lineHeight: 19.5 },
  final: { paddingBottom: 72 },
  cta: { backgroundColor: palette.cobalt, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40 },
  ctaText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cal },
});
