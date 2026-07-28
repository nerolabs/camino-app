/**
 * Shared plumbing for the marketing assistant CLIs (camino-leads / camino-fb).
 *
 * THE ONE HARD GUARDRAIL (marketing/AUTOMATION.md): nothing in this module posts,
 * comments, votes, or sends anything, anywhere. No credentials for any platform live
 * here. Output is drafts + browser tabs + the clipboard — a human hits POST.
 *
 * Pure functions (keyword table, digit lint, digest render/parse) are exported for
 * tests and import nothing that needs network or keys. LLM + clipboard + reddit
 * helpers live below the pure section and are only touched by the CLIs.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { CATALOG, type Obligation } from '../../core/engine-controller';
import { describeTiming } from '../../core/guide-content';
import { GUIDE_PROSE } from '../../core/guide-prose';

export const REPO_ROOT = path.join(__dirname, '..', '..');
export const MARKETING_DIR = path.join(REPO_ROOT, 'marketing');
export const LEADS_DIR = path.join(MARKETING_DIR, 'leads');
export const STATE_DIR = path.join(MARKETING_DIR, 'state');
export const LEDGER_PATH = path.join(MARKETING_DIR, 'ledger.csv');
export const CONFIG_PATH = path.join(MARKETING_DIR, 'leads.config.json');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export type SubConfig = { name: string; no_link?: boolean; banned?: boolean };
export type LeadsConfig = {
  reddit_username: string;          // skip threads/comments authored by this account
  subs: SubConfig[];
  search_keywords: string[];        // extra probe terms folded into the OR-group search
                                    // probes (deriveSearchProbes) alongside the alias-seed keys
  alias_seeds: Record<string, string>; // keyword → guide id, or prefix pattern like "nlv-*"
  fb_link_groups: string[];         // FB groups where a link is tolerated (ledger/admin-approved)
  max_leads_per_day: number;
  max_leads_per_sub?: number;       // spread the day's leads across subs (default 3) — many
                                    // comments in one sub in one day is the campaign pattern
};

export function loadConfig(): LeadsConfig {
  // The live config is gitignored (per-community flags are relationship state, not code);
  // the committed .example is the fallback so a fresh clone works out of the box.
  const p = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : `${CONFIG_PATH.replace(/\.json$/, '.example.json')}`;
  return JSON.parse(fs.readFileSync(p, 'utf8')) as LeadsConfig;
}

// ---------------------------------------------------------------------------
// Keyword table — generated from the live catalog, not hardcoded (spec §A2).
// A new obligation automatically becomes a new listening keyword.
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'the', 'and', 'for', 'your', 'you', 'with', 'from', 'within', 'after', 'before',
  'spain', 'spanish', 'apply', 'application', 'register', 'registration', 'get',
  'first', 'days', 'months', 'years', 'each', 'if', 'of', 'in', 'to', 'a', 'an',
  'check', 'proof', 'exchange', 'certificate', 'card', 'appointment', 'income',
]);

export type KeywordEntry = { keyword: string; guideId: string };

/** Resolve an alias-seed target ("empadronamiento" or "nlv-*") to concrete guide ids. */
export function resolveAliasTarget(target: string, catalog: Obligation[] = CATALOG): string[] {
  if (target.endsWith('*')) {
    const prefix = target.slice(0, -1);
    return catalog.filter(o => o.id.startsWith(prefix)).map(o => o.id);
  }
  return catalog.some(o => o.id === target) ? [target] : [];
}

/**
 * Derive keyword → guide-id listening table from the catalog + alias seeds.
 * Keywords come from the obligation id's tokens and the distinctive words of its
 * English title; generic bureaucracy words are stopworded out.
 */
