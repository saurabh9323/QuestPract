# Inside a Real App

Route: `/inside-app/` (Practice navigation, global page search, Practice studio and Analytics).

The first complete journey is booking the last cinema seat. Other product journeys are not included in this release.

## What works

- Seven scenarios: one customer, double click, competing customers, lost response after commit, offline delivery, stale cache, expired session.
- Toggle conditional reservation, UNIQUE constraint and idempotency independently. Rerun to compare actual booking rows and SQL operation counts with the previous run in that scenario.
- An interactive React mini-app, active-layer animation, before/after state, SQL plus bound parameters, actual database tables, modeled request status and logs.
- Play/pause, previous/next, rewind, adjustable speed and scrubber. Keyboard shortcuts on the focused player. Reduced-motion media preference stops the animation and autoplay; animations can also be disabled in the UI.
- English/Hinglish “why” explanations, three interview prompts, an answer structure, notes and downloadable Markdown evidence.
- Predictions are captured before execution. Explicitly saved reflections retain options, result checks, prediction, viewed steps and opened evidence views, through the existing StudioProvider/Supabase progress mechanism. The course days are unchanged. A separate Analytics card reports saved evidence, not a readiness score.

## Execution boundaries

`public/inside-app-worker.js` loads the existing bundled sql.js/WASM. Each run seeds a new SQLite database, executes real parameterized queries, commits or rolls back, captures immutable snapshots and closes the database. It never accesses the account database. The client terminates a run after 15 seconds or cancellation; trace generation is capped at 120 steps.

The HTTP, session check, cache and competing-request schedule are explicit models. Competing customers deliberately both read before either writes, then their transactions run sequentially on a single connection. This demonstrates a stale preflight check, not database lock scheduling or a real multiserver load test. Conditional writes and the actual UNIQUE index independently protect this sample invariant. All writes use transactions, including the unsafe experiment.

Idempotency is scoped to customer/key with a fixed seat input. The model replays completed requests, not simultaneous in-flight requests. Production design additionally needs payload mismatch handling, expiry, distributed coordination, correct isolation and payment behavior. The Node.js/.NET snippets illustrate handler structure; they are not executable backend implementations.

SQL counts exclude fixture setup and read-only snapshot inspection. They are neither latency measurements nor complexity estimates. Row checks do not prove correctness for all possible interleavings. The animated path replays the saved model/SQL snapshots; it is not an instrumentation trace of React internals.

## Verification

`npx.cmd tsc --noEmit`

`npx.cmd tsx --test tests/inside-app.test.ts tests/inside-app-client.test.ts tests/sql-game.test.ts tests/repair-lab.test.ts tests/adaptive-revision.test.ts tests/progress.test.ts`

Worker tests execute the same JavaScript and SQLite as the browser. They cover the seven outcomes, all eight protection combinations for competing requests, actual constraint rejection and rollback, lost-reply recovery, trace continuity/counters, invalid inputs, database isolation between runs, progress merging and route registration. Client tests cover cancellation, worker errors and invalid responses.

No production build was run, following the existing project constraint. Localhost browser inspection was unavailable under the browser URL policy; desktop/mobile visual layout and authenticated cloud round trips still require a manual check.

Manual check: open Practice → Inside a Real App; predict one row; run competing customers with defaults; finish playback and save a reflection; reload and confirm it appears. Disable both seat protections, rerun and inspect the two real booking rows. Restore UNIQUE and compare. Repeat on narrow/light/dark layouts and with reduced motion enabled.
