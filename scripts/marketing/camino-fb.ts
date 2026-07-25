/**
 * camino-fb — the Facebook assist (marketing/AUTOMATION.md, Component B).
 *
 * FB has no API and scraping a logged-in session risks the personal account, so input is
 * manual capture: drop post URLs into marketing/fb-inbox.txt (one per line, optional
 * `| note` describing what the post asks). Then:
 *
 * `npm run fb:draft`             draft a comment per inbox URL → today's -fb digest
 * `npm run fb:draft -- --dry-run` print the digest, write nothing
 * `npm run fb:go`                paste loop: draft on clipboard, tab open, YOU hit POST
 *
 * GUARDRAIL: never auto-fills the FB comment box, never posts. Clipboard + tabs only.
 * FB drafts default to LINK-FREE; a link only when the group is in fb_link_groups
 * (admin-approved / ledger shows tolerance).
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { CATALOG, type Obligation } from '../../core/engine-controller';
import {
  loadConfig, deriveKeywordTable, matchThread, draftComment, renderDigest, digestPath,
  todayStamp, complete, extractJson, pasteLoop, MARKETING_DIR, LEADS_DIR, type Lead,
} from './lib';

const INBOX = path.join(MARKETING_DIR, 'fb-inbox.txt');

function groupFromUrl(url: string): string {
  return url.match(/facebook\.com\/groups\/([^/?]+)/)?.[1] ?? 'group';
}

async function askLine(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(question, a => { rl.close(); res(a.trim()); }));
}

async function pickGuide(note: string): Promise<{ guide_id: string; why: string } | null> {
  const table = deriveKeywordTable(loadConfig().alias_seeds);
  const hits = [...matchThread(note, table).keys()];
  const system = `Pick the single catalog guide id that best answers a Facebook post about moving
to Spain. Valid ids: ${CATALOG.map(o => o.id).join(', ')}.
Keyword hints (may be empty): ${hits.join(', ') || 'none'}.
If nothing genuinely fits, use guide_id "".
Reply ONLY with JSON: {"guide_id":"...","why":"one line"}`;
  const v = extractJson<{ guide_id: string; why: string }>(await complete(system, note, 300));
  return CATALOG.some(o => o.id === v.guide_id) ? v : null;
}

async function draft(flags: Set<string>): Promise<void> {
  const dryRun = flags.has('--dry-run');
  const cfg = loadConfig();
  if (!fs.existsSync(INBOX)) {
    fs.mkdirSync(MARKETING_DIR, { recursive: true });
    fs.writeFileSync(INBOX, '# Drop FB post URLs here, one per line. Optional: url | what the post asks\n');
    console.log(`Created ${INBOX} — drop FB post URLs in it, then rerun.`);
    return;
  }
  const lines = fs.readFileSync(INBOX, 'utf8').split('\n');
  const pending = lines
    .map((raw, i) => ({ raw: raw.trim(), i }))
    .filter(l => l.raw && !l.raw.startsWith('#'));
  if (pending.length === 0) { console.log('fb-inbox.txt is empty — nothing to draft.'); return; }

  const guideById = new Map(CATALOG.map(o => [o.id, o]));
  const leads: Lead[] = [];
  for (const { raw, i } of pending) {
    const [url, ...noteParts] = raw.split('|');
    const cleanUrl = url.trim();
    let note = noteParts.join('|').trim();
    if (!note) {
      if (!process.stdin.isTTY) { console.log(`skipping (no note, non-interactive): ${cleanUrl}`); continue; }
      note = await askLine(`What does this post ask? ${cleanUrl}\n> `);
      if (!note) continue;
    }
    const pick = await pickGuide(note);
    if (!pick) { console.log(`no guide fits: ${cleanUrl} (${note})`); continue; }
    const group = groupFromUrl(cleanUrl);
    const withLink = cfg.fb_link_groups.includes(group);
    const guide = guideById.get(pick.guide_id) as Obligation;
    console.log(`drafting: ${group} — ${note.slice(0, 60)} → ${pick.guide_id}${withLink ? ' +link' : ' (link-free)'}`);
    const { draft: text, lintOk } = await draftComment({
      question: note, guide, withLink, utmSource: `fb-${group.toLowerCase()}`,
    });
    leads.push({
      platform: 'fb', sub: group, title: note, permalink: cleanUrl,
      guideId: pick.guide_id, matched: [], why: pick.why,
      withLink, draft: text, lintOk, posted: false, skipped: false,
    });
    if (!dryRun) lines[i] = `# done ${raw}`;
  }

  const date = todayStamp();
  const digest = renderDigest(date, leads);
  if (dryRun) {
    console.log('\n----- DRY RUN — digest below, nothing written -----\n');
    console.log(digest);
    return;
  }
  fs.mkdirSync(LEADS_DIR, { recursive: true });
  const file = digestPath(date, 'fb');
  // append-safe: merge with any leads already drafted today
  if (fs.existsSync(file)) {
    const { parseDigest } = await import('./lib');
    const existing = parseDigest(fs.readFileSync(file, 'utf8'));
    fs.writeFileSync(file, renderDigest(date, [...existing, ...leads]));
  } else {
    fs.writeFileSync(file, digest);
  }
  fs.writeFileSync(INBOX, lines.join('\n'));
  console.log(`\n${leads.length} draft(s) → ${file}`);
  console.log('Next: `npm run fb:go` for the clipboard walk — you hit POST.');
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const cmd = args.find(a => !a.startsWith('--')) ?? 'draft';
  if (cmd === 'draft') await draft(flags);
  else if (cmd === 'go') await pasteLoop(digestPath(todayStamp(), 'fb'), todayStamp());
  else { console.error(`unknown subcommand: ${cmd} (use: draft | go)`); process.exit(1); }
}

main().catch(e => { console.error(e); process.exit(1); });
