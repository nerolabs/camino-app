/**
 * CLI wrapper for the catalog↔interview contract audit (invariant 2) plus a persona sanity pass.
 * `npm run audit` — exits non-zero on hard failures, so deploy.sh can gate on it.
 */
import { auditCatalog } from '../core/catalog-audit';
import { TEST_PERSONAS } from '../core/test-personas';
import { SLOTS, derive, type Profile } from '../core/interview-controller';
import { buildPlan } from '../core/engine-controller';

const { errors, warnings } = auditCatalog();

// Personas must only answer real slot fields (catch typos / fields that drifted out of the
// interview), and every persona must produce a non-empty plan without throwing.
const slotFields = new Set(SLOTS.map(s => s.field));
for (const persona of TEST_PERSONAS) {
  for (const key of Object.keys(persona.answers)) {
    if (!slotFields.has(key)) errors.push(`persona "${persona.name}": answers unknown slot "${key}"`);
  }
  try {
    const p: Profile = { ...persona.answers };
    derive(p);
    const plan = buildPlan(p);
    if (plan.length === 0) errors.push(`persona "${persona.name}": produces an EMPTY plan`);
  } catch (e) {
    errors.push(`persona "${persona.name}": buildPlan threw — ${String(e)}`);
  }
}

if (warnings.length) {
  console.log(`⚠ ${warnings.length} warning(s):`);
  for (const w of warnings) console.log('   ' + w);
}
if (errors.length) {
  console.error(`✗ ${errors.length} hard failure(s):`);
  for (const e of errors) console.error('   ' + e);
  process.exit(1);
}
console.log(`✓ catalog audit clean — invariant 2 holds (${warnings.length} warning(s), ${TEST_PERSONAS.length} personas OK)`);
