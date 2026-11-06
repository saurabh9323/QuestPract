import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { oopCases, oopLessons } from '../lib/oop';
import { essentialForLesson, oopEssentials, oopMessageTraces } from '../lib/oop-essentials';
import { freshProgress, validateProgress } from '../lib/progress';
import { EssentialQuiz, EssentialsPath, ObjectMessageTrace } from '../components/oop/EssentialTeaching';
import OOPStudio from '../components/OOPStudio';

test('the essentials extend the original twelve foundation and SOLID IDs without replacing existing lessons', () => {
  const ids = ['objects', 'encapsulation', 'abstraction', 'inheritance', 'polymorphism', 'composition', 'contracts', 'srp', 'ocp', 'lsp', 'isp', 'dip'];
  assert.deepEqual(oopEssentials.map(lesson => lesson.id), ids);
  assert.deepEqual(oopLessons.filter(lesson => lesson.group !== 'Patterns').map(lesson => lesson.id), ids);
  assert.deepEqual(oopLessons.filter(lesson => lesson.group === 'Patterns').map(lesson => lesson.id), ['strategy', 'factory', 'observer', 'adapter', 'state']);
  assert.deepEqual(oopCases.map(study => study.id), ['case-checkout', 'case-parking', 'case-learning']);
  assert.equal(essentialForLesson('unknown'), undefined);
  for (const lesson of oopEssentials) {
    assert.equal(new Set(lesson.quiz.options.map(option => option.id)).size, lesson.quiz.options.length);
    assert.equal(lesson.quiz.options.filter(option => option.correct).length, 1, `${lesson.id} must have one unambiguous correct choice`);
    assert.ok(lesson.quiz.options.every(option => option.feedback.trim()), `${lesson.id} needs feedback for every choice`);
  }
});

test('existing saved OOP drafts, feedback, attempts and review dates still round-trip unchanged', () => {
  const progress = freshProgress();
  const at = '2026-11-06T08:00:00.000Z';
  progress.oop = Object.fromEntries([...oopLessons, ...oopCases].map(lesson => [lesson.id, {
    draft: `My previous ${lesson.id} explanation`,
    attempts: [{ id: `attempt-${lesson.id}`, text: 'Previous submitted answer', feedback: 'Check the contract', confidence: 'assisted' as const, createdAt: at }],
    updatedAt: at,
    reviewDue: '2026-11-09'
  }]));
  const restored = validateProgress(JSON.parse(JSON.stringify(progress)));
  assert.deepEqual(restored.oop, progress.oop);
  let commits = 0;
  const html = renderToStaticMarkup(createElement(OOPStudio, { p: restored, commit: () => { commits++; } }));
  assert.match(html, /My previous objects explanation/);
  assert.match(html, /Previous submitted answer/);
  assert.match(html, /Check the contract/);
  assert.match(html, /17\/17/);
  assert.equal(commits, 0, 'reading the enriched lesson must not rewrite saved work');
});

test('scenario checks use labelled radio groups and show choice-specific feedback on a revisited check', () => {
  const essential = essentialForLesson('encapsulation')!;
  const html = renderToStaticMarkup(createElement(EssentialQuiz, { essential, checkedChoice: 'snapshot', onCheck: () => {} }));
  assert.match(html, /<fieldset/);
  assert.match(html, /<legend>/);
  assert.equal((html.match(/type="radio"/g) || []).length, 3);
  assert.equal((html.match(/name="oop-check-encapsulation"/g) || []).length, 3);
  assert.match(html, /<input(?=[^>]*value="snapshot")(?=[^>]*checked="")[^>]*>/);
  assert.match(html, /role="status"/);
  assert.match(html, /The operation owns the invariant/);
  assert.match(html, /do not submit an attempt or change your saved self-assessment/);
});

test('knowledge-check counts distinguish checked answers from correct answers and do not count unknown data', () => {
  const html = renderToStaticMarkup(createElement(EssentialsPath, {
    selected: 'objects', checks: { objects: 'shared', encapsulation: 'setter', unknown: 'anything' }, onSelect: () => {}
  }));
  assert.match(html, /<strong>1\/12<\/strong>/);
  assert.match(html, /2 checked this session/);
  assert.match(html, /session-only practice/);
});

test('trace transitions retain continuous state and distinguish mutation, rejected operations and returned values', () => {
  for (const trace of oopMessageTraces) {
    for (let i = 1; i < trace.steps.length; i++) {
      assert.equal(trace.steps[i].before, trace.steps[i - 1].after, `${trace.id}, step ${i + 1} must begin at the preceding state`);
    }
  }
  const rejected = oopMessageTraces.find(trace => trace.id === 'withdraw-rejected')!;
  assert.ok(rejected.steps.every(step => step.before === step.after));
  const success = oopMessageTraces.find(trace => trace.id === 'withdraw-success')!;
  assert.equal(success.steps.filter(step => step.before !== step.after).length, 1);
  assert.equal(success.steps.at(-1)?.after, 'A: 70 cents · B: 100 cents');
  assert.match(success.steps.at(-1)!.message, /Read walletA.balance/);
  const priceRule = oopMessageTraces.find(trace => trace.id === 'price-rule')!;
  assert.match(priceRule.steps.at(-1)!.result, /Returns 900 cents; no stored price changes/);
  const html = renderToStaticMarkup(createElement(ObjectMessageTrace, { initialScenario: 'withdraw-rejected' }));
  assert.match(html, /aria-current="step"/);
  assert.match(html, /State before this step/);
  assert.match(html, /State after this step/);
  assert.match(html, /walletA.withdraw\(120\)/);
  assert.match(html, /aria-live="polite"/);
});
