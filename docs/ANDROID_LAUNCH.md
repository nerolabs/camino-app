# Android launch playbook — Get Camino

A do-this-in-order guide to get Get Camino onto Google Play, written for a solo operator with a
**personal** Google Play account and a **Redmi 13** (Android 14 / HyperOS) as the test device.

**The one thing that matters most:** a *new personal* Play account (created after 13 Nov 2023)
**cannot publish to production** until it has run a **closed test with ≥12 testers who stay
opted-in for 14 continuous days.** That 14-day clock is the longest calendar item in the whole
launch — so the entire goal of Phase 1–4 below is **get a build into closed testing and 12 real
testers opted in, as fast as possible.** Everything else (nice store copy, screenshots) can be
polished *while the clock runs.*

Bundle / package id: **`com.nerolabs.camino`** · App name: **Get Camino: Your Road to Spain**
Legal identity: **AELaboratories** (sole proprietor, own SSN — user decision 2026-07-04).

---

## Phase 0 — Prep your test device (Redmi 13) · ~15 min · [YOU]

1. On the Redmi 13, open **Settings → About phone**. Tap **Android version** and confirm it's
   Android 13 or newer (Redmi 13 ships with 14 — fine).
2. Sign the phone into the **same Google account** you'll use as the developer account (or at least
   an account you control — testers must accept the invite with the Google account on their device).
3. Enable installing your own builds for on-device testing before the store is live:
   **Settings → About phone → tap "Build number" 7 times** → Developer options unlocked →
   **Settings → Additional settings → Developer options → enable "USB debugging"** and
   **"Install via USB."** (You only need this if you sideload the APK directly; the closed-test
   track installs through the Play Store normally.)
4. Xiaomi extra step: HyperOS/MIUI blocks sideloaded installs by default. If you sideload an APK,
   you'll get a "MIUI optimization / install blocked" prompt — allow it. For the **closed-test
   track this doesn't apply** (it's a normal Play Store install), so prefer the closed-test path.

---

## Phase 1 — Create the Google Play developer account · ~1–2 days (identity verification) · [YOU]

This is the "$25 account" step. Budget **1–3 days of waiting** because Google now verifies identity.

1. Go to **https://play.google.com/console/signup** and sign in with the Google account you want to
   own the app (use a **dedicated account** you won't lose — this is bus-factor #1; the whole app
   lives under it).
