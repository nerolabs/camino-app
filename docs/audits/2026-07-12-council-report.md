# Council Report — Get Camino pre-launch cross-functional review

**Date:** 2026-07-12 (night of; some artifacts carry 2026-07-13 stamps from the same session)
**Convened by:** the founder, with this charge (verbatim): *"a fully cross functional group to review in detail everything the app provides… I'd like these people to have almost no context into the app details but understand its purpose — to help strangers, who come from thousands and thousands of combinatory backgrounds, arrive at a trustworthy list of action items, and a living tool that allows people to check through all these tasks to increase their chances to successfully move to Spain. The outcome should be a full council report. I'd especially be interested in a lot of push back on the technology and its reliability."*

**Method:** Five independent commissioners, each launched cold with only the purpose statement and a role brief. All read-only. Tech/Reliability had repo + live-API access (ran the full test suite, probed production endpoints); Legal and PR ran the live product end-to-end as strangers (real interview runs, real free-text probes, decoded a real share link); Marketing reviewed the live site only; Operations reviewed the live site plus the operational docs. No commissioner saw another's report before filing.

**How to read this:** §1 is the synthesis — where independent seats converged, which is where the council believes the truth is. §2 is the consolidated demand list. §3–§7 preserve each commissioner's report in full, unedited. Findings are the commissioners' own; each item needs founder triage before action (a few may be partially stale or need verification against the repo).

---

## §1 Executive summary — where the council converged

**The unanimous headline:** the *engineering* earns trust; the seams around it spend it. Every seat independently rated the core architecture (deterministic engine, sourced catalog, verified stamps, public changelog, data minimization, refusal behavior) as rare-to-unique in the category — several said "better than most funded teams." And every seat located the risk in the same three seams: the Lola chat surface, the freshness treadmill, and the paper/identity around the product. None of the SEV-1/critical findings require touching the engine.

