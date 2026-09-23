import {pack} from './core';
// Editorial learning levels, in the stable order of each ten-question pack.
// Keep IDs unchanged so existing answers and bookmarks remain attached.
const levels:Record<string,string>={
 'sd-routing':'MEMMMEMEMH','sd-storage':'HMHHEMMHMM',
 'sd-consistency':'MMHHHMHHHM','sd-messaging':'MMHMEHMMMM',
 'sd-product':'MHHHEMMEEM','sd-commerce':'EHHHHMHMMM',
 'sd-platform':'HHHMHEMMMM','sd-data':'HMMMMHMMMM',
 'sd-oop':'MHEMEEMMMM','sd-functions':'EMEMMEMEMM',
};
function p(id:string,title:string,lesson:string,flow:string[],example:string,rows:string){pack('System design',id,title,lesson,flow,example,'State assumptions, label estimates, explain the first bottleneck and avoid promising exactly-once delivery or zero downtime without defining the boundary. Compare a simpler alternative.','https://aws.amazon.com/architecture/well-architected/',rows.trim().split('\n').map((s,i)=>{const [q,a]=s.split('|');const level=levels[id]?.[i];if(!level)throw new Error(`Missing design difficulty: ${id}-${i+1}`);return `${level} ${q}|${q}|${a}`}).join('\n'))}
p('sd-routing','Request routing and edge systems','Routing controls how a request reaches a service, but different layers make different decisions. DNS routing, CDN edge selection, reverse proxying and application gateways are not interchangeable. Trace identity, timeouts and observability across each boundary.',['Client','DNS / edge','Gateway','Service','Response'], 'For an authenticated API call, terminate TLS at a defined boundary, verify identity, authorize the resource, attach a request ID and bound the upstream deadline.',`
Design the complete request path through an API gateway for 1000 requests/second.|Separate TLS, authentication, routing, limits, upstream deadlines, response mapping and correlation.
Explain CDN edge selection and design a global static-asset delivery path.|Compare DNS/anycast/routing mechanisms as deployment-dependent, then define cache keys, TTL and origin fallback.
Design a reverse proxy that removes unhealthy targets without flapping.|Specify active/passive checks, thresholds, readiness versus liveness, reentry and connection draining.
Design per-user rate limiting across ten API instances.|Choose a shared atomic counter/token mechanism, key scope, window semantics and dependency-failure policy.
Design a URL shortener with ten million reads and one million writes per day.|Estimate peak load/storage, choose code generation, handle collisions, abuse, redirects and cache invalidation.
Compare horizontal and vertical scaling for a CPU-bound API.|State memory/CPU limits, state placement, coordination overhead and the point where an extra instance helps.
Design request cancellation across a browser, gateway and three downstream services.|Propagate deadlines/cancellation where supported and distinguish stopped waiting from stopped side effects.
Design a private internal API reachable only by authorized employees.|Separate network restrictions, identity, resource authorization, audit and credential lifecycle.
Design an upload gateway for 100 MB private files without buffering them all in memory.|Use bounded streaming or direct signed uploads with authorization, validation and completion verification.
Design resilient traffic routing during a single-region outage.|Define RTO/RPO, data availability, DNS/edge behavior, capacity and safe failback.
`);
p('sd-storage','Storage and partitioning','Storage design follows read/write patterns, consistency and growth. Replication improves availability only when the failover and acknowledgement contracts are explicit. Partitioning changes query costs and can concentrate load around poor keys.',['Access patterns','Key + schema','Write path','Read path','Rebalance'], 'Consistent hashing places keys and virtual nodes on a ring; adding a node moves a subset of ranges, but hot keys can remain hot regardless of average balance.',`
Explain consistent hashing and design node addition/removal with bounded remapping.|Show ring ownership, virtual nodes, replication and migration; distinguish balance from hot-key mitigation.
Trace a write into a replicated distributed database and its possible acknowledgments.|Define leader routing, log/replica persistence, quorum choice, client acknowledgement and failover ambiguity.
Design sharding for a multi-tenant application where one tenant is much larger.|Compare tenant/range/hash keys, hot-tenant isolation and cross-shard queries.
Design cross-shard joins for an order and customer reporting workload.|Compare co-location, denormalization, scatter/gather and separate analytics pipelines.
Design a key-value store with TTL expiration semantics.|Separate logical expiration from physical cleanup and discuss lazy/active deletion plus memory pressure.
Design a private document store with version history and deletion requirements.|Separate immutable blobs, ownership metadata, retention, recovery and final deletion policy.
Design a database migration that changes a required field without breaking old clients.|Use expand/backfill/dual-compatibility/contract phases and verify each rollout boundary.
Design multi-region reads with read-your-writes for a user’s own edits.|Explain replication lag and options such as primary routing or session/version tokens.
Design a database backup and restore process with a one-hour recovery target.|Specify backup type, retention, encryption, restore drills, dependencies and measured recovery time.
Compare row-oriented and columnar storage for a billion-row analytics table.|Relate projection, compression, scan patterns and update workload to the storage choice.
`);
p('sd-consistency','Consistency and concurrent workflows','Consistency is a requirement, not a fashionable default. Some operations can tolerate stale reads; inventory, permissions or money may require stronger coordination. Model partial failure and retries before choosing a transaction or compensation approach.',['Invariant','Concurrent operations','Commit boundary','Retry / compensation','Reconcile'], 'A booking can atomically claim a unique seat and commit a reservation; payment is another boundary with idempotent retry and an explicit expiry/compensation policy.',`
Choose consistency guarantees for a social feed versus a seat reservation.|Explain which stale reads are acceptable and which invariant needs coordination; eventual consistency is not universally better.
Design updates when two services edit the same database row simultaneously.|Compare atomic operations, optimistic versions and locking with visible conflict handling.
Design a distributed order-payment-inventory transaction.|Compare local transactions plus saga/outbox with coordinated transactions and define compensations.
Design idempotent payment requests when responses can be lost.|Persist caller-scoped operation keys and outcomes; handle payload mismatch and uncertain external results.
Design a ticket reservation with ten-minute holds and competing buyers.|Use atomic ownership/expiry transitions and a reconciliation path for delayed payments.
Design optimistic versus pessimistic editing for a shared profile.|Preserve drafts, expose version conflicts and consider lock lifetime and abandoned clients.
Design a service workflow when a downstream call times out halfway through.|Track operation state and distinguish unknown outcome from safe failure before retry or compensation.
Design ordering for events produced by nodes with skewed clocks.|Use causal/sequence mechanisms where needed and avoid using wall time as a universal total order.
Design a stock counter that must never become negative under high concurrency.|Choose a coordination boundary, atomic conditional updates and explicit reservation/commit transitions.
Design reconciliation for records that disagree across two services.|Define the source of truth, discrepancy detection, repair ownership and an auditable replay process.
`);
p('sd-messaging','Queues, events and workers','Queues decouple acceptance from processing and buffer uneven workloads. Delivery semantics must be paired with consumer behavior. Retries, deduplication, ordering, poison messages and lag are product-visible concerns.',['Accept','Persist / enqueue','Consume','Acknowledge','Retry / dead letter'], 'An outbox record committed with an order survives a publisher crash; a separate publisher retries it, while consumers deduplicate possible repeated deliveries.',`
Design a notification system for email, push and in-app delivery.|Separate channel preferences, durable jobs, provider responses, retries and user-visible delivery states.
Design an event bus that decouples five services.|Define event contracts, ownership, subscription lifecycle, versioning and failure isolation.
Diagnose unbounded Kafka consumer lag and propose recovery.|Compare production/consumption rates, partitions, slow handlers, poison records and safe replay capacity.
Compare push and pull delivery for a worker fleet.|Discuss backpressure, polling latency, leasing, scaling and acknowledgment responsibility.
Design delayed reminders that survive worker restarts.|Store durable scheduled intent and claim due work atomically with retry-safe processing.
Design exactly-once business effects over at-least-once message delivery.|Define the effect boundary and use transactional deduplication/idempotency rather than claiming transport magic.
Design a dead-letter queue triage and replay workflow.|Retain error context, cap retries, authorize replay and preserve idempotency with audit history.
Design ordering for events from the same customer without globally serializing all traffic.|Partition by entity key and define sequence/version handling for duplicates and gaps.
Design a thumbnail-processing queue for bursty uploads.|Bound concurrency, separate CPU/memory-heavy workers and track job lifecycle plus cancellation.
Design a webhook delivery service for unreliable customer endpoints.|Sign payloads, persist attempts, retry with limits/jitter and expose delivery history without duplicate effects.
`);
p('sd-product','Collaborative and social products','User-facing systems need concrete journeys before infrastructure. Separate authoritative writes from derived feeds/search/counts. Permissions, abuse, fanout and offline behavior often change the design more than the basic CRUD endpoints.',['User action','Authorization','Authoritative write','Derived views','Live update'], 'A chat message has a durable ID and conversation sequence; delivery acknowledgments and read receipts are separate states, not one vague sent flag.',`
Design one-to-one chat with offline recipients.|Define message IDs, persistence, delivery/read states, reconnect sync and duplicate handling.
Design group chat for rooms up to 10000 members.|Compare fanout/storage costs, ordering scope, membership permissions and presence load.
Design a social news feed for read-heavy traffic.|Compare fanout-on-write versus read and hybrid handling for very large publishers.
Design a collaborative text editor for intermittent connectivity.|Discuss operation model, convergence approach, document permissions and conflict/undo semantics.
Design a real-time presence indicator.|Use heartbeats and expiry with approximate semantics rather than treating disconnect detection as immediate certainty.
Design a shared calendar with conflicting invitations and timezone changes.|Separate event instants, local recurrence rules, RSVP state and conflict policy.
Design an activity feed with per-resource access changes.|Recheck access for derived content and define deletion/revocation propagation.
Design a comment system with nested replies and moderation.|Model depth/pagination, ordering, edits, abuse controls and moderation states.
Design a video-learning progress tracker across devices.|Store playback checkpoints and completion evidence with conflict handling and offline intent.
Design a personal interview tutor with answer history and retrieval practice.|Separate curriculum, immutable attempts, feedback provenance, review scheduling and attachment ownership.
`);
p('sd-commerce','Commerce and booking systems','Commerce workflows cross multiple failure and trust boundaries. Availability checks are not reservations; payment callbacks can repeat. State machines and durable operation identities make the differences between pending, confirmed, expired and compensated visible.',['Browse','Reserve','Authorize payment','Commit','Reconcile'], 'A shopping cart is editable intent. An order snapshots price and quantity; later catalog price changes should not silently rewrite historical purchases.',`
Design a shopping cart whose prices can change before checkout.|Revalidate and snapshot prices at an explicit boundary with user-visible changes.
Design checkout across inventory, payment and shipping services.|Define a state machine, local commits, idempotent provider calls and compensation limits.
Design hotel room booking over date ranges.|Model room inventory by night and atomically prevent overlapping confirmed reservations.
Design airline seat selection under intense concurrent demand.|Separate seat holds, expiry, payment and final allocation with durable uniqueness.
Design a flash sale that protects inventory and downstream systems.|Use admission control, atomic reservations, fairness/abuse rules and measurable queue behavior.
Design a coupon service with per-user and global redemption limits.|Enforce limits atomically and preserve idempotent redemption across retries.
Design a subscription billing system with renewals and failed payments.|Track billing periods, retries, grace states, webhooks and reconciled provider outcomes.
Design refunds including partial refunds and duplicate callbacks.|Bound refundable amount, preserve ledger entries and use operation-specific idempotency.
Design a product catalog with searchable attributes and price history.|Separate current views from history and define index freshness plus update propagation.
Design an order audit trail that cannot be casually rewritten.|Use append-only event records with controlled permissions, correlation and retention requirements.
`);
p('sd-platform','Infrastructure and resilience','Resilience comes from bounded dependencies, clear health signals and tested recovery, not simply adding more replicas. Stateful scaling needs ownership transfer or shared durable state. Choose mechanisms against explicit failure scenarios and measure their cost.',['Failure model','Isolation','Detection','Recovery','Verify'], 'A readiness check can remove an instance from traffic before termination; a bounded drain prevents existing requests from being cut off unnecessarily.',`
Design a horizontally scaled stateful service.|Explain partition ownership, session routing, durable state, migration and failure recovery.
Design leader election for scheduled jobs.|Use a well-defined lease/coordination service and fencing to prevent an expired leader from writing.
Explain ZooKeeper-style coordination for leader election at a conceptual level.|Discuss ephemeral/sequential coordination, session failure detection and fencing; verify implementation-specific details in its docs.
Design a service discovery system.|Track registrations, health/expiry, client caching and behavior during discovery outages.
Design an API service with no single availability-zone dependency.|Trace compute, data, queue and network dependencies; replicas alone do not remove every single point of failure.
Compare a modular monolith and microservices for a five-person team.|Weigh deployment independence against operations, data coordination and organizational cost.
Design a centralized configuration service with safe rollout.|Version configuration, validate changes, scope rollout and provide fallback/rollback with audit.
Design a secrets rotation workflow without exposing secrets to browsers.|Coordinate issuance, overlapping validity, refresh, revocation and observability at trusted boundaries.
Design a deployment pipeline with canary health gates and rollback.|Define artifact identity, meaningful metrics, exposure stages and schema compatibility.
Design overload protection for a dependency already failing.|Apply bounded queues/concurrency, deadlines, circuit breaking and load shedding with explicit user behavior.
`);
p('sd-data','Search, analytics and observability','Derived systems trade freshness for query efficiency. Define ingestion, indexing/aggregation, retention and correction paths. At scale, the important questions include duplicates, late data, schema evolution, hot partitions and the cost of replay.',['Ingest','Validate + partition','Index / aggregate','Query','Repair / replay'], 'Search indexes are derived views: a committed product update can precede searchable visibility, so define acceptable lag and a repair/reindex path.',`
Design search indexing for one billion documents.|Estimate shard/storage needs, tokenization, incremental updates, deletes and full reindex without losing service.
Design autocomplete with typo tolerance and ranked suggestions.|Separate prefix retrieval, ranking signals, latency budgets and update freshness.
Design a log aggregation system for thousands of services.|Bound ingestion, partition/retain logs, protect sensitive fields and support indexed investigation.
Design distributed tracing across asynchronous workers.|Propagate correlation context and distinguish request traces from long-lived business operation IDs.
Design a metrics pipeline with high-cardinality labels.|Control cardinality and retention while preserving useful dimensions and aggregation accuracy.
Design real-time analytics with late and duplicate events.|Define event time versus processing time, watermarks, deduplication and correction windows.
Design a recommendation feature starting with limited data.|Start with a measurable baseline, define feedback/experiments and avoid premature complex models.
Design a top-k trending topics service over rolling time windows.|Choose exact versus approximate counting, window boundaries and hot-key mitigation.
Design a data export service for large customer datasets.|Use background jobs, consistent snapshot semantics, private files, expiry and progress tracking.
Design a privacy deletion workflow across primary stores, caches and indexes.|Track the deletion request, propagate tombstones/commands and distinguish active data from backup retention policy.
`);
p('sd-oop','Low-level design with OOP','Low-level OOP design names responsibilities, invariants and collaboration contracts. Show interfaces and a concrete call sequence before drawing a large class hierarchy. Prefer composition where independent policies vary.',['Use cases','Entities + invariants','Interfaces','Sequence','Tests'], 'A parking system can separate AllocationStrategy from Ticket and PaymentGateway; capacity updates still need atomic coordination outside the object diagram.',`
Design a parking lot using OOP with multiple vehicle and spot types.|Separate capacity, allocation policy, ticket lifecycle and payment; show a concurrent-entry invariant.
Design an elevator controller using OOP for multiple cars.|Model requests and car states separately from scheduling strategy and safety constraints.
Design a library lending system using OOP.|Separate title from physical copy, borrower, loan and reservation queue with checkout invariants.
Design a chess game using OOP without building a UI.|Define board/state, legal move validation, turn rules and check detection without a subclass for every incidental fact.
Design a split-expense system using OOP.|Use value objects for money, explicit split strategies and balance ledger rather than mutable pairwise guesses.
Design a notification dispatcher using OOP.|Inject channel providers behind a contract; keep retry policy and durable job ownership outside vendor adapters.
Design a vending machine using an OOP state model.|Define selection, payment, dispense and refund transitions with insufficient-stock/payment behavior.
Design an extensible pricing engine using OOP.|Separate validated input, pricing rules, ordering/conflict policy and a traceable result.
Design an ATM simulator using OOP, excluding real financial integration.|Model session, authorization boundary, cash inventory and transaction states with failure tests.
Design a testable file-search utility using OOP.|Compose predicates and traversal/storage adapters; specify symlinks, permissions and cancellation.
`);
p('sd-functions','Low-level design without OOP','A non-OOP design can express the same invariants with immutable records, pure transition functions and explicit I/O adapters. The goal is clear ownership and testable behavior, not banning every class in a dependency. Compare both approaches against the same requirements.',['Data records','Pure transitions','I/O adapters','Orchestration','Property tests'], 'transition(state,event) can return {nextState,effects}; a separate runner performs effects and feeds confirmed outcomes back as events.',`
Design a shopping-cart engine with pure functions and immutable data.|Separate validation, quantity changes, discounts and checkout effects; return explicit errors.
Design a task scheduler without domain classes.|Represent jobs as records, selection as a pure policy and persistence/clock as injected boundaries.
Design a form-validation engine using composable functions.|Compose field and cross-field validators with structured errors and deterministic ordering.
Design an event-driven order state machine without inheritance.|Use tagged states/events and a pure transition table that rejects invalid transitions.
Design a CSV import pipeline using functions and streaming.|Separate parsing, validation, transformation and batched persistence with row-numbered errors.
Design a permission evaluator using policy data and pure predicates.|Define deny/allow precedence, resource context and explainable decisions without executing arbitrary policy code.
Design a rate-limiter calculation without mutable global state.|Pass bucket state/time/cost into a pure calculation and atomically persist its proposed next state.
Design a spaced-repetition planner using pure functions.|Take attempt evidence and current time, return next review date and reason with deterministic tests.
Design an undo/redo editor using immutable state transitions.|Store reversible commands or snapshots, bound history deliberately and handle edits after undo.
Compare OOP and functional designs for the same booking workflow.|Implement one invariant and one extension in both, then compare dependencies, change cost and testability.
`);
