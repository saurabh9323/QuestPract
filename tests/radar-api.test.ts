import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMockFetcher, createRadarClient, parseOpportunities, parseTracking, RadarError } from '../lib/radar/api';
import type { RadarErrorCode } from '../lib/radar/api';
import type { Opportunity } from '../lib/radar/types';

const item: Opportunity = {
  id: 'example/id', title: 'API fixture', source: 'devpost', url: 'https://devpost.com/',
  mode: 'online', tags: ['web'], fitScore: 92, registrationDeadline: '2026-11-20T18:00:00Z',
};
const errorCode = (code: RadarErrorCode) => (error: unknown) => error instanceof RadarError && error.code === code;

test('no URL uses a fully offline fictional JSON adapter with the same list and patch contract', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network request'); });
  for (const base of [undefined, '', '   ']) {
    const client = createRadarClient(base);
    assert.equal(client.mode, 'mock');
    const items = await client.listOpportunities();
    assert.ok(items.length >= 5);
    assert.ok(items.every(row => row.title.startsWith('Demo:') && new URL(row.url).pathname === '/'));
    assert.deepEqual(await client.updateTracking(items[0].id, { status: 'registered', notes: 'Team of two' }), { status: 'registered', notes: 'Team of two' });
    items[0].tags.push('mutated');
    assert.ok(!(await client.listOpportunities())[0].tags.includes('mutated'));
    await assert.rejects(client.updateTracking('missing-item', { status: 'new' }), errorCode('http'));
  }
  assert.ok(createMockFetcher() instanceof Function);
});

test('live requests preserve a base path, encode IDs, send only tracking fields and use no credentials', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json(init?.method === 'PATCH' ? { status: 'building', notes: 'Start MVP', ignored: true } : [item]);
  };
  const client = createRadarClient('https://api.example.test/v1/', { fetcher });
  assert.equal(client.mode, 'live');
  assert.deepEqual(await client.listOpportunities(), [item]);
  assert.deepEqual(await client.updateTracking(item.id, { status: 'building', notes: 'Start MVP', extra: true } as never), { status: 'building', notes: 'Start MVP' });
  assert.equal(calls[0].url, 'https://api.example.test/v1/opportunities');
  assert.equal(calls[1].url, 'https://api.example.test/v1/opportunities/example%2Fid/tracking');
  assert.equal(calls[1].init?.body, '{"status":"building","notes":"Start MVP"}');
  assert.equal(calls[1].init?.credentials, 'omit');
  assert.equal(new Headers(calls[1].init?.headers).get('Content-Type'), 'application/json');
  assert.ok(calls[0].init?.signal instanceof AbortSignal);
});

test('malformed data, unsafe links, duplicates and bounds fail the whole list', () => {
  const invalid: unknown[] = [
    null, {}, [null], [{ ...item, id: '' }], [{ ...item, id: 'a'.repeat(161) }],
    [{ ...item, title: 'a'.repeat(201) }], [{ ...item, source: 'unknown' }], [{ ...item, mode: 'remote' }],
    [{ ...item, url: 'javascript:alert(1)' }], [{ ...item, url: 'data:text/html,bad' }], [{ ...item, url: 'https://user:pass@example.test/' }],
    [{ ...item, tags: Array(13).fill('tag') }], [{ ...item, tags: ['a'.repeat(51)] }],
    [{ ...item, fitScore: 101 }], [{ ...item, fitScore: -1 }], [{ ...item, fitScore: Number.NaN }],
    [{ ...item, registrationDeadline: '2026-02-30T00:00:00Z' }], [{ ...item, registrationDeadline: null }],
    [item, item], Array.from({ length: 501 }, (_, i) => ({ ...item, id: String(i) })),
  ];
  for (const value of invalid) assert.throws(() => parseOpportunities(value), errorCode('invalid-data'));
  assert.deepEqual(parseOpportunities([]), []);
  assert.deepEqual(parseOpportunities([{ ...item, extra: true }]), [item]);
  assert.equal(parseTracking({ status: 'new', notes: 'a'.repeat(1000) }).notes?.length, 1000);
  assert.throws(() => parseTracking({ status: 'new', notes: 'a'.repeat(1001) }), errorCode('invalid-data'));
  assert.throws(() => parseTracking({ status: 'unknown' }), errorCode('invalid-data'));
});

