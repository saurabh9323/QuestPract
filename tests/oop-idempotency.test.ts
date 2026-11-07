import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import IdempotencyLab from '../components/oop/IdempotencyLab';
import { initialOrderState, ORDER_MODEL_LIMITS, orderFingerprint, runRequest } from '../lib/oop-foundations/idempotency';
import type { OrderModelState, OrderRequest, OrderRun } from '../lib/oop-foundations/idempotency';

const request: OrderRequest = { key: 'intent-1', item: 'Notebook', quantity: 1 };
function checkContinuity(run: OrderRun) {
  for (let index = 1; index < run.frames.length; index++) {
    assert.deepEqual(run.frames[index].before, run.frames[index - 1].after, `frame ${index + 1} starts at the previous state`);
  }
  const { browser: _, ...lastStore } = run.frames.at(-1)!.after;
  assert.deepEqual(lastStore, run.nextState);
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) freeze(child); }
  return value;
}

test('one accepted request creates exactly one order and completes its key record', () => {
  const start = initialOrderState();
  const result = runRequest(start, request);
  assert.deepEqual(start, initialOrderState());
  assert.equal(result.effect, 'created');
  assert.equal(result.outcome, 'created');
  assert.deepEqual(result.nextState.orders, [{ id: 'order-1', item: 'Notebook', quantity: 1 }]);
  assert.deepEqual(result.response, { status: 201, body: { orderId: 'order-1', item: 'Notebook', quantity: 1 } });
  assert.equal(result.nextState.ledger[0].status, 'completed');
  assert.deepEqual(result.nextState.ledger[0].response, result.response);
  const reserved = result.frames.find(frame => frame.id === 'reserve')!;
  assert.equal(reserved.before.ledger.length, 0);
  assert.equal(reserved.after.ledger[0].status, 'pending');
  assert.equal(reserved.after.orders.length, 0);
  const committed = result.frames.find(frame => frame.id === 'commit')!;
  assert.equal(committed.before.orders.length, 0);
  assert.equal(committed.after.orders.length, 1);
  assert.equal(committed.after.ledger[0].status, 'completed');
  checkContinuity(result);
});

test('same key and body replay the saved status and body without creating a second order', () => {
  const first = runRequest(initialOrderState(), request);
  const replay = runRequest(first.nextState, { quantity: 1, item: 'Notebook', key: 'intent-1' });
  assert.equal(replay.effect, 'replayed');
  assert.equal(replay.outcome, 'replayed');
  assert.deepEqual(replay.response, first.response);
  assert.deepEqual(replay.nextState, first.nextState);
  assert.equal(replay.frames.some(frame => frame.active === 'store'), false);
  for (const frame of replay.frames) assert.equal(frame.after.orders.length, 1);
  assert.equal(orderFingerprint({ item: 'Notebook', quantity: 1 }), orderFingerprint({ quantity: 1, item: 'Notebook' }));
  checkContinuity(replay);
});

test('same key with a changed quantity or item returns conflict and preserves the saved order', () => {
  const first = runRequest(initialOrderState(), request);
  for (const body of [{ item: 'Notebook', quantity: 2 }, { item: 'Pen', quantity: 1 }]) {
    const result = runRequest(first.nextState, { ...request, ...body });
    assert.equal(result.effect, 'conflict');
    assert.equal(result.response?.status, 409);
    assert.deepEqual(result.nextState, first.nextState);
    assert.ok(result.frames.every(frame => frame.after.orders.length === 1));
    checkContinuity(result);
  }
  assert.deepEqual(runRequest(first.nextState, request).response, first.response);
});

test('a genuinely new key creates a new order even when the body is identical', () => {
  const first = runRequest(initialOrderState(), request);
  const second = runRequest(first.nextState, { ...request, key: 'intent-2' });
  assert.equal(second.effect, 'created');
  assert.deepEqual(second.nextState.orders.map(order => order.id), ['order-1', 'order-2']);
  assert.deepEqual(second.nextState.ledger.map(entry => entry.key), ['intent-1', 'intent-2']);
  assert.equal(second.response?.status, 201);
  assert.notDeepEqual(second.response, first.response);
  checkContinuity(second);
});

