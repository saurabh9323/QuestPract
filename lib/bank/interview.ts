import {pack} from './core';
function p(id:string,title:string,lesson:string,example:string,pitfall:string,resource:string,rows:string){pack('Interview',id,title,lesson,['Define the mechanism','Trace an example','Find a failure','Defend a tradeoff'],example,pitfall,resource,rows.trim().split('\n').map(s=>{const [q,a]=s.split('|');return `${q}|${q}|${a}`}).join('\n'))}
p('int-js','JavaScript language','JavaScript uses lexical scope and first-class functions. Primitive values and object references behave differently under copying and equality. Coercion follows operator-specific rules. A reliable explanation predicts an observable result and then distinguishes the language rule from coding convention.','A spread of {settings:{dark:false}} copies only the outer object; mutating copied.settings.dark changes the shared nested object.','Do not describe closures as frozen copies of values or claim const makes objects immutable.','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',`
How do var, let, and const differ?|Discuss function/block scope, initialization, reassignment, and the temporal dead zone.
What is a closure and when is it useful?|A function retains access to lexical bindings; counters and subscriptions are concrete examples.
Why can a const object’s fields change?|The binding cannot be reassigned; the referenced object can still mutate.
How do == and === differ?|Loose equality may coerce types; strict equality does not, but neither deeply compares objects.
What does Object.is distinguish?|It treats NaN as equal to itself and distinguishes positive and negative zero.
What is the temporal dead zone?|A lexical binding exists in scope before initialization but cannot yet be accessed.
How does hoisting differ for declarations?|Function declarations are initialized early; var starts undefined; lexical bindings stay uninitialized.
How is this determined in a regular function?|Call form matters: method, explicit binding, constructor, or plain invocation under strict mode.
How is arrow-function this different?|It captures enclosing this and has no own constructible this binding.
What do call, apply, and bind do?|They specify this; call/apply invoke now, while bind returns a callable wrapper.
How does prototypal inheritance resolve a property?|Look on the object, then its prototype chain until found or null.
What is an own property?|It belongs directly to the object; inherited properties come from prototypes.
When does shallow copying fail?|Nested references remain shared; copy changed levels or use a suitable deep-cloning strategy.
Why is JSON cloning not general deep cloning?|It loses unsupported values/types and cannot handle circular references.
How do map, filter, and reduce differ?|Transform each item, retain matching items, and accumulate a result respectively.
What are null and undefined used for?|Undefined commonly represents absent/uninitialized values; null is an explicit empty value by convention.
What is optional chaining’s limitation?|It stops on nullish values, not arbitrary errors or every invalid data shape.
How do nullish coalescing and logical OR differ?|Nullish coalescing falls back only for null/undefined; OR also for zero, false, and empty string.
How do you implement recursive array flattening?|Visit values, recurse into arrays, collect nonarrays; discuss depth and cyclic-input policy.
How would you implement groupBy without a library?|Accumulate items into key-indexed arrays, defining key normalization and safe object/Map usage.
`);
p('int-async','Async JavaScript','The event loop coordinates synchronous work and queued callbacks. A Promise represents a future settlement, not a thread. Correct async code handles rejection, ordering, cancellation, cleanup, and concurrency limits. Scheduling details differ between browser and Node contexts.','If request A starts first but finishes after request B, the UI must discard A when B represents the current query.','Async functions can still block on CPU loops. A timeout is not a guarantee that the underlying work stopped.','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises',`
What is the difference between concurrency and parallelism?|Concurrency overlaps tasks; parallelism executes work simultaneously on multiple execution resources.
What does an async function return?|It returns a Promise, adopting the returned value or promise and rejecting on a thrown error.
Does await block the browser thread?|It suspends that async function; synchronous computation before the next yield still blocks.
How do microtasks differ from timer tasks?|Microtasks run at checkpoints before another task; excessive microtasks can delay rendering/tasks.
What does a zero-delay timer guarantee?|Eligibility after scheduling constraints, not immediate execution or an exact timestamp.
How do Promise.all and allSettled differ?|All rejects when an input rejects; allSettled reports every settlement without canceling the inputs.
How do Promise.race and any differ?|Race adopts first settlement; any adopts first fulfillment and rejects if all reject.
Does rejecting Promise.all cancel other requests?|No; cancellation must be implemented separately where the underlying API supports it.
How should fetch handle HTTP errors?|Check response.ok/status; many HTTP failures resolve rather than rejecting the fetch Promise.
How does AbortController help a search UI?|Abort obsolete requests and still guard the association between response and active query.
How would you implement debounce?|Reset a timer on each call, preserve arguments/this, and define leading/trailing/cancel behavior.
How does throttling differ from debounce?|Throttle limits execution rate; debounce waits for a quiet period or configured edge.
How would you implement a promise-based delay?|Resolve a Promise from a timer and optionally provide an abortable cleanup contract.
Why is async forEach often surprising?|forEach ignores callback promises; use for...of for sequence or mapped promises for concurrency.
When should requests run sequentially?|When later requests depend on earlier results or a service requires ordered side effects.
How do you limit async concurrency?|Maintain a bounded worker pool and define rejection, cancellation, and queue-draining behavior.
How do retries create duplicate writes?|A response can be lost after a write succeeds; use a persisted idempotency key/result.
How do you avoid an unhandled rejection?|Await or attach rejection handling to every relevant promise, including detached background work.
What is a stale closure in a timer?|A callback may read bindings from an earlier render; use functional updates or appropriate refs.
How do you test out-of-order responses?|Control separate promises, resolve the newer request first, then assert the older cannot overwrite it.
`);
p('int-ts','TypeScript and contracts','TypeScript checks programs statically and erases most types at runtime. Model states with unions, validate unknown external data, and keep generics tied to real relationships. A type assertion is a claim made by the programmer, not a parser.','A union {status:"loading"} or {status:"success",data:User} makes data access conditional on a status check.','Avoid any at untrusted boundaries and avoid asserting away an error without checking runtime data.','https://www.typescriptlang.org/docs/handbook/',`
How do any and unknown differ?|Unknown requires narrowing before use; any disables relevant checking and propagates unchecked assumptions.
When would you use a discriminated union?|Represent mutually exclusive states with a shared literal tag and state-specific fields.
What is type narrowing?|Control-flow checks refine a broad type into a more specific usable type.
What does never represent?|An impossible value or nonreturning path; it supports exhaustive case checking.
How do interfaces and type aliases differ?|Both describe shapes; interfaces support declaration merging, aliases can directly name unions and other types.
How do generics improve an API?|They preserve relationships between inputs and outputs rather than merely replacing types with placeholders.
What does keyof produce?|A union of property-key types for a given object type.
What is an indexed access type?|It extracts the type of a selected property or set of properties.
How do Pick and Omit help contracts?|They derive selected or excluded property shapes; runtime data still needs filtering/validation.
What does Partial not guarantee?|It makes fields optional statically; it does not validate a patch or allow every state transition.
How does Readonly differ from runtime freezing?|Readonly constrains typed assignments; it does not freeze objects or necessarily deep-protect nested values.
What is a type predicate?|A function signature tells the checker that a successful runtime check narrows a value.
Why can a user-defined type guard be wrong?|The compiler trusts the predicate signature; its implementation must actually test the claimed shape.
What does satisfies preserve?|It checks assignability while retaining a more specific inferred expression type.
How do optional fields differ from explicit undefined?|Presence may matter at runtime and under exactOptionalPropertyTypes; define the intended contract.
How would you type API loading states?|Use a discriminated union rather than unrelated booleans permitting contradictory combinations.
What is structural typing?|Compatibility depends primarily on members and their types rather than declared names alone.
How would you type a reusable React prop callback?|Specify the event/data contract and return type rather than using Function or any.
How do you validate JSON before treating it as a User?|Parse as unknown, check shape and values with runtime validation, then return a narrowed result.
How do you handle an exhaustive switch?|Assign the remaining value to never or use an assertion helper to expose unhandled variants.
`);
p('int-react','React state and lifecycle','React renders a snapshot of props and state, then commits changes. State should describe the minimum authoritative facts; derived values can often be calculated during render. Effects synchronize with external systems and need symmetric cleanup.','Three setCount(count+1) calls read the same snapshot. Three functional updates can compose into three increments.','Do not use effects to mirror every prop into state or mutate state objects in place.','https://react.dev/learn',`
Why does React state behave like a snapshot?|A render’s handlers close over that render’s values; updates schedule another render.
When should you use a functional state update?|When the next state depends on the queued previous state, especially with multiple updates.
Why should state updates be immutable?|A new reference expresses change and avoids corrupting prior render snapshots or shared values.
How does React use keys?|Keys identify siblings across renders; unstable keys can reset state or associate it with the wrong item.
Why is an array index sometimes a bad key?|Insertions/reordering change positional identity and can move local state to the wrong row.
What belongs in an effect?|Synchronization with external systems such as subscriptions, timers, browser APIs, or imperative widgets.
How do effect dependencies work?|Reactive values read by the effect determine when synchronization needs to restart.
What does effect cleanup do?|It reverses prior synchronization before a rerun or unmount, preventing leaks and stale work.
Why can effects run extra times in development?|Development Strict Mode probes setup/cleanup resilience; production behavior and remounts must still be understood.
How do useRef and useState differ?|Ref mutations persist without scheduling a render; state changes drive rendered output.
What is lifting state up?|Move shared authoritative state to the nearest common owner and pass data/actions downward.
When is context useful?|Provide shared values across a tree without threading props through unrelated intermediate components.
Why can context updates cause broad rerenders?|Consumers update when their context value changes; split contexts and stabilize meaningful values where warranted.
What does useReducer clarify?|It centralizes related state transitions into explicit actions and a pure transition function.
What is a controlled input?|Its displayed value is driven by React state and changes flow through an event handler.
When can an uncontrolled input be useful?|The DOM owns its value; refs/form APIs can read it when continuous React synchronization is unnecessary.
How do you prevent stale search results?|Abort or ignore obsolete work and ensure the result belongs to the current query.
How do you reset component state deliberately?|Change its key or explicitly reset state according to a clear ownership decision.
What makes a custom hook reusable?|It packages stateful behavior with a stable contract, without hiding unrelated side effects.
Why should hooks not run conditionally?|React associates hook state with call order; conditional calls break that consistent ordering.
`);
p('int-react-ui','React performance and accessible UI','Performance and accessibility are user-observable properties. Measure a slow journey before optimizing. Accessible controls need names, keyboard operation, focus management, and meaningful status messages. A fast screen that hides errors is not a complete feature.','A form failure should preserve entered values, show field-specific messages, and focus the error summary or first invalid field.','Memoization is not a substitute for measuring network, database, or rendering cost.','https://react.dev/reference/react',`
When does memo help a component?|When skipped rerenders are meaningful and props compare equal; verify with profiling.
How do useMemo and useCallback differ?|One caches a computed value, the other a function identity, subject to dependency changes.
Why can memoization make code worse?|It adds comparisons, memory and dependency complexity without helping an unmeasured bottleneck.
How would you render 100000 rows?|Paginate or virtualize appropriately, while preserving keyboard and screen-reader usability.
How do you investigate an input that lags?|Profile event handling, render cost and large synchronous computations before choosing an optimization.
What is code splitting useful for?|Defer code outside the current journey to reduce initial work, with sensible loading/error handling.
What should an error boundary cover?|Unexpected render/lifecycle errors in its child tree; ordinary async/event errors still need explicit handling.
How does Suspense differ from a generic loading boolean?|It coordinates supported suspending work; it does not automatically observe every fetch in an effect.
How do you handle optimistic update failure?|Retain/reconcile the prior state, preserve user intent, and expose a retry or conflict action.
How do you make a modal keyboard-accessible?|Manage initial focus, constrain modal focus, support appropriate dismissal, and restore trigger focus.
How do labels and placeholders differ?|Labels name controls persistently; placeholders are hints that disappear and do not replace labels.
How should validation errors be announced?|Use visible messages connected to fields and appropriate focus/live-region behavior.
Why use a button instead of a clickable div?|Native buttons provide keyboard activation, semantics, focusability and disabled behavior.
What is the risk of color-only status?|Users may not distinguish colors; add text or shape that conveys the same meaning.
How do you test responsive layouts beyond widths?|Check text enlargement, long content, keyboard focus, touch targets, and unintended overflow.
How should a live-search announcement behave?|Announce useful result status without flooding assistive technology on every keystroke.
How do you prevent duplicate form submission?|Track a pending operation, guard the action, and use server idempotency for important side effects.
What belongs in URL search parameters?|Shareable navigation/filter state; exclude secrets and avoid unnecessary sensitive values.
How do you handle interrupted network saves?|Preserve drafts, distinguish pending from confirmed state, and make retry/conflict behavior visible.
How do you test a user journey meaningfully?|Assert observable outcomes across success, failure, and accessibility paths rather than private function calls.
`);
p('int-next','Next.js application boundaries','Next.js combines server and client rendering capabilities. Choose a boundary based on data access and interactivity, and verify caching behavior against the installed version. Rendering strategy is separate from access control. Static export cannot supply runtime server endpoints.','A server component can fetch private data and pass a safe serializable result to a small client filter, without shipping the secret.','Do not assume all caching defaults from an older Next.js version still apply.','https://nextjs.org/docs/app',`
How do Server and Client Components differ?|Server Components can run server-side data work; Client Components provide browser interaction and may still be prerendered.
What does use client establish?|A client module boundary; imported dependencies belong to that client graph where supported.
Can a Client Component initially render HTML on the server?|Yes, client capability does not imply exclusively client-side initial HTML.
What props can cross a server/client boundary?|Use React-supported serializable values; ordinary closures and secret-bearing objects are unsuitable.
Where should a backend API secret live?|In server-only configuration/code, never a NEXT_PUBLIC_ browser-exposed variable.
How do you choose static versus request-time rendering?|Compare freshness, personalization, request dependencies, caching and hosting constraints.
What limitations come with output export?|No runtime Next server features; use build-time output and external browser-accessible services where appropriate.
How do Route Handlers differ from page components?|They implement HTTP endpoints with request/response semantics instead of returning a page UI.
How do layouts differ from templates conceptually?|Layouts preserve shared UI across navigation; templates create new instances according to framework semantics.
What can cause a hydration mismatch?|Different initial server/client output from time, random data, browser-only branching, or invalid markup.
How would you debug a hydration mismatch?|Find the differing subtree, make initial output deterministic, and move browser-specific work after hydration.
How should a protected page enforce authorization?|Verify access at the data/action boundary; redirects or hidden UI alone do not protect records.
What should loading UI communicate?|The pending region and next available action without replacing usable content unnecessarily.
How do you think about cache invalidation?|Define the cached object, freshness requirement, mutation trigger and consistency expectations first.
How do you prevent a data-fetch waterfall?|Identify independent requests and start them together; place boundaries according to actual dependencies.
Why might a server component reduce browser JavaScript?|Its server-only implementation and dependencies need not ship as interactive client code.
How do dynamic route parameters affect static export?|Known paths need build-time generation; arbitrary runtime server resolution is unavailable in a static export.
What should metadata describe?|The actual page content, title, description and appropriate canonical/social information without leaking private data.
How should images be handled in a static export?|Use compatible static assets or a configured image strategy; default runtime optimization needs a server.
How would you migrate a Next app safely between versions?|Read upgrade guidance, inspect changed defaults, run representative tests/builds, and verify deployment behavior.
`);
p('int-node','Node.js runtime','Node coordinates JavaScript execution with event-loop scheduling and asynchronous facilities. I/O concurrency does not remove CPU bottlenecks. Streams control memory and backpressure; process lifecycle must include shutdown and error reporting.','Reading a huge file into one buffer costs memory proportional to the file; a stream can process bounded chunks while respecting consumer speed.','Do not call a CPU loop nonblocking merely because its wrapper is async.','https://nodejs.org/en/learn',`
What makes Node suitable for I/O-heavy services?|It overlaps waiting work with event-driven execution, provided callbacks avoid monopolizing the event loop.
What blocks the event loop?|Long synchronous computation, synchronous I/O, and expensive parsing or pathological work in callbacks.
When would you use worker threads?|CPU-intensive JavaScript that benefits from parallel execution and can tolerate message-transfer overhead.
How do worker threads differ from child processes?|Threads share a process with isolated JS execution; processes have separate memory and OS isolation boundaries.
What is stream backpressure?|A producer must slow when a consumer cannot drain data fast enough, limiting buffered memory.
How do readable and writable streams cooperate?|Consume chunks and respect write/drain signals or use pipeline abstractions for propagation and cleanup.
Why use pipeline rather than manual stream piping?|It coordinates stream completion and errors more reliably across the chain.
How do Buffer and string differ?|Buffer stores bytes; strings represent text, requiring an explicit encoding interpretation.
What should graceful shutdown do?|Stop accepting work, drain bounded in-flight requests, close resources, and exit within a deadline.
How should an uncaught exception be treated?|Record safe diagnostics and recover at a process boundary rather than assuming unknown state is safe.
How do you prevent memory leaks in a Node service?|Inspect retained references, listeners, timers, unbounded caches and heap growth under reproducible load.
Why are unbounded in-memory caches risky?|They can grow with traffic until memory exhaustion and differ across service instances.
How do ESM and CommonJS differ?|They use different module/loading semantics and interoperability rules; inspect package type and file conventions.
What is middleware ordering important for?|Parsing, identity, authorization, routing and errors must run in a sequence matching the contract.
What happens if middleware never responds or calls next?|The request can remain pending until a timeout or connection closure.
How do you prevent sending a response twice?|Return after terminal responses and structure async branches to share one completion path.
How would you bound request-body size?|Configure parser limits and validate accepted types before expensive processing.
What belongs in a health endpoint?|A precise liveness/readiness contract with bounded checks, avoiding accidental costly dependency cascades.
How do you handle slow downstream services?|Set deadlines, limit concurrency, use safe retries, and expose degraded behavior where appropriate.
How would you investigate high event-loop delay?|Correlate CPU profiles, synchronous work, traffic shape and runtime metrics before scaling blindly.
`);
p('int-api','API design and security','An API contract defines inputs, outputs, errors, identity, and allowed state transitions. Validation is required at the boundary regardless of UI checks. Authentication identifies a caller; authorization constrains each resource operation.','A request for /applications/other-user-id must be scoped by authenticated owner identity, even if the UI never shows that link.','Do not pass arbitrary request objects directly into database filters or trust unguessable IDs as permissions.','https://developer.mozilla.org/en-US/docs/Web/HTTP',`
How do PUT and PATCH differ conceptually?|PUT replaces the target representation; PATCH applies a defined partial modification contract.
Which HTTP methods are idempotent by semantics?|Repeated identical requests have the same intended effect for methods such as GET, PUT and DELETE; responses can differ.
How do 401 and 403 differ?|401 indicates missing/invalid authentication; 403 indicates the request is understood but not permitted.
When would an API return 409?|A valid request conflicts with current resource state, such as a stale version or duplicate unique value.
What makes an error response useful?|Stable code, actionable message, field details where appropriate, and correlation without leaking secrets.
How do offset and cursor pagination differ?|Offsets are simple but shift under changes; cursors follow a stable ordering boundary with their own constraints.
Why must list ordering be deterministic?|Ties without a stable tiebreaker can duplicate or skip records between page requests.
How does authentication differ from authorization?|Identity answers who; authorization answers which operation on which resource is permitted.
What is an insecure direct object reference?|A caller can access a resource through its identifier without the required ownership/permission check.
What does CORS actually control?|Browser access to cross-origin responses under its policy; it is not a general server authorization mechanism.
How do XSS and CSRF differ?|XSS executes attacker-controlled script in an origin; CSRF induces authenticated requests using ambient credentials.
What does HttpOnly protect?|It prevents script reading a cookie, but not all authenticated actions an XSS payload can perform.
How does SameSite help cookies?|It restricts some cross-site sending, with mode-specific behavior; use it within a complete CSRF strategy.
Why should password storage use a password hash?|Slow salted password hashing resists offline guessing better than plaintext or a fast general-purpose hash.
How should secrets appear in logs?|They should not; redact tokens, passwords and sensitive payloads while preserving diagnostic context.
How do parameterized queries prevent injection?|They separate data values from executable query syntax; dynamic identifiers still need safe handling.
How do you design a safe file upload?|Bound size/types, validate content, enforce ownership, use private storage, and control serving behavior.
How should an idempotency key be scoped?|Bind it to caller and operation, persist the result, and reject incompatible reuse with a different payload.
How do rate limits differ from authorization?|Limits bound resource consumption; permission checks decide whether an action is allowed at all.
How would you version a breaking API change?|Make compatibility explicit, offer a migration period where needed, and observe clients before removing old behavior.
`);
p('int-mongo','MongoDB data modeling','MongoDB documents should follow access and update patterns. Embedding can keep a bounded aggregate together; references support independent growth and access. Indexes accelerate specific queries but consume storage and write work.','For per-user applications filtered by stage and sorted by creation time, evaluate a compound index matching that query rather than indexing stage alone.','Do not let arrays grow without limits or assume all joins disappear in a document database.','https://www.mongodb.com/docs/manual/',`
When should you embed related data?|When it is bounded, commonly read together, and benefits from atomic document updates.
When should you reference related documents?|When relationships grow independently, are many-to-many, or require separate access patterns.
What is the document atomicity boundary?|A single-document write is atomic; multi-document invariants need appropriate transactions or modeling.
What makes an unbounded array problematic?|Document size, update costs and contention grow; consider separate records or bounded buckets.
How does a compound index’s order matter?|Usable prefixes and sort/range behavior depend on field order and the actual predicate.
What is selectivity in an index?|How much a predicate narrows the dataset; low-selectivity keys may still scan many records.
What does explain help you inspect?|Chosen plan, index usage, scanned versus returned work, and execution observations where requested.
How do unique indexes help concurrency?|They enforce uniqueness at the shared storage boundary rather than relying on a race-prone precheck.
What does an aggregation pipeline do?|It transforms documents through stages such as match, group, project and sort.
Why filter by owner before aggregation?|Aggregate endpoints can leak cross-user information unless their input dataset is authorized.
How does projection improve an endpoint?|It returns only needed fields, reducing payload and accidental exposure.
What should you consider before sharding?|Shard-key distribution, query routing, hot keys, growth and cross-shard operations.
Why can a monotonically increasing shard key create hotspots?|New writes may concentrate on one key-range region depending on the sharding strategy.
What are replica sets for?|Replication and failover support availability, with read/write concern choices affecting guarantees.
How do read and write concern relate to correctness?|They specify acknowledgement/read visibility expectations; choose them for the operation’s requirements.
What does a TTL index not guarantee?|Expiration removal is not an exact per-document deadline; do not rely on instant deletion for authorization.
When would you use a transaction?|When multiple document changes must satisfy a shared atomic invariant despite concurrent writers.
How do you prevent operator injection?|Validate fields and construct allowed filters rather than passing untrusted nested objects through.
How should schemas evolve in a document store?|Version or tolerate compatible shapes and migrate deliberately; flexible storage still needs a contract.
How would you diagnose a slow aggregation?|Inspect match selectivity, index support, intermediate cardinality, sort/group work and actual execution evidence.
`);
p('int-pg','PostgreSQL and Supabase','Relational integrity belongs in constraints as well as application code. Transactions provide atomic grouping, while isolation determines interactions between concurrent work. Supabase adds client APIs and identity integration; RLS still needs explicit, tested ownership policies.','A unique (user_id,idempotency_key) constraint prevents two simultaneous identical operations from both creating new records.','A transaction does not automatically fix every race. A public client key is safe only with appropriate access policies.','https://www.postgresql.org/docs/current/tutorial.html',`
How do primary and foreign keys differ?|A primary key identifies a row; a foreign key constrains references to another candidate key.
How do WHERE and HAVING differ?|WHERE filters input rows; HAVING filters groups after aggregation.
How do inner and left joins differ?|Inner joins require a match; left joins preserve unmatched left rows with NULL right-side columns.
Why can a WHERE condition break a left join?|A predicate on NULL right-side values can eliminate unmatched rows; place conditions deliberately.
How do COUNT(*) and COUNT(column) differ?|The former counts rows; the latter counts non-NULL values.
Why can a join inflate totals?|One-to-many or many-to-many matches multiply rows; preaggregate or count the intended entity distinctly.
What does a transaction guarantee?|Atomic commit/rollback and other database guarantees under the selected isolation level and constraints.
How does a lost update occur?|Two writers derive new state from the same old value and one overwrites the other’s result.
How do optimistic and pessimistic locking differ?|Optimistic checks versions at write time; pessimistic coordination acquires locks before conflicting work.
What is a deadlock?|Transactions wait in a cycle for locks held by each other; consistent ordering and bounded retries help.
What does MVCC enable?|Readers can observe a consistent version without treating every concurrent write as a blocking conflict.
What is an index’s write cost?|Each affected index requires maintenance, adding CPU, storage and write amplification.
What is a covering index useful for?|It can satisfy required fields from index data where visibility and plan conditions allow.
How does EXPLAIN ANALYZE differ from EXPLAIN?|It executes the statement and reports observed runtime information.
How do window functions differ from GROUP BY?|They compute across related rows while preserving individual output rows.
How do rank and dense_rank differ?|Rank leaves gaps after ties; dense_rank advances to the next consecutive rank.
What does row-level security enforce?|Policies restrict which rows an allowed role may read or modify for each operation.
Why must Supabase service-role keys stay server-side?|They bypass RLS and would expose privileged access if shipped to a browser.
How would you test an ownership policy?|Use two identities and direct read/write attempts against each other’s records, including inserts with forged owner IDs.
Why use connection pooling?|It reuses bounded database connections; configure transaction/session expectations and avoid exhausting backend limits.
`);
p('int-python','Python language','Python’s object model distinguishes names from objects and mutable from immutable values. Iterators support incremental processing; generators suspend and resume execution. Type hints aid tooling but do not generally enforce runtime values by themselves.','A default list argument is created once at function definition time; use None and create a fresh list inside when independent calls need independent state.','Avoid hiding failures with broad exception swallowing or assuming every comprehension improves readability.','https://docs.python.org/3/tutorial/',`
How do list, tuple, set and dict differ?|Compare order, mutability, uniqueness and key-value access, including hashability requirements.
What causes the mutable-default-argument bug?|The default object is created once and reused across calls.
How do is and == differ?|is checks object identity; == invokes value equality semantics.
What makes an object hashable?|Its hash and equality behavior must remain compatible and stable for use in hashed collections.
How do shallow and deep copies differ?|Shallow copies share nested objects; deep copies recursively duplicate supported object graphs.
What is a generator useful for?|It yields values incrementally, reducing eager memory use and enabling streaming pipelines.
How do iterable and iterator differ?|An iterable can produce an iterator; an iterator tracks iteration state and returns successive values.
What does yield from do?|It delegates iteration and related generator protocol behavior to a subiterator.
How does a context manager help resources?|It defines entry/exit behavior so cleanup runs around a scoped block, including exceptions.
What is a decorator?|A callable transforms or wraps another callable/class; preserve metadata when wrapping functions.
How do args and kwargs work?|They collect extra positional and keyword arguments; forwarding should preserve the intended signature contract.
What is a comprehension best suited for?|A concise, readable transformation/filter; complex side-effectful logic belongs in ordinary statements.
How do exceptions propagate?|Uncaught exceptions unwind call frames, running finally/cleanup until handled or terminating the flow.
Why catch specific exception types?|It distinguishes expected recoverable failures from bugs that should remain visible.
What do Python type hints enforce by default?|They document/check statically via tools; ordinary runtime execution does not enforce all annotations.
What is a virtual environment?|An isolated package installation context for a project’s interpreter/dependency set.
How do modules and packages organize code?|Modules provide namespaces; packages group importable modules under a structured name.
What is the difference between class and instance attributes?|Class attributes are shared through the class; instance attributes belong to an individual object.
Why can Python async code still block?|Synchronous work inside a coroutine occupies its event-loop thread until it yields.
How would you parse CSV safely?|Use the standard CSV parser with explicit encoding/newline handling and row-level validation.
`);
p('int-fastapi','FastAPI and Python services','FastAPI maps typed request contracts to parsing and validation, but business invariants and authorization remain application responsibilities. Manage database sessions and background work with explicit lifetimes. Async routes help only when their work cooperates with the event loop.','A CSV preview can report accepted rows and row-numbered errors without writing anything; commit is a separate, idempotent operation.','Do not treat validation models as authorization or assume an in-process background task is a durable queue.','https://fastapi.tiangolo.com/tutorial/',`
How do path and query parameters differ?|Path values identify route resources; query parameters commonly filter or configure the operation.
What does a request model validate?|Its declared runtime shape and constraints, not every business rule or caller permission.
Why use response models?|They document and constrain returned fields/shapes, helping prevent accidental internal-data exposure.
What is dependency injection useful for?|Provide shared request-scoped services such as identity, sessions or configuration with explicit dependencies.
How should a database session be scoped?|Create and clean it up around the appropriate request/work unit, handling rollback after failures.
When would you choose def versus async def for a route?|Match the blocking/asynchronous libraries and framework execution behavior; avoid blocking an async event loop.
Why can ORM lazy loading surprise an endpoint?|Serialization may trigger extra queries or access a closed session; load required data explicitly.
How would you prevent an N+1 query pattern?|Measure query counts and use joins, eager loading or batching appropriate to the response.
How do validation and business errors differ?|Malformed data differs from a valid request conflicting with domain state; expose distinct responses.
How do you protect an endpoint by owner?|Derive identity from verified authentication and scope queries/actions to that identity.
What belongs in application startup and shutdown?|Initialize shared resources and close them through the framework’s supported lifecycle mechanism.
When is a background task insufficient?|Work requiring durable retries, cross-process coordination or survival after a crash needs durable queueing.
How would you implement paginated responses?|Bound page sizes, define stable order/cursors, and return navigation metadata consistently.
How should file processing be bounded?|Limit upload size, stream where possible, validate rows/types, and cap expensive work.
How would you make an import idempotent?|Persist an owner-scoped operation key and result under a uniqueness constraint.
How do you test a FastAPI route without a public server?|Use the framework’s test client or ASGI transport and controlled dependencies.
Which dependencies should a test override?|External boundaries such as identity or services, while retaining the core behavior being verified.
What should OpenAPI documentation include?|Accurate parameters, models, response/error shapes and authentication expectations.
How should logs connect an import’s stages?|Use a correlation/operation ID and structured events without logging sensitive file contents.
How would you deploy multiple workers safely?|Keep authoritative state outside process memory and coordinate shared jobs, connections and migrations.
`);
p('int-oop','Object-oriented design','OOP groups state and behavior behind responsibilities and contracts. Encapsulation protects invariants; polymorphism allows substitutable implementations. Inheritance is one tool, not a requirement for every design. Favor changes that reduce coupling and make behavior testable.','A PaymentGateway interface can have fake and real implementations; an order service depends on the capability instead of constructing a vendor client internally.','Avoid inheritance solely for code reuse and avoid abstract factories that solve no actual variation.','https://docs.python.org/3/tutorial/classes.html',`
What does encapsulation protect?|It limits how state changes so the object can preserve its invariants.
How does abstraction differ from encapsulation?|Abstraction exposes relevant capability; encapsulation controls representation and modification boundaries.
What is polymorphism in a practical service?|Different implementations satisfy one behavioral contract and can be used interchangeably.
When is composition preferable to inheritance?|When behaviors vary independently or inheritance would create a misleading is-a relationship.
What does the single-responsibility principle mean?|A module should have a coherent reason to change, not necessarily only one method.
How do you apply open/closed without overengineering?|Introduce extension points around demonstrated variation while keeping stable behavior unchanged.
What does Liskov substitution require?|A subtype preserves the base contract’s expectations, not merely its method signatures.
Why can a square/rectangle hierarchy be problematic?|Independent width/height mutation expectations may conflict with a square’s invariant.
What is interface segregation?|Clients depend on capabilities they need rather than a large unrelated interface.
What is dependency inversion?|High-level policy depends on abstractions rather than specific low-level implementations.
How does dependency injection differ from dependency inversion?|Injection is a construction/wiring technique; inversion is an architectural dependency direction principle.
When does a strategy pattern help?|Choose among interchangeable algorithms behind one capability based on a real variation point.
When is an observer pattern useful?|Notify multiple subscribers of state/events while managing subscription lifecycle and failure isolation.
What risks come with a singleton?|Global mutable state, hidden dependencies, lifecycle coupling and test interference.
How do factory methods help construction?|They centralize construction choices and return a defined capability without exposing concrete details.
What is an aggregate invariant?|A consistency rule enforced within a defined domain boundary across its allowed operations.
How do entities and value objects differ?|Entities have continuity of identity; value objects are defined by their values and often immutable.
What belongs in a repository abstraction?|Domain-relevant persistence operations without leaking unnecessary storage mechanics into policy.
How can overusing inheritance hurt tests?|Behavior becomes coupled to base state/lifecycle and cannot be substituted through a narrow dependency easily.
How would you refactor a giant service class?|Identify coherent responsibilities and stable seams, preserve behavior with tests, and extract incrementally.
`);
p('int-functional','Functional and procedural design','Functional design emphasizes explicit inputs, outputs and limited side effects. Procedural code can be clear when the workflow is simple and state ownership is explicit. Compare approaches by change patterns and testability, not by treating one paradigm as universally superior.','A pure calculateTotal(items,discount) returns a result; a separate boundary loads items and persists an order, making arithmetic independently testable.','Immutability does not remove the need for database concurrency control, and functions can still hide global dependencies.','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions',`
What makes a function pure?|Its result depends on inputs and it has no observable side effects.
Why is referential transparency useful?|An expression can be replaced by its value without changing behavior, simplifying reasoning and tests.
How do you separate policy from side effects?|Keep transformations pure and place I/O in explicit boundary functions or orchestration layers.
What is function composition?|Build a larger transformation by passing one function’s output into another compatible function.
How do higher-order functions help reuse?|They accept/return functions to parameterize behavior without duplicating orchestration.
What is currying versus partial application?|Currying transforms argument structure; partial application fixes some arguments of a function.
How can immutability simplify UI reasoning?|Prior states remain stable snapshots and changes are represented explicitly.
What is the cost of naive immutable copying?|Repeated large copies can consume time/memory; use structural sharing or targeted updates when justified.
How would you model errors as values?|Return a tagged success/error result with explicit handling rather than relying solely on exceptions.
When are exceptions still appropriate?|For failures where stack unwinding and boundary handling are clearer than propagating ordinary result values.
How do you test time-dependent logic purely?|Pass a clock or timestamp as input rather than reading global time internally.
How do you test randomness deterministically?|Inject a seeded generator or controlled choice source at the boundary.
What is a reducer’s responsibility?|Compute the next state from prior state and an action without side effects.
How would you design a rules engine without classes?|Represent rules as validated data and pure predicates/transforms composed by an explicit evaluator.
How would you design the same rules engine with OOP?|Use a narrow Rule contract and implementations while keeping evaluation order and state ownership explicit.
When is straightforward procedural code the best choice?|For a small stable sequence where extra abstraction would obscure the actual flow.
How can a functional core and imperative shell cooperate?|The shell performs I/O and coordinates; the core computes decisions from explicit values.
What is hidden coupling in a function?|Global state, implicit environment dependencies or shared mutable references not visible in its parameters.
How do you avoid a chain of unreadable transformations?|Name intermediate concepts, split responsibilities, and prefer clarity over maximum chaining.
How do you compare OOP and non-OOP designs fairly?|Evaluate invariants, expected changes, dependency boundaries, testability and complexity for the same requirements.
`);
p('int-systems','Networking and operating systems','An HTTP request depends on several lower layers. DNS, transport, TLS and application status are distinct failure boundaries. Processes and threads manage execution resources; memory, scheduling and file descriptors constrain service behavior.','A DNS lookup failure happens before an HTTP status exists; a 500 response means an HTTP server was reached and responded.','Do not equate an open port with a healthy application or a connection timeout with a specific root cause.','https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',`
What happens from entering a URL to seeing a page?|Trace name resolution, connection/TLS, HTTP, response parsing, asset loading and rendering with cache qualifications.
What does DNS resolve?|Names to records such as IP addresses, with caching, TTLs and multiple resolution layers.
How do TCP and UDP differ?|TCP supplies an ordered reliable byte stream; UDP sends datagrams without those built-in guarantees.
What does TLS provide?|Peer authentication and encrypted/integrity-protected transport when configured and validated correctly.
How does HTTP keep-alive help?|It reuses connections, reducing repeated setup costs while requiring connection lifecycle management.
What is head-of-line blocking?|Earlier stalled work delays later work sharing an ordered channel; the layer matters.
How do a forward proxy and reverse proxy differ?|One represents clients toward destinations; the other fronts servers toward clients.
What is a process versus a thread?|A process owns an isolation/resource context; threads execute within a process and share its address space.
What is a context switch?|The OS changes which execution context runs, with state and cache-related costs.
How does virtual memory help isolation?|Processes use virtual addresses mapped to physical resources under OS-enforced permissions.
What is the stack versus heap distinction?|Call-local execution frames versus dynamically managed allocations, with language/runtime-specific details.
What is a race condition?|Behavior depends on uncontrolled timing of conflicting operations on shared state.
How do mutexes and semaphores differ?|A mutex enforces mutual exclusion with ownership semantics; a semaphore counts available permits.
What conditions can contribute to deadlock?|Mutual exclusion, hold-and-wait, no preemption and circular wait in the classic model.
What is starvation?|Work remains indefinitely deprived of a needed resource despite system activity.
What is a file descriptor?|A process-local handle to an open OS resource such as a file or socket.
Why can a service run out of file descriptors?|Leaked/unbounded open files or connections exceed the process limit.
How does a reverse proxy perform health routing?|It uses configured checks and thresholds to exclude/reinclude targets; check scope and failure delay matter.
What is the difference between liveness and readiness?|Liveness asks whether to restart; readiness asks whether the instance should receive traffic.
How do you troubleshoot connection refused versus timeout?|Refused often means active rejection/no listener; timeout means no timely completion and needs network/path evidence.
`);
p('int-testing','Testing, Git and debugging','Tests should prove observable behavior at the right boundary. Unit, integration and end-to-end checks answer different questions. Debugging proceeds from reproduction and evidence. Git history supports small, understandable and reversible changes.','A failed-save test should verify that text remains available and a retry is possible, not merely that an internal setter was called.','Avoid tests that mirror implementation or mocks that remove the behavior the test claims to verify.','https://git-scm.com/doc',`
How do unit, integration and end-to-end tests differ?|They cover progressively broader boundaries with different speed, isolation and diagnostic tradeoffs.
What makes a test deterministic?|Controlled inputs/environment and no dependence on uncontrolled order, time, randomness or shared state.
What should you mock?|External boundaries that prevent control, while keeping the target behavior and important contracts real.
How do you test a race condition?|Control operation ordering with barriers/promises and assert the invariant under conflicting interleavings.
How do you test a retry safely?|Simulate a transient failure then success and assert one intended side effect with bounded attempts.
What is property-based testing useful for?|Explore many generated inputs against a general invariant and shrink failures to useful counterexamples.
What is mutation testing intended to reveal?|Whether tests detect deliberately changed behavior rather than merely executing code.
Why is coverage not proof of correctness?|Executed lines can have weak assertions and miss important input combinations or invariants.
How would you investigate a flaky test?|Reproduce its timing/order/environment dependencies and fix the cause rather than adding arbitrary waits.
What belongs in a useful bug report?|Expected/actual behavior, minimal reproduction, environment, impact and relevant safe evidence.
How do git merge and rebase differ?|Merge combines histories; rebase replays commits onto another base and changes their identities.
When is revert safer than reset?|On shared history, revert adds an inverse commit without moving others' branch history.
What is the staging area for?|It selects the exact changes for the next commit independently of all working-tree edits.
How does git bisect help?|It binary-searches commits using a reproducible good/bad test.
How should you resolve a merge conflict?|Understand both intended behaviors, combine deliberately, then run relevant checks.
What makes a commit reviewable?|One coherent purpose, clear context and evidence, with unrelated changes excluded.
How do you review a pull request effectively?|Check behavior, invariants, compatibility, failure handling and appropriate tests before style nits.
How do you debug without changing many things at once?|Form a hypothesis, collect a discriminating observation, and change one relevant factor.
How do you safely log diagnostic data?|Include correlation and state needed for analysis while redacting credentials and sensitive payloads.
When should a bug fix include a regression test?|When a stable meaningful test captures the failure boundary and protects against recurrence.
`);
p('int-delivery','Docker and CI/CD','Delivery pipelines convert a known source revision into a tested artifact and a controlled release. Containers package runtime dependencies but do not automatically make an application secure or reliable. Separate build-time public configuration from runtime secrets.','A pipeline installs from a lockfile, runs checks, builds once, deploys that artifact, verifies health and retains a rollback target.','Do not treat a successful process start as readiness or rebuild an untracked different artifact for each promotion.','https://docs.docker.com/get-started/',`
How do an image and container differ?|An image is a packaged filesystem/configuration; a container is a running instance with process state.
How do containers differ from virtual machines?|They share the host kernel with isolation mechanisms rather than packaging a full independent guest OS.
Why use multi-stage Docker builds?|Separate build tooling from the runtime image to reduce unnecessary size and attack surface.
How does Docker layer caching affect file order?|Stable dependency manifests before changing source allow expensive dependency layers to be reused.
Why run a container as non-root?|It reduces consequences of some compromises; it does not replace other isolation and permission controls.
What should .dockerignore exclude?|Unneeded source artifacts, secrets, caches and dependencies not intended in the build context.
Why does localhost inside a container surprise developers?|It refers to that container, not another service or necessarily the host.
How do volumes differ from the container writable layer?|Volumes provide separately managed persistent storage beyond a container’s lifecycle.
What is a container health check for?|It reports a defined health signal; orchestration behavior depends on configured policies.
How should a container handle termination signals?|The main process must receive/handle them and shut down within the platform deadline.
How do continuous integration and delivery differ?|CI validates integrated changes; delivery prepares releasable artifacts, while deployment releases them to an environment.
Why use a dependency lockfile in CI?|It preserves a reproducible resolved dependency graph rather than silently selecting new versions.
What should block a release pipeline?|Failures in required behavior/security/compatibility checks and unsuccessful readiness verification.
How do build artifacts help traceability?|They bind a deployment to a known source revision and reproducible build output.
What is a blue-green deployment?|Two environments permit switching traffic to a validated version with a defined rollback route.
What is a canary deployment?|Expose a limited traffic portion to a new version and expand based on meaningful health signals.
How do database migrations complicate rollback?|Schema/data changes may not be backward-compatible; use expand/contract and plan the compatibility window.
Why use OIDC for deployment credentials?|It exchanges constrained workload identity for short-lived credentials instead of storing long-lived cloud keys.
What should a workflow trust policy restrict?|The intended repository, branch/environment, audience and identity conditions with least privilege.
How do you debug a CI-only failure?|Compare runtime, lockfile, environment, filesystem case, timezone and test isolation using the actual error.
`);
p('int-cloud','AWS fundamentals','Cloud architecture combines identity, networking, compute, storage and operations. Each service choice has cost and failure implications. Use least privilege, define resource lifetimes, and verify cleanup; a budget alert is not a hard spending cap.','Private resume objects can be accessed through short-lived signed URLs after application authorization, without making the bucket public.','Do not infer AWS IAM permission from network reachability or assume stopped compute means all related costs stop.','https://docs.aws.amazon.com/',`
How do IAM users and roles differ?|Users represent identities with credentials; roles are assumable permission identities commonly used for temporary access.
What does least privilege mean operationally?|Grant only needed actions/resources/conditions and review usage instead of defaulting to broad wildcards.
How do security groups differ from IAM policies?|Security groups filter network traffic; IAM policies authorize AWS API actions.
What is a VPC’s role?|It defines an isolated virtual networking environment with subnets, routes and connectivity controls.
How do public and private subnets differ?|Routing and reachable paths determine exposure; names alone do not make resources public or private.
What does a load balancer add?|Traffic distribution, health-based routing and sometimes TLS/HTTP features depending on the selected service.
When might EC2 be suitable?|When control over the host/runtime is useful and you can operate patching, scaling and availability.
When might Lambda be suitable?|Event-driven bounded execution with managed scaling, subject to runtime, duration, concurrency and cost constraints.
What are cold starts?|Initialization delays for a new execution environment; impact depends on workload and configuration.
How does object storage differ from a filesystem?|It stores objects by keys with API-based access, not all local filesystem semantics.
What is a presigned S3 URL?|Time-limited authorized request parameters; access still depends on the signing identity and applicable policy.
How do you keep uploaded files private?|Restrict bucket/object access, authorize requests, and use bounded signed access where appropriate.
What is an RDS deployment responsible for versus the app?|The service manages selected database operations; schema, queries, access and application correctness remain yours.
How do availability zones help resilience?|Separate failure domains can reduce impact of a zone failure when the architecture actually spans them.
Why are backups different from replicas?|Replicas support availability/read scaling but can reproduce bad writes; backups support point-in-time recovery needs.
What should CloudWatch alarms measure?|Actionable user-impact signals and resource indicators with sensible thresholds and response ownership.
What are RTO and RPO?|Recovery time objective and acceptable data-loss window guide disaster-recovery design.
Why can cloud cost persist after stopping an instance?|Volumes, snapshots, addresses and other provisioned services may still incur charges.
How would you plan a low-cost learning deployment?|Inventory resources, estimate usage, set alerts, bound the experiment and verify teardown.
How would you verify a deployment rollback?|Route traffic to the known prior artifact, verify representative health/user flows, and check schema compatibility.
`);
p('int-reliability','Distributed-system reasoning','Distributed systems make delay, partial failure and concurrent views normal. Specify the guarantee per operation before selecting caches, replicas or queues. Prefer a simple architecture that satisfies requirements and identify its next bottleneck with evidence.','A lost response after a successful write creates ambiguity: the retry must use the same operation identity to avoid duplicate side effects.','Eventual consistency is not always preferable, and real services should not claim absolute delivery or zero failure without precise assumptions.','https://aws.amazon.com/architecture/well-architected/',`
Why is a distributed timeout ambiguous?|The remote operation may have failed, still be running, or completed with a lost response.
How do retries amplify an outage?|Many clients multiply load on a struggling dependency unless attempts are bounded and spread out.
What does jitter add to backoff?|It reduces synchronized retry waves among clients with the same schedule.
When would you use a circuit breaker?|To stop repeated calls to a failing dependency and allow controlled recovery probes.
What is a bulkhead in service design?|Separate resource pools limit one failure or workload from exhausting unrelated capacity.
How does eventual consistency differ from strong consistency?|Eventual views converge under stated conditions; stronger models constrain what reads may observe after writes.
When is read-your-writes important?|Immediately after a user change, seeing that change may be essential to the experience and correctness.
What does consistent hashing reduce?|It reduces key reassignment when nodes change compared with simple modulo mapping, with balance caveats.
What is a hot key?|A disproportionately accessed key that concentrates load despite otherwise distributed storage.
How does cache-aside work?|Read cache, fetch origin on miss, populate; define invalidation and failure behavior explicitly.
What is cache stampede prevention?|Coalesce fills, jitter expiry or serve acceptable stale values to avoid simultaneous origin rebuilds.
How does sharding affect joins?|Cross-shard joins require data movement/coordination or denormalization; shard by actual access patterns.
What does at-least-once delivery imply?|Messages can repeat; consumers must tolerate duplicates and manage acknowledgments carefully.
What is the transactional outbox pattern?|Commit domain data and an outbox record together, then reliably publish from the outbox with duplicate handling.
How does a saga differ from a distributed transaction?|A saga coordinates local steps and compensations, with intermediate states and compensation limits.
How do monotonic and wall clocks differ?|Monotonic clocks measure elapsed time without wall-clock adjustments; wall clocks represent calendar time.
Why is clock skew relevant to ordering?|Different nodes' timestamps may not reflect causal order; use suitable logical/sequence mechanisms where needed.
How do logs, metrics and traces complement each other?|Events, aggregate signals and cross-boundary request paths answer different diagnostic questions.
What makes an SLO useful?|A measurable user-relevant target with a defined window and implications for prioritizing reliability work.
When should a monolith remain a monolith?|When its boundaries and deployment needs are manageable and service decomposition would add unjustified operational cost.
`);
p('int-behavior','Interview communication and career','A credible interview answer connects a concrete situation, your responsibility, your actions and observed outcomes. State uncertainty and ownership honestly. Behavioral practice is about clear evidence and judgment, not memorizing exaggerated claims.','For an incident, explain the impact, the diagnostic evidence you collected, the recovery action you owned, and the preventive change you helped deliver.','Never invent metrics, company questions, or production experience. Separate a practice project from professional work.','https://docs.github.com/en/get-started/start-your-journey/setting-up-your-profile',`
Tell me about your most difficult production bug.|Use a specific symptom, investigation, root cause, fix, verification and prevention from real experience.
Describe a deployment that caused a UI issue.|Explain impact, rollback or mitigation, communication, and the check that would have caught it.
Tell me about a technical disagreement.|Present competing constraints fairly, the evidence used, your action and the resulting decision.
How do you handle a last-minute requirement change?|Clarify impact and priorities, offer scoped options, and communicate revised expectations early.
Describe balancing performance and a deadline.|Explain the measured bottleneck, minimum valuable fix and consciously deferred work.
How do you collaborate with backend developers?|Agree contracts, examples, failure behavior and ownership; use shared evidence when integration fails.
How do you work with designers on constraints?|Translate constraints into user impact, propose alternatives, and verify the agreed behavior together.
Tell me about a mistake you made.|Own your contribution, explain recovery and show a concrete change in how you work.
How do you ask for help effectively?|Share the goal, reproduction, evidence, attempts and the specific decision blocking progress.
Describe learning an unfamiliar technology quickly.|Show how you identified essentials, built a bounded exercise, checked assumptions and applied feedback.
How do you mentor a junior developer?|Use questions, examples and review that builds independent reasoning rather than taking over every task.
How do you prioritize multiple urgent issues?|Compare user impact, risk, dependencies and effort; communicate what is delayed and why.
Tell me about an ambiguous task.|Explain the questions and small experiments that turned ambiguity into a testable scope.
How do you explain technical debt to a stakeholder?|Connect the debt to delivery cost or risk and propose a bounded improvement with evidence.
What would you improve in your recent project?|Name one justified improvement, the tradeoff and how you would verify it.
How do you respond when you do not know an interview answer?|State what you know, ask clarifying questions, reason from fundamentals and avoid bluffing.
Why are you considering a new role?|Give an honest forward-looking reason connected to responsibilities and growth, without disparaging others.
How do you demonstrate impact without numerical metrics?|Use observable outcomes, user/reviewer feedback, reduced failure modes and clearly stated evidence.
What questions would you ask an engineering team?|Ask about ownership, review, incidents, deployment, mentoring and success expectations relevant to the role.
What is your next six-month growth plan?|Choose a few role-relevant skills, practical evidence and feedback checkpoints rather than a list of buzzwords.
`);
