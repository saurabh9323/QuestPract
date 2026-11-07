'use client';

import { useEffect, useId, useState } from 'react';
import { initialOrderState, ORDER_MODEL_LIMITS, runRequest } from '@/lib/oop-foundations/idempotency';
import type { OrderPayload, OrderRun } from '@/lib/oop-foundations/idempotency';

const originalBody: OrderPayload = { item: 'Notebook', quantity: 1 };

export default function IdempotencyLab() {
  const headingId = useId();
  const [model, setModel] = useState(initialOrderState);
  const [run, setRun] = useState<OrderRun | null>(null);
  const [cursor, setCursor] = useState(0);
  const [intent, setIntent] = useState(1);
  const [started, setStarted] = useState(false);
  const [deduplicate, setDeduplicate] = useState(true);
  const [loseResponse, setLoseResponse] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [error, setError] = useState('');
  const frame = run?.frames[cursor];
  const viewingComplete = !run || cursor === run.frames.length - 1;
  const snapshot = frame?.after;
  const visibleOrders = snapshot?.orders ?? model.orders;
  const visibleLedger = snapshot?.ledger ?? model.ledger;
  const key = `intent-${intent}`;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReducedMotion(query.matches); if (query.matches) setPlaying(false); };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!playing || !run || reducedMotion) return;
    if (cursor >= run.frames.length - 1) { setPlaying(false); return; }
    const timer = setTimeout(() => setCursor(index => index + 1), 1800);
    return () => clearTimeout(timer);
  }, [playing, run, cursor, reducedMotion]);

  function reset(protectedMode = deduplicate) {
    setModel(initialOrderState()); setRun(null); setCursor(0); setIntent(1); setStarted(false);
    setPlaying(false); setLoseResponse(false); setError(''); setDeduplicate(protectedMode);
  }
  function send(kind: 'first' | 'retry' | 'changed' | 'new') {
    if (!viewingComplete) return;
    const nextIntent = kind === 'new' ? intent + 1 : intent;
    try {
      const result = runRequest(model, {
        key: `intent-${nextIntent}`, ...originalBody, quantity: kind === 'changed' ? 2 : originalBody.quantity,
        deduplicate, loseResponse,
      });
      setModel(result.nextState); setRun(result); setCursor(0); setPlaying(false);
      setIntent(nextIntent); setStarted(true); setLoseResponse(false); setError('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Reset the lab and try again.'); }
  }
  function jump(index: number) {
    if (!run) return;
    setPlaying(false); setCursor(Math.max(0, Math.min(run.frames.length - 1, index)));
  }

  return <section className="oop-idempotency" aria-labelledby={headingId} data-motion={reducedMotion ? 'reduced' : 'allowed'}>
    <header className="oop-idem-heading"><div><span className="eyebrow">INTERACTIVE EXPERIMENT · ONE ORDER INTENT</span><h3 id={headingId}>Did the retry create another order?</h3></div><strong className="oop-idem-count">{visibleOrders.length} modeled order{visibleOrders.length === 1 ? '' : 's'}</strong></header>
    <p>Idempotency keeps the intended server effect the same when a request is repeated. Here, a key identifies one order intent and the API saves its successful response.</p>
    <p className="oop-idem-boundary"><strong>Teaching simulation.</strong> No real backend, network request, order, or payment. Calls are serialized; the pending step illustrates processing, not concurrent locking. State resets when you leave this lab.</p>

    <fieldset className="oop-idem-controls"><legend>Choose an experiment</legend>
      <label><input type="checkbox" checked={deduplicate} onChange={event => reset(event.target.checked)}/> Protect retries with an idempotency key <small>Changing this resets the experiment.</small></label>
      <label><input type="checkbox" checked={loseResponse} disabled={!viewingComplete} onChange={event => setLoseResponse(event.target.checked)}/> Deliberately lose the next response <small>The server still finishes; the browser sees a simulated timeout.</small></label>
      <p>Current intent: <code>{key}</code> · original body: <code>{JSON.stringify(originalBody)}</code></p>
      <div className="oop-idem-actions">
        <button type="button" className="primary" disabled={started || !viewingComplete} onClick={() => send('first')}>Send first order</button>
        <button type="button" className="secondary" disabled={!started || !viewingComplete} onClick={() => send('retry')}>Retry same key + original body</button>
        <button type="button" className="secondary" disabled={!started || !viewingComplete} onClick={() => send('changed')}>Same key, change quantity to 2</button>
        <button type="button" className="secondary" disabled={!started || !viewingComplete || model.orders.length >= ORDER_MODEL_LIMITS.orders} onClick={() => send('new')}>New key = new order intent</button>
      </div>
      <p className="oop-idem-hint">{!deduplicate ? 'Protection is off: repeat a request to observe a duplicate order.' : 'Try losing the first reply, finish its steps, then retry the same key and original body.'} A new key represents a genuinely new order, even when the item is the same.</p>
    </fieldset>
    {error && <p role="alert" className="oop-idem-error">{error}</p>}

    <ol className="oop-idem-flow" aria-label="Modeled request path">
      {([['browser', 'Browser', 'Send and receive'], ['api', 'Order API', deduplicate ? 'Check key + body' : 'Accept each POST'], ['store', 'Order store', 'Record an order']] as const).map(([node, label, detail]) => <li key={node} className="oop-idem-node" data-active={frame?.active === node} aria-current={frame?.active === node ? 'step' : undefined}><span className="oop-idem-packet" aria-hidden="true"/><strong>{label}</strong><small>{detail}</small>{frame?.active === node && <span className="oop-idem-active">Current step</span>}</li>)}
    </ol>

    {frame && run ? <>
      <div className="oop-idem-playback" role="group" aria-label="Order request step controls">
        <button type="button" className="secondary" disabled={cursor === 0} onClick={() => jump(cursor - 1)}>Back</button>
        <button type="button" className="secondary" disabled={viewingComplete || reducedMotion} onClick={() => setPlaying(value => !value)}>{playing ? 'Pause' : 'Play steps'}</button>
        <button type="button" className="secondary" disabled={viewingComplete} onClick={() => jump(cursor + 1)}>Next step</button>
        <button type="button" className="secondary" disabled={viewingComplete} onClick={() => jump(run.frames.length - 1)}>Finish playback</button>
        <span>Step {cursor + 1} of {run.frames.length}</span>
      </div>
      {reducedMotion && <small>Reduced motion is enabled. Use Next step or Finish playback.</small>}
      <div className="oop-idem-stage" aria-live={playing ? 'off' : 'polite'} aria-atomic="true"><span className="eyebrow">{viewingComplete ? 'REQUEST FINISHED' : 'SNAPSHOT PLAYBACK'}</span><h4>{frame.title}</h4><p>{frame.explanation}</p><p>Order count: <strong>{frame.before.orders.length} → {frame.after.orders.length}</strong></p></div>
      <p className="oop-idem-hint">Back and Next inspect saved snapshots; they do not send requests or undo orders. Finish playback before sending the next request.</p>
    </> : <p className="oop-idem-stage">Start with “Send first order” to follow the request from browser to API to order store. No playback starts automatically.</p>}

    <div className="oop-idem-stores">
      <section className="oop-idem-ledger" aria-label="Idempotency key ledger"><h4>Key ledger · shown step</h4>
        {visibleLedger.length ? <div className="oop-idem-table-wrap"><table><caption>Modeled key records</caption><thead><tr><th scope="col">Key</th><th scope="col">State</th><th scope="col">Payload</th><th scope="col">Saved result</th></tr></thead><tbody>{visibleLedger.map(entry => <tr key={entry.key}><th scope="row"><code>{entry.key}</code></th><td>{entry.status}</td><td><code>{entry.fingerprint}</code></td><td>{entry.response ? `${entry.response.status} · ${entry.response.body.orderId}` : 'Not saved yet'}</td></tr>)}</tbody></table></div> : <p>{deduplicate ? 'No key has been recorded yet.' : 'Ledger unused while protection is off.'}</p>}
        {frame && <small>Ledger before → after: {frame.before.ledger.length} → {frame.after.ledger.length} entries. Current key: {frame.before.ledger.find(entry => entry.key === run?.request.key)?.status ?? 'absent'} → {frame.after.ledger.find(entry => entry.key === run?.request.key)?.status ?? 'absent'}.</small>}
      </section>
      <section className="oop-idem-orders" aria-label="Modeled order store"><h4>Order store · {visibleOrders.length} rows</h4>{visibleOrders.length ? <ul>{visibleOrders.map(order => <li key={order.id}><code>{order.id}</code> · {order.quantity} × {order.item}</li>)}</ul> : <p>No orders yet.</p>}</section>
      <section className="oop-idem-browser" aria-label="Browser-visible result"><h4>What the browser knows</h4><p>{snapshot?.browser.message ?? 'Nothing has been sent yet.'}</p>{snapshot?.browser.response && <pre tabIndex={0} aria-label="Response received by browser"><code>{JSON.stringify(snapshot.browser.response, null, 2)}</code></pre>}</section>
    </div>
    <div className="oop-idem-footer"><button type="button" className="secondary" onClick={() => reset()}>Reset experiment</button><small>Up to {ORDER_MODEL_LIMITS.orders} orders per experiment. Nothing is saved to your account.</small></div>
    <details className="oop-idem-notes"><summary>Where the model stops</summary><p>Identical responses are this lab’s explicit cache policy; HTTP idempotency is about the intended effect, and responses can differ. This example resembles the successful-response behavior documented for Stripe API v1, but it is not a Stripe integration. It omits validation failures, error caching, concurrent requests, crash recovery, key expiry, account scoping, and external side effects. A production design must address those separately.</p><p>References: <a href="https://developer.mozilla.org/en-US/docs/Glossary/Idempotent" target="_blank" rel="noopener noreferrer">MDN: idempotent HTTP methods</a> · <a href="https://docs.stripe.com/api/idempotent_requests" target="_blank" rel="noopener noreferrer">Stripe: idempotent requests</a></p></details>
  </section>;
}
