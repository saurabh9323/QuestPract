import mockOpportunities from './mock.json';
import { isoDateMillis } from './logic';
import { OPPORTUNITY_SOURCES, TRACKING_STATUSES } from './types';
import type { Opportunity, RadarClient, RadarClientOptions, RadarRequestOptions, Tracking } from './types';

export type RadarErrorCode = 'configuration' | 'network' | 'timeout' | 'aborted' | 'http' | 'invalid-data';
export class RadarError extends Error {
  constructor(public readonly code: RadarErrorCode, message: string, public readonly status?: number) {
    super(message);
    this.name = 'RadarError';
  }
}

const MAX_ITEMS = 500;
const MAX_RESPONSE_CHARS = 1_000_000;
const DEMO_BASE = 'https://radar-demo.invalid';
const invalidData = () => new RadarError('invalid-data', 'Radar returned unexpected data. Please try again or check the API connection.');
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function boundedString(value: unknown, max: number, allowEmpty = false): value is string {
  return typeof value === 'string' && value.length <= max && (allowEmpty || value.trim().length > 0);
}
function optionalString(value: unknown, max: number): value is string | undefined {
  return value === undefined || boundedString(value, max, true);
}
function safeUrl(value: unknown): value is string {
  if (!boundedString(value, 2048)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password;
  } catch { return false; }
}
function optionalDate(value: unknown): value is string | undefined {
  return value === undefined || (boundedString(value, 50) && isoDateMillis(value) !== null);
}

/** Parse only contract fields; reject unsafe links, duplicate IDs and oversized payloads. */
export function parseOpportunities(value: unknown): Opportunity[] {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) throw invalidData();
  const ids = new Set<string>();
  return value.map((item): Opportunity => {
    if (!record(item) || !boundedString(item.id, 160) || ids.has(item.id)
      || !OPPORTUNITY_SOURCES.includes(item.source as Opportunity['source'])
      || !boundedString(item.title, 200) || !safeUrl(item.url)
      || !['online', 'offline', 'hybrid'].includes(item.mode as string)
      || !optionalString(item.location, 200) || !optionalString(item.prize, 300)
      || !optionalDate(item.registrationDeadline) || !optionalDate(item.startsAt) || !optionalDate(item.endsAt)
      || !Array.isArray(item.tags) || item.tags.length > 12 || !item.tags.every(tag => boundedString(tag, 50))
      || typeof item.fitScore !== 'number' || !Number.isFinite(item.fitScore) || item.fitScore < 0 || item.fitScore > 100) throw invalidData();
    ids.add(item.id);
    return {
      id: item.id,
      source: item.source as Opportunity['source'],
      title: item.title,
      url: item.url,
      mode: item.mode as Opportunity['mode'],
      ...(item.location !== undefined ? { location: item.location } : {}),
      ...(item.registrationDeadline !== undefined ? { registrationDeadline: item.registrationDeadline } : {}),
      ...(item.startsAt !== undefined ? { startsAt: item.startsAt } : {}),
      ...(item.endsAt !== undefined ? { endsAt: item.endsAt } : {}),
      ...(item.prize !== undefined ? { prize: item.prize } : {}),
      tags: [...item.tags] as string[],
      fitScore: item.fitScore,
    };
  });
}

export function parseTracking(value: unknown): Tracking {
  if (!record(value) || !TRACKING_STATUSES.includes(value.status as Tracking['status']) || !optionalString(value.notes, 1000)) throw invalidData();
  return { status: value.status as Tracking['status'], ...(value.notes !== undefined ? { notes: value.notes } : {}) };
}

