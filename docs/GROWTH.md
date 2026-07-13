# GROWTH.md — the Marketing track's working doc

Created 2026-07-13 night (post-submission; user directive: marketing is the main proactive
focus). Strategy + reasoning live in `STRATEGY.md`; this file is the **operational side**:
the channel ledger, the ready-to-send drafts, and the measurement loop.

**The one standing rule (soft-launch #1, 2026-07-06): DM the mods/admins for permission
BEFORE posting.** A humble, disclosed, free-tool post pulled 1.2K views and 2 full
conversions on r/GoingToSpain — and was still auto-removed via report-to-remove. Mod
pre-approval is the only reliable immunity. Every channel below starts with the DM.

All drafts are **for user sign-off before anything is sent** — personalize the
`[YOU: …]` spots; nothing here is auto-published.

---

## 1. Channel ledger (update as each channel moves)

| # | Channel | Angle | Mod DM | Post | Result |
|---|---------|-------|--------|------|--------|
| 1 | Jerez / Cádiz-province expat FB groups | Local — "I live here" | — | — | — |
| 2 | Visa-specific FB groups (NLV / DNV / Beckham) | The tool answers this group's exact question | — | — | — |
| 3 | r/SpainPersonalFinance | Modelo 720 / tax-trap honesty | — | — | — |
| 4 | r/expats | General move-planning | — | — | — |
| 5 | Expat forums (Expatica, Expat.com, InterNations) | Longer-form, evergreen | — | — | — |
| 6 | Webinar-creator warm list (15 mined) | Partnership: "your expertise, our engine" | — | — | — |
| 7 | r/GoingToSpain (re-approach) | Mods were already messaged 2026-07-06 — follow up, don't repost | — | — | — |
| 8 | Product Hunt / HN | The build-in-open story — **held for the iOS launch moment + trader resolution** | n/a | — | — |

Sequencing: 1 → 2 → 3/4 → 5/6. #8 waits for Track 1's release moment.

---

## 2. The reusable mod/admin DM (send first, always)

> Hi! I'm a member here — [YOU: one clause of standing in this group, e.g. "I live in
> Jerez" / "I've been on the NLV path since last year"]. Before posting anything I wanted
> to ask permission, because I know self-promotion rules exist for good reasons.
>
> I built a free tool for people planning a move to Spain: **getcamino.app**. You answer
> ~12 questions and it builds a personal, dated checklist of the official steps your
> specific situation requires — visa route, NIE, padrón, the tax traps like Modelo 720 —
> with every step linked to the official government source and a "last verified" date.
> It's completely free, no account needed, no ads, and I'm not selling anything.
>
> Would a post about it be welcome here? Happy to send you the exact text for approval
> first — and equally happy to take no for an answer. Thanks for keeping the group good.

(ES version: mirror of the post below — adapt the first line the same way.)

---

## 3. The Jerez / local-expat post (channel #1) — EN

> Hola vecinos 👋 I live here in Jerez, and I spent the last two weeks building the tool
> I wish I'd had when I was planning my own move: **getcamino.app**
>
> You answer about 12 quick questions — takes ~3 minutes, English or Spanish (five
> languages, actually) — and it builds a personal, dated roadmap of every official step
> your specific situation requires: the right visa route, NIE, empadronamiento, healthcare,
> and the tax deadlines people usually learn about the expensive way (looking at you,
> Modelo 720). Every step links to the official government source and shows the date it
> was last verified, because half the advice online is quietly out of date.
>
> It's completely free, no account needed, no ads, nothing to buy. I built it because the
> information out there is scattered across a hundred forum threads. What I'd genuinely
> love from this group: people who've already been through the process telling me what's
> wrong or missing — every correction ships on a public changelog the same week.
>
> [YOU: optional one-line personal touch — your own move story in one sentence]
>
> (Posted with the admins' blessing — I asked first.)

## 3b. The same post — ES

> Hola vecinos 👋 Vivo aquí en Jerez y he pasado las últimas dos semanas construyendo la
> herramienta que me habría gustado tener al planificar mi propia mudanza: **getcamino.app**
>
> Respondes unas 12 preguntas rápidas — unos 3 minutos, en español o inglés (cinco idiomas
> en total) — y te construye una hoja de ruta personal y con fechas de cada trámite oficial
> que tu situación concreta requiere: la vía de visado correcta, el NIE, el
> empadronamiento, la sanidad y los plazos fiscales que la gente suele descubrir de la
> manera cara (sí, Modelo 720). Cada paso enlaza a la fuente oficial del gobierno y
> muestra la fecha de su última verificación, porque la mitad de los consejos en internet
> están calladamente desactualizados.
>
> Es totalmente gratis, sin cuenta, sin anuncios, sin nada que comprar. La construí porque
> la información está dispersa en cien hilos de foros. Lo que de verdad agradecería de
> este grupo: que quienes ya pasaron por el proceso me digan qué está mal o qué falta —
> cada corrección se publica en un registro de cambios público la misma semana.
>
> (Publicado con permiso de los administradores — pregunté primero.)

---

## 4. The visa-group variant (channel #2 — NLV/DNV/Beckham groups)

Swap the local opener for the group's pain point; keep everything else:

> If you're working out the [NLV / digital-nomad-visa] income requirement and what order
> the paperwork actually goes in, I built a free tool that might save you a spreadsheet:
> **getcamino.app**. ~12 questions, ~3 minutes, and it builds your personal dated
> checklist — including the income-threshold check against the current official figure
> (it counts your real dependents), and the steps people miss like Modelo 720. Every step
> cites the official source with a last-verified date. Free, no account, no ads — built
> by one person who's living the process. Corrections welcome; they ship on a public
> changelog.

---

## 5. The pre-emption paragraph ("built by AI in two weeks") — for PH/HN + anywhere the story lands

> Yes — this was built in about two weeks, largely by AI, and that should worry you
> exactly as much as it worried me. So here's the architecture of the answer: **the AI
> never decides your deadlines.** Every obligation is a data entry citing an official
> government source with a last-verified date; a deterministic engine — boring, testable
> code the model cannot touch — turns your answers into the plan; the language model only
> phrases questions and parses answers, behind a validator. The two weeks went into
> plumbing, tests (345 unit tests, end-to-end suites on every deploy, a 181-profile audit
> matrix in CI), and audits — including an independent five-reviewer teardown whose full
> report is public in the repo. When a rule changes or we get one wrong, the correction
> ships on a public changelog — the first entry beat most of the internet to Valencia's
> June 2026 transfer-tax cut. The build log, warts included, is at
> getcamino.app/how-i-was-built.

---

## 6. Measurement loop

- **PostHog 808581** — funnel by source: `interview_started → interview_completed →
  roadmap_viewed`, plus `share_link_created`, `question_cta_clicked`, `contact_sent`.
  Watch per-channel within ~48h of each post.
- **Google Search Console** [USER ~30 min]: verify the getcamino.app property (DNS TXT
  is cleanest; Claude can add an HTML-tag route if preferred), submit
  `https://getcamino.app/sitemap.xml`. This is what unlocks growing /questions from real
  queries — SEO compounds with a multi-week lag, so setup cost is front-loaded.
- **Per-channel notes** go in the ledger above: views / comments / conversions / removed?
  Soft-launch #1 baseline: 1.2K views → 2 full conversions (EN+ES), zero errors.

## 7. Explicitly not doing

- No posting without mod permission (standing rule). No "hack Spain" framing ever —
  position is "move to Spain **properly**" (STRATEGY.md PR risk #2). No paid ads at this
  stage. No LinkedIn (0/17 conversion in soft launch #1 — intent mismatch).