### Convergence 1 — The Lola surface is where the deterministic guarantee leaks (Tech + PR + Legal, independently)
- **Tech (CRITICAL C1):** two of the three LLM write-paths into the profile — plan-page re-model (`app/plan.tsx:196`) and final-note distillation (`app/interview.tsx:554`) — skip the slot-schema validation the interview `extras` path enforces. A hallucinated value writes into the persisted profile the "deterministic" engine runs on. *"The thesis leaking."*
- **PR (SEV 2 ×2):** live run — Lola told a below-NLV-threshold income *"that's a solid range to work with"* (the engine's plan-level warning was correct but twelfth in the list; the chat line is what gets screenshotted). And a "will my DUI block my visa?" free-text got *"Got it — I've saved that"* — appearing to absorb-and-clear a question it never answered.
- **Legal (HIGH #2 + MEDIUM #5):** volunteered health data ("my wife has MS") silently stored, no Art. 9 basis, free-text flowing to analytics per the privacy policy; and the (excellent, observed) refusal behavior is *"an LLM behavior, not a guarantee"* — held by prompt, untested across the five locales. EU AI Act Art. 50 (chatbot must disclose it's AI) bites 2 Aug 2026 — effectively at launch — and nothing in the interview says Lola is an AI.

**Council reading:** the firewall between "LLM phrases" and "engine decides" is the product's whole claim, and it is currently enforced at one of three write surfaces, narrated at zero of them, and contradicted by the chat's tone at the exact moments that matter. One coherent fix package: validate all three write-paths identically (+ regression test); first-bubble AI disclosure; in-chat threshold flags (never praise a failing answer); an honest "I can't assess that — here's the guide / ask the consulate" pattern for stakes questions; a no-health/criminal-details hint at the free-text box; free-text excluded from analytics.

### Convergence 2 — Staleness is the real failure mode, and nothing mechanizes freshness (Ops + Tech + PR + Marketing)
- **Ops (#2):** the verification treadmill (~10–15 focused days/yr + platform churn) has *no forcing function* — no cron flags a stale `verified_at`, no job link-checks the 55+ source URLs (which already rot). *"A stamp that can silently age is worse than no stamp."*
- **Tech (H3):** no automated signal when the world changes; most stamps wear the blanket `2026-07-04` default ("really 'when we last shipped'"); legal numbers are not single-sourced — the €28,800 NLV threshold lives as an engine constant *and* hand-typed prose in two obligation titles, with no test that they agree.
- **PR:** *"The app can't invent numbers or deadlines"* is the #1 most attackable sentence on the site — the first stale figure turns it into "the app that couldn't be wrong, was."
- **Marketing:** the verified stamps + changelog are the moat itself — which raises the cost of any stamp that lies.

**Council reading:** mechanize the alarm, not the work. A scheduled CI job failing on stale `verified_at` and dead `source_url`s; `audit-matrix.ts` wired into CI (Tech M5 — it exists, is fast, and gates nothing today); single-source every legal number with a digits-equal test; two immovable calendar blocks (January budget-law pass; one mid-year full pass); per-rule real stamps instead of the blanket default.

### Convergence 3 — The paper doesn't match the product (Legal + PR + Marketing)
- **Entity:** Terms/Privacy/Aviso legal all name "AELaboratories, Inc" while the public strategy doc records a sole-proprietor decision. Flagged independently by Legal (#4) and PR (SEV 1): if that Inc isn't registered and in good standing, every legal page misidentifies the responsible party — *"one `curl` away from a story."*
- **Assent (Legal #3):** pure browsewrap — no terms acceptance anywhere before the interview. The competently drafted liability language *"is decoration"* until a one-line assent screen exists. Add E&O insurance the same week; for a US operator that's the actual backstop.
- **GDPR (Legal #1, #7):** five EU languages = unambiguous Art. 3(2) targeting, with no Art. 27 EU representative, no lawful-basis mapping, no transfer mechanism, vague retention. Plus share links put exact figures (`foreign_assets_eur: 1000000`) in a query string that lands in server logs and link-preview fetchers — fix is elegant: move the payload to a `#fragment`, which never reaches the server. ~Two days of drafting + one small code change + ~€500–1,500/yr EU-rep service.

### Convergence 4 — The public repo and the unnamed founder are one decision, currently half-made (PR + Marketing + Legal)
- **PR (SEV 1):** `/how-i-was-built` links the public repo, where `STRATEGY.md` hands hostile writers their framing in the founder's own voice (*"honesty as UI, weaponizes freshness"*, the seeding plan, monetization-vs-"No catch", the sole-prop/SSN detail). Build-in-public must be a *deliberate* posture: curate those files out, or pre-frame them loudly on the site. *"Discoverable but unnarrated"* is the worst position.
- **PR (SEV 3) + Marketing (all three personas):** nobody on the site has a name. *"Built in public, anonymously"* is an unstable contradiction; the name is in the repo commits anyway. The retirees seek a human co-sign in their Facebook group; the skeptical spouse's veto stands until "who are you, why is it free, when would you tell me to hire a professional?" are answered on-site. FAQ has zero meta-questions — those four questions *are* the Reddit thread.

### Convergence 5 — Abuse and availability share one lever (Tech + Ops)
- **Tech (H2):** proved live that `/api/lola` is an open unauthenticated Claude proxy honoring a caller-supplied system prompt from plain curl (the origin allowlist is a documented no-op on EAS Hosting). When an abuser drains the daily cap, *legitimate users mid-interview get 429s* — the abuse ceiling and the user-facing failure are the same lever.
- **Ops (#6):** same finding from the cost side; per-token Turnstile (TODO #20) is already designed and queued for "before the public launch moment," which is now. Also: the 200/day global feedback cap silently 429s real feedback on a successful launch day.

### Convergence 6 — Continuity is a single thread (Ops + Tech)
- **Ops (#1, CRITICAL):** bus factor = 1, continuity plan consciously parked "until real money." The system *coasts* through an operator absence — which is the trap: staleness accrues invisibly until a calendar event (domain, card expiry, Apple renewal) kills it. The already-scoped bus-factor hour (password manager + emergency access, second admin on Apple/Supabase, one-page continuity note) should happen before launch, not at revenue. Plus the circular billing loop: Namecheap renewal notices route to an inbox that dies with the domain.
- **Tech (M6):** no documented Supabase backup/PITR policy for the one table holding every user's roadmap; the July grant incident already demonstrated silent data loss, and the fix was an alert, not a backup.

### Findings unique to one seat, council-endorsed
- **Tech H4 — the combinatorics ceiling:** one `work_situation` per household means a dual-career couple gets one visa path; the second adult's route is missing *by omission* — the least visible failure, hitting exactly the combinatorially complex families the purpose statement names. Demand: an honest user-facing scope statement ("we model the primary applicant's route") until the profile is person-structured.
- **Tech M7:** `family_extra_count` counts "children" as one dependent regardless of count — understates the NLV income threshold for larger families under a conservative-warning design that then *fails* to warn them.
- **Legal #6 — the privacy-respecting harm story:** "Prefer not to say" may silently drop Modelo 720 — the most penalty-laden obligation in the domain. Penalty-bearing rules must be included conditionally, never dropped for lack of an answer.
- **Marketing #3 — the German own-goal:** "Damit gehen Sie nach Hause" ("with that, you go home") as the homepage promise, on an emigration product. One native-speaker pass per locale before any paid acquisition; a mistranslation is the cheapest way to falsify "every step verified" in a reader's mind.
- **Marketing #1/#2 — show, don't summarize:** the hero's best move is a real cited, dated step (the artifact already exists on /guide/nie) and an EU/non-EU segmentation line ("EU citizens don't need a visa at all — move first, register once there" is buried in /questions and is the acquisition hook for the entire EU segment). The deterministic-engine line — the single best answer to the AI objection — currently lives in the privacy policy.

### The Tech commissioner's verdict, which the council adopts as its own
*"Would I stake my own move on this today? No — not unsupervised."* But with a named five-item path to yes: validate all three LLM write-paths identically; put audit-matrix in CI; single-source and test the legal numbers; rate-limit the proxy at the edge; write down the honest scope boundary for complex households. *"Do those five and I'd move from 'orienting tool' to 'I'd rely on it, verifying the big-ticket numbers with a gestor.' Until then it is a very good draft that presents itself as a verified answer, and the gap between those two words is exactly where a real person's relocation gets hurt."*

---

## §2 Consolidated council demands

### Before launch (blocking, in rough order of stakes × cheapness)
1. **Entity + assent** — verify/fix "AELaboratories, Inc" on all legal pages; one-line terms-acceptance at interview start and iOS first-run; E&O policy. *(Legal, PR)*
2. **Close the LLM write-path hole** — schema-validate re-model and distillation deltas exactly like the `extras` path; regression test that garbage deltas are rejected field-by-field. *(Tech C1)*
3. **Lola honesty package** — first-bubble AI disclosure (also satisfies AI Act Art. 50); in-chat threshold flags, never praise a failing answer; honest "can't assess" pattern for stakes questions; no-health/criminal-details microcopy; free-text out of analytics; refusal regression tests in all five locales. *(Legal, PR, Tech)*
4. **GDPR drafting pass** — lawful bases, DPF/SCCs, retention, volunteered-sensitive-data paragraph; appoint EU representative; share-link payload from `?d=` to `#fragment`. *(Legal)*
5. **Repo posture decision** — curate `STRATEGY.md`/`HANDOFF.md` out of the public repo, or pre-frame them on-site. No middle state. *(PR)*
6. **Bus-factor hour + billing loop** — credentials with emergency access, second admins, continuity page; Namecheap multi-year + auto-renew with notices to an external mailbox; Sentry alerts to the monitored inbox. *(Ops)*
7. **Freshness mechanized** — CI fails on stale `verified_at` / dead `source_url`; `audit-matrix.ts` as a CI gate; single-source legal numbers with a digits-agree test; real per-rule stamps. *(Ops, Tech)*
8. **Edge rate limit / Turnstile on `/api/lola`** before the marketing moment; alert on budget-429s; raise/alert the 200-day feedback cap. *(Tech, Ops)*
9. **Name + meta-FAQ** — founder name/face on /how-i-was-built and /contact; FAQ answers for who built this / how is it free / future monetization / what happens when you're wrong. *(PR, Marketing)*
10. **Never drop penalty-bearing obligations** on declined answers — include conditionally. *(Legal)*
11. **Scope statement for complex households** until the profile is person-structured; fix `family_extra_count` to a real dependent count or state the limitation. *(Tech)*

### Fast-follow (days-to-weeks, pre-marketing-push)
- Native-speaker pass on all five locales (German first). *(Marketing)*
- Hero: real cited step artifact + EU/non-EU segmentation; deterministic-engine line at the point of AI-doubt. *(Marketing)*
- Soften the absolutes: "can't invent numbers" → the checkable claim; "No catch" → "Free to use — here's how we'll eventually make money →". *(PR)*
- Specific source links per official chip (visible domain), verified stamps on /questions pages. *(PR, Marketing)*
- Housekeeping: `/guides`→`/guide` redirect + branded 404; future-dated changelog rendering (timezone); "27 steps" teaser vs 32 actual; 73 guides vs 78 sitemap URLs; /questions/modelo-720 deep-link routing check; real `<a href>` in footer/nav. *(PR, Marketing)*
- Supabase backup/PITR confirmed + documented; "your data, your exit" note. *(Tech, Ops)*
- Auto-acknowledgment on /contact with honest response time + not-legal-advice framing; weekly triage slot; canned responses. *(Ops)*
- Crisis playbook written now: wrong-fact incident template; reliance-harm statement; "built in 4 days" pre-emption paragraph; monetization announcement pre-drafted; never-disparage-gestores posture. *(PR)*
- Pick the personal-runway number (monthly spend / weekly hours at which something changes); pull one small revenue experiment forward of Phase 7. *(Ops)*
- Web-as-canonical in launch messaging while EU App Store storefronts remain withheld. *(Ops)*

---

## §3 Technology & Reliability — full report

> [Report preserved verbatim as filed.]

I read the engine, the catalog, the interview, all three LLM surfaces, the audit tooling, the test suite (ran it: 263 vitest green, 181×16 matrix green, catalog audit clean), and I probed the live API. The core architecture is genuinely better than most things in this space — the deterministic-engine-over-a-hand-verified-catalog idea is the right idea, and the team clearly knows it. That's exactly why I'm going to be hard on the places where the guarantee leaks, because the polish creates trust the substructure can't fully back.

### CRITICAL

**C1. The trustworthy-list guarantee has an unvalidated LLM write-path into the profile**
The whole thesis (THESIS.md invariant 3) is: the LLM never authors plan items — it only extracts *typed values* the deterministic engine re-derives from. That firewall is real in the interview's chip/`extras` path, which validates every LLM-produced value against the slot schema before accepting it (`app/interview.tsx:428-438` — type-checks bool/date/list/enum, drops anything that doesn't fit).

But two *other* LLM write-paths skip that check entirely:
- **Re-model** (`app/plan.tsx:196`): `const nextProfile = { ...profile, ...changes }; derive(nextProfile)` — `changes` comes straight from Claude via `parseProfileChange` (`lib/plan-coach.ts:83`). No per-field type or enum validation.
- **Final-note distillation** (`app/interview.tsx:554`): `p = { ...p, ...distilled.changes }; derive(p)` — same, from `distillFinalNote`.

So a hallucinated or out-of-enum value ("intends_long_stay": "yes" instead of `true`, a `work_situation` string not in the enum, a malformed `arrival_date`) writes straight into the profile, **persists to the database** (`saveProfileDb`), and flows into the "deterministic" engine as input. The engine is only deterministic *given a clean profile*; here the LLM is allowed to dirty the profile at its input boundary. The determinism guarantee is technically preserved and practically defeated. Worse, the corruption is silent and durable — it survives reloads.

**What goes wrong for a real user:** someone on the /plan page types "we decided to stay short-term after all," the extractor writes a subtly wrong typed value, and their entire visa/tax cluster silently vanishes or mutates — with the app cheerfully narrating "replanned!" There is no test on either path asserting that only schema-valid values reach the profile.
**What I'd demand:** run *both* re-model and distillation deltas through the exact same slot-schema validator the interview `extras` path uses, and add a regression test that a garbage LLM delta is rejected field-by-field.

### HIGH

**H2. `/api/lola` is an open, unauthenticated Claude proxy that honors a caller-supplied system prompt**
I hit it live from a foreign origin with plain curl:
```
POST https://getcamino.app/api/lola {"system":"You are a pirate...","messages":[...]}
→ 200 {"text":"Arrr, here be yer haiku..."}
```
The code documents this honestly (`app/api/lola+api.ts:16-21, 46-50`): on EAS Hosting the Origin header is rewritten, so the origin allowlist is a **no-op in production**, and the OPTIONS/CORS guard only stops *browsers* on other sites — it does nothing against a script. The only real backstops are payload caps and volume limits (`LOLA_GLOBAL_PER_DAY`, set to 25000 in prod). The comment itself admits "a hard global limit would need Cloudflare KV / a WAF rate-limit rule (future)."

**What goes wrong:** this is your single largest variable cost (Anthropic, per-token) sitting behind a per-isolate in-memory counter and a Supabase-backed daily cap. A motivated abuser scripts it as free Claude until the daily cap trips — at which point *legitimate users mid-interview get 429s*. The abuse ceiling and the user-facing failure are the same lever. It's a reliability risk to real users, not just a cost risk.
**What I'd demand:** a real edge rate-limit (Cloudflare WAF/KV or Turnstile — already TODO #20) before any growth push, and a provider-side spend cap that pages before it hard-stops users.

**H3. The catalog-freshness mechanism is one human, manual, and unmonitored — and users can't see how stale their specific rule is**
The product's entire value is "trustworthy." Trust decays because visa/tax rules change. The mechanism keeping the catalog true is: `core/SOURCING.md` says *"Re-verify annually,"* plus whatever the founder happens to catch (the changelog shows genuinely impressive same-day catches — the C. Valenciana 10%→9% cut, Murcia 8%→7.75%). But there is **no automated signal** when a real-world rule changes. Nothing watches BOE, AEAT, or DGT. The `verified_at` stamps default to a single date (`2026-07-04`), so most of the catalog wears one "last verified" date regardless of the underlying rule's volatility.

Concretely, the NLV threshold `28_800` lives as a live engine constant (`interview-controller.ts:353`) *and* as hand-typed strings in two obligation titles (`engine-controller.ts:287,300`); the DNV figures live in a derivation (`:355-356`) and in title prose (`:349,359`). When IPREM or SMI moves with the next national budget, a human has to remember to edit multiple places, and **nothing tests that the constant and the prose agree.** The digit-lint proves a translation didn't change a number — it does *not* prove the number is currently true.

**What goes wrong:** a user in 2027 evidences income against a stale 2026 threshold, books a consulate appointment, and gets refused — having done exactly what the "trustworthy list" told them. The changelog builds trust that the *opposite* failure (silent staleness) then betrays.
**What I'd demand:** (a) single-source every legal number (constant → interpolated into prose, never re-typed), with a test asserting the title's digits equal the constant; (b) per-rule volatility metadata and a real re-verification cadence, not "annually"; (c) surface a genuine per-rule `verified_at` to the user, not a blanket default — a stamp that's really "when we last shipped" reads as more assurance than exists.

**H4. Household combinatorics exceed what the model can represent — mixed families and dual-worker couples are structurally under-served**
The thesis is "model ~100 obligations, combinations generate 10,000 journeys for free." But the *profile* can't express the combinations that matter most for the hardest users:

- **One `work_situation` per household** (`interview-controller.ts:74`, single-select; `visa_type` derived from it at `:278`). A couple where one spouse is a remote employee (DNV) and the other is self-employed (self-employment visa) gets exactly one visa path and one tax cluster. The other person's entire route is missing.
- **Passports are a household SET, not per-person** (`nationalities`, `:64`). The team clearly knows this hurts — the build-37 shred found a US/ES case handed the wrong registration, and the `non_eu_family_member` clarifier (`:129`) is a patch. But it's still one boolean standing in for "who, specifically, needs their own residence process." A non-EU child of EU parents, or a household with three different nationalities, collapses into one EX-19 step that can't be attributed to a person.

The audit matrix (`scripts/audit-matrix.ts`) samples 8 passport sets × 7 work situations × 3 households — real, but it samples a space the *profile itself* can't fully encode. Passing 181 profiles proves the conditions are self-consistent; it doesn't prove the model can represent a real mixed family.

**What goes wrong:** the exact user this product should most help — the combinatorially complex family — gets a roadmap that's confidently wrong by omission for one household member. And omission is the least visible failure mode.
**What I'd demand:** an explicit, user-facing scope statement ("we model the primary applicant's route; a second working adult needs their own plan") until the profile is person-structured — honesty about the boundary, since the UI currently implies whole-household coverage.

### MEDIUM

**M5. The bug class that actually bites (wrong conditions) is guarded by a tool that doesn't run in CI**
CI runs typecheck + `npm run audit` (invariant-2 mechanical audit) + vitest (`ci.yml`). The mechanical audit only proves every `applies_if` field is *askable* — the founder's own late-night engine-audit note says plainly it "can't see" condition-level bugs. The tool that *can* — `scripts/audit-matrix.ts` with its 16 class-level expectations — is **manual-only** ("run it during any catalog/condition work"). The most dangerous, most recently-recurring bug class (a condition that routes the wrong person to the wrong step — five such bugs found in a single day per HANDOFF) is gated by discipline, not by the pipeline.
**What I'd demand:** wire `audit-matrix.ts` into CI. It's fast, deterministic, offline, and already written. There is no reason it isn't a gate.

**M6. Single points of failure: data durability and "what if the product dies" are undocumented**
`docs/PROVIDERS.md` is an unusually good SPOF inventory (it correctly flags domain-expiry as the worst failure and Sentry alert-routing). But two gaps:
- **No backup/PITR policy** anywhere in docs — the user's roadmap lives in one Supabase project (`profileDb.ts` → single `profiles` table). I found no mention of backups, and the free tier's protections are thin. The 2026-07-05 grant incident already caused silent data loss for *every* signed-in user for days; the guard added was an *alert*, not a backup.
- **Product-death exit:** there's a share-link codec and a PDF export, so a user *can* extract a static snapshot — good. But the "living" half (re-flow, check-off) dies with the servers, and nothing tells the user their roadmap is only as durable as one Supabase project on one person's account.
**What I'd demand:** confirm Supabase PITR/backups are on and documented; add a "your data, your exit" note; ensure the domain and the two Supabase billing emails are on the monitored inbox (PROVIDERS.md migration checklist is still unchecked).

**M7. `family_extra_count` and threshold math assume a shape that doesn't match "dependents"**
`nlv_income_threshold = 28_800 + 7_200 * family_extra_count`, where `family_extra_count` is `(has_spouse?1:0)+(has_children?1:0)` (`interview-controller.ts:349-353`). A family with three children counts as **one** dependent for the income threshold. The real NLV requirement scales per dependent person. This under-states the required income for larger families — the conservative-warning design (only warn when the band top can't reach the threshold) means large families are told they qualify when they may not.
**What I'd demand:** capture a dependent *count*, not a boolean, for threshold math; or state the limitation on the step.

### LOW

**L8. LLM coach can drift from the step's grounded facts**
`askLola` (`lib/plan-coach.ts:106`) is instructed not to invent deadlines/costs/laws, but it's a free-text advisory surface with no post-hoc guard that its output stays within the step's grounded content. The instruction is a prompt, not an invariant. Low severity because it's framed as advisory ("a gestor signs the papers"), but a confident hallucinated form number in the coach reads as authoritative as the catalog.

**L9. `parseExtraction` brace-slicing is fragile**
`parseExtraction` (`lib/extractionPrompt.ts:68`) does `slice(indexOf('{'), lastIndexOf('}')+1)`. Any prose containing braces around the JSON breaks parsing → a `clarify` fallback. Fails safe (re-asks), so low — but it's a soft reliability tax on the interview.

### VERDICT — would I stake my own move on this today?

**No — not unsupervised, and not for my situation specifically.** As a *starting checklist* it's better than anything free out there, and I'd genuinely use it to orient. But I would not treat its list as trustworthy-by-construction the way the marketing implies, for three reasons that are load-bearing:

1. **The determinism firewall has a hole (C1).** The one property the entire trust claim rests on — "the LLM never dirties the plan" — is enforced in one of three LLM write-paths and skipped in the other two, straight into persisted state. That's not a papercut; it's the thesis leaking.
2. **Staleness is unmonitored and invisible (H3).** The product's trust ritual (the changelog) advertises fast correction while the more likely failure — a rule that quietly went stale between annual reviews — has no detector and a `verified_at` stamp that overstates freshness. For visa/tax specifically, silent staleness is the failure that actually ends someone's move.
3. **My kind of case is the under-served kind (H4).** A mixed-nationality family or a two-career couple — the users who most need this — hit the profile's representational ceiling, and the failure is by omission, the hardest to notice.

None of these are architecture-fatal. The bones are good and the team's audit reflexes are real (the same-day regional catches are legitimately impressive). Fix C1 (validate all three write-paths identically), gate M5 (put audit-matrix in CI), single-source and test the legal numbers (H3), rate-limit the proxy at the edge (H2), and write down the honest scope boundary for complex households (H4) — do those five and I'd move from "orienting tool" to "I'd rely on it, verifying the big-ticket numbers with a gestor." Until then it is a very good *draft* that presents itself as a *verified* answer, and the gap between those two words is exactly where a real person's relocation gets hurt.

---

## §4 Legal & Compliance — full report

> [Report preserved verbatim as filed.]

**Method.** I experienced the live product as a stranger: homepage (EN/ES/DE/FR/IT), the conversational interview end-to-end including free-text probes, the generated roadmap, the share-link feature (I captured the actual link the Copy button produces), /privacy, /terms, /aviso-legal, /questions and a tax guide, /changelog, /how-i-was-built, /contact. I did not read source code. One caveat: the browser I was given carried prior product state (a dev-personas bar and a resumable session), so my "first-run" observations come from a second, fresh interview I started after state cleared.

**Overall posture.** This product is closer to the safe side of the line than 90% of "AI relocation/immigration" tools I would expect to review. The load-bearing facts in its favor: a deterministic rules engine with the LLM confined to phrasing/extraction (per /how-i-was-built, and consistent with observed behavior); a uniform "Guidance only — not legal or tax advice" footer, translated in all five languages; an aviso legal that expressly says it "is not legal, tax, or immigration advice, and is not a gestoría or law firm"; data minimization by design (bands, "Prefer not to say" options, no document uploads); self-serve deletion; and — decisively — when I posed a real legal-strategy question mid-interview ("I overstayed Schengen by 4 months; should I disclose it?"), Lola refused cleanly: "I can't advise you on visa disclosure strategy. That's a legal question for an immigration lawyer" and offered to resume once I had counsel. That is exactly the right behavior, and it happened unprompted on the live product. The issues below are real, but they are fixable at paper-and-microcopy cost.

### 1. HIGH — GDPR formalities don't match the actual EU targeting
**Observed.** Five languages including ES/DE/FR/IT, Spain-specific content — this is unambiguous Art. 3(2) targeting of EU data subjects. Yet /privacy (last updated 12 July 2026): no Art. 27 EU representative; no lawful-basis mapping ("we honor [GDPR rights] for everyone" is nice but is not an Art. 6 basis); no transfer mechanism — it says providers "process data in the United States" with no SCC/DPF/adequacy language; retention is "while you have an account" with nothing more.
**Legal theory.** Art. 27 (representative), Art. 13 (information duties), Ch. V (transfers). The Art. 27(2) exemption ("occasional" processing) is not available: this is systematic, ongoing collection of nationalities, family shape, income/asset bands from EU users.
**Likelihood.** Low-to-moderate and complaint-driven — but the complainant profile (a German or Spanish user whose visa was denied) is precisely this product's user base, and a US controller with no EU representative is an easy first finding for any DPA that receives one.
**Cheapest adequate mitigation.** One drafting pass on the privacy policy (lawful bases: contract for the roadmap, consent for emails and free-text; DPF and/or SCCs — Anthropic, Supabase, PostHog, Sentry all offer them; concrete retention); appoint an EU-rep service (~€500–1,500/yr). No engineering required.

### 2. HIGH — Special-category data is invited, stored, and (per the policy) analyzed, with no Art. 9 basis
**Observed.** The interview ends with an open prompt ("is there anything else about your move you think I should know?"). I typed that my wife has multiple sclerosis and needs monthly infusions. Response: "Got it — I've saved that with your plan." No warning, no consent, no answer either (good on the advice line, bad on the data line). /privacy is silent on special categories, and separately states interview answer text is used to identify confusing questions (i.e., flows to analytics — PostHog is a named processor). My overstay confession (offence-related data, Art. 10-adjacent) was likewise absorbed silently.
**Legal theory.** Health data volunteered in free text is still Art. 9 data once you store it; "the user typed it unprompted" is not "explicit consent." Routing that text into product analytics makes it worse.
**Likelihood.** Moderate. Free-text fields in a relocation interview will collect illness, disability, criminal-record and asylum details at scale — this is a when, not if.
**Cheapest adequate mitigation.** (a) Microcopy at the free-text box: "No health or criminal-record details, please — Lola doesn't need them and they may be stored." (b) Exclude free-text from analytics events. (c) One privacy-policy paragraph on volunteered sensitive data and its deletion path. All cheap.

### 3. HIGH — The liability shield may not bind anyone: there is no assent mechanism
**Observed.** The interview starts with zero click-through — no "by continuing you agree to the Terms," no checkbox, no account. /terms (NC law, consequential-damages disclaimer expressly covering "missed deadlines, visa outcomes, or tax consequences", EU mandatory-rights carve-out — competently drafted) is reachable only via a footer link the user never has to see.
**Legal theory.** Pure browsewrap. US courts routinely decline to enforce terms nobody assented to (Nguyen v. Barnes & Noble line). The one artifact that stands between a reliance plaintiff and the operator is the artifact most likely to be held unenforceable. Meanwhile the product's own presentation maximizes reliance: "Required," "Due 2 Nov 2026," "1 item carries a financial penalty if missed," "Honest by construction," "Sourced." The stronger the authority signal, the stronger a negligent-misrepresentation theory (Restatement §552) if a stale rule causes a missed deadline — and the changelog candidly documents past wrong rules. That candor is admirable and helps show diligence, but it also concedes a non-zero error rate.
**Likelihood.** Any single suit: low (free product, small damages, diffuse causation). A claim surviving a motion to dismiss because the terms don't bind: realistic. The launch multiplies exposure.
**Cheapest adequate mitigation.** One screen: "By starting, you agree to the Terms. Camino is guidance, not legal or tax advice." at interview start and iOS first-run. Plus a modest media/tech E&O policy — for a US operator this is the actual backstop, not the terms.

### 4. MEDIUM-HIGH — Entity identity must be true
**Observed.** /privacy, /terms, /aviso-legal all say "AELaboratories, Inc, 500 Westover Dr #34489, Sanford, NC" (a mailbox address). My briefing says the operator is a sole proprietor. Both cannot be true. If no such corporation exists in good standing, every legal page misidentifies the responsible party, there is no liability shield at all, and the misstatement itself is exploitable. I cannot verify incorporation from the outside — which is the point: neither can a court, until it matters.
**Mitigation.** Verify/complete the incorporation before launch, or change the pages to the true legal name. Hours, not weeks.

### 5. MEDIUM — UPL / regulated-advice line: currently on the right side, but held there by behavior, not structure
**Assessment.** US: personalized-but-automated self-help from a fixed rules catalog, with conspicuous disclaimers and no representation before any authority, sits in the protected self-help/publisher zone; state UPL enforcement against a Spain-bound tool is a remote risk. Spain: it is not holding itself out as abogado or gestoría (aviso legal says so expressly); intrusismo (art. 403 CP) requires arrogating acts proper to a titled profession — general informational guidance with sources doesn't reach it. The realistic Spanish antagonist is a gestor/lawyer trade association complaint, which the current framing survives. EU AI Act: this is not Annex III high-risk (the migration category targets systems used by authorities), but Art. 50 transparency (chatbot must disclose it's AI) begins applying 2 August 2026 — effectively at launch. Nothing in the interview says Lola is an AI; only the privacy policy does. The refusal behavior I observed is excellent but is an LLM behavior, not a guarantee — and I could only test it in English.
**Mitigation.** (a) First interview bubble: "I'm Lola, an AI assistant. This is guidance, not legal advice." — solves Art. 50 and strengthens the UPL posture in one line. (b) Regression-test the refusal pattern (overstay, disclosure strategy, asylum, tax evasion) in all five languages. (c) Per-step microcopy on dated items: "confirm with your consulate — dates are estimates."

### 6. MEDIUM — "Prefer not to say" may silently drop penalty-bearing obligations
**Observed.** The interview handles declined answers gracefully ("No worries—privacy first... Your roadmap will adjust accordingly"). But the roadmap presents itself as complete ("25 total steps · 15 required · 1 penalty risk"). If a user declines the foreign-assets question and the plan therefore omits Modelo 720 — the single most penalty-laden trap in this domain, and the product's own guide says "skipping it carries real penalties" — the worst realistic harm story writes itself: the product's privacy-respecting design causes the omission. I could not fully verify the downstream behavior from outside.
**Mitigation.** Never drop a penalty-bearing rule for lack of an answer; include it conditionally ("If your foreign assets exceed €50,000...").

### 7. MEDIUM — Share link encodes detailed personal data in a URL query string
**Observed.** The Copy-link button produces `https://getcamino.app/shared?d=<base64-JSON>`. Decoded, the payload of the test persona included `"nationalities":["US","ES"]`, `"has_children":true`, `"partner_is_married":true`, `"arrival_date":"2026-07-12"`, and notably `"foreign_assets_eur":1000000` — an exact figure, not a band. The modal is honest ("The link itself encodes your answers... never your notes. Share it only with people you'd tell those things to") and notes are excluded — good faith is evident. But query strings land in server logs (EAS/Cloudflare), browser histories, and messaging-app link-preview fetchers; the modal says "nationalities, dates, plans" and does not mention asset figures; and /privacy doesn't mention the feature at all.
**Mitigation.** Move the payload to a `#fragment` (never transmitted to the server) — likely a one-line change given the architecture; mention financial details in the modal; add the feature to the privacy policy.

### 8. LOW-MEDIUM — Legal pages are English-only beneath localized chrome
**Observed.** /fr/privacy renders a French shell around an English policy with "Les pages légales sont fournies en anglais ; la version anglaise fait foi." Marketing in five languages while legal terms bind only in English is a GDPR Art. 12 transparency weakness and a classic unfair-terms/transparency vulnerability for EU consumers (and the "English prevails" clause won't defeat Rome I Art. 6 mandatory protections — which the terms themselves concede).
**Mitigation:** translate at minimum the "short version" summary blocks and the disclaimer into the four other languages; keep English as the full authoritative text.

### 9. LOW — Assorted
- **DSA:** Camino hosts no third-party content and is no marketplace; "online platform"/trader-traceability obligations do not apply. Non-issue.
- **Digital Content Directive:** "free" doesn't exempt it — EU users pay with personal data, so statutory conformity duties attach; the EU carve-out in /terms is the right hedge.
- **Age:** no minimum age or children's statement anywhere. Actual risk trivial (product self-selects adults), but add "18+" to the terms — one sentence.
- **App Store:** the privacy nutrition label must disclose free-text/health-adjacent collection honestly, and Apple reviewers do read "not legal advice" claims for medical/legal categories; the in-app account deletion requirement is already met. Low risk if the label is filled truthfully.
- **FTC Section 5:** "Honest by construction" / "Sourced" are substantiated by the public changelog and verification process; keep it that way — those claims are now warranties in the colloquial sense and exhibits in the legal one.

### The three things I would insist on before launch
1. **Make the paper real: entity and assent.** Confirm AELaboratories, Inc actually exists in good standing (or fix every legal page), and put a one-line terms acceptance in front of the interview and the iOS first-run. Until then, the well-drafted liability language is decoration. Add an E&O policy the same week.
2. **Close the GDPR gap that engineering can't excuse.** EU representative; lawful bases, transfer mechanism (DPF/SCCs), and retention in the policy; free-text excluded from analytics; a "no health/criminal details" hint at the open text box; share-link payload out of the query string. This is roughly two days of drafting and one small code change, and it removes the entire category of "US company ignoring GDPR while targeting five EU languages."
3. **Disclose the AI and pin the advice line in all five languages.** "I'm Lola, an AI assistant — guidance, not legal advice" as the first interview message (this also satisfies EU AI Act Art. 50, which bites on 2 Aug 2026, i.e., immediately), plus regression tests that the refusal behavior I observed in English holds in ES/DE/FR/IT — and a rule that penalty-bearing obligations are never silently dropped when a user declines to answer.

**Blunt closing.** The bones here are unusually good: deterministic engine, sourced catalog, real refusal behavior, honest changelog, minimal data. What's missing is almost entirely paperwork and one product reflex — the product currently behaves better than its legal file reads. That is the reversible kind of problem. Launch without fixing items 1–3 and the first viral "Camino told my family X" story meets an unenforceable disclaimer, an unverifiable entity, and a DPA complaint with no EU representative to receive it.

---

## §5 PR & Public Trust — full report

> [Report preserved verbatim as filed. Note: this commissioner's interview ran in the founder's own browser profile, so a staff-only "Dev personas" strip was visible; verified as `isStaff`-gated and invisible to strangers.]

### Executive verdict
This product is closer to defensible than almost anything in its category — the changelog of admitted mistakes, per-step "Facts last verified" stamps, and the deterministic-engine story are genuinely rare and will survive scrutiny. But the biggest threats are self-inflicted and sit in exactly the places the product points journalists toward: the public repo it proudly links, and the gap between Lola's chat tone and the engine's actual findings. The trust architecture is real; the trust *narration* has three or four loaded guns lying around.

### SEV 1 — The public repo hands hostile writers their framing
`/how-i-was-built` links to `github.com/nerolabs/camino-app`, which is public and contains `docs/STRATEGY.md` and `HANDOFF.md`. The strategy doc, in the founder's own voice, reframes every trust feature as a growth tactic:
- *"'Last verified' stamps per step/guide — honesty as UI, weaponizes freshness."*
- *"Public regulatory changelog… Converts maintenance into marketing + trust."*
- *"Communities with gifts, not ads"* — the Reddit/FB seeding plan, next to the record of a post already auto-removed as self-promo.
- *"The wrong-date story is the nightmare scenario. Defense = architecture + process."*
- *"When gestor referrals start: disclose compensation"* — a monetization plan, while the homepage says "100% free. No catch."
- Personal detail: the decision to run as *"SOLE PROPRIETOR (own SSN)"*, PO box, name coupling.

The headline writes itself: *"The 'honest' immigration app whose founder called honesty 'UI'."* Build-in-public is the thesis, so this is a decision, not an accident — but it must be a *deliberate* decision. Either curate these files out of the public repo, or own them loudly (link the strategy doc yourself and pre-frame it: "yes, trust features are also our growth strategy — that's the point, the incentives align"). The worst position is the current one: discoverable but unnarrated.

### SEV 1 — The legal entity doesn't match the founder's own public record
Terms and Aviso legal name **"AELaboratories, Inc"** (Sanford, NC). The public `STRATEGY.md` records the July 4 decision: sole proprietor *"until a proven revenue model, then the US LLC."* Inc ≠ LLC ≠ sole proprietor. If "AELaboratories, Inc" is not a registered corporation, the site's legal pages name an entity that doesn't exist — one `curl` away from *"free immigration app's terms cite a fictitious company."* Fix the terms to match reality before an App Store reviewer or journalist does the lookup.

### SEV 2 — Lola congratulates answers the engine is about to flag
I chose income **€20k–€28k** — below the NLV's €28,800 requirement. Lola's response: *"Got it — that's a solid range to work with."* The generated plan **did** include a warning — *"Heads-up: your income band looks below the NLV requirement… Review how you'll evidence sufficient passive means"* — which is excellent and the single best defensibility artifact I found. But it's tagged merely "Recommended," sits twelfth in the list, and the chat line is what gets screenshotted. The engine caught it; the mouth undermined it. The flag belongs *in the chat, at the moment of answer*.

### SEV 2 — Direct questions with real stakes get silently swallowed
Final free-text: *"I had a DUI conviction six years ago — will that block my visa?"* Response: *"Got it — I've saved that with your plan. That's everything I need."* No answer, no "I can't assess individual cases — here's the criminal-record-check guide, and this is a question for the consulate/a lawyer." The plan showed no visible trace of it. A user reasonably concludes the app *considered* the DUI and cleared them. Not answering is defensible; *appearing to absorb* the question is not. This is the "family relied on the app" fact pattern in miniature.

### SEV 3 — Nobody on the site has a name
"How I was built" is first-person singular ("my wife — a former QA engineer") but unnamed. Contact page: no person. In expat communities, "who's behind this?" is the first comment, and anonymity + AI + immigration is folklore fuel. The name is one click away in the repo commits anyway — own it on-site. A face and a name are the cheapest trust asset available and the product has bought everything except this.

### SEV 3 — The citation promise is bigger than the citation UI
Homepage: *"27 steps, dated, each official one citing its government source — check everything yourself."* The step modal delivers an "official ↗" chip, a "Facts last verified 4 Jul 2026 · changelog" stamp — good — plus this generic line: *"Verified against an official government source (AEAT, extranjería, BOE)."* Naming three institutions in parentheses reads like a trust costume to exactly the skeptic this page is for. Every official chip must land on the specific rule, not a portal homepage, and the generic sentence should name the one actual source. Also: FAQ answer pages carry no verified stamps or sources at all, while making factual claims (€28,800, etc.) — inconsistent with the promise.

### SEV 4 — Polish items with outsized screenshot risk
- Changelog entries dated **13 July 2026** viewed on 12 July (timezone rendering, presumably) — "the accuracy app dates its corrections in the future."
- `/guides` (plural) 404s with dev-flavored copy: *"This screen doesn't exist."* The real route is `/guide`. Add the redirect and a branded 404.
- Footer/nav links aren't real `<a href>` in served HTML (JS navigation) — hurts crawlers, breaks middle-click; the sitemap papers over it.
- The FAQ has zero meta-questions: no "Who built this?", "How is it free?", "How will it make money?", "What if you're wrong?". Those four questions are the entire Reddit thread; answer them before Reddit asks.

### Crisis stress tests
**Headline 1: "Retired couple's Spanish visa refused after free AI app called their too-low income 'a solid range'" — Defensibility: B−.** The public record is strong on paper: a dated warning step existed in their plan, "Guidance only" on every page, terms explicitly disclaim outcomes, a changelog proving a correction culture. But the story runs on the chat transcript, and the transcript says "solid range." The defense requires explaining that a "Recommended"-tagged item twelve rows down outranks what the assistant *said* — that's losing on television. Fix the in-chat flag and this becomes an **A−**.

**Headline 2: "One man, an AI, and a playbook that calls honesty 'UI': the app telling thousands how to immigrate" — Defensibility: C+ today.** The build pages are a real asset — *"the LLM appears at exactly two surfaces," "no LLM decides your deadlines,"* 200+ tests, audits that "found real problems" and said so. But the same repo serves the journalist their thesis, their quotes, a seeding strategy with a prior auto-removal, an entity mismatch, and the founder's identity — all discoverable, none pre-framed. With the repo curated *or* explicitly owned, plus a name on the site, this rises to **B+**, because the underlying story ("AI typed; sources and a deterministic engine decide; here are our mistakes, dated") is actually the best version of the AI-built narrative anyone in this space has.

### The AI angle: asset or liability?
Asset — conditionally. *"AI collapses the cost of typing, not the cost of being wrong"* is the best sentence on the entire property and should be closer to the homepage. The two-surfaces claim is concrete, checkable, and disarms the standard "hallucinating immigration advice" attack better than any disclaimer. The condition: it needs a named human standing in front of it, and the "built in 4 days" pre-emption paragraph must exist *before* launch, because Hacker News will do that math in the first hour.

### Community dynamics
Friction sources, in order: (1) paid relocation consultants, who will attack accuracy because "free" attacks their livelihood — "no catch" is a declaration of war they'll happily return the moment a referral fee appears; (2) FB-group admins whose folklore the catalog contradicts — the sourced-link-per-answer style is the right weapon, and the never-argue, changelog-as-response posture is correct; (3) the anti-nomad political climate — the "move properly: padrón, right visa, right taxes" positioning is exactly right and should be more visible in public copy.

### The three most attackable sentences
1. **"The app can't invent numbers or deadlines."** (homepage) — an absolute. The first stale figure — and the changelog proves figures go stale — becomes "the app that couldn't be wrong, was." Rephrase toward the checkable claim: nothing enters a plan without a cited source, and here's the dated record of every fix.
2. **"Got it — that's a solid range to work with."** (Lola, to income that fails the NLV requirement) — the screenshot that starts the thread.
3. **"100% free. No catch."** (homepage) — with a public doc planning compensated gestor referrals, this is a future-hypocrisy story already in the can. "Free to use. Here's how we'll eventually make money →" is stronger *and* more on-brand.

### Fix BEFORE launch
1. Resolve the AELaboratories, Inc / sole-proprietor mismatch in Terms + Aviso legal.
2. Decide the repo posture: remove STRATEGY.md/HANDOFF.md from the public repo, or pre-frame them on the site. No middle state.
3. Move threshold warnings into the chat at answer time; never let Lola praise a failing answer.
4. Give free-text stakes questions an honest reply: "I can't assess that — here's the relevant guide; this one needs the consulate or a lawyer."
5. Put a name and face on /how-i-was-built and /contact.
6. Add FAQ meta-questions: who built this, how is it free, future monetization, what happens when you're wrong (link changelog).
7. Make every "official" chip land on the specific source; replace the generic "(AEAT, extranjería, BOE)" line; add verified stamps to FAQ pages.
8. `/guides` → `/guide` redirect, branded 404, fix future-dated changelog rendering, soften "The app can't invent…" and "No catch."

### Prepare FOR after (playbook, written now, used later)
1. The "built in 4 days" pre-emption paragraph (plumbing vs. facts) — publish with launch.
2. A wrong-fact incident template: acknowledge < 24h, changelog entry with source diff, personal note, never argue. Rehearse it on the next real correction.
3. A "someone relied on us and was harmed" statement: sympathy first, the plan's warning record second, disclaimers a distant third.
4. A standing two-sentence reply for "it's just ChatGPT" and "who are you to give immigration advice" comments, ending in a sourced link.
5. Monetization announcement drafted before the first referral euro: what changed, what's disclosed, what stays free.
6. A consultant-attack posture: never disparage gestores — the product already tells users to hire them; make that the whole answer.

The uncomfortable summary: the engineering earns trust; the packaging occasionally spends it. Every SEV 1–2 item above is fixable in days, and none require touching the engine.

---

## §6 Marketing & Positioning — full report

> [Report preserved verbatim as filed. Live site only; interview not submitted (read-only mandate).]

### 1. The five-second test
Hero: **"Moving to Spain" / "Your move to Spain, planned in one short interview."** CTA: **"Build my free roadmap →"** with small print **"Free · Takes about 3 minutes · No account needed to start."**

What lands in five seconds: what it is (a plan), what it costs (nothing), what it demands (3 minutes, no account). That's genuinely rare clarity. I would not bounce; the friction disclosure next to the CTA is the best line on the page.

What's ambiguous:
- **"Moving to Spain" is a category label, not a claim.** Nothing in the hero says *why this beats the Facebook group I'm already in*.
- **Who is behind this?** Nothing above the fold. "Honest by construction — the app can't invent numbers" is engineer-speak — answering an objection the stranger hasn't formed yet, and planting the AI-hallucination worry before they'd have had it.
- **"Lola's first question is waiting"** — a naming reveal without a setup. Who is Lola? A person? A bot?

Feel: clean, honest, slightly nerdy. Bounce risk is not confusion; it's *insufficient reason to prefer*.

### 2. Three strangers walk in

**A. The anxious American retirees (62, NLV, consultant-comparers).** The Susan & Tom sample plan is almost a direct-mail letter to this exact couple — 32 steps, real dates, the criminal-record 90-day window, the $28,800 threshold with the formula. The single strongest conversion asset on the site for this persona, and it is one click too deep — a text link, not the hero. What loses them: (1) no human anywhere — they're comparing against a consultant who gets on Zoom; an unnamed builder + an AI is a hard sell at 62; (2) the AI reveal — the right counter-argument (deterministic engine, AI only phrases questions) lives in the *privacy policy*; (3) "Guidance only — not legal or tax advice" lands as *you're on your own* without a companion sentence about what the tool IS reliable for. Where they drop: at the moment of commitment — they'll screenshot the sample plan and take it to their Facebook group to ask "is this legit?", because the site gives them no name, no credential, no third-party signal to skip that step.

**B. The German remote worker (31, EU, "it's easy").** This persona is an EU citizen; the nearest sample persona (Maya, digital-nomad) is a *Canadian* on a DNV — wrong plan. Nothing on the homepage says "EU citizen? Your list is different and shorter — but not empty." That sentence — buried in /questions — is the acquisition line for the entire EU market. What converts this persona: one specific scary thing they'd have missed (Beckham Law's ~6-month filing window is that thing; it's currently buried inside a sample plan). What loses them: the German localization. "**Damit gehen Sie nach Hause**" for "You leave with this" literally reads "with that, you go home" — for an emigration product, unintentionally comic and an instant machine-translation signal. This persona is most likely to read in German and most likely to equate sloppy German with sloppy visa data. Where they drop: the German homepage (translation smell), or after bookmarking-not-using because nothing forces the realization that *their* combination is non-obvious.

**C. The skeptical spouse (looking for reasons to say no).** Reads the footer first. Finds: a genuinely disarming privacy policy (cookieless, named subprocessors, delete-anytime, and the best trust copy on the site — "every date is computed by our own deterministic engine — not by AI"); a changelog that is the sleeper asset ("RULES CHANGE. WE SAY SO" — a skeptic reads admitted mistakes and concludes someone is actually maintaining this); a how-i-was-built page that is double-edged (specific, human, believable — but the compressed timeline reads as "a week-old app is telling my family when to file taxes," and the builder is unnamed, converting "built in public" into a contradiction). One flag: an entry dated 13 July 2026 viewed on 12 July — exactly the detail this persona uses to dismiss everything else. They don't drop; they *veto*: "It's free, it's anonymous, it was built by an AI in a week, and it disclaims all advice — why are we trusting it over a gestor?" The site has no page answering "when should you NOT use Camino" — paradoxically, that page would be the strongest trust page on the site for this persona.

### 3. Promise audit
| Promise (verbatim) | Observed | Verdict |
|---|---|---|
| "Takes about 3 minutes" | Unverifiable from outside (client-rendered interview). Sample plans consistent. | Keep only if true at p50, not best-case. |
| "Free" / "100% kostenlos. Ohne Haken." | No paywall or upsell on 12 pages. | Holds — but nothing explains *how* it's free. |
| "No account needed to start" | "to start" is doing quiet work; accounts exist for saving. | Technically honest; reads as bait-and-switch if the account wall arrives right after the interview. Say upfront what requires an account. |
| "Every official step cites its government source" | /guide/nie cites categories ("AEAT, extranjería, BOE") with a generic "View the official source ↗" — domain not visible. | Half-delivered in presentation. Make the actual domain visible so "check everything yourself" is a one-glance action. |
| "Verified… Last verified 4 Jul 2026" | Present, recent. | Holds — best-in-class if consistent across all guides. |
| "Explore all 73 guides" | Guide index shows 73; sitemap contains **78** /guide/ URLs. | Minor discrepancy — orphaned guides or stale count (the homepage was already burned once on a hardcoded count). |
| "Cookieless" | Stated with mechanism. | Holds, and is a differentiator — currently buried. |
| "The app can't invent numbers or deadlines" | Backed by deterministic-engine claim in privacy + build pages. | Holds, but the proof lives three clicks from the claim. |
| "27 steps, dated…" (homepage teaser) | Actual sample plan = 32 steps. | Trivial, but this site's brand is precision. Sync the numbers. |

### 4. Positioning & differentiation
The defensible claim is not "personalized roadmap" (any GPT wrapper claims that). It's the stack of: *deterministic engine + per-step government citations + visible last-verified dates + a public changelog that admits corrections*. No consultant publishes a changelog. No Facebook group has verification dates. No chatbot can say "the app can't invent numbers." **That is the moat, and the homepage leads with the weakest part of it** (the abstract "Honest by construction") instead of the concrete artifact.

- **vs. paid consultants:** win on price and transparency, lose on accountability and hand-holding. Position as *the thing you do before (or instead of) paying €2,000*, and be explicit about when a professional is still needed.
- **vs. gestores:** same, plus Camino is in the user's language before they speak Spanish. Underplayed.
- **vs. Facebook/Reddit:** the real competitor. "Every answer in your expat group is somebody's memory of a rule that may have changed. Every step here has a source and a verification date" — that's the fight to pick, and no page picks it.
- **vs. government sites:** you're the sequencer. "The rules are all public. The order is the product."
- **vs. ChatGPT:** "The app can't invent numbers or deadlines" is the whole pitch. Currently one bullet among four.

**The AI-built story:** an asset for press/dev-Twitter/Product Hunt; a net **liability** in the conversion path for personas A and C. The architecture resolves the collision, but the resolution lives in the privacy policy. Invert the framing: lead with *"no AI decides your deadlines"* and let "how I was built" be the depth. Also: "built in public" while the builder is unnamed is an unstable position — pick one.

**Is "free" believable?** For the German, yes. For the retirees, no — free + anonymous + AI triggers "am I the product." The privacy policy answers the data half superbly; no page answers the money half. One footer sentence closes the loop.

### 5. Top 5 conversion improvements (ranked by impact)
1. **Put a real, cited, dated step in the hero.** The artifact already exists on /guide/nie; the trust section's four abstract emoji-bullets convert nobody.
2. **Segment the hero by the one question that changes everything: EU or not.** Two buttons or one EU hook line; opens the entire EU segment.
3. **Fix the German localization before spending a euro on German acquisition.** One native-speaker pass per locale.
4. **Move the deterministic-engine claim from the privacy policy to the point of AI-doubt** ("AI asks the questions. It never decides your deadlines."), and name the founder.
5. **Add "the catch" and "when you still need a professional"** — three sentences answering the last two objections standing.

*(Housekeeping: "27 steps" vs 32; 73 vs 78 sitemap guide URLs; future-dated changelog entry; /questions/modelo-720 appeared to render the generic "Do I need a visa?" answer — check deep-link routing; visible government domains on source links.)*

### Verdict
The retirees come back a second day — but via their Facebook group, not directly; give them a name, a "how it's free," and visible source links and they come back on their own. The German comes back only if they hit the "didn't know that" moment before bouncing off the machine-translated homepage — currently a coin flip. The skeptical spouse is, unusually, the most winnable: the changelog and privacy policy are the most trust-generating pages on the site and they're exactly where a skeptic looks — but the veto stands until someone answers "who are you, why is it free, and when would you tell me to hire a professional instead?" The honesty infrastructure is genuinely differentiated; the marketing keeps summarizing it instead of showing it, and buries its best evidence in the footer.

---

## §7 Operations & Sustainability — full report

> [Report preserved verbatim as filed. Sources: live site, docs/PROVIDERS.md, docs/MONITORING.md, docs/STRATEGY.md, core/SOURCING.md, TODO.md, HANDOFF.md.]

### Summary judgment
This is one of the best-documented one-person operations I've reviewed: the provider map is evidence-based, monitoring is laptop-independent, deploys are test-gated, and the sourcing log shows genuine verification discipline (it has caught real regulator changes secondhand sources missed). The architecture is also cheap to run: the cost physics do not threaten this product.

What threatens it is that **every load-bearing process is a discipline, not a mechanism**. The verification cadence, the support response, the renewal calendar, and continuity itself all depend on one person's continued engagement — and the operation's own documents show the continuity plan being consciously deferred. For a product whose entire pitch is *trustworthiness*, the gap between "trustworthy today" and "trustworthy in 14 months" is the whole review.

### 1. Bus factor = 1, continuity plan explicitly parked — CRITICAL × moderate
STRATEGY.md Personal risk #1 names the fix; TODO item 31 parks it "until real money." Every account sits behind one person's logins and 2FA devices. No second admin anywhere. **Failure story:** the operator is hospitalized in September. The system *coasts* — that's the trap. Support goes silent, a Sentry incident goes unseen, and then a calendar event lands (Apple renewal, card expiry, Namecheap renewal) and the app is pulled or the domain dies, with no one able even to post a status notice. **Mitigation:** the already-scoped one hour, done before submission: credentials in a password manager with emergency access; second admin on Apple and Supabase; a one-page "if I'm unreachable for 30 days" note. ~1 hour, $0. The single highest-leverage item in the whole review.

### 2. The verification treadmill has no forcing function — HIGH × high (12–18 months)
73 obligations (55+ official with source URLs), a 19-territory regional table, derivation lists like the DGT countries. The DGT list was materially wrong (6 countries falsely promised an exchange, 13 falsely sent to the exam) until the 2026-07-13 audit — proof errors sit silently until someone chooses to look. **Workload:** ~10–15 focused days/year of verification + 1–2 weeks/year platform treadmill + daily support. Sustainable for a motivated operator; nothing enforces it through an unmotivated one — no cron flags a stale `verified_at`, no job link-checks the source URLs (which already rot). **Failure story:** the January 2027 budget law moves IPREM; the app confidently shows €28,800 with a "Verified 2026-07-04" stamp; a user budgets to it and gets a consulate rejection — the nightmare scenario, with the stamps as the exhibit against it. **Mitigation:** monthly CI job failing on stale stamps and dead URLs, emailing a checklist; two immovable calendar blocks (early January; mid-year).

### 3. Circular dependency in the billing/renewal plan — HIGH × low-moderate
All billing/renewal email routes to andrew@getcamino.app — an address whose MX dies with the getcamino.app domain at Namecheap. Namecheap's own dunning emails would go to the inbox its failure kills. **Mitigation:** auto-renew on, register 2–3 years upfront (~$30), WHOIS/renewal contacts to an external mailbox; Google Workspace billing contact likewise external.

### 4. Support: one silent inbox meeting visa panic — MODERATE-HIGH × certain at launch
/contact → /api/feedback → one inbox. Rate-limited (5/min/IP, 200/day global — a successful launch day silently 429s real feedback). No auto-acknowledgment, no stated response time, no not-legal-advice framing at the point of contact. **Failure story:** launch week brings 30 messages; ten are "my appointment is Tuesday"; the first App Store review says "emailed twice, silence — don't trust it with your move." The trust product is damaged by *unresponsiveness*, not wrong data. **Mitigation:** honest auto-reply (one person, N-day typical reply, not legal advice, urgent → consulate/gestor, links to /questions and /changelog); weekly triage slot; five canned responses; raise/alert the 200-day cap.

### 5. App Store reality: Spain withheld; sole-prop fragility — HIGH for the core market × currently realized
The trader (DSA) declaration is blocked on an open Apple identity case; **EU storefronts — including Spain — stay withheld until it resolves.** A move-to-Spain app that Spain-resident and EU users cannot download is a material launch defect with no ETA under the operator's control. Plus: manual release, expected rejection cycle, annual forced-rebuild treadmill, $99/yr personal membership, and sole-proprietor exposure — one Apple account-standing decision removes the iOS channel. **Mitigation:** treat the web app as the canonical product in all launch messaging until EU storefronts open (it's the stronger surface anyway: five languages, no gatekeeper); weekly cadence on the Apple case; calendar the renewal independently.

### 6. Anthropic single-vendor + free-product abuse = denial of service, not cost blowout — MODERATE × moderate
Degradation is partial by design (chip answers are zero-LLM). The abuse posture is documented and mostly sound, but TODO #20's own analysis stands: a rotating-IP abuser can drain the 25k daily budget and 429 every real user — and the Turnstile per-token fix is queued for "before the public launch moment," which is now. **Cost math (Haiku $1/$5 per MTok):** a Lola call ≈ $0.002–0.005; an interview a few cents; 10k users/month ≈ low hundreds of dollars; worst-case capped day ≈ $100. "Free" is an availability risk and a quiet personal-wallet drain, not existential. **Mitigation:** per-token Turnstile before the marketing moment; Sentry alert when budget-429s fire.

### 7. Cost/revenue physics: it dies of attention, not of cost — LOW-MODERATE × certain
Fixed base ≈ $40–60/month. At 10k users/month: Anthropic low hundreds; Resend exits its free tier at ~750 weekly-roundup subscribers (~$20/mo); PostHog holds to ~30k users; Supabase free tier holds (watch staging inactivity-pausing). Total at 10k users: **$200–700/month, 100% personal outflow, $0 revenue**, with monetization parked behind a circular "at revenue" condition. The ceiling isn't infrastructure; it's how long one person funds and staffs a free public utility. **Mitigation:** pick the number now (monthly spend and weekly hours at which something changes); pull one small revenue experiment (disclosed gestor referral or tip jar) forward of Phase 7.

### 8. Vendor concentration beyond Anthropic — MODERATE × low
The deep concentration is **Expo/EAS**: hosting, API routes, builds, env vars, and the serving edge (Cloudflare on *Expo's* account). API routes are written against EAS-Workers quirks, so migration is days of porting, not a DNS flip. Supabase holds the stickiest data. One open gap: **Sentry alerts still route to member emails, not the monitored inbox** — the pager isn't fully wired. Mitigations in order: finish Sentry alert routing (minutes); monthly Supabase backup pulled off-platform; a half-page cold-restore runbook noting the public repo is the recovery seed.

### What a 30-day operator absence looks like
Days 1–3: support goes silent. Week 1: new Sentry issues sit unhandled; site, interviews, weekly emails keep running (genuinely good). Weeks 2–4: nothing visibly degrades — which is exactly the danger, because staleness accrues invisibly and the stamps keep asserting freshness that no longer exists. The first *hard* failure is calendar-driven or regulatory. A user in month two experiences a polished, responsive app that is quietly becoming wrong, with a support channel that never answers.

### Three operational commitments to demand before launch
1. **Do the bus-factor hour now — reverse the "at revenue" deferral.** Launch does not proceed while the only person who can post "we're having problems" is also the single point of failure.
2. **Mechanize the trust promise.** CI fails on stale `verified_at` and dead `source_url`s; two immovable calendar blocks. The stamps must be driven by real re-verification dates — or be removed. A stamp that can silently age is worse than no stamp.
3. **Set the stranger contract before strangers arrive.** Honest auto-acknowledgment + weekly triage; break the circular billing loop; per-token Turnstile live before the marketing moment.

The blunt close: the product's data discipline is better than most funded teams'. The operation around it is a well-documented single thread. Every risk above is cheap to mitigate *this week* and expensive to discover in month six — the founder has already written down most of them; the only real finding is that writing them down was treated as handling them.

---

*End of council report. All findings await founder triage; none have been actioned. The council notes with some irony that its strongest unanimous finding — that written-down risks were treated as handled — now applies to this document.*
