# STRATEGY.md — multi-stakeholder review (2026-07-03)

A grounded review of Camino's competitive position, growth options, and risks — legal, PR,
and personal. Requested by the user; produced with a repo audit, a live competitive scan,
and the current Spanish political climate. The actionable queue lives in TODO.md (items
6–10); this file keeps the reasoning so future sessions don't re-derive it.

## Position: how unique is Camino?

- **Vs Spain-specific incumbents** ([MovingToSpain.com](https://movingtospain.com/relocation-plans/)
  interactive checklist + budget planner + paid packages; static checklists from
  [SpainGuru](https://spainguru.es/move-to-spain-checklist/),
  [HousingAnywhere](https://housinganywhere.com/Spain/moving-to-spain-checklist), insurance
  affiliates): none personalize by situation, sequence by dependency, re-plan on change, or
  cite the official source per step. Camino's moat is the audited catalog + deterministic
  engine, not prose.
- **Vs AI-immigration startups**: funded activity is US work visas
  ([OpenSphere](https://opensphere.ai/), [Visas.AI](https://visas.ai/),
  [JustiGuide](https://techcrunch.com/2025/11/26/justiguide-wants-to-use-ai-to-help-people-navigate-the-u-s-immigration-system/)),
  lawyer tooling ([Filevine](https://www.filevine.com/platform/immigrationai/),
  [Visalaw](https://www.visalaw.ai/), [Visto](https://visto.ai/) for Canada), or employer-side
  ([Jobbatical](https://www.jobbatical.com/blog/ai-eu-visa-work-permit-processing)).
  Consumer lifestyle-migration to ONE country, done deeply, is an open lane.
- **The real competitor is free**: ChatGPT + Facebook groups. The counter is the thesis
  itself — an LLM can invent a deadline; Camino structurally cannot. That claim must be
  SHOWN (source citations, build log, changelog), not asserted.

## Growth: ranked for a one-person team

1. **Compound the guide SEO**: question-shaped pages ("NLV income requirement 2026",
   "US license driving in Spain", "Beckham law who qualifies") — pure functions of catalog
   data; plus 3–5 persona sample plans (US remote couple, UK retiree, EU family).
2. **Artifacts that travel**: the branded PDF already travels; add a read-only roadmap
   share link (lighter than the cut household sharing) — every share is a landing page.
3. **Communities with gifts, not ads**: FB groups / r/GoingToSpain answered with specific
   sourced guide links. Requires the social share cards (queued) so links unfurl well.
4. **Partnerships**: the 15 mined webinar creators are a warm list (audience, no product).
   MovingToSpain.com is possible but now partly a competitor (paid packages) — pitch is
   "your expertise, our engine."
5. **One launch moment**: Product Hunt / HN — the build-in-open story; for backlinks more
   than users. Prepare the "built in 4 days" pre-emption paragraph BEFORE launch.
6. **Regulatory changelog** (also a product feature — see below): the most linkable thing
   we could publish.

## Uniqueness: what to add

- **Public regulatory changelog** (top pick): publish catalog diffs with sources ("3 Jul —
  NLV threshold updated, BOE link"). Converts maintenance into marketing + trust; feeds the
  weekly email; nobody in the space does it.
- **"Last verified" stamps** per step/guide — honesty as UI, weaponizes freshness.
- **Timeline simulation**: arrive March vs September → school windows + 183-day tax clock
  shift. Cheap on a deterministic engine; impossible for content sites.
- **Region-aware steps** (already queued) — comunidad accuracy where content sites go vague.
- **Move-budget view**: per-obligation official fees → "your move costs ~X" (catalog data,
  invariant 3 applies).
- **Cita checklists**: what to bring per appointment. Unglamorous, high utility, shareable.

## Risks

### Legal (ranked)
1. **App Store blockers (found in this review)**: no in-app **account deletion**
   (guideline 5.1.1(v) — hard rejection for apps with sign-in) and no **privacy policy URL**
   (ASC required field). Plus the DSA trader status (already flagged).
2. **GDPR baseline**: privacy policy naming processors (Supabase, Resend, PostHog, Sentry,
   Anthropic, ElevenLabs — voice + interview text flows explicitly), retention, rights;
   the deletion flow doubles as right-to-erasure. Architecture is already privacy-lean
   (no doc vault, minimal slots, EU hosts for Resend/PostHog).
3. **Cookie/analytics consent**: PostHog + Sentry on EU visitors with no consent. Options:
   banner, or PostHog cookieless mode (fits the brand better — decide deliberately).
4. **LSSI aviso legal** (Spain): operator-identity page once the site has economic purpose.
5. **Reliance harm**: stale catalog entry → missed window. Mitigations: ToS with liability
   cap, last-verified stamps, correction changelog, E&O insurance once there's revenue.
   When gestor referrals start: **disclose compensation**.
6. **Entity/tax hygiene**: Camino under the LLC, not personal. If operating while
   Spain-resident, US-LLC-managed-from-Spain raises PE/autónomo questions → get a gestor
   (the product's own advice, applied; there's a good public story in doing so).
   *Backtest 2026-07-04 — user decision: SOLE PROPRIETOR (own SSN) until a proven revenue
   model, then the US LLC (never a Spanish entity; immigration in progress). Accepted
   trade-offs: personal Google Play account (12-tester closed-test gate), personal-name
   coupling remains. Revisit at first revenue.*
7. **Trademark**: search in software classes before brand spend (crowded word). *Backtest
   2026-07-04 — call held up and user acted early: public brand renamed to **"Get Camino"**
   ("Get Camino: Your Road to Spain") without waiting for an attorney — distinctive compound,
   matches the owned domain getcamino.app, exactly fits ASC's 30-char name limit. Identifiers
   (bundle id, scheme) deliberately unchanged. Full search still due before brand spend.*

### PR
1. **The wrong-date story** is the nightmare scenario. Defense = architecture + process:
   fast correction, published diffs (changelog), never argue.
2. **Hostile climate**: Madrid housing protests (May 2026), "nomads bullied" coverage,
   anti-tourism marches, housing = top political issue before 2027 elections. Position
   Camino as the "move to Spain **properly**" tool — padrón, right visa, right taxes,
   integration-forward Lola. Never market "hack Spain." Tenant-obligation content reads
   well in this climate.
3. **"Built by AI in 4 days"** cuts both ways: the 4 days built plumbing; facts come from
   cited sources through an engine the AI can't touch; the log shows the audits. Have the
   paragraph ready pre-launch.
4. **Breach of migration data** would be outsized: keep the no-vault stance (public),
   minimal data; publish security posture eventually.

### Personal
1. **Bus factor = 1**: credentials to a password manager + trusted second person; second
   admin on Apple/Supabase. One hour against the biggest continuity risk.
2. **Pace**: the 4-day sprint isn't an operating mode. Weekly rhythm (Monday email, weekly
   release train, scheduled feedback triage).
3. **Name coupling**: name/entity/PO box semi-public via repo + ASC — fine, but corrections
   are personal-reputation events; the changelog habit protects the person too.
4. **Upside**: the build log is a standalone case study in AI-native development — writing/
   talking about the method is personal development AND an acquisition channel.

Sources: linked inline; competitive scan + climate scan performed 2026-07-03 via web search.
