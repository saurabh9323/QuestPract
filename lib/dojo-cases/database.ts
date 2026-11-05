import type {DojoChallenge} from './types';

export const databaseCases: DojoChallenge[] = [
  {
    "id": "order-schema",
    "track": "Database",
    "level": "Easy",
    "title": "An order schema that preserves history",
    "brief": "Model orders and line items so a later product-price change does not rewrite past purchase totals.",
    "input": "Order O9 has product P1 quantity 2 at 500 minor currency units each.",
    "output": "Tables, primary and foreign keys, quantity checks and historical unit price.",
    "concept": "A foreign key preserves a relationship; it does not preserve the historical value of mutable product attributes.",
    "components": [
      "Customer",
      "Order",
      "Order line",
      "Product"
    ],
    "flow": [
      "Customer → Order: customer_id foreign key",
      "Order → Order line: order_id foreign key",
      "Product → Order line: product_id plus purchase-time price snapshot"
    ],
    "checks": [
      "Each line belongs to an order.",
      "Quantity and money representation are constrained.",
      "Historical price is stored on the line.",
      "Deletion and ownership policies are explained."
    ],
    "hint": "Joining today’s product price cannot reconstruct yesterday’s sale price.",
    "solution": "Use orders and order_lines with explicit keys. Store quantity, unit_price_minor and currency where appropriate; define valid quantities and amounts. Choose restrictive deletion or deliberate archival policies, and explain whether taxes and discounts need their own snapshots.",
    "failure": "A product is discontinued. The old order still needs a readable historical line.",
    "tradeoff": "A price snapshot duplicates product data but preserves the purchase agreement. Referencing only the current product record saves storage while making historical totals change with later edits."
  },
  {
    id: 'ledger-transfer', track: 'Database', level: 'Medium', title: 'Move credits without losing the balance',
    brief: 'Transfer credits between two wallets in one database. A crash or concurrent spend must never leave a one-sided transfer or make a wallet negative.',
    input: 'Wallet A has 700 credits and wallet B has 100. Command T42 moves 250 from A to B; another command may spend from A concurrently.',
    output: 'After one successful T42, A has 450 and B has 350, with one durable transfer record. An insufficient-balance command changes neither wallet.',
    concept: 'A transaction groups writes atomically, but a read followed by an unconditional update can still lose concurrent changes. The balance invariant needs locking or a conditional write at the database boundary.',
    components: ['Transfer command', 'Wallet rows', 'Transaction', 'Transfer ledger'],
    flow: ['Transfer command → Transaction: transfer ID, source, destination and positive amount', 'Transaction → Wallet rows: lock both accounts in stable ID order', 'Wallet rows → Transaction: current balances for validation', 'Transaction → Transfer ledger: unique T42 and balanced debit/credit entries', 'Transaction → Wallet rows: debit and credit committed together'],
    checks: ['Positive integer amounts and distinct wallet IDs are validated.', 'The debit, credit and transfer identity commit or roll back together.', 'Concurrent spends cannot both use an outdated balance.', 'Deadlock retries and repeated transfer IDs cannot apply T42 twice.'],
    hint: 'A transaction around two writes does not make a balance read outside it safe. Identify which locked or conditional operation decides that funds exist.',
    solution: 'Begin a transaction and establish a unique transfer identity. Lock source and destination rows in deterministic order, verify ownership and available funds, then update both balances and append matching ledger entries before commit. On rollback nothing moves. Retry transient conflicts with the same command ID and return the stored result for a completed transfer.',
    failure: 'The process stops after updating A but before updating B. Both writes must remain uncommitted so recovery cannot expose a debit without its credit.',
    tradeoff: 'Row locks make a small transfer easy to reason about but can serialize hot wallets. Optimistic conditional writes reduce waiting under light contention but need conflict handling and full transaction retries.'
  },
  {
    id: 'task-query-index', track: 'Database', level: 'Medium', title: 'Index the actual task-list query',
    brief: 'A workspace lists the next open tasks for one owner. Select an index from the filter and ordering requirements, then explain how to verify that it reduces work.',
    input: 'Tasks(id, owner_id, status, due_at, title) has 2 million rows. Query: WHERE owner_id = 17 AND status = open ORDER BY due_at ASC, id ASC LIMIT 20; due_at is non-null.',
    output: 'A candidate index on (owner_id, status, due_at, id), with an execution-plan comparison showing rows visited, sort work and read latency for representative owners.',
    concept: 'A composite B-tree can use leading equality conditions and then traverse the ordered suffix. Index usefulness depends on the query shape, selectivity and actual distribution, not the number of indexed columns alone.',
    components: ['Task list query', 'Composite B-tree', 'Task rows', 'Execution plan'],
    flow: ['Task list query → Composite B-tree: seek owner 17 and open status', 'Composite B-tree → Task rows: fetch at most the needed ordered matches', 'Task rows → Task list query: first 20 tasks ordered by due_at and id', 'Execution plan → Task list query: compare scanned rows and sorting before and after'],
    checks: ['The index begins with the equality-filter columns.', 'The id tie-breaker appears in both ORDER BY and the index.', 'Plans are checked for small and very large owners using realistic data.', 'Write overhead, index size and stale planner statistics are considered.'],
    hint: 'After locating one owner and status, the next index entries should already be in the order the page needs.',
    solution: 'Try a B-tree on (owner_id, status, due_at, id). Inspect the database execution plan with representative bind values and current statistics; compare scanned rows, sorting and observed latency. Avoid indexing title merely because it is selected unless measured covering-index benefits justify the larger structure. Revisit the design if the query begins filtering multiple statuses or changes ordering.',
    failure: 'A rewritten query orders by a computed expression on due_at. The existing index may still filter efficiently while no longer avoiding the sort; inspect the new plan.',
    tradeoff: 'The composite index accelerates this ordered read but takes storage and adds work when tasks change status or due date. A narrower index is cheaper to maintain but may leave more rows to scan or sort.'
  },
  {
    id: 'appointment-overlap', track: 'Database', level: 'Hard', title: 'Reject overlapping room reservations',
    brief: 'A booking service must prevent overlapping active reservations for the same room, including when two requests arrive on separate servers at the same time.',
    input: 'Room R2 already has a confirmed interval [10:00, 11:00). Request A wants [11:00, 12:00); requests B and C both want [12:00, 13:00). Cancelled rows must not block new bookings.',
    output: 'A succeeds because adjacent half-open intervals do not overlap. At most one of B and C commits; the loser receives an availability conflict.',
    concept: 'Checking for overlap before inserting can race across transactions. A database-enforced exclusion rule or serialized per-room critical section must protect the predicate, not just each new row.',
    components: ['Booking API', 'Room row', 'Reservation transaction', 'Reservation intervals'],
    flow: ['Booking API → Reservation transaction: room, UTC start/end and command ID', 'Reservation transaction → Room row: acquire the room lock before checking availability', 'Reservation transaction → Reservation intervals: test active rows with start < requestedEnd and end > requestedStart', 'Reservation transaction → Reservation intervals: insert only if the protected check is clear', 'Reservation transaction → Booking API: committed ID or conflict'],
    checks: ['Intervals use start < end and a consistent timezone representation.', 'Adjacent intervals are accepted under the documented [start, end) convention.', 'Every writer uses the same room-lock boundary, or a database constraint enforces overlap exclusion.', 'Cancellation and concurrent rescheduling follow the same invariant.'],
    hint: 'Locking an empty result set does not necessarily lock the missing reservation that another request is about to insert.',
    solution: 'Use a transaction that locks the existing room row before reading active overlaps and inserting. All booking and rescheduling writers must acquire that lock; acquire multiple room locks in a stable order if needed. Alternatively use a supported range-exclusion constraint for active intervals. Map conflicts to a retryable availability response and keep a unique command ID for replay safety.',
    failure: 'Two servers both read no overlap at 12:00 and then insert. A preliminary SELECT without a shared locking or constraint rule permits both reservations.',
    tradeoff: 'A per-room lock is portable and straightforward but serializes bookings for that room. A range-exclusion constraint protects the invariant closer to the data while tying the design to database-specific capabilities.'
  }
];
