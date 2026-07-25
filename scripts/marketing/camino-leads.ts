/**
 * camino-leads — the Reddit lead scanner (marketing/AUTOMATION.md, Component A).
 *
 * `npm run leads`            scan → classify → draft → digest (default subcommand: scan)
 * `npm run leads -- --tabs`  also open each surfaced thread in a browser tab
 * `npm run leads -- --dry-run`  print the digest to stdout; write no state, open nothing
 * `npm run leads:go`         the paste loop — clipboard + tab per lead, YOU hit POST
 *
 * GUARDRAIL: this tool never posts, comments, votes, or sends anything, anywhere.
 * It has no Reddit credentials — it reads the public JSON endpoints only.
 */
import fs from 'fs';
import { CATALOG, type Obligation } from '../../core/engine-controller';
import {
  loadConfig, deriveKeywordTable, matchThread, draftComment, fetchRss, candidateScore,
  pickLeads, renderDigest, digestPath, todayStamp, loadSeen, saveSeen, complete,
  extractJson, openTab, pasteLoop, LEADS_DIR, type Lead, type RssEntry,
} from './lib';

const CLASSIFY_CHUNK = 40;      // candidates per LLM call
const MAX_CLASSIFY_TOTAL = 200; // hard LLM budget bound per run (5 calls) — cold-start protection
const MIN_CONFIDENCE = 0.6;
const MAX_AGE_H = 48;

type RedditPost = RssEntry & { subreddit: string };

async function alreadyCommented(permalink: string, username: string): Promise<boolean> {
  if (!username) return false;
  const entries = await fetchRss(`${permalink}.rss`);
  // first entry is the post itself; the rest are comments
  return entries.slice(1).some(e => e.author === username);
}

type Candidate = { post: RedditPost; guideHits: Map<string, string[]> };
type Verdict = { index: number; answerable: boolean; guide_id: string; confidence: number; link: boolean; why: string };

async function classify(candidates: Candidate[]): Promise<Verdict[]> {
  const catalogIds = CATALOG.map(o => o.id).join(', ');
  const items = candidates.map((c, i) =>
    `[${i}] r/${c.post.subreddit} — "${c.post.title}"\n${c.post.body.slice(0, 600)}\nkeyword hits: ${
      [...c.guideHits.entries()].map(([g, ks]) => `${g}(${ks.join('/')})`).join(', ')}`,
  ).join('\n\n---\n\n');
  const system = `You triage reddit threads for a free moving-to-Spain roadmap tool.
For each thread decide: is this an ANSWERABLE question from a real person planning a move to
Spain (not news, rant, meme, survey, or a question already answered well in the title itself)?
Pick the single best-fitting guide id from this list (or the keyword hits given): ${catalogIds}.
confidence: 0..1 that a helpful comment citing that guide genuinely answers the thread. Set
link=true ONLY when the guide's extra detail/official source adds real value beyond the comment
itself — target: at most 1 in 3 threads get a link.
Reply with ONLY a JSON array: [{"index":n,"answerable":bool,"guide_id":"...","confidence":0.0,"link":bool,"why":"one line"}]`;
  const reply = await complete(system, items, 3000);
  return extractJson<Verdict[]>(reply);
}

