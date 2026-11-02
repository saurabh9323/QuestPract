# Repair & Recall

Local route: `/repair-lab/`. Linked from Practice navigation, the Practice studio and Module Playground. No existing route is replaced.

The **For you** tab now also uses the existing Gemini connection to prepare questions from currently completed course days after login. See [adaptive-revision.md](./adaptive-revision.md) for queueing, privacy, limits and validation. The repair labs and built-in 20-day quiz remain usable without Gemini.

## Unfinished modules

Six original, intentionally incomplete or faulty JavaScript modules:

| Module | Course foundation | Work to do |
| --- | --- | --- |
| Shopping cart | Day 1 | Finish a helper and handle quantities |
| Guest list | Day 2 | Add a Set membership guard |
| First unique signal | Day 8 | Complete counting and ordered lookup |
| Delivery pairing | Day 11 | Repair index reuse, then optimize sorted search |
| Sensor report | Day 15 | Repair rolling sums and negative-input handling |
| Range-report engine | Day 19 | Finish prefix totals and inclusive queries |

Each has a contract, scenario, task checklist, four graduated clues, actual executable tests, draft code, reflection notes and an optional external repository/editor URL. URLs are saved as text; no remote code is fetched. There are 27 supplied test cases in total.

The existing instrumenter and isolated worker execute the functions. The existing trace player shows recorded execution with forward/back stepping and code-line highlighting. The optional comparison runs the starter on the same example and tests. Event counts are instrumented observations on that example, not a speed benchmark or Big-O estimate. A broken starter may do less work than its correct repair.

Download either the starter or current version as a self-contained `.mjs` file with Node.js assertions, and a Markdown guide. It works locally with `node filename.mjs` or in a compatible Node.js online editor. The portal does not create or fork repositories. Test-only reference repairs stay in `tests/repair-lab.test.ts`; they are not imported into the learner UI.

## Twenty-day brainstorm

`/repair-lab/?mode=recall` contains 22 original multiple-choice decisions aligned by question ID to every DSA assignment in days 1–20. Days 9 and 18 each have two questions. Each decision has an explanation revealed after submission, a dry-run prompt, and a changed-requirement follow-up. No complete implementation is revealed.

The full 20-day revision path is available even when saved progress differs from the learner's recollection. “Only my completed days” uses actual completed submission/day records within days 1–20. It does not assume 20 sequential days have been completed and never updates course completion.

Five-question sprints prioritize previous wrong decisions, then unseen questions, then the oldest correct decisions. The sprint tracks new submissions relative to its starting point; earlier answers do not instantly complete it. First-attempt accuracy is stable across retries and sorted by submission time. Sync-recovered drafts are not quiz submissions. Written reasoning/dry-run answers are saved but not automatically graded.

## Persistence and limits

- Uses the existing StudioProvider/Supabase progress sync, validation, attempt limit and reconciliation. No migration or new secret is required.
- Records use `repair-code-{moduleId}` and `repair-recall-{questionId}`.
- Code drafts debounce for 500 ms and flush on navigation; in-flight workers abort on unmount.
- JavaScript execution only, with existing supported-syntax restrictions, 3-second worker timeout and 5,000-event cap. Downloaded code executes outside the portal sandbox.
- Passing supplied tests is evidence for those cases, not a correctness proof or optimization certification.
- No AI dependency or automatic external submission. Drafts remain usable without Gemini.
- Themes use the existing color variables. Mobile grid breakpoints, visible keyboard focus, native radio groups and the existing accessible/reduced-motion trace player are used.

## Verification

Run `npx tsc --noEmit` and `npx tsx --test tests/repair-lab.test.ts tests/playground.test.ts tests/progress.test.ts`.

Tests cover failing starters, correct test-only repairs in the worker, executable downloads, exact curriculum coverage, completion filtering, immutable first-attempt scores, sprint selection, account-data validation/merge and route preservation.

Local Next development route returned HTTP 200. Browser observation was denied by the browser tool's URL policy, so desktop/mobile visual layout and signed-in interactive account sync were not verified in this session. No production build, push or deployment was performed for this feature.
