# Marketing Automation Spec — for Claude Code

Paste this into the Camino repo (suggested: `marketing/AUTOMATION.md`) and tell Claude Code to build it. It automates the boring 80% of the comment engine — finding answerable threads and drafting replies — while keeping every actual post behind Andrew's fingers.

## The one hard guardrail

**Nothing in this system ever posts, comments, votes, or sends anything, anywhere.** No Reddit credentials exist in the tool. No Playwright/DOM automation submits a form. Output is always: drafts \+ open browser tabs \+ clipboard. Andrew hits POST. This is not a v1 limitation; it's permanent (spam-flag risk, platform ToS, and the product's honesty positioning all point the same way).

---

## Component A — Reddit lead scanner (`camino-leads`)

A CLI script (or `claude -p` harness) run by cron each morning. No login needed — Reddit's public JSON endpoints suffice.

**1\. Fetch.** For each target sub, pull `/new.json?limit=50` plus `/search.json?q=<keyword>&restrict_sr=1&sort=new&t=week` for the top keywords. Target subs (config file, editable): `GoingToSpain, SpainAuxiliares, askspain, expats, SpainPersonalFinance, ExpatFIRE, digitalnomad, valencia, Malaga, Granada, Barcelona, Madrid` Config also carries a `no_link` flag per sub (mods said no / sub bans links → drafts for those subs get a link-free variant) and a `banned` flag (skip entirely).

**2\. Keyword → guide mapping — generate, don't hardcode.** Derive the keyword table from the live catalog (the same data the engine and guide pages build from), so a new obligation automatically becomes a new listening keyword. Seed with obvious aliases the titles won't contain: `padrón→empadronamiento`, `green certificate→eu-registration-certificate`, `NLV/non-lucrative→nlv-*`, `DNV/nomad visa→dnv-*`, `720→modelo-720`, `driving license/licence swap→dgt-exchange`, `bring my dog/cat→pet-import`, `gestor`, `apostille`, `sworn translation`, `Beckham`, `autónomo`, `wealth tax`, `empadron*` misspellings.

**3\. Classify (one LLM call per candidate, batched).** For each matched thread: is this an answerable question from a real person planning a move (vs. news, rant, meme, already-answered-well)? Which guide id fits best? Confidence low → drop. Also drop: threads older than 48h, threads where `seen.json` says we've already surfaced them, threads where Andrew has already commented (check his username in the comment authors).

**4\. Draft.** One comment per surfaced thread, following the comment-engine rules from `GROWTH.md`/workdoc §4, embedded here as system prompt:

- Answer the question fully in the comment FIRST — 2–4 sentences of real, correct content sourced from the guide's own text. The link is a footnote, never the payload.  
- Link format: `getcamino.app/guide/<id>?utm_source=rd-<sub>` — only when the guide genuinely adds sources/detail. Target ≤1 in 3 drafts carrying a link; the classifier marks which drafts should be link-free.  
- Every linked draft ends with the disclosure parenthetical: `(Disclosure: my site — free, no signup.)`  
- Tone: helpful redditor, not brand voice. No emoji, no "Great question\!". Vary phrasing — no two drafts share sentence structure.  
- **The digit rule applies to drafts too:** a draft may not contain any number, deadline, or threshold that isn't in the cited guide's own text. Lint drafts the same way guide prose is linted.

**5\. Digest.** Write `marketing/leads/YYYY-MM-DD.md`: for each lead — sub, thread title \+ permalink, why it matched, the draft, and a `[ ] posted / [ ] skipped` checkbox. Cap at **5 leads/day** (quality \+ posting more looks like a campaign). Then optionally `open` each permalink as a browser tab (flag: `--tabs`).

**6\. Paste loop (the "just hit POST" part).** `camino-leads go`: iterates the day's leads — copies draft \#1 to the clipboard, opens its tab, waits for a keypress, then copies draft \#2, opens its tab… Andrew's per-lead work: click reply box, ⌘V, edit if wanted, POST, press any key in the terminal. Five leads ≈ five minutes.

**7\. Ledger.** Append each `posted` lead to `marketing/ledger.csv` (date, platform, sub, thread, guide id, link y/n) so the Friday PostHog check has something to join against.

**Cron:** daily 08:00, quiet exit if zero leads. Budget-bound the LLM calls; the whole run should cost cents.

> **Implementation note (2026-07-25):** Reddit now returns 403 to all anonymous `.json` endpoints, so the built tool reads the **Atom RSS feeds** instead (`/new.rss`, `/search.rss`, `<permalink>.rss` for the already-commented check) — same data, still read-only and credential-free, with a 3s request pace and 429 backoff. Everything else in this spec is implemented as written; Component C is deliberately not built yet.

---

## Component B — Facebook assist (`camino-fb`)

Facebook groups have no API and scraping a logged-in session risks the personal account — so FB input is manual-capture, automated-everything-else:

**1\. Capture.** During the Mon/Wed scan (or anytime), Andrew drops FB post URLs into `marketing/fb-inbox.txt` — one per line, optionally with a note after a `|` ("asks about NIE order"). Copying a URL from the share menu takes 3 seconds per post.

**2\. Draft.** `camino-fb draft`: for each URL, use the note (or ask Andrew one line if missing) to pick the guide and generate a comment draft — same rules as Component A, but `utm_source=fb-<groupname>`, and default to **link-free variants more often** (FB groups are touchier; link only when the workdoc ledger shows that group tolerates it or the admin approved).

**3\. The tab ritual.** `camino-fb go`: same paste loop — open the FB post tab, draft on clipboard, Andrew pastes and hits POST, keypress advances. Drafts also land in `marketing/leads/` with checkboxes, and posted ones append to the ledger.

**Explicitly rejected:** auto-filling the FB comment box via DOM automation. It's the difference between "clipboard assistant" and "bot with your account" — detection risk on the account that is the marketing asset. If the paste step ever feels too slow, revisit; don't build it by default.

---

## Component C — weekly digest roll-up (optional, build last)

Friday cron: read the week's `leads/*.md` \+ `ledger.csv`, emit `marketing/weekly/YYYY-WW.md` — posted count, link ratio, per-sub tally, any leads marked posted whose threads got deleted (fetch the permalink; 404/removed \= note it), and a reminder list of unanswered admin DMs from the channel ledger. Andrew reads it in the Friday session on desktop.

## Definition of done

- `camino-leads` runs end-to-end on live Reddit data with zero posts made, produces a digest with ≥1 correctly-matched lead and a draft that passes the digit-lint.  
- `camino-fb go` walks a 2-URL inbox with the clipboard/tab loop.  
- A `--dry-run` on both prints instead of opening tabs.  
- README section: 5-line quickstart \+ the guardrail, stated first.

