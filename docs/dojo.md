# Dojo

Open Practice → Dojo, or /dojo/. Existing links with ?challenge=<id> still open the same case. The section query selects lesson, workbench, failure-lab or interview-review. Track filters, search and pagination stay in the URL.

## Study workflow

1. Read the brief, input, expected behavior and trade-off. Mark the brief understood to record the lesson stage.
2. Draw the design using the case's component shelf. Drag nodes, connect ports, label arrows and write requirements, decisions, flow and estimates. Keyboard users can add components by button, select them in lists and move them using arrow keys or movement buttons.
3. Save a design version. Draft changes save through the existing Studio account persistence; version snapshots preserve checkpoints and notes. Undo/redo keeps up to 30 local graph edits.
4. Run the track experiment after choosing a prediction. Adjust assumptions, replay individual steps, and relate the result to this case.
5. Check the case-specific criteria and write evidence plus an interview answer. Mark the design self-reviewed. Changes to the design, review text or experiments reopen review.

The library has 25 original cases in six tracks: GenAI, Architecture, Database, API, Algorithms and LLD. Every track includes Easy, Medium and Hard cases. All cases are open.

## Scope and interpretation

- The canvas inspects directed structural reachability. It does not execute edge conditions, applications or infrastructure.
- There are six fixed teaching models, one per track. The model is shared by cases in its track and clearly named. It runs separately from the learner's diagram.
- Prediction matches apply only to that model and its assumptions.
- Self-review records a learner's judgment, not a correctness grade or an interview-readiness score.
- Gemini hint/review buttons open bounded drafts in the existing tutor. Only the user's send action submits a request. The API key remains with the existing server-side integration.
- Graph exports are JSON and standalone SVG. Full case exports include design and experiment histories. The portfolio export includes self-reviewed cases.
- Playground and SQL links provide existing execution tools separately from these design models.

## Data compatibility

The original eight case IDs and positional checklist meanings are unchanged. Records remain under dojo-<case-id>; experiments use dojo-<case-id>-failure-lab. Existing Studio fields and attempts provide account save, backup and merge behavior; no database migration is required.

Untouched legacy reviewed=yes records retain their historical completion. New reviews capture a design version, evidence and a compact change indicator. Intentional edits invalidate historical review markers too. Dojo progress appears in Analytics and does not alter course-day completion.

Malformed diagrams remain available for export instead of being replaced silently. Restoring an earlier version first preserves the working diagram and notes. Saved graphs allow 24 nodes, 80 edges and the existing 40,000-character field limit.

## Extending

- Cases: lib/dojo-cases/<track>.ts, typed by types.ts and exported via lib/dojo.ts.
- Graph validation, history, inspection and SVG: lib/dojo-workbench.ts.
- Deterministic teaching models and input normalization: lib/dojo-sim.ts.
- Review/progress rules: lib/dojo-course.ts.
- Bounded tutor drafts: lib/dojo-tutor.ts.
- UI: components/dojo/, styles in app/dojo*.css.

Run npm.cmd run typecheck and the tests/dojo-*.test.ts suites when changing these contracts.