2. Choose account type: **Yourself / Individual (personal).** (Org accounts skip the 12-tester
   gate but require a **D-U-N-S number** and take longer — we deliberately chose personal; see
   STRATEGY.md risk #6.)
3. Pay the **one-time $25 USD** registration fee (credit/debit card).
4. **Identity verification (the slow part):** Google will ask for your legal name, address, and a
   **government photo ID** (and sometimes a selfie). Enter your name/address to match your ID
   exactly. Submit. Verification is usually a few hours but can take **up to 2–3 business days** —
   *this is why you start today.* You cannot create the app listing until this clears.
5. Set up the **payments profile** even though the app is free — Google requires it to exist.
   (No bank details needed for a free app with no in-app purchases.)

> ⏳ **While you wait for verification**, do Phase 2 (build the .aab) — it needs no Play account.

---

## Phase 2 — Produce the Android build (.aab) · ~20 min of your time + ~20 min cloud build · [CLAUDE builds on your command]

We need a **production Android App Bundle (.aab)** to upload to the closed track. (The old preview
APK — build `a538b9d7` — points at the *staging* DB and is APK not AAB; don't use it for the real
test.)

1. **You give the go-ahead** (EAS build credits are only spent on your command). Then Claude runs:
   ```
   npx eas-cli build --platform android --profile production
   ```
   - First Android build: EAS auto-generates and stores an **upload keystore** on its servers
     (non-interactive, no action from you). Let EAS manage it — don't generate your own.
   - `appVersionSource: remote` + `autoIncrement` means EAS manages `versionCode` for you.
   - Output: a downloadable **`.aab`** artifact URL when the build finishes (~15–25 min).
2. Download the `.aab` to your computer (you'll upload it in Phase 3).

> Note: the production profile bakes the **production** Supabase DB + `getcamino.app` API — correct
> for a real closed test. Sign-in, interview, roadmap, and the /api/lola path all work against prod.

---

## Phase 3 — Create the app in Play Console + fill the required forms · ~2–3 hrs · [YOU]

Once account verification clears. In **Play Console** (https://play.google.com/console):

### 3a. Create the app
- **All apps → Create app.**
- App name: **Get Camino: Your Road to Spain** · Default language: **English (US)** ·
  App or game: **App** · Free or paid: **Free.** Accept the declarations. **Create app.**

### 3b. Work through "Dashboard → Set up your app" (the required questionnaires)
Play gates production on these being complete. Fill each (mirror the honest answers we already
wrote for Apple in `docs/APP_STORE.md` — same facts):

1. **App access** — "All functionality is available without special access" **is false** here only
   if sign-in is *required*; ours isn't (browse + interview work logged-out). Choose **"All
   functionality available without restrictions"**, OR if it asks for a login demo, provide the
   note: *"Google/Apple/email sign-in is optional; used only to save a plan. Tap Sample plan for
   the full experience without an account."*
2. **Ads** — **No**, the app contains no ads.
3. **Content rating** — fill the IARC questionnaire. Category: **Reference/News/Education or
   Utility.** Answer "No" to all violence/sexual/gambling/drugs questions. Expected result:
   **Everyone / PEGI 3** (the Android equivalent of Apple's 4+).
4. **Target audience & content** — target age **18+** (or 13+; the app is for adults moving abroad —
   choose 18 and up to avoid the "designed for families" program and its extra rules).
5. **Data safety** — the Android analog of Apple's privacy nutrition label. Declare, matching
   `docs/APP_STORE.md`:
   - Collected & linked to the user: **Email** (auth), **User ID** (Supabase), **App
     interactions** (PostHog), **User content** = the interview answers (household/work/dates/
     income *band*).
   - **Crash logs & diagnostics** (Sentry) — collected, **not** linked to identity.
   - **Data is encrypted in transit:** Yes. **Users can request deletion:** Yes → provide the
     in-app delete-account path + the URL. **No data sold. No tracking for ads.**
   - Location / photos / contacts / financial account / health: **not collected.**
6. **Government apps** — No. **Financial features** — No.
7. **Privacy policy URL:** `https://getcamino.app/privacy`

### 3c. Store listing (the public copy)
- **Short description (80 chars):** `Your personal, deadline-aware roadmap for moving to Spain.`
- **Full description (4000 chars):** reuse the Apple description in `docs/APP_STORE.md` (paste and
  lightly trim — no Apple-specific words).
- **App icon (512×512 PNG):** generated by `scripts/gen-icon.mjs` (adaptive foreground). Claude can
  export the exact 512×512 if you don't have it handy.
- **Feature graphic (1024×500 PNG):** *required by Play* (Apple has no equivalent). Claude can
  generate one from the brand mark — ask.
- **Phone screenshots (min 2, up to 8):** capture on the Redmi 13 once the closed-test build is
  installed (same 5-shot story as `docs/APP_STORE.md`: home, interview, roadmap, step sheet,
  sample plan). Drop raw PNGs in `docs/store-assets/` and Claude will frame/label them.
- **Category:** Travel & Local (primary). **Contact email:** your support email. Save.

---

## Phase 4 — Start the closed test (STARTS THE 14-DAY CLOCK) · ~30 min · [YOU]

**This is the step whose calendar time you cannot compress — do it the moment 3b/3c are done
enough to submit; you can keep editing the listing afterward.**

1. **Play Console → Testing → Closed testing → Create a new track** (or use the default "Closed
   testing – Alpha").
2. **Create release → upload the `.aab`** from Phase 2. Add short release notes ("First closed
   test — full app: interview, roadmap, sign-in.").
3. **Testers tab:** create an **email list** and add **≥12 tester Gmail addresses.** Recruit **~15**
   to survive drop-off (one tester who un-enrolls resets nothing, but you must have ≥12 *still
   opted in* on the day you apply for production). Pull from your family-testing circle.
4. **Copy the opt-in URL** and send it to every tester. **Each tester must:** open the link on
   their Android phone → tap **"Become a tester"** → then install Get Camino from the Play Store
   link on that page. **They must remain testers for 14 continuous days** — tell them not to leave
   the program.
5. **Roll out the release** to the closed track. Google review of a closed-test build is usually
   hours to ~2 days.
6. **Install on your Redmi 13** via your own opt-in link to verify on real hardware (Phase 5).

> 📅 **Mark the date.** 14 days from when your 12th tester is opted-in is the earliest you can
> apply for production. Track it. Recruiting all 12 on day 1 is the difference between launching in
> 2 weeks vs 4.

---

## Phase 5 — Android on-device verification (Redmi 13) · [YOU + Claude fixes]

Install the closed-test build and check the Android-specific things that differ from iOS (expect
one fix round — TODO Phase 3 item 11):
- **Back gesture / back button** — navigating back through interview → home behaves (no dead-ends,
  no accidental app-exit mid-interview).
- **Keyboard** — the composer isn't hidden behind the keyboard; dictation mic works (HyperOS may
  prompt for mic permission — grant).
- **Sign-in** — Google sign-in completes (deep-link `caminoapp://auth-callback` round-trips);
  Apple/email as available.
- **Dictation** — `expo-speech-recognition` streams on-device.
- **Safe area / notch** — nav clears the Redmi's camera cutout; nothing clipped.
- **Cold start** — with no saved plan, app lands home; no spinner past ~35s.
- File anything broken; Claude fixes → you re-build (`eas build --platform android`) → new closed
  release. Fixes during the 14 days **don't reset the clock** (same track, same testers).

---

## Phase 6 — Promote to production (after 14 days + 12 testers) · [YOU]

1. **Play Console → Dashboard → "Apply for production access"** — available once the 12-testers-×-
   14-days criteria show as met. Fill the short questionnaire (who tested, what feedback, how you
   addressed it — a few sentences).
2. Google reviews the production-access application (can take a few days).
3. Once granted: **Production → Create release → promote the tested build (or a new .aab) →
   review → roll out** (start at a staged % if you like). Public on Google Play.

---

## Optional later: automate submission with a service account

For now, **upload the .aab by hand** in Play Console — no extra setup, right for the first test.
Later, to let `eas submit --platform android` push builds automatically, you'd create a Google
Cloud **service account**, grant it Play Console access, download its JSON key, and add
`submit.production.android.serviceAccountKeyPath` to `eas.json`. Skip until the manual flow feels
tedious — it's a convenience, not a requirement.

---

## Sources (closed-testing rule, current as of July 2026)
- Play Console Help — testing requirements for new personal accounts:
  https://support.google.com/googleplay/android-developer/answer/14151465
- Google walked the requirement back from 20 → **12 testers** (Dec 2024); 14 continuous days stands.
