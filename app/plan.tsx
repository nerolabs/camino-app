import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Pressable, TextInput, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { dateLocale, currentLang } from '@/lib/i18n';
import { palette } from '@/constants/Colors';
import { useProfile } from '@/core/ProfileContext';
import { useAuth } from '@/core/AuthContext';
import { saveProfile as saveProfileDb } from '@/core/profileDb';
import { derive, type Profile } from '@/core/interview-controller';
import { buildPlan, isOverdue, type Objective, type Progress } from '@/core/engine-controller';
import { thisWeek } from '@/core/this-week';
import { reportHtml } from '@/lib/reportHtml';
import { exportPdf } from '@/lib/exportPdf';
import { normalizeDateInput } from '@/lib/dateInput';
import { regionLabel } from '@/core/regions';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { BackToTop, useBackToTop } from '@/components/BackToTop';
import { capture } from '@/lib/analytics';
import EmailSignIn from '@/components/EmailSignIn';
import { parseProfileChange, askLola, TASK_INTRO, changeHint } from '@/lib/plan-coach';
import { displayTitle } from '@/lib/catalogTitles';
import {
  diffSummary, plansDiffer, completionLine, formatTiming, timingDetail, openExternal,
  phaseLabel, PHASE_ICONS, PHASE_ORDER, SEV_COLOR, sevLabel, sevBlurb,
  sourceShort, sourceBlurb, SOURCE_COLOR,
} from '@/lib/plan-format';

