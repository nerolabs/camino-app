/**
 * The pure decision behind the interview's deterministic "stakes" reaction (council fix C1b).
 *
 * The live finding: Lola's LLM reaction praised an income band the engine was about to flag as
 * below the NLV threshold ("that's a solid range") — the chat undermining the roadmap exactly
 * when stakes are highest. On the income slot the reaction is now engine-computed instead: this
 * selector reads the SAME conservative threshold flags the plan uses (income_may_fall_short_*,
 * see core/interview-controller derivations) and decides between an honest heads-up and a neutral
 * acknowledgement. The interview layer maps the result to localized copy; keeping the decision
 * pure lets it be unit-tested next to the derivation it reads.
 */
import { type Profile } from '@/core/interview-controller';

export type IncomeAck =
  | { kind: 'short'; route: 'nlv' | 'dnv'; threshold: number }
  | { kind: 'noted' };

export function incomeAck(p: Profile): IncomeAck {
  const isDnv = p.visa_type === 'dnv';
  const short = isDnv ? p.income_may_fall_short_dnv : p.income_may_fall_short_nlv;
  if (short) {
    const threshold = Number(isDnv ? p.dnv_income_threshold : p.nlv_income_threshold) || 0;
    return { kind: 'short', route: isDnv ? 'dnv' : 'nlv', threshold };
  }
  return { kind: 'noted' };
}