export function deriveKeywordTable(
  aliasSeeds: Record<string, string>,
  catalog: Obligation[] = CATALOG,
): KeywordEntry[] {
  const out: KeywordEntry[] = [];
  const seen = new Set<string>();
  const add = (keyword: string, guideId: string) => {
    const k = keyword.toLowerCase().trim();
    if (k.length < 3 || STOPWORDS.has(k)) return;
    const key = `${k}→${guideId}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ keyword: k, guideId });
  };

  for (const o of catalog) {
    for (const tok of o.id.split('-')) add(tok, o.id);
    const words = o.title.toLowerCase().replace(/[^a-záéíóúüñ0-9\s-]/gi, ' ').split(/\s+/);
    for (const w of words) if (w.length >= 5) add(w, o.id);
  }
  for (const [alias, target] of Object.entries(aliasSeeds)) {
    for (const id of resolveAliasTarget(target, catalog)) add(alias, id);
  }
  return out;
}

/**
 * Compress the listening vocabulary into a few OR-group search queries. Reddit search
 * speaks Lucene, so one probe covers ~6 terms — the whole alias vocabulary reaches the
 * deep /search.rss window (t=week) without multiplying requests (each probe is one
 * request per sub at RSS_DELAY_MS pace). Terms are the alias-seed keys plus the
 * config's extra search_keywords; accent/punctuation variants of the same phrase
 * collapse to one term because reddit search normalizes them anyway.
 */
export function deriveSearchProbes(
  aliasSeeds: Record<string, string>, extraTerms: string[] = [], groupSize = 6,
): string[] {
  const terms: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...extraTerms, ...Object.keys(aliasSeeds)]) {
    const norm = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    terms.push(raw.trim());
  }
  const probes: string[] = [];
  for (let i = 0; i < terms.length; i += groupSize) {
    probes.push(terms.slice(i, i + groupSize)
      // quote anything with a space or hyphen so OR binds the whole phrase,
      // not a stray token (lucene reads a bare mid-query "-x" as NOT x)
      .map(t => (/[^a-z0-9áéíóúüñ]/i.test(t) ? `"${t}"` : t)).join(' OR '));
  }
  return probes;
}

/** Match a thread's text against the table → guide ids with the keywords that hit. */
export function matchThread(text: string, table: KeywordEntry[]): Map<string, string[]> {
  const lower = ` ${text.toLowerCase()} `;
  const hits = new Map<string, string[]>();
  const bounded = new Map<string, boolean>(); // keyword → has a word-boundary occurrence
  for (const { keyword, guideId } of table) {
    let ok = bounded.get(keyword);
    if (ok === undefined) {
      ok = false;
      for (let idx = lower.indexOf(keyword); idx !== -1; idx = lower.indexOf(keyword, idx + 1)) {
        const before = lower[idx - 1] ?? ' ';
        const after = lower[idx + keyword.length] ?? ' ';
        if (!/[a-zá-ú0-9]/.test(before) && !/[a-zá-ú0-9]/.test(after)) { ok = true; break; }
      }
      bounded.set(keyword, ok);
    }
    if (!ok) continue;
    const arr = hits.get(guideId) ?? [];
    if (!arr.includes(keyword)) arr.push(keyword);
    hits.set(guideId, arr);
  }
  return hits;
}

/**
 * Take the day's leads from the confidence-sorted keepers, spreading them across subs:
 * at most `maxPerSub` from any one community, `maxTotal` overall. Concentration in one
 * sub — not total volume — is what reads as a campaign to a mod queue.
 */
export function pickLeads<T>(
  items: T[], subOf: (t: T) => string, maxTotal: number, maxPerSub: number,
): T[] {
  const perSub = new Map<string, number>();
  const out: T[] = [];
  for (const it of items) {
    if (out.length >= maxTotal) break;
    const s = subOf(it).toLowerCase();
    const n = perSub.get(s) ?? 0;
    if (n >= maxPerSub) continue;
    perSub.set(s, n + 1);
    out.push(it);
  }
  return out;
}

/**
 * Rank a candidate thread for classification order: distinct guide hits (the strongest
 * signal), an actual question mark in the title, and a real selftext beat pure recency —
 * so when volume spikes (cold start, 12 subs) city-sub chatter can't crowd out the good
 * threads.
 */
export function candidateScore(c: { title: string; body: string; hitCount: number }): number {
  return c.hitCount * 2 + (/[?¿]/.test(c.title) ? 2 : 0) + (c.body.length > 200 ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Digit lint — the guide-prose rule applied to drafts (spec §A4): a draft may not
// contain any number that isn't in the cited guide's own text.
// ---------------------------------------------------------------------------

const digitsOf = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []);

/** The guide's "own text": title + curated prose + the timing rule in words. */
export function guideOwnText(o: Obligation): string {
  return [o.title, GUIDE_PROSE[o.id] ?? '', describeTiming(o)].join('\n');
}

export function digitLintDraft(draft: string, guideText: string): { ok: boolean; offending: string[] } {
  const allowed = new Set(digitsOf(guideText));
  const offending = digitsOf(draft).filter(d => !allowed.has(d));
  return { ok: offending.length === 0, offending };
}

// ---------------------------------------------------------------------------
// Reddit RSS — the listening surface. Reddit 403s unauthenticated .json these days,
// but the Atom feeds (/new.rss, /search.rss, <permalink>.rss) still serve anonymous
// readers. Read-only by construction: an RSS feed cannot post.
// ---------------------------------------------------------------------------

export type RssEntry = {
  id: string;            // t3_xxx (posts) / t1_xxx (comments)
  author: string;        // reddit username, no /u/ prefix
  title: string;
  body: string;          // content with HTML stripped
  permalink: string;     // full https://www.reddit.com/... URL
  createdUtc: number;    // epoch seconds
};

export function unescapeHtml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

export function parseRssEntries(xml: string): RssEntry[] {
  const entries: RssEntry[] = [];
  for (const chunk of xml.split('<entry>').slice(1)) {
    const id = chunk.match(/<id>(t[13]_[a-z0-9]+)<\/id>/)?.[1];
    const link = chunk.match(/<link href="([^"]+)"/)?.[1];
    if (!id || !link) continue;
    const rawContent = chunk.match(/<content type="html">([\s\S]*?)<\/content>/)?.[1] ?? '';
    const body = unescapeHtml(rawContent)
      .replace(/<!-- SC_ON -->[\s\S]*$/, '')   // drop the "submitted by /u/x [link] [comments]" boilerplate
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const published = chunk.match(/<published>([^<]+)<\/published>/)?.[1];
    entries.push({
      id,
      author: chunk.match(/<author><name>\/u\/([^<]+)<\/name>/)?.[1]?.trim() ?? '',
      title: unescapeHtml(chunk.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''),
      body,
      permalink: unescapeHtml(link),
      createdUtc: published ? Date.parse(published) / 1000 : 0,
    });
  }
  return entries;
}

const RSS_UA = 'camino-leads/1.0 (rss reader; drafts only, never posts)';
// Anonymous reddit throttles hard (~a few requests/min per IP). This is a patience-based
// scanner — a slow morning cron, not a crawler. NOTE: the request goes through `curl`, not
// node's fetch: reddit fingerprints the HTTP client and 403/429s undici even when curl gets
// a 200 on the same URL in the same second (verified 2026-07-25).
const RSS_DELAY_MS = 12000;
const RSS_BACKOFF_MS = 65000;

function curlGet(url: string): { status: number; body: string } {
  const res = spawnSync('curl', ['-s', '-w', '\n%{http_code}', '-A', RSS_UA, '--max-time', '30', url], {
    encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
  });
  const out = res.stdout ?? '';
  const nl = out.lastIndexOf('\n');
  return { status: Number(out.slice(nl + 1)) || 0, body: out.slice(0, nl) };
}

/** Polite fetch of one reddit RSS feed: slow pace, one long retry on 403/429, [] on failure. */
export async function fetchRss(url: string): Promise<RssEntry[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { status, body } = curlGet(url);
    if (status === 200) {
      const entries = parseRssEntries(body);
      await new Promise(r => setTimeout(r, RSS_DELAY_MS));
      return entries;
    }
    const throttled = status === 429 || status === 403;
    console.error(`  ! ${status || 'network error'} ${url}${throttled && attempt === 0 ? ` — backing off ${RSS_BACKOFF_MS / 1000}s` : ''}`);
    if (!throttled || attempt === 1) break;
    await new Promise(r => setTimeout(r, RSS_BACKOFF_MS));
  }
  await new Promise(r => setTimeout(r, RSS_DELAY_MS));
  return [];
}

// ---------------------------------------------------------------------------
// Lead digests — marketing/leads/YYYY-MM-DD[-fb].md
// Human-readable markdown; each lead carries a machine-readable HTML comment so
// the `go` paste loop can parse the file back without fragile prose parsing.
// ---------------------------------------------------------------------------

export type Lead = {
  platform: 'reddit' | 'fb';
  sub: string;                 // subreddit or FB group name
  title: string;
  permalink: string;
  guideId: string;
  matched: string[];           // keywords that surfaced it
  why: string;                 // classifier's reason
  withLink: boolean;
  draft: string;
  lintOk: boolean;
  posted: boolean;
  skipped: boolean;
};

export function renderDigest(date: string, leads: Lead[]): string {
  const lines: string[] = [
    `# Camino leads — ${date}`,
    '',
    '_Drafts only. Nothing here was posted by a machine; you hit POST. `npm run leads:go` walks these with the clipboard._',
    '',
  ];
  leads.forEach((l, i) => {
    const meta = { platform: l.platform, sub: l.sub, permalink: l.permalink, guideId: l.guideId, withLink: l.withLink };
    lines.push(`<!-- lead ${JSON.stringify(meta)} -->`);
    lines.push(`## ${i + 1}. ${l.platform === 'reddit' ? 'r/' : ''}${l.sub} — ${l.title.replace(/\n/g, ' ')}`);
    lines.push('');
    lines.push(`- thread: ${l.permalink}`);
    lines.push(`- guide: ${l.guideId}${l.matched.length ? ` (matched: ${l.matched.join(', ')})` : ''}`);
    lines.push(`- why: ${l.why.replace(/\n/g, ' ')}`);
    lines.push(`- link in draft: ${l.withLink ? 'yes' : 'no'}${l.lintOk ? '' : ' — ⚠️ DIGIT LINT FAILED, edit before posting'}`);
    lines.push(`- [${l.posted ? 'x' : ' '}] posted / [${l.skipped ? 'x' : ' '}] skipped`);
    lines.push('');
    for (const dl of l.draft.split('\n')) lines.push(`> ${dl}`);
    lines.push('');
  });
  if (leads.length === 0) lines.push('_No leads today._', '');
  return lines.join('\n');
}

