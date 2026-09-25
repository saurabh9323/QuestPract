# Visual Lab and solo tournaments

Open **Learn → Visual lab**. Three tabs provide the scenario library, the existing custom-input simulators, and solo tournaments.

## 100 visual scenarios

The library contains ten input scenarios for each of ten algorithm families: Two Sum, exact binary search, lower bound, linear search, maximum subarray, prefix sums, frequency maps, stable deduplication, bubble sort, and fixed-size sliding windows. These are 100 input and edge-case exercises across ten algorithms, with Easy and Medium labels.

Each scenario includes a precise return-value contract, authored expected output, explanation, progressive hints, algorithm code, complexity, and computed state frames. Play, pause, change speed, move backward, or scrub to a frame to inspect indices and variables. Examples cover duplicates, empty inputs, negative values, missing targets, ties, and boundary positions where applicable.

Search and filter by topic, difficulty, reviewed status, or bookmarks. Save a prediction and English/Hinglish notes, copy a review prompt, mark a scenario reviewed, and move to the next or a random unreviewed case. Reviewed status is a self-assessment, not a correctness grade. Existing custom-input Two Sum, binary-search, and request-journey simulators remain available.

## Solo tournaments

Choose 4, 6, or 8 questions and a 10, 20, 30, or 45 minute budget. Topic and difficulty filters control the pool; mixed rounds prioritize different algorithm families. Each round snapshots its questions so later catalog changes do not change an existing round.

Predict the exact JSON return value. Each correct answer earns 100 points. Object property order is ignored, but array order and value types matter. Missing, malformed, or non-finite JSON earns zero. Scratch code is saved for review and is not executed or graded. Submit early or let the absolute deadline expire; outputs and explanations appear in the completed-round review.

Only one round can be active. The deadline uses the device clock and is checked when returning to the tournament tab. The app does not run a background timer while closed. This is personal practice, not a server-enforced coding competition, multiplayer leaderboard, or LeetCode-compatible judge.

## Saved work

Scenario predictions, notes, bookmarks, and reviews use `Progress.studio` records keyed by stable scenario IDs. Tournament records use unique round IDs and hold question snapshots, answers, scratch work, deadlines, and results. These pass through the existing authenticated progress save flow; watch the account save indicator before leaving.

Submitted rounds are immutable through the round UI. A stale active draft merged from another save cannot reopen a valid submitted round. Its differing fields are retained in recovered draft history, with export available. Invalid saved rounds can be exported and archived without deleting the record. Completed-round exports include saved snapshots. No new database schema or progress reset is required.

## Verification for this change

- Executed all 100 trusted reference snippets in bounded Node VM contexts and compared their outputs with authored expected values.
- Compared all 100 final visual-frame outputs with the same expected values; checked unique IDs and mixed-topic round selection.
- Checked exact JSON scoring, object-order equivalence, non-finite-number rejection, malformed snapshot guards, and both merge orderings for finished versus stale active rounds.
- TypeScript validation passed. No new test files, production build, Playwright run, browser verification, or live Supabase integration check was performed for this change.