test('bad live responses stay live and expose friendly typed errors instead of demo fallback', async () => {
  for (const fetcher of [
    async () => new Response('not json'),
    async () => Response.json([{ ...item, url: 'file:///private' }]),
    async () => Response.json([], { headers: { 'Content-Length': '1000001' } }),
    async () => new Response(' '.repeat(1000001)),
  ]) {
    const client = createRadarClient('https://api.example.test', { fetcher });
    await assert.rejects(client.listOpportunities(), errorCode('invalid-data'));
    assert.equal(client.mode, 'live');
  }
  const unavailable = createRadarClient('https://api.example.test', { fetcher: async () => new Response(null, { status: 503 }) });
  await assert.rejects(unavailable.listOpportunities(), error => error instanceof RadarError && error.code === 'http' && error.status === 503);
  const disconnected = createRadarClient('https://api.example.test', { fetcher: async () => { throw new TypeError('Failed to fetch'); } });
  await assert.rejects(disconnected.listOpportunities(), error => error instanceof RadarError && error.code === 'network' && /CORS/.test(error.message));
  const badPatch = createRadarClient('https://api.example.test', { fetcher: async () => Response.json({ status: 'nope' }) });
  await assert.rejects(badPatch.updateTracking(item.id, { status: 'interested' }), errorCode('invalid-data'));
});

test('invalid API configuration and invalid local tracking never reach fetch', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return Response.json([]); };
  for (const base of ['not-a-url', 'file:///tmp/test', 'https://api.example.test?token=bad', 'https://api.example.test/#fragment']) {
    const client = createRadarClient(base, { fetcher });
    await assert.rejects(client.listOpportunities(), errorCode('configuration'));
  }
  const client = createRadarClient('https://api.example.test', { fetcher });
  await assert.rejects(client.updateTracking('', { status: 'new' }), errorCode('invalid-data'));
  await assert.rejects(client.updateTracking(item.id, { status: 'new', notes: 'a'.repeat(1001) }), errorCode('invalid-data'));
  assert.equal(calls, 0);
});

test('caller cancellation forwards to the transport and an already canceled request never starts', async () => {
  let calls = 0;
  let transportSignal: AbortSignal | null | undefined;
  const client = createRadarClient('https://api.example.test', { fetcher: async (_, init) => {
    calls++;
    transportSignal = init?.signal;
    return new Promise<Response>(() => {});
  } });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(client.listOpportunities({ signal: controller.signal }), errorCode('aborted'));
  assert.equal(calls, 0);
  const pendingController = new AbortController();
  const pending = client.listOpportunities({ signal: pendingController.signal });
  const rejection = assert.rejects(pending, errorCode('aborted'));
  pendingController.abort();
  await rejection;
  assert.equal(calls, 1);
  assert.equal(transportSignal?.aborted, true);
});

test('timeout aborts an unresponsive transport even if fetch ignores abort', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let transportSignal: AbortSignal | null | undefined;
  const client = createRadarClient('https://api.example.test', { timeoutMs: 500, fetcher: async (_, init) => {
    transportSignal = init?.signal;
    return new Promise<Response>(() => {});
  } });
  const pending = client.listOpportunities();
  const rejection = assert.rejects(pending, errorCode('timeout'));
  t.mock.timers.tick(500);
  await rejection;
  assert.equal(transportSignal?.aborted, true);
});

test('the timeout also bounds a response whose headers arrive but body never does', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let readingBody = false;
  const response = Response.json([]);
  Object.defineProperty(response, 'text', { value: () => { readingBody = true; return new Promise<string>(() => {}); } });
  const client = createRadarClient('https://api.example.test', { timeoutMs: 500, fetcher: async () => response });
  const pending = client.listOpportunities();
  const rejection = assert.rejects(pending, errorCode('timeout'));
  await Promise.resolve();
  assert.equal(readingBody, true);
  t.mock.timers.tick(500);
  await rejection;
});
