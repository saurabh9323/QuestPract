import test from 'node:test';
import assert from 'node:assert/strict';
import {dojoChallenges, type DojoChallenge} from '../lib/dojo';

test('25 cases cover all six tracks and every difficulty within each track', () => {
  assert.equal(dojoChallenges.length, 25);
  const counts = {GenAI: 5, Architecture: 4, Database: 4, API: 4, Algorithms: 4, LLD: 4};
  assert.deepEqual([...new Set(dojoChallenges.map(c => c.track))].sort(), Object.keys(counts).sort());
  for (const [track, count] of Object.entries(counts)) {
    const cases = dojoChallenges.filter(c => c.track === track);
    assert.equal(cases.length, count, track);
    assert.deepEqual([...new Set(cases.map(c => c.level))].sort(), ['Easy', 'Hard', 'Medium'], track);
  }
});

test('case IDs are unique route-safe progress keys and substantive content is not duplicated', () => {
  assert.equal(new Set(dojoChallenges.map(c => c.id)).size, dojoChallenges.length);
  for (const c of dojoChallenges) assert.match(c.id, /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
  for (const field of ['title', 'brief', 'input', 'output', 'concept', 'solution', 'failure', 'tradeoff'] as const) {
    const values = dojoChallenges.map(c => c[field].trim().toLowerCase().replace(/\s+/g, ' '));
    assert.equal(new Set(values).size, dojoChallenges.length, `${field} must be specific to each case`);
  }
});

test('every case supplies a usable mission, labeled flow, review criteria and defensible tradeoff', () => {
  const minimum: Partial<Record<keyof DojoChallenge, number>> = {
    title: 15, brief: 80, input: 45, output: 45, concept: 80,
    hint: 45, solution: 180, failure: 70, tradeoff: 120,
  };
  for (const c of dojoChallenges) {
    for (const [field, length] of Object.entries(minimum)) {
      const value = c[field as keyof DojoChallenge];
      assert.equal(typeof value, 'string', `${c.id}.${field}`);
      assert.ok((value as string).trim().length >= length!, `${c.id}.${field} needs substantive content`);
      assert.doesNotMatch(value as string, /\b(?:TODO|TBD|lorem ipsum)\b/i, `${c.id}.${field}`);
    }
    assert.ok(c.components.length >= 4, `${c.id} component scope`);
    assert.equal(new Set(c.components).size, c.components.length, `${c.id} duplicate component`);
    assert.ok(c.flow.length >= 3, `${c.id} flow steps`);
    for (const step of c.flow) assert.match(step, /^.+ → .+: .+$/, `${c.id} labeled movement`);
    assert.ok(c.checks.length >= 4, `${c.id} review criteria`);
    assert.equal(new Set(c.checks).size, c.checks.length, `${c.id} duplicate check`);
    for (const check of c.checks) assert.ok(check.length >= 25, `${c.id} meaningful check`);
  }
});

// Existing learner records use dojo-{id} and positional check0, check1, … fields.
// Keep these check meanings and their order when expanding the catalog.
test('the original eight progress IDs retain their track, title and indexed check meanings', () => {
  const originals = [
    {
      id: 'grounded-handbook', track: 'GenAI', title: 'Answers with evidence',
      checks: ['Document access is checked before evidence is returned.', 'Evidence is tied to a version and a source.', 'Missing evidence has an explicit response.', 'Citations are checked against retrieved passages.'],
    },
    {
      id: 'document-ingestion', track: 'GenAI', title: 'Build a searchable document pipeline',
      checks: ['Chunk boundaries preserve meaningful context.', 'Embedding version is recorded.', 'Access metadata travels with every chunk.', 'Replacement and deletion remove stale searchable content.'],
    },
    {
      id: 'bounded-memory', track: 'GenAI', title: 'Conversation memory with a budget',
      checks: ['The current question is preserved.', 'Context selection stays within a stated budget.', 'Summary is distinguished from original messages.', 'Users can reset or correct remembered information.'],
    },
    {
      id: 'tool-approval', track: 'GenAI', title: 'An assistant that drafts before acting',
      checks: ['Ambiguous timezones and dates are clarified.', 'Approval applies to the exact proposal.', 'Repeated delivery does not duplicate events.', 'Tool permissions and server validation are enforced.'],
    },
    {
      id: 'catalog-cache', track: 'Architecture', title: 'A catalogue during a traffic spike',
      checks: ['Freshness is stated per operation.', 'Cache failure cannot create unlimited database load.', 'Purchase validation uses authoritative state.', 'Hit-rate assumptions are measured.'],
    },
    {
      id: 'order-schema', track: 'Database', title: 'An order schema that preserves history',
      checks: ['Each line belongs to an order.', 'Quantity and money representation are constrained.', 'Historical price is stored on the line.', 'Deletion and ownership policies are explained.'],
    },
    {
      id: 'retry-contract', track: 'API', title: 'A retry-safe create endpoint',
      checks: ['Key scope and retention are explicit.', 'Different bodies with the same key conflict.', 'Concurrent duplicates are arbitrated durably.', 'Uncertain outcomes can be reconciled.'],
    },
    {
      id: 'growth-review', track: 'Algorithms', title: 'Choose a duplicate detector',
      checks: ['Distinct positions are compared.', 'Empty and one-element inputs return false.', 'Nested approach has O(n²) worst-case comparisons.', 'Set scan has expected O(n) time and O(n) extra space under usual hash-table assumptions.'],
    },
  ];
  for (const original of originals) {
    const actual = dojoChallenges.find(c => c.id === original.id);
    assert.ok(actual, `${original.id} must resolve saved links and progress`);
    assert.deepEqual({id: actual.id, track: actual.track, title: actual.title, checks: actual.checks}, original);
  }
});
