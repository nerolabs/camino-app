# Submission day — 2026-07-12 (fresh-eyes pass + App Store submission)

Yesterday shipped the Cristina batch (voice retired, "short interview" copy, countdown
ending, /contact) to production web AND build 36 (auto-submitted to TestFlight overnight).
Today: verify build 36 fresh-eyed, then submit to the App Store.

## Part 1 — Build 36 device verification (Andrew, ~10 min)

Open TestFlight → confirm **build 36** installed (it will not auto-update).

- [ ] **No voice anywhere**: no Voice on/off pill in the interview; nothing tries to speak.
- [ ] **Mic glyph**: composer shows the standard microphone (not the old emoji); tap →
      turns amber with a stop square; dictation still streams into the box.
- [ ] **The ending**: finish an interview WITH a final note → Lola acknowledges it →
      "Getting your roadmap ready — 3… 2… 1" → roadmap. Then once more skipping the note.
- [ ] **Contact page**: footer → Contact; hamburger → Report a problem lands with the
      problem chip pre-selected (cobalt). Send a real test message; confirm it reaches
      feedback@getcamino.app with "problem" in the subject.
- [ ] Regression spot-check: roadmap sheet "✕ Done" still clears the Dynamic Island;
      one language switch mid-interview.
- [ ] **RETAKE the interview screenshot while you're in there** (fresh-eyes catch 2026-07-11
      night: the current framed interview-screen-mid-point.PNG shows the "Voice on" pill —
      UI build 36 REMOVED). Capture the same mid-interview moment on build 36, drop the raw
      PNG into docs/store-assets/, and Claude re-runs clean + frame. The other 4 shots are
      verified clean — no voice UI anywhere.

## Part 2 — Fresh eyes (Cristina, ~20 min, phone + web)

Same rules as yesterday: hesitation is data, screenshot anything odd
(screenshot → Share Beta Feedback inside TestFlight goes straight to us).

- [ ] Run one full interview on the phone, one on the web — does the new ending feel
      right? Does anything still promise a "conversation"?
- [ ] Find and use the contact page cold ("how would you ask us a question?").
- [ ] Free play on whatever feels untested.

File findings in a triage table (copy docs/testing/2026-07-11-triage.md); same buses:
web-now vs native-batch (which is now build 37 material — do NOT hold the submission
for polish findings; only a broken core flow blocks).

## Part 3 — Submit (Andrew + Claude, ~20 min)

- [ ] **Trader case check**: any movement from Apple? If resolved → declare Trader FIRST
      (details become public on EU listings), then submit with EU included. If not →
      submit anyway (EU/Spain lights up later, no resubmission needed; release is MANUAL).
- [ ] ASC → version page → **attach build 36**.
- [ ] **Upload screenshots** from docs/store-assets/framed/ ("View All Sizes in Media
      Manager" → the 6.9" slot; if only 6.5" is offered, Claude regenerates at 1284×2778).
- [ ] **Review notes**: replace the WHOLE block with the updated one in docs/APP_STORE.md
      (rewritten 2026-07-11 night — ElevenLabs line gone, Apple/email sign-in wording fixed,
      income-bands line added).
- [ ] Final read of the version page top to bottom.
- [ ] **Add for Review.** Expect one rejection cycle; it's normal. Manual release means
      approval just parks until the launch moment.

## After submission

- [ ] Watch ASC status (Waiting for Review → In Review, typically 24–48h).
- [ ] PostHog 808581: interview-v2 funnel + the new contact_sent event.
- [ ] User-side queue: cancel the ElevenLabs plan; delete ELEVENLABS_* EAS env vars;
      delete the stray "docs/TEST-COVERAGE 2.md" Finder duplicate.
