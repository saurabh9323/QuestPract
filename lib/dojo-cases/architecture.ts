import type {DojoChallenge} from './types';

export const architectureCases: DojoChallenge[] = [
  {
    "id": "catalog-cache",
    "track": "Architecture",
    "level": "Medium",
    "title": "A catalogue during a traffic spike",
    "brief": "Design product reads that tolerate 30 seconds of stale descriptions, while purchase-time stock checks remain authoritative.",
    "input": "1000 reads/s, assumed 90% cache hit rate, and a cache outage.",
    "output": "A read path with a protected fallback and a separate authoritative purchase check.",
    "concept": "Caching trades freshness and operational complexity for lower repeated read load.",
    "components": [
      "Client",
      "API",
      "Cache",
      "Database"
    ],
    "flow": [
      "Client → API: product ID",
      "API → Cache: lookup",
      "Cache → API: hit, or miss",
      "API → Database: bounded fallback on miss",
      "Database → Cache: value plus expiry"
    ],
    "checks": [
      "Freshness is stated per operation.",
      "Cache failure cannot create unlimited database load.",
      "Purchase validation uses authoritative state.",
      "Hit-rate assumptions are measured."
    ],
    "hint": "The fallback can receive ten times its normal read load during an outage.",
    "solution": "Use cache-aside for eligible reads, bounded concurrency for fallback, timeouts and explicit degradation. In the simplified steady state, database read load is 1000 × (1 − 0.9) = 100/s. Outage capacity is a separate design question.",
    "failure": "Many hot keys expire together. Discuss refresh coordination and expiry jitter without assuming either eliminates all spikes.",
    "tradeoff": "Longer cache lifetimes reduce database reads but expose stale descriptions for longer. Short lifetimes improve freshness while increasing refresh traffic; stock correctness still needs an authoritative purchase check."
  },
  {
    id: 'upload-pipeline', track: 'Architecture', level: 'Easy', title: 'Upload a photo without storing bytes in the app',
    brief: 'Design profile-photo uploads when application instances have temporary local disks. Store durable image bytes separately from the profile record.',
    input: 'User U7 uploads a 2 MB JPEG, then replaces it with a new photo.',
    output: 'A durable object and an owned profile reference; the previous photo remains visible until the replacement is ready.',
    concept: 'Blob storage holds file contents while the application database holds ownership and lifecycle metadata. A successful upload does not automatically make an object the active profile photo.',
    components: ['Client', 'Upload API', 'Object store', 'Profile database'],
    flow: ['Client → Upload API: authenticated photo upload', 'Upload API → Object store: validated bytes under a new unique object key', 'Object store → Upload API: durable object acknowledgement', 'Upload API → Profile database: replace the owned active-photo reference', 'Profile database → Client: active photo URL and version'],
    checks: ['Temporary application disks are not the durable source of images.', 'File size, permitted format and ownership are validated.', 'A failed upload leaves the existing profile photo intact.', 'Unreferenced objects have a delayed cleanup policy.'],
    hint: 'Uploading the new bytes and changing the active reference are separate steps. Decide which happens first.',
    solution: 'Write each accepted upload to a unique object key, then update the authenticated user’s profile reference after storage confirms success. Preserve the old reference until that update commits. Record upload ownership and clean abandoned objects after a grace period; old objects can be removed after references are checked. Use a version check or defined last-write policy for concurrent replacements.',
    failure: 'Object storage succeeds but the profile update fails. Keep the old photo active and let orphan cleanup remove the unused new object.',
    tradeoff: 'Relaying uploads through the API simplifies validation but consumes application bandwidth. Direct object-store uploads reduce that load and require scoped upload permissions plus a separate verification step.'
  },
  {
    id: 'payment-outbox', track: 'Architecture', level: 'Medium', title: 'Publish an order without losing its event',
    brief: 'An order service must notify fulfillment after saving an order. Design recovery when the database commits but the message broker is unavailable.',
    input: 'Order O81 commits; the broker is offline for two minutes; the dispatcher later delivers event E81 twice.',
    output: 'O81 remains committed, E81 is eventually published, and fulfillment creates one work item.',
    concept: 'A transactional outbox makes the business record and the intent to publish atomic within one database. Delivery can still repeat, so consumers need durable deduplication.',
    components: ['Order API', 'Order database', 'Outbox dispatcher', 'Message broker', 'Fulfillment'],
    flow: ['Order API → Order database: commit order and outbox event in one transaction', 'Order database → Outbox dispatcher: pending event E81', 'Outbox dispatcher → Message broker: publish with stable event ID', 'Message broker → Fulfillment: at-least-once delivery', 'Fulfillment → Fulfillment: commit event ID and work item together'],
    checks: ['The order and outbox insert share a database transaction.', 'Publishing retries preserve the original event ID.', 'A crash after publishing but before marking sent can safely replay.', 'Consumer deduplication and the work item commit atomically.'],
    hint: 'The uncertain interval moves from the request handler to the dispatcher; it does not disappear.',
    solution: 'Insert the order and a uniquely identified outbox record in one transaction. A dispatcher claims pending records, retries publication with bounded backoff and marks acknowledged events as sent. The fulfillment consumer uses a unique processed-event key in the same transaction as work-item creation. Monitor oldest pending event age and retain enough deduplication history for the supported replay window.',
    failure: 'The broker accepts E81, but the dispatcher crashes before recording success. On restart it publishes E81 again; the consumer must recognize the duplicate.',
    tradeoff: 'The outbox adds storage, cleanup and dispatcher operations, and fulfillment becomes eventually consistent. It avoids a distributed transaction while making local persistence and publication intent atomic.'
  },
  {
    id: 'regional-failover', track: 'Architecture', level: 'Hard', title: 'Fail over a single-writer service safely',
    brief: 'Design regional recovery for a notes service with asynchronous replication. State what happens to acknowledged writes and prevent two regions from accepting writes at once.',
    input: 'Region A is unreachable, region B last reported 20 seconds of replication lag, the recovery-time objective is 60 seconds, and the recovery-point objective is 30 seconds.',
    output: 'A fenced promotion decision, an explicitly verified recovery-point bound or unknown status, and a recovery procedure; an unreachable old writer is not assumed stopped.',
    concept: 'Asynchronous replication trades write latency for possible recovery data loss. Availability objectives do not establish exclusive write ownership during a network partition, and a stale lag sample does not bound losses at promotion.',
    components: ['Traffic router', 'Writer lease', 'Primary database', 'Replica database', 'Recovery controller'],
    flow: ['Primary database → Replica database: asynchronous replication stream', 'Recovery controller → Writer lease: prove old writer lease has expired or been fenced', 'Replica database → Recovery controller: durable replay position and measurement freshness', 'Recovery controller → Replica database: promote only after ownership and data-loss checks', 'Recovery controller → Traffic router: route writes to the new primary'],
    checks: ['Recovery time and tolerated data loss are defined separately.', 'Promotion requires enforceable exclusive writer ownership.', 'A historical 20-second lag sample is not treated as proof of the current recovery point.', 'The returning old region is rebuilt or reconciled before reuse.'],
    hint: 'A health check proves that one observer cannot reach A. It does not prove A has stopped serving every client or reveal its final acknowledged write.',
    solution: 'Use a consistent control plane for an exclusive writer lease and enforce lease validity or fencing on the write path. Promote B only after the old authority cannot commit more writes and available durable replication evidence establishes an acceptable recovery point. If acknowledged-write position is unknown, expose that uncertainty and follow the declared loss-acceptance policy. Change routing, validate the new writer and reconcile lost operations. The 60-second recovery target does not justify bypassing fencing or pretending the last lag sample proves the 30-second loss target.',
    failure: 'A network partition isolates A from the recovery controller while some clients still reach A. Promoting B without enforceable fencing creates divergent histories; A may also have acknowledged newer writes than the last lag sample shows.',
    tradeoff: 'Synchronous replication can reduce acknowledged-write loss but adds cross-region latency and may reduce write availability. Asynchronous replication keeps the local path fast and requires an explicit recovery-loss policy.'
  }
];
