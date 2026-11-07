import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { foundationLessons } from '../lib/oop-foundations/lessons';

const byId = (id: string) => {
  const lesson = foundationLessons.find(item => item.id === id);
  assert.ok(lesson, `Missing foundation lesson ${id}`);
  return lesson;
};

test('all ten requested foundation topics have usable, source-mapped animation frames and reasoning checks', () => {
  assert.deepEqual(foundationLessons.map(lesson => lesson.id), [
    'fields-methods', 'constructors', 'this', 'static-members', 'generics',
    'generic-constraints', 'overloads', 'immutability', 'dependency-injection', 'idempotency'
  ]);
  for (const lesson of foundationLessons) {
    const lines = lesson.code.source.split('\n');
    assert.equal(lesson.code.language, 'TypeScript');
    assert.ok(lesson.steps.length >= 4 && lesson.steps.length <= 6, lesson.id);
    assert.equal(new Set(lesson.steps.map(step => step.title)).size, lesson.steps.length, lesson.id);
    for (const step of lesson.steps) {
      assert.equal(step.nodes.length, 3, `${lesson.id}: ${step.title}`);
      assert.ok(Number.isInteger(step.active) && step.active >= 0 && step.active < 3);
      assert.ok(Number.isInteger(step.line) && step.line! >= 1 && step.line! <= lines.length);
      assert.ok(lines[step.line! - 1].trim(), `${lesson.id}: frame points to an empty line`);
      assert.ok(step.variables.length, `${lesson.id}: frame needs visible state`);
      assert.ok(step.variables.every(variable => variable.name && variable.before && variable.after));
      assert.ok(step.nodes.every(node => node.label && node.value && node.icon));
    }
    assert.equal(lesson.question.options.length, 3);
    assert.equal(lesson.question.options.filter(option => option.correct).length, 1);
    assert.equal(new Set(lesson.question.options.map(option => option.id)).size, 3);
    assert.ok(lesson.question.options.every(option => option.feedback));
    assert.ok(lesson.analogy.story && lesson.analogy.limit);
    assert.ok(lesson.sources.length >= 2);
    for (const source of lesson.sources) {
      const url = new URL(source.url);
      assert.equal(url.protocol, 'https:');
      assert.ok(['www.typescriptlang.org', 'developer.mozilla.org', 'learn.microsoft.com', 'www.rfc-editor.org', 'docs.stripe.com', 'aws.amazon.com'].includes(url.hostname));
    }
  }
});

test('authored examples type-check strictly and produce exactly their stated outputs locally', () => {
  // Only repository-authored, fixed examples run here. The learning UI never executes snippets or learner code.
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'quest90-oop-content-'));
  const compiledDirectory = path.join(temporary, 'compiled');
  try {
    mkdirSync(compiledDirectory);
    const files = foundationLessons.map(lesson => {
      const file = path.join(temporary, `${lesson.id}.ts`);
      writeFileSync(file, `${lesson.code.source}\nexport {};`);
      return file;
    });
    // Use the installed CLI: TypeScript 7 no longer exposes the legacy root-package compiler API.
    const compiler = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');
    execFileSync(process.execPath, [compiler, '--strict', '--skipLibCheck', '--target', 'es2022',
      '--module', 'commonjs', '--outDir', compiledDirectory, ...files],
    { cwd: temporary, encoding: 'utf8', timeout: 30000, windowsHide: true });
    for (const lesson of foundationLessons) {
      const output: string[] = [];
      const javascript = readFileSync(path.join(compiledDirectory, `${lesson.id}.js`), 'utf8');
      const context = vm.createContext({ exports: {}, console: { log: (...values: unknown[]) => output.push(values.map(String).join(' ')) } });
      new vm.Script(javascript, { filename: `${lesson.id}.js` }).runInContext(context, { timeout: 1000 });
      assert.equal(output.join('\n'), lesson.code.expected, lesson.id);
    }
  } finally {
    // Only remove the exact, uniquely created test directory inside the OS temporary directory.
    assert.equal(path.dirname(path.resolve(temporary)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temporary).startsWith('quest90-oop-content-'));
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('type-focused walkthroughs separate checking from runtime rather than inventing runtime generic dispatch', () => {
  const generics = byId('generics');
  assert.match(generics.steps[0].explanation, /checking.*not runtime/i);
  assert.match(generics.steps[2].explanation, /same Box class/);
  assert.match(generics.steps[2].explanation, /no runtime T field/);
  assert.match(generics.pitfall, /validate JSON/);
  const constraints = byId('generic-constraints');
  assert.match(constraints.pitfall, /not runtime validation/);
  assert.match(constraints.steps[3].explanation, /same object/);
  const overloads = byId('overloads');
  assert.match(overloads.steps[2].explanation, /disappear from emitted JavaScript/);
  assert.equal(overloads.code.source.split('\n')[overloads.steps[3].line! - 1].trim(), 'if (typeof value === "number") return "#" + value;');
  assert.match(overloads.when, /single string \| number parameter/);
});

test('immutability walkthrough copies the changed path and shows shallow freeze permitting a nested change', () => {
  const lesson = byId('immutability');
  const copy = lesson.steps[1].variables;
  assert.deepEqual(copy.find(variable => variable.name === 'first.tags'), { name: 'first.tags', before: '["learner"]', after: '["learner"]' });
  assert.deepEqual(lesson.steps[4].variables, [{ name: 'frozen.nested.score', before: '1', after: '2' }]);
  assert.match(lesson.pitfall, /readonly does not freeze/);
  assert.match(lesson.analogy.limit, /nested/);
});

test('idempotency frames preserve a single effect through replay and conflict and document production limits', () => {
  const lesson = byId('idempotency');
  const transitions = lesson.steps.flatMap(step => step.variables.filter(variable => variable.name === 'totalCents'));
  assert.equal(transitions.filter(variable => variable.before !== variable.after).length, 1);
  assert.ok(transitions.slice(2).every(variable => variable.before === '500' && variable.after === '500'));
  assert.equal(lesson.code.source.split('\n')[lesson.steps[3].line! - 1].trim(), 'return previous.receipt;');
  assert.match(lesson.code.source.split('\n')[lesson.steps[4].line! - 1], /previous.cents !== cents/);
  assert.match(lesson.definition, /response does not have to be identical/);
  assert.match(lesson.pitfall, /atomic key claim/);
  assert.match(lesson.pitfall, /durable/);
  assert.match(lesson.pitfall, /crash after charging but before saving/);
  assert.match(lesson.pitfall, /Never promise exactly-once/);
  assert.equal(lesson.question.options.find(option => option.correct)?.id, 'conflict');
});
