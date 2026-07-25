/**
 * The marketing assistant's pure core (scripts/marketing/lib.ts): the catalog-derived
 * keyword table, the draft digit-lint (the guide-prose honesty rule applied to outbound
 * comments), and the digest render/parse round-trip the paste loop depends on.
 * No network, no LLM, no filesystem writes.
 */
import { describe, it, expect } from 'vitest';
import { CATALOG } from '../core/engine-controller';
import {
  deriveKeywordTable, resolveAliasTarget, matchThread, parseRssEntries, candidateScore,
  digitLintDraft, guideOwnText, renderDigest, parseDigest, type Lead,
} from '../scripts/marketing/lib';
import fs from 'fs';
import path from 'path';

const SEEDS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'marketing', 'leads.config.example.json'), 'utf8'),
).alias_seeds as Record<string, string>;

describe('keyword table — generated from the catalog, not hardcoded', () => {
  const table = deriveKeywordTable(SEEDS);

  it('every catalog obligation contributes at least one listening keyword', () => {
    const covered = new Set(table.map(e => e.guideId));
    for (const o of CATALOG) {
      expect(covered.has(o.id), `${o.id} has no keyword — a new obligation must auto-enroll`).toBe(true);
    }
  });

  it('alias seeds map colloquial phrasing to the right guide (padrón → empadronamiento)', () => {
    const hits = matchThread('How do I register on the padrón in Valencia?', table);
    expect([...hits.keys()]).toContain('empadronamiento');
  });

  it('prefix seeds fan out (nlv-* reaches every NLV guide)', () => {
    const ids = resolveAliasTarget('nlv-*');
    expect(ids.length).toBeGreaterThan(3);
    expect(ids.every(id => id.startsWith('nlv-'))).toBe(true);
  });

  it('every alias seed resolves to at least one real catalog id (no dead seeds)', () => {
    for (const target of Object.values(SEEDS)) {
      expect(resolveAliasTarget(target).length, `seed target "${target}" matches nothing`).toBeGreaterThan(0);
    }
  });

  it('matching respects word boundaries (no "nie" inside "denied" or "niece")', () => {
    const table2 = [{ keyword: 'nie', guideId: 'nie-number' }];
    expect(matchThread('my application was denied by my niece', table2).size).toBe(0);
    expect(matchThread('where do I get my NIE?', table2).size).toBe(1);
  });

  it('candidateScore ranks a real question with substance above bare chatter', () => {
    const question = candidateScore({ title: '¿NIE before padrón?', body: 'x'.repeat(300), hitCount: 2 });
    const chatter = candidateScore({ title: 'beach recs', body: 'short', hitCount: 1 });
    expect(question).toBeGreaterThan(chatter);
    // hits are the strongest signal: three guide hits outrank one hit + a question mark
    expect(candidateScore({ title: 'a', body: '', hitCount: 3 }))
      .toBeGreaterThan(candidateScore({ title: 'b?', body: '', hitCount: 1 }));
  });
});

