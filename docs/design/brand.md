# Brand & voice — Camino × Lola

The identity. Build every screen to this; don't reinvent it per feature. Visual
reference lives alongside this file: `brand-board.html`, `lola-states.html`,
`lola-voice.html`.

## Essence

From overwhelmed to underway. Camino turns moving to a new country into a path you
can actually walk — one clear step at a time, with someone beside you.

## The brand is two things on purpose

- **Camino** — *the way and the destination.* The calm infrastructure: the plan, the
  sequence, the deadlines. Cool, trustworthy, exact.
- **Lola** — *the friend on the path.* The warmth: she walks it with you, narrates the
  why, hands you the phrase to say at the window, and never trades truth for comfort.
  She carries the Camino.

Public app name is **Camino**; Lola is the guide you meet *inside* it. The "Camino ×
Lola" lockup is an internal brand-story artifact, not the product wordmark.

> Working title. *Camino* is a common Spanish word — do a trademark + app-store-name
> check before committing, and consider a distinguishing lockup ("Camino — your way to
> Spain").

## Palette — Andalusian tile, whitewash, sherry

| Token | Hex | Role |
|---|---|---|
| Cobalt | `#2B5AA3` | Camino · primary |
| Indigo | `#15243B` | Text · ink |
| Sherry amber | `#BD8318` | **Lola · accent** |
| Olive | `#5E7355` | Calm · done states |
| Clay | `#A8472F` | Alert · used sparingly |
| Cal | `#FBFAF7` | Whitewash · ground |

**The rule that governs every screen: amber means Lola is present.** Cobalt is the
neutral system. Don't let amber leak onto ordinary buttons, or her presence stops
meaning anything.

## Type — the voice & the interface

- **Fraunces** (soft serif) — *the voice.* Lola, headlines, anything spoken.
- **Hanken Grotesk** (grotesque sans) — *the interface.* Labels, structure, data.

Warmth vs. clarity, made literal.

## The mark — one star, two hosts

An **azulejo compass-star**: navigation (the journey) and tile (place, belonging) in
one. Deliberately *not* the Camino-de-Santiago scallop shell, which would wrongly
signal pilgrimage. The amber center dot is the waypoint — the destination.

- **Camino:** the star, white, on a cobalt rounded-square tile, amber dot.
- **Lola:** the same star in a warm amber circle. She wears the Camino.

The store app icon is a separate exercise — it must read at ~60px on a busy home
screen, which is a tighter brief than the brand mark.

## Lola as presence, not a face

Decision on record: **no animated face.** A face centers the guide and risks reading
as a kids' app in a high-stakes adult moment; it also adds none of what makes Lola
*Lola* (that's verbal + behavioral). Instead, the star **breathes** — presence
through motion, color, and pace, like Siri's orb rather than a character.

Six states, each tied to a real moment (see `lola-states.html`):

| State | When | What it conveys |
|---|---|---|
| Present | ambient, every screen | "I'm here. No rush." |
| Listening | user is answering | gentle attentive ripple |
| Finding the way | reading the answer, building the plan | compass turns, then **settles to north** (not a loading spinner) |
| Guiding | Lola is speaking | warm pulse, synced to audio |
| Holding | user is overwhelmed (high disposition) | **slows and softens** — the glyph does the disposition work |
| Done | a step completed | proportionate bloom, never confetti |

A literal face, if ever, is a later narrow experiment: a few *illustrated*, grown-up
expressions — never 3D or realtime-rigged — tested with real movers first.

## Voice — two registers, one brand

**Camino (system voice)** — plain, calm, active; sentence case. Names what happens.
- "Your next step"
- "Email me this plan"
- "Starts once your residency is granted"

**Lola (companion voice)** — warm, narrates the why, dry about the bureaucracy,
bilingual texture. Never trades truth for comfort; never soothes a penalty into
sounding optional. Canonical samples (the brief for any copywriter or voice actor):

- *Hello:* "Hey — it's Lola. I've already mapped what's ahead, so you don't have to hold it all in your head. Ready when you are."
- *Next step:* "First thing: your padrón. It's just registering at the town hall — fifteen minutes, and it unlocks almost everything else. I'll walk you through the how."
- *At the window:* "Ask for 'el volante de empadronamiento.' Bring your passport and a photocopy — Spain loves a photocopy, bring two."
- *When it's a lot:* "Hey. That's a lot, I know. So today, just one thing. The rest can wait, and I'm keeping track of it. You're not behind."
- *Straight talk:* "Let's be straight about this one. Modelo 720 carries real fines if it's missed, so I won't let it sneak up on you. Nothing to do until January — I've got it on the calendar."
- *A win:* "Your residence appointment is booked. That's a big one — really. Nice work."
- *Reading your post:* "Want me to read this letter to you? It's from the Ayuntamiento, and it's good news — your registration went through. Nothing you need to do."

## Spoken voice (TTS) — production direction

Use a neural TTS with a custom voice (ElevenLabs, or Azure / Google / OpenAI),
directed: warm, unhurried, a touch lower, ~0.9 pace.

**The decision to make early — clarity vs. accent.** Users are stressed and often
non-native. Lean: warm, *lightly* Spanish-inflected English for everything, with
authentic Spanish pronunciation only on the Spanish terms ("padrón," "volante"). If an
accent ever costs comprehension of a deadline, clarity wins — this is a high-stakes-
information app.

**Accessibility wedge worth building early:** Lola reading an official letter aloud,
calmly, in plain words, is something a silent checklist can never do. May be the
feature people remember.

## Scope

Guidance, not legal or tax advice. Lola keeps the map; a gestor signs the papers.
