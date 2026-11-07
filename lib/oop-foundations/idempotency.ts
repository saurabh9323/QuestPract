/** A deterministic, serialized teaching model. It never calls an API or makes a payment. */
export const ORDER_MODEL_LIMITS = { orders: 20, keyLength: 80, itemLength: 80, quantity: 10 } as const;

export type OrderPayload = { item: string; quantity: number };
export type ModelOrder = OrderPayload & { id: string };
export type OrderSuccess = { status: 201; body: { orderId: string; item: string; quantity: number } };
export type OrderConflict = { status: 409; body: { code: 'key_payload_conflict'; message: string } };
export type OrderResponse = OrderSuccess | OrderConflict;
export type KeyLedgerEntry = {
  key: string;
  fingerprint: string;
  status: 'pending' | 'completed';
  response?: OrderSuccess;
};
export type OrderModelState = { orders: ModelOrder[]; ledger: KeyLedgerEntry[]; nextOrderId: number };
export type OrderRequest = OrderPayload & { key: string; loseResponse?: boolean; deduplicate?: boolean };
export type BrowserResult = {
  status: 'ready' | 'waiting' | 'received' | 'timeout';
  message: string;
  response?: OrderResponse;
};
export type OrderSnapshot = OrderModelState & { browser: BrowserResult };
export type OrderFrame = {
  id: string;
  title: string;
  explanation: string;
  active: 'browser' | 'api' | 'store';
  before: OrderSnapshot;
  after: OrderSnapshot;
};
export type OrderRun = {
  request: OrderRequest;
  frames: OrderFrame[];
  nextState: OrderModelState;
  effect: 'created' | 'replayed' | 'conflict';
  outcome: 'created' | 'replayed' | 'conflict' | 'timeout';
  /** The response observed by the browser; absent when the reply was deliberately lost. */
  response?: OrderResponse;
};