// Signed-out users just watched their roadmap appear — the capture moment. One email field:
// it saves the roadmap, creates the account (silently — the profile rides in auth metadata
// until the first sign-in adopts it), and the emailed link signs them in from any device.
function EmailCaptureCard({ profile }: { profile: Profile }) {
  const { t } = useTranslation('plan');
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.emailCard}>
      <Text style={styles.emailCardTitle}>{t('emailCard.title')}</Text>
      <Text style={styles.emailCardBody}>
        {t('emailCard.body')}
      </Text>
      {open ? (
        <EmailSignIn context="plan_page" pendingProfile={profile} sendLabel={t('emailCard.button')} />
      ) : (
        <TouchableOpacity
          style={styles.emailCardBtn}
          onPress={() => { setOpen(true); capture('email_me_roadmap_opened'); }}
        >
          <Text style={styles.emailCardBtnText}>{t('emailCard.button')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PenaltyBanner({ objectives }: { objectives: Objective[] }) {
  const { t } = useTranslation('plan');
  const penalties = objectives.filter(o => o.severity === 'penalty');
  if (penalties.length === 0) return null;
  return (
    <View style={styles.penaltyBanner}>
      <Text style={styles.penaltyBannerIcon}>⚠️</Text>
      <Text style={styles.penaltyBannerText}>
        {penalties.length === 1
          ? t('banners.penaltyOne')
          : t('banners.penaltyMany', { count: penalties.length })}
      </Text>
    </View>
  );
}

export default function PlanScreen() {
  const { t } = useTranslation('plan');
  const { profile, setProfile, isStaff, profileLoaded } = useProfile();
  const { user } = useAuth();
  const router = useRouter();
  const top = useBackToTop();

  // "Loading your roadmap…" must be a moment, never a destination (build-28 family finding:
  // a cold start with a restored session but no saved answers sat here forever). Once the
  // profile question is SETTLED and there's nothing to show, go home to start the process —
  // and if settling itself hangs (offline fetch), stop pretending after 10s and go home too.
  useEffect(() => {
    if (profile || !user) return; // signed-out empty state stays a real page (guides/SEO)
    // Settled-empty → home after a short grace (absorbs the just-signed-in tick where
    // profileLoaded is still stale-true until SessionSync resets it). Not settled → the
    // fetch gets 10s before we stop pretending and go home anyway.
    const t = setTimeout(() => router.replace('/'), profileLoaded ? 1_500 : 10_000);
    return () => clearTimeout(t);
  }, [profile, profileLoaded, user, router]);
  const [selected, setSelected] = useState<Objective | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeText, setChangeText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [changeNote, setChangeNote] = useState<{ title: string; body: string } | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [taskChat, setTaskChat] = useState<{ role: 'lola' | 'user'; text: string }[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [taskThinking, setTaskThinking] = useState(false);
  const activeTaskRef = useRef<string | null>(null);
  // "This week" vs the full phased roadmap. Full is the default — the week view is the
  // attention filter you flip to, not a place to hide the plan.
  const [view, setView] = useState<'week' | 'all'>('all');
  // Exact keyboard overlap (same hook as the interview composer — the KAV lesson): the task
  // sheet slides above the keyboard so its inputs stay visible (build-24 family finding).
  const kb = useKeyboardHeight();
  const { height: winH } = useWindowDimensions();

  useEffect(() => { capture('roadmap_viewed'); }, []); // funnel endpoint: reached the roadmap

  async function openCard(obj: Objective) {
    capture('task_opened', { objective_id: obj.id });
    setSelected(obj);
    setDateInput(''); setDateOpen(false);
    setChangeOpen(false); setChangeText('');
    setTaskInput(''); setTaskChat([]);
    activeTaskRef.current = obj.id;
    setTaskThinking(true);
    const intro = await askLola(obj, profile ?? {}, [], TASK_INTRO);
    if (activeTaskRef.current !== obj.id) return; // a different card was opened meanwhile
    setTaskChat([{ role: 'lola', text: intro }]);
    setTaskThinking(false);
  }

  async function submitTaskQuestion(obj: Objective) {
    if (!taskInput.trim() || taskThinking) return;
    const q = taskInput.trim();
    const history = taskChat;
    setTaskInput('');
    setTaskChat(prev => [...prev, { role: 'user', text: q }]);
    setTaskThinking(true);
    capture('task_coach_asked', { objective_id: obj.id }); // feature health: using post-roadmap Lola
    const answer = await askLola(obj, profile ?? {}, history, q);
    setTaskChat(prev => [...prev, { role: 'lola', text: answer }]);
    setTaskThinking(false);
  }

  async function setProgress(id: string, pr: Progress | null) {
    const prev = (profile?.progress as Record<string, Progress> | undefined) ?? {};
    const nextProgress = { ...prev };
    if (pr) nextProgress[id] = pr; else delete nextProgress[id];
    const next: Profile = { ...profile, progress: nextProgress };
    setProfile(next);
    if (user) await saveProfileDb(user.id, next);
  }

  function markDone(id: string, completedOn?: string) {
    setProgress(id, { state: 'done', ...(completedOn ? { completedOn } : {}) });
    capture('roadmap_item_completed', { objective_id: id, back_dated: !!completedOn });
    setDateInput('');
    setSelected(null);
  }

  // Layer 2: free-text "what changed" → profile delta → deterministic re-plan.
  async function submitChange(obj: Objective, currentPlan: Objective[]) {
    if (!changeText.trim() || thinking) return;
    setThinking(true);
    const result = await parseProfileChange(changeText, obj.title);
    setThinking(false);
    if ('error' in result) {
      setChangeNote({ title: t('changeNote.errTitle'), body: t('changeNote.errBody') });
      return;
    }
    const changes = result.changes;
    setChangeText('');
    setChangeOpen(false);
    setSelected(null);
    if (Object.keys(changes).length === 0) {
      setChangeNote({ title: t('changeNote.noChangeTitle'), body: t('changeNote.noChangeBody') });
      return;
    }
    const nextProfile: Profile = { ...profile, ...changes };
    derive(nextProfile);
    const after = buildPlan(nextProfile);
    // Honesty check: a field can change without any plan impact — never claim a remodel
    // over a no-op diff (build-24 family finding: "replanned!" while every date stayed put).
    if (!plansDiffer(currentPlan, after)) {
      capture('plan_remodel_noop', { changed_fields: Object.keys(changes) });
      setChangeNote({ title: t('changeNote.noopTitle'), body: t('changeNote.noopBody') });
      setProfile(nextProfile);
      if (user) await saveProfileDb(user.id, nextProfile);
      return;
    }
    capture('plan_remodelled', { changed_fields: Object.keys(changes) });
    setChangeNote({ title: t('changeNote.remodelTitle'), body: diffSummary(currentPlan, after) });
    setProfile(nextProfile);
    if (user) await saveProfileDb(user.id, nextProfile);
  }

  if (!profile) {
    // Signed in but no profile in memory yet = still hydrating (SessionSync is fetching it after a
    // reload). Show a loading note instead of the "no roadmap" empty state, which would be wrong.
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={{ flexGrow: 1 }}>
        <NavBar />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyHeading}>{user ? t('empty.loadingTitle') : t('empty.noneTitle')}</Text>
          <Text style={styles.emptyBody}>
            {user ? t('empty.loadingBody') : t('empty.noneBody')}
          </Text>
        </View>
        <Footer />
      </ScrollView>
    );
  }

  const objectives = buildPlan(profile);
  const byPhase = PHASE_ORDER.map(phase => ({
    phase,
    items: objectives.filter(o => o.phase === phase),
  })).filter(g => g.items.length > 0);

  const penaltyCount = objectives.filter(o => o.severity === 'penalty').length;
  const requiredCount = objectives.filter(o => o.severity === 'required').length;
  const doneCount = objectives.filter(o => o.done).length;
  const overdueCount = objectives.filter(o => isOverdue(o)).length;
  // "Overdue · was due 12 Jun" — same red treatment on cards, the sheet pill, and (soon) the
  // weekly email, all keyed off the engine's single isOverdue predicate.
  const overdueLine = (o: Objective) =>
    o.timing.state === 'scheduled'
      ? t('overdue.wasDue', { date: o.timing.due.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' }) })
      : t('overdue.plain');
  const titleById = new Map(objectives.map(o => [o.id, displayTitle(o)]));
  const week = thisWeek(objectives);

  const renderCard = (obj: Objective) => {
    const isPenalty = obj.severity === 'penalty' && !obj.done;
    const barColor = obj.done ? palette.olive : SEV_COLOR[obj.severity];
    return (
      <TouchableOpacity
        key={obj.id}
        style={[styles.card, isPenalty && styles.cardPenalty, obj.done && styles.cardDone]}
        activeOpacity={0.7}
        onPress={() => openCard(obj)}
        accessibilityRole="button"
        accessibilityLabel={t('card.a11y', { title: displayTitle(obj), status: obj.done ? t('card.a11yDone') : formatTiming(obj) })}
      >
        <View style={[styles.severityBar, { backgroundColor: barColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardTitle, isPenalty && styles.cardTitlePenalty, obj.done && styles.cardTitleDone]} numberOfLines={3}>
              {displayTitle(obj)}
            </Text>
            {obj.done ? (
              <View style={[styles.sevBadge, { backgroundColor: palette.olive + '18' }]}>
                <Text style={[styles.sevBadgeText, { color: palette.olive }]}>{t('card.doneBadge')}</Text>
              </View>
            ) : (
              <View style={[styles.sevBadge, { backgroundColor: SEV_COLOR[obj.severity] + '18' }]}>
                <Text style={[styles.sevBadgeText, { color: SEV_COLOR[obj.severity] }]}>
                  {sevLabel(obj.severity)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cardMeta}>
            {obj.done ? (
              <Text style={[styles.cardTiming, { color: palette.olive }]}>{completionLine(obj)}</Text>
            ) : (
              <>
                <Text style={[styles.cardTiming, (isPenalty || isOverdue(obj)) && styles.cardTimingPenalty]}>
                  {isOverdue(obj) ? overdueLine(obj) : formatTiming(obj)}
                </Text>
                <View style={styles.sourceDot}>
                  <View style={[styles.sourceDotMark, { backgroundColor: SOURCE_COLOR[obj.source] }]} />
                  <Text style={styles.sourceDotText}>{sourceShort(obj.source)}</Text>
                </View>
                <Text style={styles.cardCategory}>{obj.category}</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
    <ScrollView style={styles.scroll} ref={top.ref} onScroll={top.onScroll} scrollEventThrottle={16}>
      <NavBar />
      <View style={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">{t('heading')}</Text>

        <View style={styles.toolbarRow}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, view === 'week' && styles.viewToggleBtnActive]}
              onPress={() => { setView('week'); capture('plan_view_toggled', { view: 'week' }); }}
            >
              <Text style={[styles.viewToggleText, view === 'week' && styles.viewToggleTextActive]}>
                {week.overdue.length > 0 ? t('toolbar.thisWeekOverdue', { count: week.overdue.length }) : t('toolbar.thisWeek')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, view === 'all' && styles.viewToggleBtnActive]}
              onPress={() => { setView('all'); capture('plan_view_toggled', { view: 'all' }); }}
            >
              <Text style={[styles.viewToggleText, view === 'all' && styles.viewToggleTextActive]}>{t('toolbar.fullRoadmap')}</Text>
            </TouchableOpacity>
          </View>
          {/* The report: a pure function of the plan (THESIS piece 4). Web → print dialog
              ("Save as PDF"); native → real PDF into the share sheet. */}
          <TouchableOpacity
            onPress={() => {
              capture('plan_pdf_exported');
              exportPdf(reportHtml(objectives, new Date(), currentLang())).catch(() => {});
            }}
            accessibilityLabel={t('toolbar.exportA11y')}
          >
            <Text style={styles.exportLink}>{t('toolbar.exportPdf')}</Text>
          </TouchableOpacity>
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
          {overdueCount > 0 && (
            <View style={[styles.statChip, styles.statChipOverdue]}>
              <Text style={[styles.statNum, { color: '#C0392B' }]}>{overdueCount}</Text>
              <Text style={styles.statLabel}>{t('stats.overdue')}</Text>
            </View>
          )}
          {penaltyCount > 0 && (
            <View style={styles.statChip}>
              <Text style={[styles.statNum, { color: '#C0392B' }]}>{penaltyCount}</Text>
              <Text style={styles.statLabel}>{t('stats.penaltyRisk')}</Text>
            </View>
          )}
          {doneCount > 0 && (
            <View style={styles.statChip}>
              <Text style={[styles.statNum, { color: palette.olive }]}>{doneCount}</Text>
              <Text style={styles.statLabel}>{t('stats.done')}</Text>
            </View>
          )}
        </View>

        {!user && <EmailCaptureCard profile={profile} />}

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

        <PenaltyBanner objectives={objectives} />

        {view === 'week' ? (
          <>
            {week.overdue.length > 0 && (
              <View style={styles.section}>
                <View style={styles.phaseHeader}>
                  <Text style={[styles.phaseLabel, { color: '#C0392B' }]}>{t('week.slippedPast')}</Text>
                  <Text style={styles.phaseCount}>{week.overdue.length}</Text>
                </View>
                {week.overdue.map(renderCard)}
              </View>
            )}
            {week.dueSoon.length > 0 && (
              <View style={styles.section}>
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseLabel}>{t('week.dueThisWeek')}</Text>
                  <Text style={styles.phaseCount}>{week.dueSoon.length}</Text>
                </View>
                {week.dueSoon.map(renderCard)}
              </View>
            )}
            {week.overdue.length === 0 && week.dueSoon.length === 0 && (
              <View style={styles.weekClear}>
                <Text style={styles.weekClearTitle}>{t('week.clearTitle')}</Text>
                <Text style={styles.weekClearBody}>
                  {week.nextUp && week.nextUp.timing.state !== 'pending_anchor'
                    ? t('week.clearNext', { title: displayTitle(week.nextUp), timing: formatTiming(week.nextUp).toLowerCase() })
                    : t('week.clearWaiting')}
                </Text>
              </View>
            )}
          </>
        ) : (
          byPhase.map(({ phase, items }) => (
            <View key={phase} style={styles.section}>
              <View style={styles.phaseHeader}>
                <Text style={styles.phaseIcon}>{PHASE_ICONS[phase]}</Text>
                <Text style={styles.phaseLabel}>{phaseLabel(phase)}</Text>
                <Text style={styles.phaseCount}>{items.length}</Text>
              </View>
              {items.map(renderCard)}
            </View>
          ))
        )}
      </View>
      <Footer />
    </ScrollView>

    <Modal
      visible={!!selected}
      transparent
      animationType="slide"
      onRequestClose={() => setSelected(null)}
    >
      {/* Backdrop is an absolute-fill Pressable BEHIND a plain-View sheet — wrapping the sheet's
          ScrollView in a Pressable made the whole drawer unscrollable on iOS (the touchable
          claimed the drag gesture; build-18 device finding). Tap-out still closes. */}
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
        {/* Keyboard-aware: slide the whole sheet above the keyboard by the exact overlap the
            OS reports, and cap its height to the space that remains. */}
        <View style={[styles.sheet, kb > 0 && { marginBottom: kb, maxHeight: winH - kb - 60 }]}>
          {selected && (() => {
            const deps = selected.depends_on
              .map(id => titleById.get(id))
              .filter((t): t is string => !!t);
            return (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.sheetHandle} />

                <Text style={styles.sheetTitle}>{displayTitle(selected)}</Text>
                <View style={styles.sheetPills}>
                  <View style={styles.pill}><Text style={[styles.pillText, { color: selected.done ? palette.olive : isOverdue(selected) ? '#C0392B' : palette.cobalt }]}>{selected.done ? completionLine(selected) : isOverdue(selected) ? overdueLine(selected) : formatTiming(selected)}</Text></View>
                  {/* Source pill — tappable when there's a canonical source to open (new tab on web). */}
                  {selected.source_url ? (
                    <TouchableOpacity style={styles.pillLink} onPress={() => openExternal(selected.source_url!)}>
                      <View style={[styles.pillDot, { backgroundColor: SOURCE_COLOR[selected.source] }]} />
                      <Text style={styles.pillLinkText}>{sourceShort(selected.source)} ↗</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.pill}>
                      <View style={[styles.pillDot, { backgroundColor: SOURCE_COLOR[selected.source] }]} />
                      <Text style={styles.pillText}>{sourceShort(selected.source)}</Text>
                    </View>
                  )}
                  {/* Staff-only: corresponding webinar button — opens the YouTube source at its timestamp. */}
                  {isStaff && selected.webinar_url && (
                    <TouchableOpacity style={styles.pillWebinar} onPress={() => openExternal(selected.webinar_url!)}>
                      <Text style={styles.pillWebinarText}>▶ webinar ↗</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* ── Lola task coach (the living element) ───────────────── */}
                <View style={styles.thread}>
                  {taskChat.map((t, i) => (
                    <View key={i} style={t.role === 'lola' ? styles.threadLola : styles.threadUser}>
                      <Text style={t.role === 'lola' ? styles.threadLolaText : styles.threadUserText}>{t.text}</Text>
                    </View>
                  ))}
                  {taskThinking && (
                    <View style={styles.threadLola}><ActivityIndicator color={palette.amber} /></View>
                  )}
                </View>

                <View style={styles.askRow}>
                  <TextInput
                    style={styles.askInput}
                    accessibilityLabel={t('sheet.askA11y')}
                    value={taskInput}
                    onChangeText={setTaskInput}
                    placeholder={t('sheet.askPlaceholder')}
                    placeholderTextColor={palette.muted}
                    onSubmitEditing={() => submitTaskQuestion(selected)}
                    returnKeyType="send"
                    editable={!taskThinking}
                  />
                  <TouchableOpacity
                    style={[styles.askSend, (!taskInput.trim() || taskThinking) && styles.askSendDisabled]}
                    onPress={() => submitTaskQuestion(selected)}
                    disabled={!taskInput.trim() || taskThinking}
                  >
                    <Text style={styles.askSendText}>↑</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Compact actions ────────────────────────────────────── */}
                <View style={styles.actionsRow}>
                  {selected.done ? (
                    <>
                      <View style={styles.donePill}><Text style={styles.donePillText}>{t('sheet.doneBadge')}</Text></View>
                      <TouchableOpacity onPress={() => { setProgress(selected.id, null); setSelected(null); }}>
                        <Text style={styles.linkBtn}>{t('sheet.undo')}</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.doneChip} onPress={() => markDone(selected.id, new Date().toISOString().slice(0, 10))}>
                        <Text style={styles.doneChipText}>{t('sheet.markDone')}</Text>
                      </TouchableOpacity>
                      {/* "on a date" read as a mystery (build-25 family finding) — say what it's for. */}
                      <TouchableOpacity onPress={() => setDateOpen(v => !v)}>
                        <Text style={styles.linkBtn}>{t('sheet.addDate')}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {dateOpen && !selected.done && (() => {
                  // Forgiving entry (build-25 family finding: "2026-April-25" was rejected):
                  // deterministic normalizer + a live preview so the user confirms our parse.
                  const parsed = normalizeDateInput(dateInput);
                  return (
                    <View>
                      <Text style={styles.dateHint}>{t('sheet.dateHint')}</Text>
                      <View style={styles.dateRow}>
                        <TextInput
                          style={styles.dateInput}
                          value={dateInput}
                          onChangeText={setDateInput}
                          placeholder={t('sheet.datePlaceholder')}
                          placeholderTextColor={palette.muted}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          style={[styles.dateSaveBtn, !parsed && styles.dateSaveBtnDisabled]}
                          disabled={!parsed}
                          onPress={() => parsed && markDone(selected.id, parsed.iso)}
                        >
                          <Text style={styles.dateSaveBtnText}>{t('sheet.save')}</Text>
                        </TouchableOpacity>
                      </View>
                      {dateInput.trim().length > 0 && (
                        <Text style={[styles.datePreview, !parsed && styles.datePreviewBad]}>
                          {parsed ? t('sheet.datePreview', { label: parsed.label }) : t('sheet.dateUnreadable')}
                        </Text>
                      )}
                    </View>
                  );
                })()}

                {/* ── Something changed → re-plan ─────────────────────────── */}
                {!changeOpen ? (
                  <TouchableOpacity onPress={() => setChangeOpen(true)}>
                    <Text style={styles.changeLink}>{t('sheet.changeLink')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.changeBox}>
                    <TextInput
                      style={styles.changeInput}
                      value={changeText}
                      onChangeText={setChangeText}
                      placeholder={changeHint(selected)}
                      placeholderTextColor={palette.muted}
                      multiline
                      editable={!thinking}
                    />
                    <TouchableOpacity
                      style={[styles.changeSubmit, (thinking || !changeText.trim()) && styles.dateSaveBtnDisabled]}
                      disabled={thinking || !changeText.trim()}
                      onPress={() => submitChange(selected, objectives)}
                    >
                      {thinking ? <ActivityIndicator color={palette.cal} /> : <Text style={styles.changeSubmitText}>{t('sheet.tellLola')}</Text>}
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── Step details (timing, prerequisites, source) — always shown ── */}
                <View style={styles.detailsBox}>
                    <Text style={styles.sheetSectionLabel}>{t('sheet.whenLabel')}</Text>
                    <Text style={styles.sheetTiming}>{isOverdue(selected) ? overdueLine(selected) : formatTiming(selected)}</Text>
                    {isOverdue(selected) && (
                      <Text style={styles.overdueNudge}>
                        {t('sheet.overdueNudge')}
                      </Text>
                    )}
                    <Text style={styles.sheetBody}>{timingDetail(selected)}</Text>
                    {selected.regional && (
                      <>
                        <Text style={styles.sheetSectionLabel}>{t('sheet.regionalLabel')}</Text>
                        <Text style={styles.sheetBody}>
                          {regionLabel(profile?.region)
                            ? t('sheet.regionalBodyWithRegion', { region: regionLabel(profile?.region) })
                            : t('sheet.regionalBody')}
                        </Text>
                      </>
                    )}
                    {deps.length > 0 && (
                      <>
                        <Text style={styles.sheetSectionLabel}>{t('sheet.depsLabel')}</Text>
                        {deps.map((d, i) => (<Text key={i} style={styles.sheetDep}>• {d}</Text>))}
                      </>
                    )}
                    {/* Explanation of the source tag. The actionable links live in the header pills
                        (official / webinar), so they're visible without opening details. */}
                    <View style={[styles.sourceNote, { borderLeftColor: SOURCE_COLOR[selected.source] }]}>
                      <Text style={styles.sourceNoteText}>{sourceBlurb(selected.source)}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.sheetCloseLink} onPress={() => setSelected(null)}>
                  <Text style={styles.sheetCloseLinkText}>{t('sheet.close')}</Text>
                </TouchableOpacity>
              </ScrollView>
            );
          })()}
        </View>
      </View>
    </Modal>

    <Modal
      visible={!!changeNote}
      transparent
      animationType="fade"
      onRequestClose={() => setChangeNote(null)}
    >
      <Pressable style={styles.celebrateBackdrop} onPress={() => setChangeNote(null)}>
        <Pressable style={styles.celebrateCard} onPress={e => e.stopPropagation()}>
          <View style={styles.celebrateGlyphRing}>
            <Text style={styles.celebrateGlyph}>✦</Text>
          </View>
          <Text style={styles.celebrateTitle}>{changeNote?.title}</Text>
          <Text style={styles.celebrateBody}>{changeNote?.body}</Text>
          <TouchableOpacity style={styles.celebrateBtn} onPress={() => setChangeNote(null)}>
            <Text style={styles.celebrateBtnText}>{t('changeNote.seePlan')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
    <BackToTop visible={top.visible} scrollToTop={top.scrollToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1 },
  scroll:        { flex: 1, backgroundColor: palette.cal },
  content:       { width: '100%', maxWidth: 820, alignSelf: 'center', padding: 24, paddingTop: 32, paddingBottom: 48 },

  emptyWrap:     { flex: 1, backgroundColor: palette.cal, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyHeading:  { fontFamily: 'Fraunces_600SemiBold', fontSize: 26, color: palette.indigo, marginBottom: 12 },
  emptyBody:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, color: palette.indigo, textAlign: 'center', lineHeight: 24 },

  heading:       { fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: palette.indigo, marginBottom: 16 },

  toolbarRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   marginBottom: 16, gap: 10 },
  exportLink:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: palette.cobalt,
                   paddingVertical: 8, paddingHorizontal: 6 },
  viewToggle:    { flexDirection: 'row', backgroundColor: '#EEE9E0', borderRadius: 10, padding: 3,
                   alignSelf: 'flex-start' },
  viewToggleBtn: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 8 },
  viewToggleBtnActive: { backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  viewToggleText:{ fontFamily: 'HankenGrotesk_500Medium', fontSize: 13, color: palette.muted },
  viewToggleTextActive: { color: palette.indigo, fontFamily: 'HankenGrotesk_600SemiBold' },

  weekClear:     { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 14,
                   padding: 22, alignItems: 'flex-start' },
  weekClearTitle:{ fontFamily: 'Fraunces_600SemiBold', fontSize: 21, color: palette.olive, marginBottom: 8 },
  weekClearBody: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 22, color: palette.indigo },

  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statChip:      { backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
                   borderWidth: 1, borderColor: '#E8E4DC', alignItems: 'center', minWidth: 72 },
  statNum:       { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: palette.indigo },
  statLabel:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted, marginTop: 1 },
  statChipOverdue:{ borderColor: '#C0392B', backgroundColor: '#FBEFED' },
  overdueNudge:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, lineHeight: 19, color: '#C0392B', marginTop: 6 },
  legend:        { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: -6, marginBottom: 20 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendText:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted },

  emailCard:        { backgroundColor: palette.white, borderWidth: 1.5, borderColor: palette.cobalt,
                      borderRadius: 14, padding: 18, marginBottom: 20, gap: 10 },
  emailCardTitle:   { fontFamily: 'Fraunces_600SemiBold', fontSize: 19, color: palette.indigo },
  emailCardBody:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 21, color: palette.indigo },
  emailCardBtn:     { alignSelf: 'flex-start', backgroundColor: palette.cobalt, borderRadius: 10,
                      paddingVertical: 12, paddingHorizontal: 20 },
  emailCardBtnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },

  penaltyBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FDF2F2',
                   borderWidth: 1, borderColor: '#F5C6C6', borderRadius: 10,
                   padding: 12, marginBottom: 12, gap: 10 },
  penaltyBannerIcon: { fontSize: 16, lineHeight: 22 },
  penaltyBannerText: { flex: 1, fontFamily: 'HankenGrotesk_500Medium', fontSize: 13,
                       color: '#C0392B', lineHeight: 20 },

  alertBanner:   { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF8ED',
                   borderWidth: 1, borderColor: '#F5DFA8', borderRadius: 10,
                   padding: 12, marginBottom: 12, gap: 10 },
  alertBannerIcon: { fontSize: 16, lineHeight: 22 },
  alertBannerText: { flex: 1, fontFamily: 'HankenGrotesk_500Medium', fontSize: 13,
                     color: palette.amber, lineHeight: 20 },

  celebrateBackdrop: { flex: 1, backgroundColor: 'rgba(21,36,59,0.55)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  celebrateCard:     { backgroundColor: palette.cal, borderRadius: 20, padding: 28, alignItems: 'center',
                       maxWidth: 360, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' },
  celebrateGlyphRing:{ width: 56, height: 56, borderRadius: 28, backgroundColor: palette.amber + '1A',
                       justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  celebrateGlyph:    { fontSize: 26, color: palette.amber },
  celebrateTitle:    { fontFamily: 'Fraunces_600SemiBold', fontSize: 21, color: palette.indigo, textAlign: 'center', lineHeight: 27, marginBottom: 8 },
  celebrateBody:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.muted, textAlign: 'center', lineHeight: 22, marginBottom: 22 },
  celebrateBtn:      { backgroundColor: palette.amber, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, alignSelf: 'stretch', alignItems: 'center' },
  celebrateBtnText:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },

  section:       { marginBottom: 28 },
  phaseHeader:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  phaseIcon:     { fontSize: 14 },
  phaseLabel:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, color: palette.muted,
                   letterSpacing: 1.1, textTransform: 'uppercase', flex: 1 },
  phaseCount:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted },

  card:          { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 10,
                   overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardPenalty:   { backgroundColor: '#FFFAF9', boxShadow: '0 2px 6px rgba(192,57,43,0.08)' },
  severityBar:   { width: 4 },
  cardBody:      { flex: 1, padding: 14 },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  cardTitle:     { flex: 1, fontFamily: 'HankenGrotesk_500Medium', fontSize: 15, color: palette.indigo, lineHeight: 21 },
  cardTitlePenalty: { color: '#8B1A0E' },
  sevBadge:      { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 },
  sevBadgeText:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 0.3 },
  cardMeta:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTiming:    { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.cobalt, flex: 1 },
  cardTimingPenalty: { color: '#C0392B' },
  cardCategory:  { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted,
                   textTransform: 'capitalize', backgroundColor: '#F2EDE6', borderRadius: 4,
                   paddingHorizontal: 6, paddingVertical: 2 },
  sourceDot:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sourceDotMark: { width: 6, height: 6, borderRadius: 3 },
  sourceDotText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(21,36,59,0.45)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet:         { width: '100%', maxWidth: 640, alignSelf: 'center',
                   backgroundColor: palette.cal, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                   padding: 24, paddingTop: 12, maxHeight: '85%' },
  sheetHandle:   { alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
                   backgroundColor: '#D8D2C8', marginBottom: 18 },
  sheetTitle:    { fontFamily: 'Fraunces_600SemiBold', fontSize: 21, color: palette.indigo, lineHeight: 28, marginBottom: 10 },
  sheetPills:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  pill:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF',
                   borderWidth: 1, borderColor: '#E8E4DC', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillDot:       { width: 6, height: 6, borderRadius: 3 },
  pillText:      { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.muted },
  pillLink:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EEF3FA',
                   borderWidth: 1, borderColor: palette.cobalt, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillLinkText:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, color: palette.cobalt },
  pillWebinar:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FBF3E2',
                   borderWidth: 1, borderColor: palette.amber, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillWebinarText:{ fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, color: palette.amber },
  sheetSectionLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, color: palette.muted,
                       letterSpacing: 1.1, marginTop: 18, marginBottom: 6 },
  sheetTiming:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, color: palette.cobalt, marginBottom: 4 },
  sheetBody:     { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: palette.indigo, lineHeight: 21 },
  sheetDep:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: palette.indigo, lineHeight: 22 },
  sourceNote:    { backgroundColor: '#FFFFFF', borderRadius: 8, borderLeftWidth: 3,
                   padding: 12, marginTop: 20 },
  sourceNoteText:{ fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, color: palette.indigo, lineHeight: 19 },

  cardDone:      { backgroundColor: '#F6F7F3' },
  cardTitleDone: { color: palette.olive },

  // ── Chat-first task sheet ──────────────────────────────────────────────
  thread:        { gap: 8, marginBottom: 12, minHeight: 40 },
  threadLola:    { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 16, borderBottomLeftRadius: 4,
                   padding: 12, maxWidth: '92%', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  threadUser:    { alignSelf: 'flex-end', backgroundColor: palette.cobalt, borderRadius: 16, borderBottomRightRadius: 4,
                   padding: 12, maxWidth: '92%' },
  threadLolaText:{ fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: palette.indigo, lineHeight: 21 },
  threadUserText:{ fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: palette.cal, lineHeight: 21 },
  askRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF',
                   borderRadius: 24, borderWidth: 1, borderColor: '#E0DCD4', paddingLeft: 14, paddingRight: 5, paddingVertical: 5 },
  askInput:      { flex: 1, fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: palette.indigo, paddingVertical: 6,
                   ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as object : null) },
  askSend:       { backgroundColor: palette.amber, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  askSendDisabled: { backgroundColor: palette.muted, opacity: 0.5 },
  askSendText:   { color: palette.cal, fontSize: 17, lineHeight: 20 },

  actionsRow:    { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  doneChip:      { backgroundColor: palette.olive, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  doneChipText:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cal },
  donePill:      { backgroundColor: palette.olive + '18', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  donePillText:  { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.olive },
  linkBtn:       { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: palette.cobalt },

  dateHint:      { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, color: palette.muted, marginTop: 12 },
  datePreview:   { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: palette.olive, marginTop: 6 },
  datePreviewBad:{ color: palette.muted, fontFamily: 'HankenGrotesk_400Regular' },
  dateRow:       { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  dateInput:     { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
                   fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, color: palette.indigo,
                   borderWidth: 1, borderColor: '#E0DCD4' },
  dateSaveBtn:   { backgroundColor: palette.olive, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11, justifyContent: 'center' },
  dateSaveBtnDisabled: { backgroundColor: palette.muted, opacity: 0.5 },
  dateSaveBtnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.cal },

  changeLink:    { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: palette.amber, marginTop: 18 },
  changeBox:     { marginTop: 14 },
  changeInput:   { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, minHeight: 64,
                   fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, color: palette.indigo,
                   borderWidth: 1, borderColor: '#E0DCD4', textAlignVertical: 'top' },
  changeSubmit:  { backgroundColor: palette.amber, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  changeSubmitText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.cal },

  detailsBox:    { marginTop: 18, borderTopWidth: 1, borderTopColor: '#EAE6DE', paddingTop: 2 },
  sheetCloseLink:{ alignItems: 'center', paddingVertical: 16, marginTop: 10 },
  sheetCloseLinkText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.muted },
});
