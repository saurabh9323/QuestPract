import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checklistFor, deadlineCountdown, isoDateMillis, topOpportunities } from '../lib/radar/logic';
import { RADAR_CHECKLIST_IDS } from '../lib/radar/types';
import type { Opportunity } from '../lib/radar/types';

const opportunity = (id: string, fitScore: number): Opportunity => ({
  id, fitScore, title: id, source: 'devpost', url: 'https://devpost.com/', mode: 'online', tags: [],
});
const deadline = '2026-11-20T18:00:00Z';

test('top five sorts by fit without mutating inputs and keeps ties in source order', () => {
  const items = Object.freeze([
    opportunity('a', 45), opportunity('b', 90), opportunity('c', 70), opportunity('d', 90),
    opportunity('e', 50), opportunity('f', 80), opportunity('g', 30),
  ]);
  assert.deepEqual(topOpportunities(items).map(item => item.id), ['b', 'd', 'f', 'c', 'e']);
  assert.deepEqual(items.map(item => item.id), ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  assert.equal(topOpportunities(items)[0], items[1]);
  assert.deepEqual(topOpportunities(items, 2.8).map(item => item.id), ['b', 'd']);
  assert.deepEqual(topOpportunities(items, -1), []);
  assert.deepEqual(topOpportunities([], 5), []);
  assert.deepEqual(topOpportunities(items, Number.NaN), []);
});

test('countdown handles explicit times, timezones and the last-six-hours boundary', () => {
  assert.deepEqual(deadlineCountdown(deadline, new Date('2026-11-13T16:00:00Z')), {
    status: 'open', label: '7d 2h left', remainingMillis: (7 * 24 + 2) * 3600000,
  });
  assert.equal(deadlineCountdown(deadline, new Date('2026-11-20T11:59:59Z')).status, 'open');
  assert.deepEqual(deadlineCountdown(deadline, new Date('2026-11-20T12:00:00Z')), {
    status: 'urgent', label: '6h 0m left', remainingMillis: 6 * 3600000,
  });
  assert.equal(deadlineCountdown(deadline, new Date('2026-11-20T17:30:00Z')).label, '30m left');
  assert.equal(deadlineCountdown(deadline, new Date('2026-11-20T17:59:59Z')).label, 'Less than a minute left');
  assert.deepEqual(deadlineCountdown('2026-11-20T23:30:00+05:30', new Date('2026-11-20T12:00:00Z')), deadlineCountdown(deadline, new Date('2026-11-20T12:00:00Z')));
});

test('registration becomes closed at the exact deadline and never has negative time', () => {
  for (const now of ['2026-11-20T18:00:00Z', '2026-11-23T00:00:00Z']) {
    assert.deepEqual(deadlineCountdown(deadline, new Date(now)), { status: 'closed', label: 'Registration closed', remainingMillis: 0 });
  }
});

test('missing and malformed dates are explicitly unavailable, without inventing a plan', () => {
  const now = new Date('2026-11-06T12:00:00Z');
  assert.equal(deadlineCountdown(undefined, now).status, 'missing');
  assert.equal(deadlineCountdown(undefined, now).remainingMillis, null);
  for (const value of ['not-a-date', '2026-02-30T12:00:00Z', '11/20/2026', '2026-11-20T12:00:00']) {
    assert.equal(deadlineCountdown(value, now).status, 'invalid');
    assert.deepEqual(checklistFor(value, now), []);
  }
  assert.deepEqual(checklistFor(undefined, now), []);
  assert.equal(deadlineCountdown(deadline, new Date(Number.NaN)).status, 'invalid');
  assert.deepEqual(checklistFor(deadline, new Date(Number.NaN)), []);
  assert.equal(isoDateMillis('2028-02-29'), Date.parse('2028-02-29T00:00:00Z'));
  assert.equal(isoDateMillis('2026-02-29'), null);
});

test('checklist is deterministic, follows T-7/T-5/T-3/last-six-hours and exposes stable IDs', () => {
  const plan = checklistFor(deadline, new Date('2026-11-12T18:00:00Z'));
  assert.deepEqual(plan.map(item => item.id), RADAR_CHECKLIST_IDS);
  assert.deepEqual(plan.map(item => item.at), [
    '2026-11-13T18:00:00.000Z', '2026-11-15T18:00:00.000Z', '2026-11-17T18:00:00.000Z',
    '2026-11-20T12:00:00.000Z', '2026-11-20T12:00:00.000Z', '2026-11-20T12:00:00.000Z',
  ]);
  assert.ok(plan.every(item => item.status === 'upcoming'));
  assert.deepEqual(checklistFor(deadline, new Date('2026-11-15T18:00:00Z')).map(item => item.status), ['due', 'due', 'upcoming', 'upcoming', 'upcoming', 'upcoming']);
  assert.ok(checklistFor(deadline, new Date('2026-11-20T12:00:00Z')).every(item => item.status === 'due'));
  assert.ok(checklistFor(deadline, new Date('2026-11-20T18:00:00Z')).every(item => item.status === 'closed'));
  assert.ok(checklistFor(deadline, new Date('2026-11-22T18:00:00Z')).every(item => item.status === 'closed'));
});