/** The demo implements fetch's request/response boundary entirely in memory. */
export function createMockFetcher(): typeof fetch {
  return async (input, init) => {
    if (init?.signal?.aborted) throw new DOMException('Request canceled', 'AbortError');
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const method = init?.method ?? 'GET';
    if (method === 'GET' && url.pathname === '/opportunities') return Response.json(mockOpportunities);
    const match = url.pathname.match(/^\/opportunities\/([^/]+)\/tracking$/);
    if (method === 'PATCH' && match) {
      const id = decodeURIComponent(match[1]);
      if (!mockOpportunities.some(item => item.id === id)) return Response.json({}, { status: 404 });
      const tracking = parseTracking(JSON.parse(String(init?.body ?? 'null')));
      return Response.json(tracking);
    }
    return Response.json({}, { status: 404 });
  };
}

function endpoint(base: string, path: string): string {
  if (!safeUrl(base)) throw new RadarError('configuration', 'The Radar API URL must be an HTTP or HTTPS address.');
  const url = new URL(base);
  if (url.search || url.hash) throw new RadarError('configuration', 'The Radar API URL must not contain a query or fragment.');
  return `${url.href.replace(/\/+$/, '')}${path}`;
}

/** Omit baseUrl for explicit fictional demo mode. A failed live request never switches to demo. */
export function createRadarClient(baseUrl?: string, options: RadarClientOptions = {}): RadarClient {
  const base = baseUrl?.trim();
  const mode = base ? 'live' : 'mock';
  const fetcher = options.fetcher ?? (mode === 'mock' ? createMockFetcher() : globalThis.fetch.bind(globalThis));
  const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs! > 0 ? Math.min(options.timeoutMs!, 120000) : 10000;

  async function request<T>(path: string, init: RequestInit, parse: (value: unknown) => T, requestOptions: RadarRequestOptions = {}): Promise<T> {
    const callerSignal = requestOptions.signal;
    if (callerSignal?.aborted) throw new RadarError('aborted', 'Radar request canceled.');
    const url = endpoint(base || DEMO_BASE, path);
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;
    const canceled = new Promise<never>((_, reject) => {
      onAbort = () => {
        reject(new RadarError('aborted', 'Radar request canceled.'));
        controller.abort();
      };
      callerSignal?.addEventListener('abort', onAbort, { once: true });
      timer = setTimeout(() => {
        reject(new RadarError('timeout', 'Radar took too long to respond. Please try again.'));
        controller.abort();
      }, timeoutMs);
    });
    const perform = async () => {
      const response = await fetcher(url, { ...init, signal: controller.signal, credentials: 'omit', cache: 'no-store' });
      if (!response.ok) throw new RadarError('http', response.status === 404 ? 'This Radar item is no longer available. Refresh and try again.' : `The Radar API could not complete the request (${response.status}). Please try again.`, response.status);
      const declaredLength = Number(response.headers.get('Content-Length'));
      if (declaredLength > MAX_RESPONSE_CHARS) throw invalidData();
      const body = await response.text();
      if (body.length > MAX_RESPONSE_CHARS) throw invalidData();
      let data: unknown;
      try { data = JSON.parse(body); } catch { throw invalidData(); }
      return parse(data);
    };
    try {
      return await Promise.race([canceled, perform()]);
    } catch (error) {
      if (error instanceof RadarError) throw error;
      if (callerSignal?.aborted) throw new RadarError('aborted', 'Radar request canceled.');
      throw new RadarError('network', 'Could not reach the Radar API. Check your connection, API URL, and whether the API allows this site in its CORS settings.');
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (onAbort) callerSignal?.removeEventListener('abort', onAbort);
    }
  }

  return {
    mode,
    listOpportunities: requestOptions => request('/opportunities', { method: 'GET', headers: { Accept: 'application/json' } }, parseOpportunities, requestOptions),
    updateTracking: async (id, tracking, requestOptions) => {
      if (!boundedString(id, 160)) throw invalidData();
      const validTracking = parseTracking(tracking);
      return request(`/opportunities/${encodeURIComponent(id)}/tracking`, {
        method: 'PATCH', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(validTracking),
      }, parseTracking, requestOptions);
    },
  };
}
