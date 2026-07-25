# Marketing assistant — camino-leads & camino-fb

## The one hard guardrail (read first)

**Nothing in this tooling ever posts, comments, votes, or sends anything, anywhere.**
No Reddit or Facebook credentials exist here. No DOM automation submits a form. Output is
always drafts + open browser tabs + the clipboard — **Andrew hits POST.** This is permanent,
not a v1 limitation (spam-flag risk, platform ToS, and the product's honesty positioning
all point the same way). Full spec: [AUTOMATION.md](./AUTOMATION.md).

## Quickstart

```sh
npm run leads                # scan Reddit → classify → ≤5 drafts → marketing/leads/YYYY-MM-DD.md
npm run leads:go             # paste loop: draft on clipboard, tab opens, p/s/Enter/q per lead
echo 'https://facebook.com/groups/g/posts/123 | asks about NIE order' >> marketing/fb-inbox.txt
npm run fb:draft && npm run fb:go   # same loop for captured FB posts
npm run leads -- --dry-run   # print the digest, write no state, open no tabs (fb:draft too)
```

## How it works

- **Keywords are generated, not hardcoded** — derived from the live catalog (the same data
  the engine and guide pages build from) plus the alias seeds in `leads.config.json`
  (`padrón → empadronamiento`, `nlv → nlv-*`, …). A new obligation automatically becomes a
  new listening keyword.
- **Batched LLM calls classify every match** (answerable question from a real mover?
  which guide? confidence ≥ 0.6 keeps) — candidates are ranked by match quality first, and
  the scan prints the funnel (not-answerable / low-confidence / kept) plus near-misses so
  the yield is inspectable. Threads older than 48h, already-classified
  (`marketing/state/seen.json`), or already carrying your comment are skipped.
- **Drafts follow the comment-engine rules**: answer fully in the comment first, link as a
  footnote in ≤1/3 of drafts (`?utm_source=rd-<sub>` / `fb-<group>`) with the disclosure
  parenthetical, and **the digit rule applies** — a draft may not contain a number that
  isn't in the cited guide's own text (linted mechanically; a failed draft is flagged
  ⚠️ in the digest, never auto-posted).
- **Every posted lead lands in `marketing/ledger.csv`** (date, platform, sub, thread,
  guide id, link y/n) for the Friday PostHog join.
- **Config** (`marketing/leads.config.json`): target subs with `no_link` / `banned` flags,
  search probes, alias seeds, `fb_link_groups`, `reddit_username` (set this — it enables
  the already-commented skip).

## Cron (optional)

Daily 08:00 scan, quiet when zero leads (`crontab -e`):

```cron
0 8 * * * cd $HOME/Desktop/claude/camino-app && /usr/bin/env npx tsx scripts/marketing/camino-leads.ts scan >> /tmp/camino-leads.log 2>&1
```

Needs `ANTHROPIC_API_KEY` (read from the repo `.env` automatically).

## Privacy note

All generated activity — `leads/`, `ledger.csv`, `state/`, `fb-inbox.txt`, `weekly/` — AND
the live `leads.config.json` (per-community `no_link`/`banned` flags are relationship state)
are **gitignored**: this repo is public and the operation's receipts don't belong in it.
Only the tool code, this README, the spec, and `leads.config.example.json` are committed —
copy the example to `leads.config.json` and set `reddit_username` to start.

## Not built yet

Component C (the Friday weekly roll-up) is deliberately last per the spec — build it once
the ledger has a few weeks of rows worth rolling up.
