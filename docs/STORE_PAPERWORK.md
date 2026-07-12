# iOS App Store paperwork playbook — Get Camino

A click-by-click guide to fill out **App Store Connect (ASC)** and submit Get Camino for public
review. This is TODO **Phase 4 → Phase 5 (iOS)**. The *copy* is already drafted in
`docs/APP_STORE.md` — this file is the **procedure** (where each field goes, in order).

App: **Get Camino** · ASC App ID **6786412055** · bundle **`com.nerolabs.camino`** ·
Legal identity: **AELaboratories** (sole proprietor) · Copyright: **© 2026 AELaboratories**.

> **Prerequisite:** a public-candidate build must be on TestFlight, device-verified. As of
> 2026-07-12 evening: **build 37 is riding to TestFlight** (the Cristina-shred build — trust
> batch, share links, regional facts). The submission candidate is expected to be **build 38**
> after her findings land; build 36 remains the last device-verified fallback. You attach the
> candidate at the end.

---

## Step 0 — Log in and find the app · [YOU]
- **https://appstoreconnect.apple.com** → **My Apps → Get Camino.**
- You'll work across three left-nav areas: **App Information** (once), **App Privacy** (once),
  and the **version** page (the "1.0 Prepare for Submission" screen — the main event).

---

## Step 1 — App Information (app-level, set once) · ~15 min · [YOU]
Left nav: **App Information**.
- **Name:** `Get Camino: Your Road to Spain` (exactly 30 chars — don't add anything, it's at the cap).
- **Subtitle:** `Your Spain move, in order`
- **Category:** Primary **Travel**, Secondary **Lifestyle**.
- **Content Rights:** "Does your app contain, show, or access third-party content?" — the app shows
  **links to government sources** (external). Answer **Yes**, you have the rights/permission (they're
  public government pages you link to, not embed). If unsure, "No" is also defensible since we don't
  host third-party content — but Yes is safest.
- **Age Rating → Edit:** click through the questionnaire; answer **None** to everything
  (no violence, sexual content, gambling, etc.). Result should be **4+**. Save.

### DSA / trader status (EU Digital Services Act) — **required, easy to miss**

> **⏸ BLOCKED 2026-07-11 — open Apple support case.** The developer account is an
> organization account under the old identity (Proxim.us, PO Box 1973 Vashon); switching
> to sole-prop isn't possible without a new personal account, so the play is an Apple
> support case to change the org name/address to **AELaboratories** — currently with a
> supervisor. Until it resolves, the trader declaration stays "non-trader."
> **When the case closes:** (1) declare Trader with the AELaboratories details;
> (2) complete Apple's trader verification (email/phone confirm — allow a few days);
> (3) align the legal pages (/privacy, /terms, /aviso-legal currently name Proxim.us /
> Vashon — the public EU trader info, ASC copyright line, and legal pages should all
> state the same operator identity, per TODO 6b's open wording choice).
> Everything else on this playbook is DONE as of 2026-07-11 (fields, privacy label
> published, pricing/availability); submission itself can proceed without trader status,
> but the app would be **withheld from all EU storefronts (incl. Spain) until Trader is
> declared + verified** — decide at submission time whether to parallelize or wait.
- Still in **App Information** (or under **App Store → General → App Information**), find
  **"Trader Status."** Because you distribute to the EU, you must declare **Trader.**
  - Choose **Trader.**
  - Enter your **trader contact details**: legal name (**AELaboratories** / your legal name as sole
    proprietor), **address**, **phone**, **email.** These become **publicly visible** on the EU
    App Store listing (DSA transparency requirement — this is expected).
  - ⚠️ If you decline trader status, Apple **removes the app from all EU storefronts.** You want EU
    (Spain!) — so declare Trader.

---

## Step 2 — App Privacy (the privacy "nutrition label") · ~20 min · [YOU]
Left nav: **App Privacy → Edit.** Enter exactly what `docs/APP_STORE.md` lists. For each data type
Apple asks: *collected? linked to identity? used for tracking? purpose?* Our honest answers:

| Data type | Collected | Linked | Tracking | Purpose |
|---|---|---|---|---|
| Contact info → **Email address** | Yes | Yes | No | App Functionality / Account |
| Identifiers → **User ID** | Yes | Yes | No | App Functionality |
| Usage Data → **Product Interaction** | Yes | Yes | No | Analytics |
| Diagnostics → **Crash Data** + **Performance Data** | Yes | **No** | No | App Functionality |
| User Content → **Other** (interview answers) | Yes | Yes | No | App Functionality |

- **Tracking:** answer **No** across the board — no ad SDKs, no cross-app tracking → **no ATT
  prompt.**
- In the "other user content" description note: *income/assets collected as bands, not exact
  figures* (also put this in review notes).
- **Privacy Policy URL** (this lives on the version page, App Information, or here depending on ASC
  layout): `https://getcamino.app/privacy` — **required field, app is rejected without it.**

---

## Step 2.5 — Pricing and Availability · ~5 min · [YOU] *(added 2026-07-11 — the original
playbook missed this; ASC blocks submission without it)*
Left nav: **Monetization → Pricing and Availability.**
- **Price Schedule → Add Pricing → USD 0 (Free).** No paid agreement needed for free apps.
- **App Availability → Set Up Availability → all countries/regions** (Spain + EU + US at minimum).
- Leave "Apple Silicon Mac" and "Vision Pro" availability **unchecked** — surfaces we've never
  tested; opt in later deliberately if ever.

