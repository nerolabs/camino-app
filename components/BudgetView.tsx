/**
 * The "Costs" view on /plan (move-budget feature, increment 3). Renders the deterministic budget
 * (core/budget.ts) in the three honest layers the UX is built on — sourced (firm+soft, a range) ·
 * personal (the user's own figure) · free (collapsed) — plus the Add-budget sheet for personal
 * items and the home-price input that firms up property costs.
 *
 * SHIPS BEHIND A FLAG. The cost registry is a researched FIRST PASS (verified:false), so this view
 * is gated by BUDGET_ENABLED (EXPO_PUBLIC_BUDGET_ENABLED === '1'), carries an "estimates in
 * progress" banner, and stays English-first until the per-figure verification pass + ×5 locale copy
 * land (same playbook as App Attest / Play Integrity). The pure logic is unit-tested
 * (budget/budget-inputs/budget-format); this component is the presentation layer over it.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Pressable, ScrollView } from 'react-native';
import { palette } from '@/constants/Colors';
import type { Objective } from '@/core/engine-controller';
import type { Profile } from '@/core/interview-controller';
import { buildBudget, type BudgetLine } from '@/core/budget';
import { profileToBudgetInputs, isBuying, isSelfEmployed } from '@/core/budget-inputs';
import { OBLIGATION_COSTS } from '@/core/obligation-costs';
import { formatEur, lineCostDisplay, budgetHeadline } from '@/lib/budgetFormat';
import { displayTitle } from '@/lib/catalogTitles';
import { capture } from '@/lib/analytics';

export const BUDGET_ENABLED = process.env.EXPO_PUBLIC_BUDGET_ENABLED === '1';

type Patch = (patch: Record<string, unknown>) => void;

const KIND_COLOR = { firm: palette.olive, soft: palette.cobalt, personal: palette.amber } as const;

function SourcedCard({ line }: { line: BudgetLine }) {
  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: KIND_COLOR[line.kind] }]} />
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle} numberOfLines={2}>{line.title}</Text>
        <Text style={styles.cardCost}>{lineCostDisplay(line)}</Text>
      </View>
      <View style={styles.metaRow}>
        <View style={[styles.pill, { backgroundColor: line.kind === 'firm' ? '#EEF1EA' : '#EEF3FA' }]}>
          <Text style={[styles.pillText, { color: line.kind === 'firm' ? '#42573b' : '#274d84' }]}>
            {line.kind === 'firm' ? 'Firm' : 'Scales with your numbers'}
          </Text>
        </View>
        {line.recurring && <Text style={styles.recTag}>{line.recurring === 'monthly' ? 'per month' : 'per year'}</Text>}
        {line.source_url && <View style={styles.srcDot} />}
        <Text style={styles.estTag}>estimate</Text>
      </View>
    </View>
  );
}

export default function BudgetView({
  objectives, profile, onPatch,
}: { objectives: Objective[]; profile: Profile; onPatch: Patch }) {
  useEffect(() => { capture('budget_viewed'); }, []);

  const rows = objectives.map(o => ({ id: o.id, title: displayTitle(o) }));
  const inputs = profileToBudgetInputs(profile);
  const budget = buildBudget(rows, inputs);
  const head = budgetHeadline(budget);
  const buying = isBuying(profile);
  const selfEmp = isSelfEmployed(profile);

  const firmLines = budget.sourcedLines.filter(l => l.kind === 'firm');
  const softLines = budget.sourcedLines.filter(l => l.kind === 'soft');

  // Home-price input (writes home_price_eur; firms up ITP / notary / registry).
  const [priceText, setPriceText] = useState(inputs.homePriceEur != null ? String(inputs.homePriceEur) : '');
  function commitPrice() {
    const n = Number(priceText.replace(/[^0-9]/g, ''));
    onPatch({ home_price_eur: Number.isFinite(n) && n > 0 ? n : undefined });
    if (n > 0) capture('budget_home_price_set');
  }

  // Add-budget sheet for personal items.
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetAmt, setSheetAmt] = useState('');
  const userBudgets = (inputs.userBudgets ?? {}) as Record<string, number>;
  function openSheet(id: string) {
    setSheetId(id);
    setSheetAmt(userBudgets[id] != null ? String(userBudgets[id]) : '');
  }
  function saveSheet() {
    if (!sheetId) return;
    const n = Number(sheetAmt.replace(/[^0-9]/g, ''));
    const next = { ...userBudgets };
    if (Number.isFinite(n) && n > 0) { next[sheetId] = n; capture('budget_estimate_added', { id: sheetId }); }
    else delete next[sheetId];
    onPatch({ budget_estimates: next });
    setSheetId(null);
  }

  const sheetCost = sheetId ? OBLIGATION_COSTS[sheetId] : null;
  const sheetTitle = sheetId ? (objectives.find(o => o.id === sheetId)?.title ?? sheetId) : '';

  return (
    <View style={styles.wrap}>
      {/* Estimates-in-progress banner — the honesty gate while data is verified:false */}
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          <Text style={styles.noticeStrong}>Estimates in progress.</Text> These figures are researched, not yet
          verified to our standard — a guide, not a quote. Official fees are shown with a dot.
        </Text>
      </View>

      {/* Context: the two gates that shape the money (from your answers) */}
      <View style={styles.gates}>
        <View style={styles.gateRow}>
          <Text style={styles.gateQ}>Buying a home</Text>
          <Text style={[styles.gateVal, buying && styles.gateOn]}>{buying ? 'Yes' : 'No'}</Text>
        </View>
        {buying && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Home price</Text>
            <TextInput
              style={styles.priceInput}
              value={priceText}
              onChangeText={setPriceText}
              onBlur={commitPrice}
              onSubmitEditing={commitPrice}
              keyboardType="numeric"
              placeholder="€ —"
              placeholderTextColor={palette.muted}
              returnKeyType="done"
            />
          </View>
        )}
        <View style={styles.gateRow}>
          <Text style={styles.gateQ}>Working self-employed</Text>
          <Text style={[styles.gateVal, selfEmp && styles.gateOn]}>{selfEmp ? 'Yes' : 'No'}</Text>
        </View>
        <Text style={styles.gateHint}>From your interview answers — change them there to reshape the plan.</Text>
      </View>

      {/* Total */}
      <View style={styles.total}>
        <Text style={styles.totalLabel}>YOUR MOVE · SOURCED ESTIMATE</Text>
        <Text style={styles.totalAmt}>{head.total}</Text>
        <View style={styles.totalSplit}>
          <View style={styles.totalPart}>
            <Text style={styles.totalPartK}>Fixed fees</Text>
            <Text style={styles.totalPartV}>{head.firm}</Text>
          </View>
          <View style={styles.totalPart}>
            <Text style={styles.totalPartK}>+ your budget</Text>
            <Text style={[styles.totalPartV, { color: palette.amber }]}>
              {budget.personal.userOneTime > 0 ? formatEur(budget.personal.userOneTime) : 'you set'}
            </Text>
          </View>
        </View>
        {(head.monthly || head.annual) && (
          <Text style={styles.totalFoot}>
            {head.monthly ? `Recurring: ${head.monthly}/mo` : ''}
            {head.monthly && head.annual ? ' · ' : ''}
            {head.annual ? `${head.annual}/yr` : ''}
          </Text>
        )}
      </View>

      {/* Layer 1 — sourced */}
      {(firmLines.length > 0 || softLines.length > 0) && (
        <>
          <LayerLabel color={palette.olive} title="Camino-sourced" hint="a source on every line" />
          {firmLines.length > 0 && <Text style={styles.groupLabel}>FIXED OFFICIAL FEES</Text>}
          {firmLines.map(l => <SourcedCard key={l.id} line={l} />)}
          {softLines.length > 0 && <Text style={styles.groupLabel}>SCALES WITH YOUR NUMBERS</Text>}
          {softLines.map(l => <SourcedCard key={l.id} line={l} />)}
        </>
      )}

      {/* Layer 2 — personal */}
      {budget.personal.lines.length > 0 && (
        <>
          <LayerLabel color={palette.amber} title="Your budget to set" hint="your figure, not ours" />
          {budget.personal.lines.map(l => {
            const saved = userBudgets[l.id];
            return (
              <TouchableOpacity key={l.id} style={styles.card} onPress={() => openSheet(l.id)} activeOpacity={0.7}>
                <View style={[styles.bar, { backgroundColor: palette.amber }]} />
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{l.title}</Text>
                  {saved != null
                    ? <Text style={[styles.cardCost, { color: palette.amber }]}>{formatEur(saved)}</Text>
                    : <View style={styles.addBtn}><Text style={styles.addBtnText}>+ add budget</Text></View>}
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.personalHint}>{saved != null ? 'Your estimate · tap to edit' : l.display}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Layer 3 — free */}
      {budget.free.count > 0 && (
        <View style={styles.freeRow}>
          <Text style={styles.freeText}>
            {budget.free.count} step{budget.free.count === 1 ? '' : 's'} in your plan cost nothing
          </Text>
        </View>
      )}

      {/* Add-budget sheet */}
      <Modal visible={sheetId != null} transparent animationType="slide" onRequestClose={() => setSheetId(null)}>
        <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetId(null)} />
        <View style={styles.sheet}>
          <View style={styles.grab} />
          <Text style={styles.sheetEyebrow}>YOUR BUDGET</Text>
          <Text style={styles.sheetTitle}>{sheetTitle}</Text>
          <View style={styles.sheetHonest}>
            <Text style={styles.sheetHonestText}>
              There's no official price for this — whatever you enter is yours; we won't guess it, and it
              stays out of the sourced total.
            </Text>
          </View>
          <View style={styles.amtBox}>
            <Text style={styles.amtCur}>€</Text>
            <TextInput
              style={styles.amtInput}
              value={sheetAmt}
              onChangeText={setSheetAmt}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={palette.muted}
              autoFocus
            />
            <Text style={styles.amtUnit}>{sheetCost?.recurring === 'monthly' ? 'per month' : 'one-time'}</Text>
          </View>
          {sheetCost?.typicalEur && (
            <TouchableOpacity
              style={styles.hintChip}
              onPress={() => setSheetAmt(String(sheetCost.typicalEur![0]))}
            >
              <Text style={styles.hintChipText}>
                Others pay ~{formatEur(sheetCost.typicalEur[0])}–{formatEur(sheetCost.typicalEur[1])}
                {sheetCost.perUnit ? ` ${sheetCost.perUnit}` : ''} · tap to use
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.sheetActs}>
            <TouchableOpacity style={styles.saveBtn} onPress={saveSheet}>
              <Text style={styles.saveBtnText}>Save to my budget</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={() => setSheetId(null)}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </Modal>
    </View>
  );
}

function LayerLabel({ color, title, hint }: { color: string; title: string; hint?: string }) {
  return (
    <View style={styles.layerLabel}>
      <View style={[styles.layerDot, { backgroundColor: color }]} />
      <Text style={styles.layerTitle}>{title}</Text>
      {hint && <Text style={styles.layerHint}>{hint}</Text>}
    </View>
  );
}

const HAIR = 'rgba(21,36,59,0.10)';
const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 2, paddingTop: 4, width: '100%', maxWidth: 640, alignSelf: 'center' },
  notice: { backgroundColor: '#FBF3E3', borderColor: 'rgba(189,131,24,0.28)', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  noticeText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, lineHeight: 19, color: palette.indigo },
  noticeStrong: { fontFamily: 'HankenGrotesk_600SemiBold', color: '#8a5f11' },

  gates: { backgroundColor: palette.white, borderColor: HAIR, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 12 },
  gateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  gateQ: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.indigo },
  gateVal: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: palette.muted },
  gateOn: { color: palette.cobalt },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(21,36,59,0.055)' },
  priceLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, color: '#8a5f11' },
  priceInput: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.indigo, backgroundColor: '#FBF3E3', borderColor: 'rgba(189,131,24,0.35)', borderWidth: 1, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 6, minWidth: 120, textAlign: 'right' },
  gateHint: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11.5, color: palette.muted, paddingBottom: 10, paddingTop: 2 },

  total: { backgroundColor: palette.white, borderColor: HAIR, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  totalLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10.5, letterSpacing: 1.2, color: palette.muted },
  totalAmt: { fontFamily: 'Fraunces_600SemiBold', fontSize: 30, color: palette.indigo, marginTop: 6 },
  totalSplit: { flexDirection: 'row', gap: 8, marginTop: 12 },
  totalPart: { flex: 1, backgroundColor: palette.cal, borderColor: HAIR, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9 },
  totalPartK: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 9.5, letterSpacing: 0.8, color: palette.muted, textTransform: 'uppercase' },
  totalPartV: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15, color: palette.indigo, marginTop: 3 },
  totalFoot: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, color: palette.muted, marginTop: 11 },

  layerLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 8 },
  layerDot: { width: 9, height: 9, borderRadius: 5 },
  layerTitle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 0.8, color: palette.indigo, textTransform: 'uppercase' },
  layerHint: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: palette.muted },
  groupLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 9.5, letterSpacing: 0.8, color: palette.muted, textTransform: 'uppercase', marginTop: 10, marginBottom: 6, marginLeft: 3 },

  card: { position: 'relative', backgroundColor: palette.white, borderColor: HAIR, borderWidth: 1, borderRadius: 12, paddingVertical: 11, paddingRight: 12, paddingLeft: 16, marginBottom: 8, overflow: 'hidden' },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardTitle: { flex: 1, fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, lineHeight: 18, color: palette.indigo },
  cardCost: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14, color: palette.indigo },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  pill: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2.5 },
  pillText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10 },
  recTag: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 10.5, color: palette.muted },
  srcDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.olive },
  estTag: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 10, color: palette.muted, fontStyle: 'italic' },
  personalHint: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11.5, color: palette.muted },
  addBtn: { backgroundColor: '#FBF3E3', borderColor: 'rgba(189,131,24,0.4)', borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  addBtnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, color: '#8a5f11' },

  freeRow: { backgroundColor: '#EEF0F3', borderColor: HAIR, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, marginTop: 6 },
  freeText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, color: '#5b6a7e' },

  // The Modal renders at the app root, outside /plan's centered column — so anchor + cap the sheet
  // here or it spans the full desktop-web viewport width.
  modalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(21,36,59,0.34)' },
  sheet: { width: '100%', maxWidth: 480, backgroundColor: palette.cal, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  grab: { width: 38, height: 5, borderRadius: 3, backgroundColor: HAIR, alignSelf: 'center', marginBottom: 14 },
  sheetEyebrow: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10.5, letterSpacing: 1.2, color: palette.amber },
  sheetTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 21, color: palette.indigo, marginTop: 5 },
  sheetHonest: { backgroundColor: '#FBF3E3', borderColor: 'rgba(189,131,24,0.24)', borderWidth: 1, borderRadius: 11, padding: 11, marginTop: 12 },
  sheetHonestText: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 12.5, lineHeight: 18, color: palette.indigo },
  amtBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.white, borderColor: palette.cobalt, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginTop: 16 },
  amtCur: { fontFamily: 'Fraunces_600SemiBold', fontSize: 26, color: palette.muted },
  amtInput: { flex: 1, fontFamily: 'Fraunces_600SemiBold', fontSize: 26, color: palette.indigo, padding: 0 },
  amtUnit: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, color: palette.muted },
  hintChip: { alignSelf: 'flex-start', backgroundColor: '#FBF3E3', borderColor: 'rgba(189,131,24,0.3)', borderWidth: 1, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, marginTop: 12 },
  hintChipText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, color: '#8a5f11' },
  sheetActs: { flexDirection: 'row', gap: 9, marginTop: 18 },
  saveBtn: { flex: 1, backgroundColor: palette.cobalt, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13.5, color: palette.white },
  skipBtn: { borderColor: HAIR, borderWidth: 1, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center' },
  skipBtnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13.5, color: palette.muted },
});
