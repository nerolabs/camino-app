# App Store submission prep — Camino

Everything drafted for the public iOS listing (ASC App ID **6786412055**). Copy is ready for your
review/edit; items marked **[YOU]** need your hand (assets, decisions, the submit button).

## ⚠️ One likely blocker to resolve first: Sign in with Apple

**App Review Guideline 4.8:** apps that use a third-party login (we use Google via Supabase) must
also offer an equivalent privacy-focused option — in practice, **Sign in with Apple**. TestFlight
doesn't enforce it; public review usually does.

- Supabase supports Apple as an OAuth provider (native flow via `expo-apple-authentication` +
  `signInWithIdToken`, web via OAuth redirect).
- Estimated work: a session (provider config in Supabase + Apple capability + a second button in
  the auth UI + on-device verify). **Recommend doing this before submitting** rather than risking
  a rejection cycle.
- Alternative reading: since browsing + the full interview work **without any account**, one can
  argue login is optional-feature-only… but 4.8 is enforced inconsistently and a rejection costs
  a week. Build it.

## Metadata (drafts — edit freely)

- **Name (30 chars max):** `Camino: Your Road to Spain`
- **Subtitle (30 chars):** `Your Spain move, in order`
- **Category:** Travel (primary) · Lifestyle (secondary)
- **Promotional text (170 chars, editable without review):**
  `Moving to Spain? Camino turns your situation into a step-by-step roadmap — real requirements, real deadlines, in the right order — with Lola guiding you the whole way.`
- **Keywords (100 chars, comma-separated, no spaces needed):**
  `spain,move abroad,relocation,visa,NIE,expat,digital nomad,retire,NLV,residency,padron,checklist`
- **Support URL:** https://getcamino.app/how-it-works
- **Marketing URL:** https://getcamino.app

**Description (4000 chars max) — draft:**

> Moving to Spain is a hundred small steps — visa before flight, padrón before residency,
> residency before the health card — and they only work in the right order.
>
> Camino turns YOUR situation into a personal, deadline-aware roadmap. Answer a few questions in
> a short conversation with Lola, our warm relocation guide, and get a sequenced plan built from
> real requirements: which visa path fits, which documents to apostille, when the padrón, NIE and
> TIE happen, what taxes actually apply to you — each step linked to its official government
> source.
>
> WHAT MAKES CAMINO DIFFERENT
> • Deterministic, not generative: which steps apply, in what order, by when — that's computed
>   from your answers, never improvised. Lola explains the why; she never invents the what.
> • Official sources, linked: every legal requirement carries a link to the government page it
>   comes from (AEAT, extranjería, BOE, DGT, Instituto Cervantes…).
> • A living plan: check steps off — even back-dated — and downstream deadlines re-flow around
>   what actually happened. Tell Lola what changed; the plan rebuilds.
> • Coaching on every step: ask Lola how to tackle any item and get practical, grounded help.
> • Try before you commit: browse a full sample roadmap first — no account needed.
>
> Whether you're coming on the non-lucrative visa, as a digital nomad, to study, or heading for
> citizenship one day, Camino keeps the map. (Guidance only — not legal or tax advice. Lola keeps
> the map; a gestor signs the papers.)

## Privacy nutrition label (Apple's questionnaire → our honest answers)

| Data type | Collected? | Linked to identity? | Tracking? | Purpose |
|---|---|---|---|---|
| Contact info → Email | Yes (Google sign-in) | Yes | No | Account/auth |
| Identifiers → User ID | Yes (Supabase UID) | Yes | No | Account, saving your plan |
| Usage data → Product interaction | Yes (PostHog) | Yes (when signed in) | No | Analytics/app functionality |
| Diagnostics → Crash + performance | Yes (Sentry) | No | No | App functionality |
| User content → Interview answers | Yes (profile: household, work, dates, income *band*) | Yes | No | App functionality (builds the plan) |
| Location / contacts / photos / health / financial account info | No | — | — | — |

- **Tracking (ATT):** none — no cross-app tracking, no ad SDKs → no ATT prompt needed.
- Income and assets are collected as **bands**, never exact figures — worth saying in review notes.

## App Review notes (paste into the review box)

> Camino builds a personalized relocation roadmap for moving to Spain.
> • No account is required to browse, view the sample plan (/sample-plan), or complete the full
>   interview; Google sign-in is only needed to SAVE a plan across devices. [If Apple account
>   added: Sign in with Apple is offered alongside Google.]
> • AI usage: a language model phrases interview questions, extracts typed answers, and gives
>   advisory coaching. It cannot create or alter legal requirements, deadlines or costs — those
>   come from a fixed, human-verified catalog with links to official government sources shown in
>   the app. Content is guidance, not legal/tax advice (stated in-app).
> • Text-to-speech voice is generated via ElevenLabs; speech recognition uses the OS dictation.
> • Demo: tap "Sample plan" from the home screen for the full roadmap experience without login.

## Screenshots **[YOU + me]**

Required sizes: 6.9" (1320×2868) and 6.5" (1284×2778 or 1242×2688); iPad only if we enable iPad.
Suggested 5-shot story (portrait, device frames optional):
1. Home hero — "Your personalized roadmap for moving to Spain."
2. Interview — Lola mid-conversation (the multi-answer skip makes this look magical).
3. Roadmap — phases + stats + a penalty banner visible.
4. Step sheet — official ↗ pill + Lola's coaching thread.
5. Sample plan — "This is Susan & Tom's plan." banner.
Plan: capture on your device (build 11 or later) or Simulator; I can annotate/frame them if you
drop raw PNGs into `docs/store-assets/`.

## Remaining checklist

- [x] **Sign in with Apple** (guideline 4.8) — **DONE 2026-07-03.** Code shipped
      (`lib/appleSignIn.native.ts` via Supabase `signInWithIdToken`; official Apple button on iOS;
      entitlement via `usesAppleSignIn` + plugin). Supabase Apple provider enabled with
      `com.nerolabs.camino` in Authorized Client IDs on **both** projects (production by user;
      staging completed + verified during the completeness check). Native-only flow — no Apple
      secret. Remaining: on-device verify in build 12.
- [ ] App Store icon 1024×1024 — we already generate an opaque icon; confirm the marketing icon
      reads well at small sizes. *(exists via `scripts/gen-icon.mjs`)*
- [ ] Screenshots per above. **[YOU capture / I polish]**
- [ ] Age rating questionnaire → expect **4+** (no objectionable content). **[YOU click through]**
- [ ] Copyright line (`© 2026 Proxim.us / Nerolabs — pick one`), trade rep info if EU DSA prompts. **[YOU]**
- [ ] Paste metadata + privacy answers into App Store Connect, attach build (12+ recommended so
      the keyboard fix + interview intelligence ride along), **Submit for review**. **[YOU]**