export function initialOrderState(): OrderModelState {
  return { orders: [], ledger: [], nextOrderId: 1 };
}

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const validText = (value: unknown, max: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
/** Fixed field order makes equivalent payloads comparable without relying on input property order. */
export function orderFingerprint(payload: OrderPayload): string {
  return JSON.stringify({ item: payload.item, quantity: payload.quantity });
}
function validatePayload(payload: OrderPayload) {
  if (!validText(payload.item, ORDER_MODEL_LIMITS.itemLength) || !Number.isInteger(payload.quantity) || payload.quantity < 1 || payload.quantity > ORDER_MODEL_LIMITS.quantity) {
    throw new Error('Choose an item of 1–80 characters and a quantity from 1 to 10.');
  }
}
function validateState(state: OrderModelState) {
  if (!state || !Array.isArray(state.orders) || !Array.isArray(state.ledger)
    || state.orders.length > ORDER_MODEL_LIMITS.orders || state.ledger.length > ORDER_MODEL_LIMITS.orders
    || state.nextOrderId !== state.orders.length + 1) throw new Error('The order model state is invalid. Reset the lab.');
  state.orders.forEach((order, index) => {
    if (!order || order.id !== `order-${index + 1}`) throw new Error('The order model state is invalid. Reset the lab.');
    validatePayload(order);
  });
  const keys = new Set<string>();
  const orderIds = new Set<string>();
  for (const entry of state.ledger) {
    if (!entry || !validText(entry.key, ORDER_MODEL_LIMITS.keyLength) || keys.has(entry.key)
      || entry.status !== 'completed' || !entry.response || entry.response.status !== 201 || !entry.response.body) {
      throw new Error('Finish the current modeled request before starting another. Reset if the state is invalid.');
    }
    const saved = state.orders.find(order => order.id === entry.response!.body.orderId);
    if (!saved || orderIds.has(saved.id) || entry.fingerprint !== orderFingerprint(saved)
      || saved.item !== entry.response.body.item || saved.quantity !== entry.response.body.quantity) throw new Error('The saved key result does not match its order. Reset the lab.');
    keys.add(entry.key);
    orderIds.add(saved.id);
  }
}

/** Runs one complete request, returning independent snapshots for step playback.
 * Requests are serialized. Pending frames illustrate a reservation; they do not simulate locks,
 * concurrent requests, crashes, key expiry, authentication, or a durable database transaction.
 * Same-key replay uses an explicit cached-response contract, not a property of HTTP alone.
 */
export function runRequest(state: OrderModelState, input: OrderRequest): OrderRun {
  validateState(state);
  if (!input || !validText(input.key, ORDER_MODEL_LIMITS.keyLength)) throw new Error('Use an idempotency key of 1–80 characters.');
  validatePayload(input);
  if ((input.loseResponse !== undefined && typeof input.loseResponse !== 'boolean')
    || (input.deduplicate !== undefined && typeof input.deduplicate !== 'boolean')) throw new Error('Request switches must be true or false.');
  const request: OrderRequest = { key: input.key, item: input.item, quantity: input.quantity, loseResponse: input.loseResponse ?? false, deduplicate: input.deduplicate ?? true };
  const fingerprint = orderFingerprint(request);
  const previous = request.deduplicate ? state.ledger.find(entry => entry.key === request.key) : undefined;
  if (!previous && state.orders.length >= ORDER_MODEL_LIMITS.orders) throw new Error('This lab holds 20 orders. Reset it to try another experiment.');
  let snapshot: OrderSnapshot = { ...copy(state), browser: { status: 'ready', message: 'The browser has prepared an order request.' } };
  const frames: OrderFrame[] = [];
  const add = (id: string, title: string, explanation: string, active: OrderFrame['active'], change?: (next: OrderSnapshot) => void) => {
    const before = copy(snapshot);
    const after = copy(snapshot);
    change?.(after);
    frames.push({ id, title, explanation, active, before, after: copy(after) });
    snapshot = after;
  };
  add('send', 'The browser sends an order request', `POST /orders carries key “${request.key}” and ${request.quantity} × ${request.item}. A retry must keep the original key and body.`, 'browser', next => {
    next.browser = { status: 'waiting', message: 'Waiting for a response. The browser does not yet know whether an order exists.' };
  });

  let response: OrderResponse;
  let effect: OrderRun['effect'];
  if (previous && previous.fingerprint !== fingerprint) {
    effect = 'conflict';
    response = { status: 409, body: { code: 'key_payload_conflict', message: 'This key already belongs to a different order payload.' } };
    add('conflict', 'The key matches, but the body changed', 'The modeled API rejects key reuse with different data. Neither the order store nor the saved result changes. The 409 code is this lab’s chosen contract.', 'api');
  } else if (previous) {
    effect = 'replayed';
    response = copy(previous.response!);
    add('match', 'The key and body match a completed request', 'The API finds the saved successful result. It skips order creation and replays that result under this model’s cached-response contract.', 'api');
  } else {
    effect = 'created';
    if (request.deduplicate) {
      add('reserve', 'The model marks this key as pending', 'This is a new key. The ledger records its payload while this request is processed. Requests in this lab run one at a time; this frame does not prove concurrency safety.', 'api', next => {
        next.ledger.push({ key: request.key, fingerprint, status: 'pending' });
      });
    } else {
      add('bypass', 'The API ignores the idempotency key', 'Protection is off for this comparison. Each accepted POST creates an order, even when the browser repeats the same key and body.', 'api');
    }
    const order: ModelOrder = { id: `order-${snapshot.nextOrderId}`, item: request.item, quantity: request.quantity };
    response = { status: 201, body: { orderId: order.id, item: order.item, quantity: order.quantity } };
    const success = copy(response);
    add('commit', 'One order is created', request.deduplicate
      ? 'The model adds the order and saves its response together. Real systems must implement durable, coordinated writes; an in-memory example cannot establish that guarantee.'
      : 'Another accepted request means another order. A disabled button alone would not protect a server from retries.', 'store', next => {
      next.orders.push(order);
      next.nextOrderId++;
      if (request.deduplicate) {
        const entry = next.ledger.find(row => row.key === request.key)!;
        entry.status = 'completed';
        entry.response = success;
      }
    });
  }

  if (request.loseResponse) {
    add('lost', 'The reply is lost; the browser sees a timeout', 'Only the reply is lost in this experiment. The server-side result remains. A timeout cannot tell the browser whether an order was created.', 'browser', next => {
      next.browser = { status: 'timeout', message: 'Simulated timeout: no response reached the browser.' };
    });
  } else {
    const delivered = copy(response);
    add('reply', effect === 'replayed' ? 'The original response reaches the browser again' : effect === 'conflict' ? 'The browser receives a conflict' : 'The browser receives the new order', effect === 'replayed'
      ? 'The status and body match the saved first response, including its order ID. The order count stays the same.'
      : effect === 'conflict' ? 'The request failed with 409 in this model. Use the original payload to retry, or a new key for a genuinely new order intent.'
        : 'A 201 response identifies the one newly created order. Keep this key and payload if its delivery needs to be retried.', 'browser', next => {
      next.browser = { status: 'received', message: effect === 'replayed' ? 'Saved response replayed.' : effect === 'conflict' ? 'Payload conflict; no new order.' : 'New order confirmed.', response: delivered };
    });
  }
  const nextState = copy({ orders: snapshot.orders, ledger: snapshot.ledger, nextOrderId: snapshot.nextOrderId });
  return {
    request: copy(request), frames, nextState, effect,
    outcome: request.loseResponse ? 'timeout' : effect,
    ...(request.loseResponse ? {} : { response: copy(response) }),
  };
}