---

## Step 3 — The version page ("1.0 Prepare for Submission") · ~30 min · [YOU]
Left nav: the version (e.g. **iOS App 1.0**). Paste from `docs/APP_STORE.md`:

- **Promotional Text (170 chars, editable anytime without review):** the promo paragraph.
- **Description (4000 chars):** the full description block.
- **Keywords (100 chars):** `spain,move abroad,relocation,visa,NIE,expat,digital nomad,retire,NLV,residency,padron,checklist`
- **Support URL:** `https://getcamino.app/how-it-works`
- **Marketing URL:** `https://getcamino.app`
- **Copyright:** `© 2026 AELaboratories`
- **Version:** `1.0`

### Screenshots (required) — [YOU capture · CLAUDE frames]
- Apple currently requires **one 6.9" set (1320×2868)**; a 6.5" set is optional but nice.
- Capture 5 shots on your iPhone on **build 35** (so the shots match what the reviewer sees —
  it carries landing v2 + the live-roadmap interview) — the story in `docs/APP_STORE.md`:
  home hero · Lola mid-interview · roadmap with a penalty banner · step sheet with the official ↗
  pill · sample-plan banner.
- Drop raw PNGs into `docs/store-assets/` → Claude annotates/frames them → upload the framed set.
- **App icon:** 1024×1024 marketing icon is pulled from the build (already opaque via
  `scripts/gen-icon.mjs`) — confirm it reads well small.

### Build
- **Build section → +** → select the **TestFlight build** you're shipping (build 35 once verified).
  Export-compliance is pre-answered (`ITSAppUsesNonExemptEncryption=false` in config) so no manual
  step.

### App Review Information (bottom of the version page)
- **Sign-in required?** — **No** (browse + interview + sample plan work logged-out). If you toggle
  "sign-in required" off, you don't need a demo account; still paste the review notes.
- **Notes:** paste the "App Review notes" block from `docs/APP_STORE.md` verbatim (explains: no
  account needed, the AI is advisory-only over a fixed human-verified catalog, dictation-only
  voice input — TTS retired 2026-07-11 — income as bands, "tap Sample plan for the full
  experience without login"). ✅ Pasted + updated live in ASC 2026-07-12.
- **Contact info:** your name / phone / email for the reviewer.

---

## Step 4 — Submit · [YOU]
- Top-right **"Add for Review" / "Submit for Review."**
- ASC asks a couple final questions (advertising identifier: **No**). Confirm.
- Status → **Waiting for Review.** Typical review is **24–48h**; **expect one rejection cycle**
  (it's normal — read the reason, fix, resubmit; the review notes above pre-empt the common ones).

---

## Known likely rejection reasons (pre-empted, but watch for)
1. **Guideline 4.8 (Sign in with Apple)** — already shipped (Apple button + entitlement, build 12+).
   Because sign-in is *optional*, this is low-risk, but keep the "sign-in is optional" note prominent.
2. **Guideline 5.1.1(v) (account deletion)** — we have in-app delete-account. If asked, point the
   reviewer to it (hamburger → delete account).
3. **Privacy policy URL missing/unreachable** — verify `https://getcamino.app/privacy` loads before
   submitting.
4. **Metadata references to other platforms** — don't mention Android/Google Play in the iOS copy.
5. **AI/medical/legal-advice concern** — the review note ("guidance, not legal/tax advice; a fixed
   human-verified catalog; a gestor signs the papers") is written to defuse this. It's also stated
   in-app.

---

## After approval
- Choose **manual release** (so you control the launch moment) vs **automatic.** Recommend
  **manual** — coordinate with the Phase-6 marketing moment (STRATEGY.md).
- Update the two homework pages + TODO per the standing rule when the release ships.
