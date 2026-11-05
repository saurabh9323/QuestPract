import type {DojoChallenge} from './types';

export const lldCases: DojoChallenge[] = [
  {
    id: 'library-loans', track: 'LLD', level: 'Easy', title: 'Lend a copy, not a book title',
    brief: 'Model a small library where several physical copies share one book title. A member borrows and returns a particular copy.',
    input: 'Title T1 has copies C1 and C2. Member M1 borrows C1; M2 then requests C1 while C2 remains available.',
    output: 'M1 receives one active loan for C1; M2’s request for C1 is rejected without making C2 unavailable.',
    concept: 'Entity identity follows the thing whose state changes independently. A book title describes content; a copy owns availability; a loan records the borrowing relationship.',
    components: ['Book title', 'Book copy', 'Member', 'Loan service', 'Loan repository'],
    flow: ['Book title → Book copy: shared bibliographic metadata', 'Member → Loan service: borrow a specific copy', 'Loan service → Loan repository: create active loan if the copy is available', 'Loan repository → Book copy: active loan determines availability', 'Member → Loan service: return the active loan'],
    checks: ['Different copies of the same title have distinct identities.', 'A copy cannot have two active loans.', 'Returning a loan changes that copy’s availability only.', 'A repeated return has a defined result and does not create a new loan.'],
    hint: 'Two copies share a title and author, but they can be in different places at the same time.',
    solution: 'Give BookTitle, BookCopy and Loan separate IDs. Store copyId, memberId, borrowedAt and returnedAt on the loan. Have LoanService coordinate borrowing and returning through a repository that enforces one active loan per copy. Derive availability from active loans or update it atomically with loan changes; reject borrowing an already-loaned copy. A repeated return reports the already-returned result without changing a later loan.',
    failure: 'A design stores isBorrowed on BookTitle. Borrowing C1 incorrectly blocks C2 and cannot represent two independent returns.',
    tradeoff: 'Deriving availability from loans avoids duplicated state but adds a lookup. Storing availability on the copy makes reads simpler and requires atomic updates to prevent disagreement with loan history.'
  },
  {
    id: 'notification-strategies', track: 'LLD', level: 'Medium', title: 'Add a notification channel without rewriting delivery',
    brief: 'Design a notification service that sends through email and SMS, then accepts a push channel without changing the orchestration logic.',
    input: 'Notification N42 targets email and SMS; email succeeds, while SMS reports an invalid destination.',
    output: 'Separate channel outcomes for N42; email stays successful and the permanent SMS failure is not retried blindly.',
    concept: 'A strategy interface separates delivery orchestration from channel-specific behavior. A useful abstraction preserves meaningful outcomes instead of hiding all differences behind a boolean.',
    components: ['Notification service', 'Sender registry', 'Email sender', 'SMS sender', 'Delivery result'],
    flow: ['Notification service → Sender registry: resolve requested channel', 'Sender registry → Email sender: invoke email strategy', 'Sender registry → SMS sender: invoke SMS strategy', 'Email sender → Delivery result: accepted with provider message ID', 'SMS sender → Delivery result: permanent destination error'],
    checks: ['Adding a channel requires a new sender and registration, not a new orchestration branch.', 'Each requested channel produces its own structured outcome.', 'Unknown channels and missing destination data fail explicitly.', 'Retry policy distinguishes transient failures from permanent failures.'],
    hint: 'The shared contract can describe accepted, transient failure and permanent failure without pretending every provider has identical inputs.',
    solution: 'Define a Sender interface receiving a validated channel destination, rendered content and operation ID. Register senders by channel and let NotificationService resolve and invoke them. Return a discriminated result with provider ID or error classification. Keep rendering and retry policy outside provider adapters, and retry only eligible failed deliveries using the provider’s supported deduplication mechanism. Provider acceptance is not proof that the recipient read the message.',
    failure: 'The service returns one success boolean after email succeeds and SMS fails. The caller cannot identify the failed channel and may resend the successful email.',
    tradeoff: 'A narrow shared interface makes new channels easier to add but cannot expose every provider feature. Keep optional capabilities explicit instead of adding unrelated flags to every sender.'
  },
  {
    id: 'vending-state-machine', track: 'LLD', level: 'Medium', title: 'Make vending-machine transitions explicit',
    brief: 'Model a vending machine that accepts credit, sells an available item, returns change and supports cancellation before dispensing begins. Assume sufficient change is available.',
    input: 'Water costs 30 units with stock 1. The user inserts 50 units, selects water, then presses cancel during dispensing.',
    output: 'One dispensing attempt and 20 units of change after confirmed delivery; cancellation during dispensing does not also refund all 50 units.',
    concept: 'A state machine defines which commands are valid and which effects happen at each transition. Explicit states prevent overlapping commands from spending the same balance twice.',
    components: ['User', 'Vending machine', 'Inventory', 'Credit balance', 'Dispenser'],
    flow: ['User → Vending machine: insert credit while idle or collecting', 'Vending machine → Credit balance: record accepted units', 'Vending machine → Inventory: validate and reserve selected item', 'Vending machine → Dispenser: enter dispensing state and request delivery', 'Dispenser → Vending machine: confirmed delivery or uncertain failure'],
    checks: ['Insufficient credit and out-of-stock selection leave credit recoverable.', 'Cancellation is permitted only before dispensing starts.', 'Selection reserves stock and balance exactly once.', 'Uncertain physical delivery enters an explicit fault state.'],
    hint: 'Write down the allowed commands in Idle, Collecting, Dispensing and Fault before choosing classes.',
    solution: 'Centralize command handling around explicit states and guard transitions with stock and credit checks. On a valid selection, reserve the item, freeze further purchase commands and enter Dispensing before invoking the hardware. On confirmed delivery, finalize the sale, return change and clear credit. On an uncertain hardware outcome, enter Fault for sensor reconciliation or operator recovery rather than automatically retrying delivery or issuing a full refund.',
    failure: 'The dispenser releases the item but its acknowledgement is lost. A blind retry can give away a second item; an unconditional refund can return the purchase price after delivery.',
    tradeoff: 'A transition table is compact for a small machine. Separate state classes can isolate growing behavior but add indirection; neither replaces a deliberate policy for uncertain hardware outcomes.'
  },
  {
    id: 'reservation-holds', track: 'LLD', level: 'Hard', title: 'Expire a seat hold without double booking',
    brief: 'Design a seat reservation model with expiring holds and confirmation. Concurrent users must not both obtain seat A1, and expiry must be testable without real sleeps.',
    input: 'H1 holds A1 until 12:05:00 UTC. Confirmation arrives exactly at 12:05:00 while another user requests A1.',
    output: 'H1 is expired at the boundary; at most one new active hold or confirmed reservation owns A1.',
    concept: 'Domain invariants require both explicit lifecycle rules and atomic persistence. Injected time makes expiry deterministic, but an in-memory check alone cannot coordinate multiple service instances.',
    components: ['Reservation service', 'Clock', 'Seat hold', 'Reservation repository', 'Confirmed booking'],
    flow: ['Reservation service → Clock: obtain the decision-time policy', 'Reservation service → Reservation repository: atomically acquire available or expired seat', 'Reservation repository → Seat hold: persist owner, expiry and version using decision time after obtaining the lock', 'Reservation service → Reservation repository: confirm matching unexpired hold with version check', 'Reservation repository → Confirmed booking: commit unique confirmed ownership'],
    checks: ['Expiry uses a documented boundary such as now >= expiresAt.', 'Confirmation validates the requesting owner and hold identity.', 'Acquisition and confirmation enforce seat ownership atomically.', 'Tests use an injected clock for before, at and after expiry, including lock wait.'],
    hint: 'A background expiry job is housekeeping. Correctness must still hold if that job runs late or never runs.',
    solution: 'Represent a hold with seatId, ownerId, expiresAt, status and a concurrency version. Inject a Clock policy into ReservationService and its repository boundary. Use locking or compare-and-set operations to acquire a seat and confirm only the matching owner’s unexpired hold. Evaluate time at the atomic decision, after any lock wait, with a consistent authoritative source. Keep confirmed seat ownership unique, and treat cleanup jobs as optional reclamation rather than the authority on availability.',
    failure: 'Two replicas both read an expired hold and then write replacements without a conditional update. Each returns success even though only one persisted record remains.',
    tradeoff: 'Pessimistic locking makes contested transitions easier to reason about but can queue requests. Optimistic version checks reduce lock duration and require explicit conflict responses or bounded retries.'
  }
];
