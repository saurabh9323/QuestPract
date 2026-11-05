import type {DojoChallenge} from './types';

export const apiCases: DojoChallenge[] = [
  {
    "id": "retry-contract",
    "track": "API",
    "level": "Medium",
    "title": "A retry-safe create endpoint",
    "brief": "A mobile client retries order creation after losing its connection. Define a contract that avoids duplicate orders.",
    "input": "POST /orders, authenticated owner, retry key R1 and a stable request body.",
    "output": "One committed order; replay returns the recorded outcome; a changed body with the same key is rejected.",
    "concept": "Idempotency controls repeated logical operations. A unique key must be scoped, associated with the command and enforced under concurrency.",
    "components": [
      "Client",
      "API",
      "Idempotency record",
      "Transaction",
      "Orders"
    ],
    "flow": [
      "Client → API: body and retry key",
      "API → Idempotency record: owner, key and request hash",
      "API → Transaction: new logical command",
      "Transaction → Orders: committed order"
    ],
    "checks": [
      "Key scope and retention are explicit.",
      "Different bodies with the same key conflict.",
      "Concurrent duplicates are arbitrated durably.",
      "Uncertain outcomes can be reconciled."
    ],
    "hint": "Checking for a key and inserting later can race unless protected by the storage design.",
    "solution": "Use an owner-scoped unique key and stable command fingerprint. Atomically commit operation identity and the business effect when possible. Store or reconstruct the response and define pending, conflict and replay behavior. Retention limits must be part of the contract.",
    "failure": "Two identical requests arrive at the same time on different API replicas.",
    "tradeoff": "Keeping idempotency results longer improves recovery for delayed clients but increases storage and retention obligations. Expiring a key bounds storage while ending the duplicate-prevention guarantee for late retries."
  },
  {
    id: 'cursor-feed', track: 'API', level: 'Easy', title: 'Page through a changing activity feed',
    brief: 'Define a feed endpoint that returns the next page without shifting already-read positions when a new activity is inserted at the top. Activity timestamps and IDs remain immutable.',
    input: 'GET /activities?limit=2 returns (10:05, a9) and (10:04, a8), newest first. Before page two, a new row (10:06, a10) is inserted.',
    output: 'The next cursor represents (10:04, a8). Page two returns rows strictly below that pair, so a8 is not repeated because a10 was inserted.',
    concept: 'Keyset pagination continues after a stable ordered key. A timestamp alone is not a total order when multiple records share it; the cursor needs a unique tie-breaker and the query scope.',
    components: ['Feed client', 'Cursor validator', 'Activity query', 'Page response'],
    flow: ['Feed client → Cursor validator: requested limit and opaque continuation token', 'Cursor validator → Activity query: owner scope and last created_at/id pair', 'Activity query → Page response: up to limit plus one rows in descending tuple order', 'Page response → Feed client: bounded items and next cursor when another row exists'],
    checks: ['The cursor and query both order by created_at DESC, id DESC.', 'Rows sharing the timestamp remain reachable without duplicates.', 'Limits are bounded and invalid or mismatched-scope cursors are rejected.', 'Every page rechecks authorization; a cursor does not grant resource access.'],
    hint: 'Write the predicate for a row older than (10:04, a8), including the case where its timestamp also equals 10:04.',
    solution: 'Query the authorized feed with created_at less than the cursor timestamp, or equal timestamp and id less than the cursor ID, using the same descending ordering. Fetch limit plus one to determine continuation. Encode and validate cursor version and filter scope, signing the token if tamper detection is required. Explain that deletions and backfilled older rows can still change subsequent pages; this is not a frozen snapshot.',
    failure: 'Three activities share 10:04 but the cursor stores only that timestamp. Using a strict timestamp comparison skips the remaining activities in that second.',
    tradeoff: 'Keyset pagination handles inserts ahead of the cursor efficiently but does not support jumping directly to an arbitrary page number. A consistent snapshot needs extra server state or a versioned dataset contract.'
  },
  {
    id: 'conditional-profile-edit', track: 'API', level: 'Medium', title: 'Prevent a stale editor from overwriting changes',
    brief: 'Two browser tabs edit the same profile. Define a conditional update contract that makes stale writes visible and lets a user deliberately reconcile their draft with the latest version.',
    input: 'Both tabs GET profile P3 with ETag "v7". Tab A updates the display name and receives "v8". Tab B then sends its older draft with If-Match: "v7".',
    output: 'Tab A succeeds once. Tab B receives 412 Precondition Failed without changing P3, fetches v8 and presents a deliberate retry or merge.',
    concept: 'Optimistic concurrency carries a version from the read to the write. The server must compare and modify atomically; checking a version and later saving unconditionally reintroduces the lost-update race.',
    components: ['Profile editor', 'Resource API', 'Versioned profile row', 'Conflict view'],
    flow: ['Resource API → Profile editor: profile representation plus strong ETag', 'Profile editor → Resource API: PATCH fields and If-Match version', 'Resource API → Versioned profile row: authorized conditional update where version = 7', 'Versioned profile row → Resource API: one updated row or version mismatch', 'Resource API → Conflict view: 412 for a stale version and a way to fetch current state'],
    checks: ['GET and successful PATCH return the current representation version.', 'Missing required If-Match returns 428 rather than silently overwriting.', 'Version comparison and update share one atomic database operation.', 'Conflict handling preserves the local draft and does not blindly retry it.'],
    hint: 'If two requests both pass a preliminary version check, which write operation still knows that only one may commit?',
    solution: 'Require If-Match for this endpoint and validate editable fields and ownership. Execute an update scoped by profile ID, owner and expected version while incrementing that version. Return a new ETag on success, 412 for a stale existing resource and the documented absent-resource response otherwise. Let the client fetch current data and reconcile fields before sending a new explicit conditional edit.',
    failure: 'The client automatically replaces If-Match with the latest ETag and resubmits its entire stale form. The request now passes concurrency checks while still erasing another user change.',
    tradeoff: 'Resource-wide versions are simple and catch all concurrent edits but can reject changes to unrelated fields. Field-level merging reduces those conflicts while adding rules for which changes can safely combine.'
  },
  {
    id: 'signed-webhook', track: 'API', level: 'Hard', title: 'Accept authentic webhooks without repeating effects',
    brief: 'A payment provider retries signed payment events and may deliver them out of order. Design the ingress endpoint so an authentic duplicate cannot ship an order twice.',
    input: 'A signed payment.succeeded event E55 for payment P8 arrives twice. The provider signature covers a timestamp and the exact raw request bytes; an older pending event may arrive afterward.',
    output: 'Unauthentic requests are rejected. E55 is durably accepted once, retries receive a successful acknowledgement, and P8 causes at most one fulfillment command.',
    concept: 'Authenticity, replay protection and business idempotency solve different problems. A valid signature does not make an event new, and arrival order does not establish a valid payment-state transition.',
    components: ['Provider', 'Signature verifier', 'Durable event inbox', 'Payment worker', 'Fulfillment outbox'],
    flow: ['Provider → Signature verifier: raw body, timestamp and signature header', 'Signature verifier → Durable event inbox: verified event ID and payload after bounded-age checks', 'Durable event inbox → Provider: acknowledge after durable acceptance', 'Durable event inbox → Payment worker: retryable event processing', 'Payment worker → Fulfillment outbox: one authorized state transition and unique effect key committed together'],
    checks: ['The signature is checked against raw bytes using the provider-defined algorithm and a server-held secret.', 'A bounded timestamp window and unique event ID address different replay cases.', 'Acknowledgement follows durable acceptance; worker failure leaves recoverable work.', 'Late events cannot regress a completed payment or repeat fulfillment.'],
    hint: 'Return a successful acknowledgement only after you can recover the event following a process restart. Deduplicate again at the business effect boundary.',
    solution: 'Verify the timestamp and signature before trusting payload fields; support deliberate secret rotation. Persist the provider event under a unique provider/event ID and acknowledge valid duplicates. Process through an explicit payment state machine, reconciling ambiguous order with the provider if required. Commit the payment transition and a uniquely keyed fulfillment outbox record in one transaction. Retry transient failures with limits and expose permanently invalid events for review.',
    failure: 'A worker updates the order, then crashes before marking the inbox item processed. Replaying E55 must observe the completed transition and must not create another fulfillment effect.',
    tradeoff: 'A durable inbox adds storage, asynchronous status and operational work but allows quick acknowledgement and controlled retries. Synchronous processing is simpler initially but couples provider timeouts to every downstream dependency.'
  }
];
