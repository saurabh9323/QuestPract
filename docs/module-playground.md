# Module Playground — Phase 1

Open `/playground/`. The existing static catch-all route and Practice navigation include the page. Nothing requires a new database table.

## Implemented

- Five data-driven JavaScript labs: two pointers, sliding window, binary search, bubble sort, and hash-map Two Sum, with four executable tests each.
- Acorn AST transformation, typed events, isolated worker execution, array/pointer rendering, variables before/after, source highlighting, playback and time travel.
- Existing Studio records store code, inputs, notes, active time and explicitly saved attempts. Attempts retain code, test results and assistance level; full traces are not persisted. Saved passing attempts contribute to the Playground analytics card.
- Optional Gemini step explanations and four hint levels use the existing auto-coach queue and server-side key. Local hints work without Gemini.
- AI context has a 3,800-character cap and includes at most the selected step plus five events on either side. The preview identifies trimming. Only citations present in that request and belonging to the current run are clickable.

## Execution contract

JavaScript only. Define synchronous `solve`. The supported subset includes variables, expressions, arrays, branches, loops, named functions, recursion and selected Map/Set/Math/collection methods. Unsupported syntax fails explicitly; this is not a general-purpose JavaScript debugger.

The UI parses/instruments code without evaluating it. A network-blocked opaque-origin sandbox iframe creates the worker. Each input/test runs in a fresh worker with a three-second deadline. Limits include 5,000 events, 100 nested calls, 128 collection entries and a 4 MB trace budget. Cancel removes the sandbox. Tests compare raw returned values inside the worker, before display serialization.

Snapshots are bounded display representations. Swaps appear as individual writes. Platform internals are not traced. Map/Set state is available in the variables panel; specialized Map/Set and other structure renderers are future work. Starter code is a worked example, so passing it does not demonstrate independent authorship.

## Validation

Run `npx.cmd tsc --noEmit` and `npx.cmd tsx --test tests/playground.test.ts`.
The Node test harness uses the actual public worker source; its startup watchdog is 15 seconds to accommodate local Node startup, while the browser execution deadline remains three seconds.

All 11 focused tests pass, including all 20 supplied module cases, scope/recursion semantics, caps, wrong answers, schema validation, context trimming and citation validation. Typecheck passes.

Desktop (1440×900) and mobile (390×844) were inspected in the browser. The sliding-window example returned 9, passed 4/4 tests and produced 84 events; playback, scrubbing and keyboard stepping were exercised. Both themes were inspected.

The full repository suite has seven existing course/planning failures, reproduced on unchanged HEAD. No unrelated tests were changed.

Live Gemini responses could not be verified locally: the deployed function rejects the localhost:3015 origin with `COACH_ALLOWED_ORIGINS`. The UI reports this connection failure and remains usable. No production function settings were changed.

## Next phases

Prediction scoring, measured complexity, races, bug mutation/divergence, adversarial input tools, specialized data-structure renderers and explicitly labelled JS/React/SQL simulators remain outside Phase 1. AI review, generated modules, AI mutations and interview follow-ups are also deferred.