async function scan(flags: Set<string>): Promise<void> {
  const dryRun = flags.has('--dry-run');
  const cfg = loadConfig();
  const table = deriveKeywordTable(cfg.alias_seeds);
  const seen = loadSeen();
  const now = Date.now() / 1000;
  const guideById = new Map(CATALOG.map(o => [o.id, o]));

  // 1. Fetch — /new.rss per sub, plus /search.rss for the configured probe keywords
  // (reddit 403s anonymous .json; the Atom feeds still serve — see lib.ts fetchRss)
  const posts = new Map<string, RedditPost>();
  for (const sub of cfg.subs) {
    if (sub.banned) continue;
    console.log(`fetching r/${sub.name} ...`);
    const urls = [
      `https://www.reddit.com/r/${sub.name}/new.rss?limit=25`,
      ...cfg.search_keywords.map(k =>
        `https://www.reddit.com/r/${sub.name}/search.rss?q=${encodeURIComponent(k)}&restrict_sr=1&sort=new&t=week`),
    ];
    for (const url of urls) {
      for (const e of await fetchRss(url)) {
        if (e.id.startsWith('t3_')) posts.set(e.id, { ...e, subreddit: sub.name });
      }
    }
  }

  // 2. Match + filter
  const candidates: Candidate[] = [];
  for (const post of posts.values()) {
    if (seen.has(post.id)) continue;
    if ((now - post.createdUtc) / 3600 > MAX_AGE_H) continue;
    if (cfg.reddit_username && post.author === cfg.reddit_username) continue;
    const guideHits = matchThread(`${post.title}\n${post.body}`, table);
    if (guideHits.size === 0) continue;
    candidates.push({ post, guideHits });
  }
  // Best material first: match quality over recency (recency only breaks ties), so a
  // volume spike can't push good threads past the classification budget.
  const scoreOf = (c: Candidate) =>
    candidateScore({ title: c.post.title, body: c.post.body, hitCount: c.guideHits.size });
  candidates.sort((a, b) => scoreOf(b) - scoreOf(a) || b.post.createdUtc - a.post.createdUtc);
  const toClassify = candidates.slice(0, MAX_CLASSIFY_TOTAL);
  console.log(`${posts.size} posts fetched → ${candidates.length} keyword matches → classifying ${toClassify.length}`);
  if (toClassify.length === 0) { console.log('Zero leads today.'); return; }

  // 3. Classify — every candidate, in chunks (each chunk is one LLM call)
  const allVerdicts: Verdict[] = [];
  for (let off = 0; off < toClassify.length; off += CLASSIFY_CHUNK) {
    const chunk = toClassify.slice(off, off + CLASSIFY_CHUNK);
    try {
      for (const v of await classify(chunk)) allVerdicts.push({ ...v, index: v.index + off });
    } catch (e) {
      console.error(`  ! classify chunk @${off} failed: ${(e as Error).message}`);
    }
  }

  // The funnel, visible: what the classifier rejected and why, so the daily yield
  // reads as judgment, not a black box.
  const notAnswerable = allVerdicts.filter(v => !v.answerable);
  const badGuide = allVerdicts.filter(v => v.answerable && !guideById.has(v.guide_id));
  const lowConf = allVerdicts.filter(v => v.answerable && guideById.has(v.guide_id) && v.confidence < MIN_CONFIDENCE);
  const kept = allVerdicts
    .filter(v => v.answerable && v.confidence >= MIN_CONFIDENCE && guideById.has(v.guide_id))
    .sort((a, b) => b.confidence - a.confidence);
  console.log(`classified ${allVerdicts.length}: ${notAnswerable.length} not answerable · ${lowConf.length} low confidence · ${badGuide.length} no matching guide · ${kept.length} kept${kept.length > cfg.max_leads_per_day ? ` (drafting top ${cfg.max_leads_per_day})` : ''}`);
  const nearMisses = lowConf.filter(v => v.confidence >= 0.4).sort((a, b) => b.confidence - a.confidence);
  for (const v of nearMisses.slice(0, 8)) {
    const { post } = toClassify[v.index];
    console.log(`  near miss ${v.confidence.toFixed(2)} r/${post.subreddit} — ${post.title.slice(0, 70)} → ${v.guide_id} (${v.why})`);
  }

  // Everything classified is "seen" — a rejected thread stays rejected; only posts we
  // never got to (beyond the budget cap) may resurface tomorrow.
  for (const c of toClassify) seen.add(c.post.id);

  const verdicts = pickLeads(
    kept, v => toClassify[v.index].post.subreddit,
    cfg.max_leads_per_day, cfg.max_leads_per_sub ?? 3,
  );
  for (const v of kept.filter(k => !verdicts.includes(k)).slice(0, 5)) {
    const { post } = toClassify[v.index];
    console.log(`  over cap (daily or per-sub) ${v.confidence.toFixed(2)} r/${post.subreddit} — ${post.title.slice(0, 70)} → ${v.guide_id}`);
  }
  if (verdicts.length === 0) {
    if (!flags.has('--dry-run')) saveSeen(seen);
    console.log('Classifier kept nothing. Zero leads today.');
    return;
  }

  // 4. Enforce the link budget (≤1 in 3) + per-sub no_link flags, then draft
  const linkBudget = Math.max(1, Math.floor(verdicts.length / 3));
  let linksUsed = 0;
  const leads: Lead[] = [];
  for (const v of verdicts) {
    const { post, guideHits } = toClassify[v.index];
    if (await alreadyCommented(post.permalink, cfg.reddit_username)) continue;
    const subCfg = cfg.subs.find(s => s.name.toLowerCase() === post.subreddit.toLowerCase());
    const withLink = v.link && !subCfg?.no_link && linksUsed < linkBudget;
    if (withLink) linksUsed++;
    const guide = guideById.get(v.guide_id) as Obligation;
    console.log(`drafting: r/${post.subreddit} — ${post.title.slice(0, 70)} → ${v.guide_id}${withLink ? ' +link' : ''}`);
    const { draft, lintOk } = await draftComment({
      question: `${post.title}\n\n${post.body.slice(0, 1500)}`,
      guide, withLink, utmSource: `rd-${post.subreddit.toLowerCase()}`,
    });
    leads.push({
      platform: 'reddit', sub: post.subreddit, title: post.title,
      permalink: post.permalink,
      guideId: v.guide_id, matched: guideHits.get(v.guide_id) ?? [],
      why: v.why, withLink, draft, lintOk, posted: false, skipped: false,
    });
  }

  // 5. Digest (+ optional tabs). Dry-run prints and persists nothing.
  const date = todayStamp();
  const digest = renderDigest(date, leads);
  if (dryRun) {
    console.log('\n----- DRY RUN — digest below, nothing written, no tabs -----\n');
    console.log(digest);
    return;
  }
  fs.mkdirSync(LEADS_DIR, { recursive: true });
  const file = digestPath(date, 'reddit');
  fs.writeFileSync(file, digest);
  saveSeen(seen);
  console.log(`\n${leads.length} lead(s) → ${file}`);
  if (flags.has('--tabs')) for (const l of leads) openTab(l.permalink);
  console.log('Next: `npm run leads:go` for the clipboard walk — you hit POST.');
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const cmd = args.find(a => !a.startsWith('--')) ?? 'scan';
  if (cmd === 'scan') await scan(flags);
  else if (cmd === 'go') await pasteLoop(digestPath(todayStamp(), 'reddit'), todayStamp());
  else { console.error(`unknown subcommand: ${cmd} (use: scan | go)`); process.exit(1); }
}

main().catch(e => { console.error(e); process.exit(1); });