describe('reddit RSS parsing — the listening surface (anonymous .json is 403 now)', () => {
  // Trimmed real entry shape from r/GoingToSpain/new.rss, 2026-07-25
  const xml = `<?xml version="1.0" encoding="UTF-8"?><feed><entry><author><name>/u/mover42</name><uri>https://www.reddit.com/user/mover42</uri></author><category term="GoingToSpain" label="r/GoingToSpain"/><content type="html">&lt;!-- SC_OFF --&gt;&lt;div class=&quot;md&quot;&gt;&lt;p&gt;Do I need the padr&#243;n before the TIE appointment?&lt;/p&gt; &lt;/div&gt;&lt;!-- SC_ON --&gt; &amp;#32; submitted by &amp;#32; &lt;a href=&quot;https://www.reddit.com/user/mover42&quot;&gt; /u/mover42 &lt;/a&gt;</content><id>t3_1abcde</id><link href="https://www.reddit.com/r/GoingToSpain/comments/1abcde/padron_before_tie/" /><updated>2026-07-25T15:53:17+00:00</updated><published>2026-07-25T15:53:17+00:00</published><title>Padr&#243;n before TIE?</title></entry></feed>`;

  it('extracts id, author, title, permalink, timestamp, and de-HTML-ed body', () => {
    const [e] = parseRssEntries(xml);
    expect(e.id).toBe('t3_1abcde');
    expect(e.author).toBe('mover42');
    expect(e.title).toBe('Padrón before TIE?');
    expect(e.permalink).toBe('https://www.reddit.com/r/GoingToSpain/comments/1abcde/padron_before_tie/');
    expect(e.createdUtc).toBe(Date.parse('2026-07-25T15:53:17+00:00') / 1000);
    expect(e.body).toBe('Do I need the padrón before the TIE appointment?');
    expect(e.body).not.toContain('submitted by'); // boilerplate stripped
  });

  it('parsed body feeds the keyword matcher (padrón → empadronamiento)', () => {
    const [e] = parseRssEntries(xml);
    const hits = matchThread(`${e.title}\n${e.body}`, deriveKeywordTable(SEEDS));
    expect([...hits.keys()]).toContain('empadronamiento');
  });
});

describe('draft digit-lint — the guide-prose rule applied to outbound comments', () => {
  const nlv = CATALOG.find(o => o.id === 'nlv-income-proof')!;
  const own = guideOwnText(nlv);

  it('a draft restating the guide\'s own figures passes', () => {
    expect(own).toContain('28,800'); // sanity: the figure lives in the guide's own text
    const r = digitLintDraft('The threshold is €28,800 a year for the main applicant.', own);
    expect(r.ok).toBe(true);
  });

  it('a draft inventing a number the guide does not carry fails, naming the digit', () => {
    const r = digitLintDraft('You need €31,000 in the bank.', own);
    expect(r.ok).toBe(false);
    expect(r.offending).toContain('31,000');
  });

  it('a number-free draft always passes', () => {
    expect(digitLintDraft('Book the appointment first and gather documents toward it.', own).ok).toBe(true);
  });
});

describe('digest render/parse round-trip — what the paste loop reads back', () => {
  const lead: Lead = {
    platform: 'reddit', sub: 'GoingToSpain',
    title: 'NLV income — am I close enough?',
    permalink: 'https://www.reddit.com/r/GoingToSpain/comments/abc/x/',
    guideId: 'nlv-income-proof', matched: ['nlv', 'income'],
    why: 'real mover asking an answerable means-test question',
    withLink: true, lintOk: true, posted: false, skipped: false,
    draft: 'First line of the draft.\n\nSecond paragraph with the link.',
  };

  it('a lead survives render → parse intact', () => {
    const [back] = parseDigest(renderDigest('2026-07-25', [lead]));
    expect(back.permalink).toBe(lead.permalink);
    expect(back.guideId).toBe(lead.guideId);
    expect(back.sub).toBe(lead.sub);
    expect(back.withLink).toBe(true);
    expect(back.draft).toBe(lead.draft);
    expect(back.posted).toBe(false);
    expect(back.skipped).toBe(false);
  });

  it('checkbox marks (posted/skipped) round-trip so progress survives a quit', () => {
    const md = renderDigest('2026-07-25', [
      { ...lead, posted: true },
      { ...lead, title: 'second', skipped: true },
    ]);
    const back = parseDigest(md);
    expect(back[0].posted).toBe(true);
    expect(back[0].skipped).toBe(false);
    expect(back[1].skipped).toBe(true);
  });

  it('a lint-failed draft keeps its warning through the round-trip', () => {
    const [back] = parseDigest(renderDigest('2026-07-25', [{ ...lead, lintOk: false }]));
    expect(back.lintOk).toBe(false);
  });
});