test('a deliberately lost reply leaves one committed order, and retry reveals that same result', () => {
  const lost = runRequest(initialOrderState(), { ...request, loseResponse: true });
  assert.equal(lost.outcome, 'timeout');
  assert.equal(lost.effect, 'created');
  assert.equal(lost.response, undefined);
  assert.equal(lost.nextState.orders.length, 1);
  assert.equal(lost.nextState.ledger[0].status, 'completed');
  assert.equal(lost.frames.at(-1)!.after.browser.status, 'timeout');
  assert.equal(lost.frames.at(-1)!.after.browser.response, undefined);
  const retry = runRequest(lost.nextState, request);
  assert.equal(retry.outcome, 'replayed');
  assert.deepEqual(retry.response, lost.nextState.ledger[0].response);
  assert.equal(retry.nextState.orders.length, 1);
  checkContinuity(lost);
  checkContinuity(retry);
});

test('the unprotected comparison exposes duplicate orders after a lost response and retry', () => {
  const lost = runRequest(initialOrderState(), { ...request, deduplicate: false, loseResponse: true });
  const retry = runRequest(lost.nextState, { ...request, deduplicate: false });
  assert.equal(lost.outcome, 'timeout');
  assert.equal(retry.outcome, 'created');
  assert.deepEqual(retry.nextState.orders.map(order => order.id), ['order-1', 'order-2']);
  assert.deepEqual(retry.nextState.ledger, []);
  checkContinuity(lost);
  checkContinuity(retry);
});

test('runs are deterministic and snapshots never alias inputs, each other or the next state', () => {
  const start = freeze(initialOrderState());
  const input = freeze({ ...request });
  const first = runRequest(start, input);
  assert.deepEqual(first, runRequest(start, input));
  const frozenNext = freeze(first.nextState);
  const replay = runRequest(frozenNext, input);
  assert.deepEqual(replay.nextState, frozenNext);
  const editable = runRequest(initialOrderState(), request);
  editable.frames.at(-1)!.after.orders[0].quantity = 9;
  assert.equal(editable.nextState.orders[0].quantity, 1);
  assert.equal(editable.frames.at(-2)!.after.orders[0].quantity, 1);
  editable.nextState.ledger[0].response!.body.quantity = 8;
  assert.equal(editable.response?.status === 201 && editable.response.body.quantity, 1);
});

test('inputs and state are bounded; unfinished frames cannot be passed off as completed requests', () => {
  for (const patch of [
    { key: '' }, { key: ' '.repeat(2) }, { key: 'k'.repeat(81) },
    { item: '' }, { item: 'x'.repeat(81) }, { quantity: 0 }, { quantity: 11 }, { quantity: 1.5 },
    { quantity: Number.NaN }, { deduplicate: 'yes' }, { loseResponse: 1 },
  ]) assert.throws(() => runRequest(initialOrderState(), { ...request, ...patch } as OrderRequest));
  const first = runRequest(initialOrderState(), request);
  const { browser: _, ...pending } = first.frames.find(frame => frame.id === 'reserve')!.after;
  assert.throws(() => runRequest(pending, request), /Finish the current modeled request/);
  assert.throws(() => runRequest({ ...initialOrderState(), nextOrderId: 2 }, request), /state is invalid/);
  assert.throws(() => runRequest({ ...first.nextState, ledger: [...first.nextState.ledger, ...first.nextState.ledger] }, request));
  let state: OrderModelState = initialOrderState();
  for (let index = 1; index <= ORDER_MODEL_LIMITS.orders; index++) state = runRequest(state, { ...request, key: `intent-${index}` }).nextState;
  assert.equal(state.orders.length, 20);
  assert.throws(() => runRequest(state, { ...request, key: 'intent-21' }), /20 orders/);
  assert.equal(runRequest(state, request).outcome, 'replayed', 'existing results remain replayable at capacity');
  assert.equal(runRequest(state, { ...request, quantity: 2 }).outcome, 'conflict');
});

test('the lab renders accessible controls and clearly describes its simulation boundary', () => {
  const html = renderToStaticMarkup(createElement(IdempotencyLab));
  for (const phrase of ['Teaching simulation.', 'No real backend, network request, order, or payment.', 'Send first order', 'Retry same key + original body', 'Same key, change quantity to 2', 'New key = new order intent', 'Deliberately lose the next response', 'Modeled request path', 'Idempotency key ledger', 'Browser-visible result', 'Reset experiment', 'Nothing is saved to your account.']) assert.ok(html.includes(phrase), phrase);
  assert.ok(html.includes('data-motion="reduced"'));
  assert.ok(html.includes('https://developer.mozilla.org/en-US/docs/Glossary/Idempotent'));
  assert.ok(html.includes('https://docs.stripe.com/api/idempotent_requests'));
  assert.equal((html.match(/<input type="checkbox"/g) ?? []).length, 2);
});