export function parseDigest(md: string): Lead[] {
  const leads: Lead[] = [];
  const blocks = md.split('<!-- lead ').slice(1);
  for (const block of blocks) {
    const metaEnd = block.indexOf(' -->');
    if (metaEnd === -1) continue;
    const meta = JSON.parse(block.slice(0, metaEnd));
    const body = block.slice(metaEnd + 4);
    const title = body.match(/^\n?## \d+\. .*? — (.*)$/m)?.[1] ?? '';
    const matched = body.match(/^- guide: .*\(matched: (.*)\)$/m)?.[1]?.split(', ') ?? [];
    const why = body.match(/^- why: (.*)$/m)?.[1] ?? '';
    const lintOk = !/DIGIT LINT FAILED/.test(body);
    const boxes = body.match(/^- \[(x| )\] posted \/ \[(x| )\] skipped$/m);
    const draft = body.split('\n').filter(l => l.startsWith('> ')).map(l => l.slice(2)).join('\n');
    leads.push({
      platform: meta.platform, sub: meta.sub, permalink: meta.permalink,
      guideId: meta.guideId, withLink: meta.withLink,
      title, matched, why, lintOk, draft,
      posted: boxes?.[1] === 'x', skipped: boxes?.[2] === 'x',
    });
  }
  return leads;
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function digestPath(date: string, platform: 'reddit' | 'fb'): string {
  return path.join(LEADS_DIR, `${date}${platform === 'fb' ? '-fb' : ''}.md`);
}

// ---------------------------------------------------------------------------
// Ledger — marketing/ledger.csv (joined against PostHog on the Friday check)
// ---------------------------------------------------------------------------

export function appendLedger(l: Lead): void {
  fs.mkdirSync(MARKETING_DIR, { recursive: true });
  if (!fs.existsSync(LEDGER_PATH)) {
    fs.writeFileSync(LEDGER_PATH, 'date,platform,sub,thread,guide_id,link\n');
  }
  const csv = [todayStamp(), l.platform, l.sub, l.permalink, l.guideId, l.withLink ? 'y' : 'n']
    .map(v => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',');
  fs.appendFileSync(LEDGER_PATH, csv + '\n');
}

// ---------------------------------------------------------------------------
// Seen-state (never surface the same thread twice)
// ---------------------------------------------------------------------------

export function loadSeen(): Set<string> {
  const p = path.join(STATE_DIR, 'seen.json');
  if (!fs.existsSync(p)) return new Set();
  return new Set(JSON.parse(fs.readFileSync(p, 'utf8')) as string[]);
}

export function saveSeen(seen: Set<string>): void {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(path.join(STATE_DIR, 'seen.json'), JSON.stringify([...seen], null, 1));
}

// ---------------------------------------------------------------------------
// Env / LLM. Model: Opus — these drafts go out under Andrew's name; quality over
// pennies (a full daily run is still well under a dollar at this volume).
// ---------------------------------------------------------------------------

export const MODEL = 'claude-opus-4-8';

export function loadDotEnv(): void {
  if (process.env.ANTHROPIC_API_KEY) return;
  const envPath = path.join(REPO_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

let _client: import('@anthropic-ai/sdk').default | null = null;
export async function anthropic() {
  if (!_client) {
    loadDotEnv();
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    _client = new Anthropic();
  }
  return _client;
}

/** One completion, plain text back. Small helper so the CLIs stay readable. */
export async function complete(system: string, user: string, maxTokens = 1500): Promise<string> {
  const client = await anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  return res.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('');
}

/** Extract the first JSON array/object from an LLM reply (tolerates prose around it). */
export function extractJson<T>(text: string): T {
  const start = text.search(/[[{]/);
  if (start === -1) throw new Error(`no JSON in LLM reply: ${text.slice(0, 200)}`);
  // walk to the matching close bracket
  const open = text[start];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close && --depth === 0) {
      return JSON.parse(text.slice(start, i + 1)) as T;
    }
  }
  throw new Error('unbalanced JSON in LLM reply');
}

// ---------------------------------------------------------------------------
// The comment-engine drafting rules (spec §A4), shared by both CLIs
// ---------------------------------------------------------------------------

export const DRAFT_SYSTEM = `You draft reddit/facebook comments for Andrew, who built getcamino.app
(a free deterministic moving-to-Spain roadmap tool). Rules, all hard:
- Answer the question fully IN THE COMMENT first — 2 to 4 sentences of real, correct content
  sourced ONLY from the guide text you are given. The link (when allowed) is a footnote, never
  the payload.
- Never state a number, deadline, fee, or threshold that is not literally present in the guide
  text provided. If the guide text has no number, the comment has no number.
- Tone: helpful regular forum user, not brand voice. No emoji. Never open with "Great question"
  or similar. Vary sentence structure between drafts.
- If told the draft is LINK-FREE: no URL at all, no site mention.
- If told the draft carries a LINK: end with the exact link line you are given, then on the same
  line the parenthetical: (Disclosure: my site — free, no signup.)
- Output ONLY the comment text. No preamble, no quotes around it.`;

export function guideLink(guideId: string, utmSource: string): string {
  return `getcamino.app/guide/${guideId}?utm_source=${utmSource}`;
}

/** Draft one comment; digit-lints it; retries once with a no-numbers nudge on failure. */
export async function draftComment(opts: {
  question: string; guide: Obligation; withLink: boolean; utmSource: string;
}): Promise<{ draft: string; lintOk: boolean }> {
  const ownText = guideOwnText(opts.guide);
  const linkInstr = opts.withLink
    ? `The draft carries a LINK. Link line to use verbatim: More detail + the official source: ${guideLink(opts.guide.id, opts.utmSource)}`
    : 'The draft is LINK-FREE.';
  const user = `THE QUESTION/POST:\n${opts.question}\n\nTHE GUIDE TEXT (your only source of facts):\n${ownText}\n\n${linkInstr}`;
  let draft = (await complete(DRAFT_SYSTEM, user)).trim();
  let lint = digitLintDraft(draft, ownText);
  if (!lint.ok) {
    draft = (await complete(
      DRAFT_SYSTEM,
      `${user}\n\nYour previous draft used numbers not present in the guide text (${lint.offending.join(', ')}). Rewrite it using NO numbers at all.`,
    )).trim();
    lint = digitLintDraft(draft, ownText);
  }
  return { draft, lintOk: lint.ok };
}

// ---------------------------------------------------------------------------
// Clipboard / tabs / keypress — the "Andrew hits POST" plumbing (macOS)
// ---------------------------------------------------------------------------

export function copyToClipboard(text: string): void {
  spawnSync('pbcopy', { input: text });
}

export function openTab(url: string): void {
  spawnSync('open', [url]);
}

export async function waitKey(prompt: string): Promise<string> {
  process.stdout.write(prompt);
  return new Promise(resolve => {
    const stdin = process.stdin;
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.once('data', (b: Buffer) => {
      stdin.setRawMode?.(false);
      stdin.pause();
      const ch = b.toString('utf8');
      process.stdout.write(ch + '\n');
      if (ch === '') process.exit(130); // ctrl-c
      resolve(ch.toLowerCase());
    });
  });
}

/**
 * The shared paste loop (`go`): for each unhandled lead — draft on clipboard, tab open,
 * one keypress: p = posted (ledger + checkbox) · s = skipped · Enter = leave for later ·
 * q = quit. Rewrites the digest after every mark so progress survives a quit.
 */
export async function pasteLoop(file: string, date: string): Promise<void> {
  if (!fs.existsSync(file)) {
    console.log(`No digest at ${file} — run the scan/draft step first.`);
    return;
  }
  const leads = parseDigest(fs.readFileSync(file, 'utf8'));
  const pending = leads.filter(l => !l.posted && !l.skipped);
  if (pending.length === 0) {
    console.log('Nothing pending — every lead in the digest is already marked.');
    return;
  }
  console.log(`${pending.length} pending lead(s). Draft goes on the clipboard, tab opens, you paste + POST.\n`);
  for (const lead of pending) {
    if (!lead.lintOk) console.log('⚠️  This draft FAILED the digit lint — edit before posting.');
    copyToClipboard(lead.draft);
    openTab(lead.permalink);
    console.log(`→ ${lead.platform === 'reddit' ? 'r/' : ''}${lead.sub} — ${lead.title}`);
    const key = await waitKey('   [p]osted  [s]kipped  [Enter] later  [q]uit: ');
    if (key === 'q') break;
    if (key === 'p') { lead.posted = true; appendLedger(lead); }
    if (key === 's') lead.skipped = true;
    fs.writeFileSync(file, renderDigest(date, leads));
  }
  console.log('\nDone. Digest updated:', path.relative(REPO_ROOT, file));
}
