# Fresh-eyes test script — 2026-07-11

**For the tester (that's you! 🎉)** — you can't do this wrong. Everything that confuses
you is a finding, not a mistake. Think out loud; hesitation is data.

## How to report anything odd

- **Web:** screenshot (⌘⇧4 area, or ⌘⇧5 to record video) + one line: *what you were doing*.
- **iPhone:** take a screenshot inside the app → tap the thumbnail → **Share Beta Feedback**
  (goes straight to us), or just screenshot/screen-record and send normally.
- Always note: **web or phone**, and what you expected to happen instead.

## Setup (Andrew does this first)

- [ ] iPhone: TestFlight shows **build 35** installed (open TestFlight and check — it does
      not auto-update). Andrew verifies his two items (Dynamic Island / voice OFF) before handoff.
- [ ] Web testing happens on **https://getcamino.app** in a **fresh incognito window** — not localhost.

---

## Part 1 — Web, wide window, signed out (~20 min)

1. **Landing page, cold read.** Scroll the whole page slowly. Say out loud: what does this
   product do? Would you start? Anything that reads confusing, salesy, or broken?
2. **Start the interview.** First question is about your arrival date — does the phrasing
   make sense? Answer a few questions:
   - Tap **chips** for some, type free text via **"Other"** for at least two.
   - Watch the **right-hand roadmap pane**: steps should appear as you answer, new ones
     briefly highlighted; a **"+N new steps"** pill appears under answers. Does the
     connection between your answer and the new steps feel clear?
   - Find the **voice toggle**. It should start **OFF**. Turn it on — does Lola speak? Try
     the **mic** button and dictate one answer.
3. **Finish the interview** all the way to the roadmap.
4. **Roadmap:** open a step → read it → ask the coach a follow-up question → **✓ Mark done**
   on one step → mark another done **on a specific date** (dates downstream should shift).
   Try **"Something changed?"** with e.g. "we decided to rent instead of buy". **Export the PDF.**

## Part 2 — Web, sign-in + the trust test (~10 min)

5. **Sign in with your email** (magic link). Did the email arrive quickly? Right language?
   Does the link land you back signed in, roadmap intact?
6. **The big one:** sign out → close the window → new incognito window → sign back in.
   **Is your roadmap exactly as you left it** (done-marks included)? ← report ANY difference.
7. Switch the language to **Español** (☰ menu) and skim: the roadmap, one guide page, and
   start a throwaway interview — does the current question re-issue in Spanish? Anything
   that reads like machine-English?

## Part 3 — iPhone, TestFlight build 35 (~20 min)

8. **Cold start** (swipe the app away first). Where do you land? Does it make sense?
9. **Run the interview on the phone.** Under the top bar you should see a strip —
   **"Your roadmap · N steps … View ›"**. Tap it: a full sheet opens. Tap **✕ Done** —
   does everything clear cleanly around the Dynamic Island (nothing stuck under it)?
10. **Voice should be OFF by default** on the phone too. Mic dictation: first and last
    words captured at normal speaking pace?
11. **Sign in with Apple**, then check the roadmap matches what you built on the web.
12. Roadmap on phone: open a step, mark done, PDF export, "Something changed?".
13. Free play, 5 min: poke anything — hamburger menu items, guides, rotating, backgrounding
    the app mid-interview and coming back.

## Known quirks — don't file these

- Roadmap pane: when an answer *removes* steps, they vanish silently (no message yet).
- New-step highlight is a fade, not a slide.
- The housing question's "own **or** plan to buy" wording is intentional.
- If Lola occasionally skips her little aside/acknowledgement, that can be a safety
  filter doing its job — mention it, but it may not be a bug.
