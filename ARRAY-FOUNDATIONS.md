# Array Foundations: loops, Set and Map

Open **Learn → Visual lab → Array foundations**. This beginner section contains **60 authored worked examples: 20 plain-loop, 20 Set and 20 Map examples**. Some questions intentionally overlap so learners can compare tools; this is not a claim of 60 unrelated algorithm patterns.

## Suggested path

1. Plain loops: indices, scans, running values, filtering, nested comparisons, and a baseline Two Sum.
2. Set: membership and uniqueness, then intersections, unions, and related patterns.
3. Map: counts and indices, grouping and joins, then prefix-sum and window patterns.

Start with three to five examples per session and explain each before moving on. Six harder examples are marked **Stretch**. There is no required maximum number of exercises; understanding and transfer matter more than collecting solved titles.

The introduction distinguishes an array value from its index, `Array.map(callback)` from `new Map()`, and membership from an associated count/index. It explains that Map and Set solutions still use loops and that average hash-lookup complexity is an assumption rather than JavaScript's worst-case guarantee.

## Live comparison

Supply up to twelve bounded integers and compare:

- Does any value repeat?
- Does a target-sum pair at distinct positions exist?

All three implementations return a Boolean, making their output contracts comparable. Step/play controls show actual computed comparisons, lookups and remembered values for the input. Counters distinguish pair comparisons from main membership checks and explicitly do not claim CPU timings. Map's maintenance lookups are not included in that counter.

The loop and Map tracks separately provide **Two Sum returning indices**. A Set alone only preserves membership, so its worked Two Sum example explicitly returns a Boolean. The index-producing examples choose the earliest finishing index, then the earliest earlier matching index, and return an empty array when no pair exists.

## Twenty examples in each track

**Loops:** sum, maximum, minimum, first matching index, target count, reversed copy, doubling, even filter, duplicate detection, Two Sum indices, prefix sums, running maximum, left rotation, second-largest distinct value, sorted merge, order check, target removal, sign counts, one-level flattening, stable deduplication.

**Set:** duplicates, stable uniqueness, multiple membership queries, intersection, difference, union, symmetric difference, subset, disjointness, equal distinct contents, three-way intersection, target-pair existence, first repeat, missing positive, longest consecutive run, distinct magnitudes, blocked-value filtering, unique tags, duplicate record IDs, complete required range.

**Map:** duplicates, Two Sum indices, frequencies, first singleton, mode with stable tie-breaking, multiset equality, parity groups, occurrence positions, last indices, target-pair count, target-subarray count, longest target-sum range, multiset intersection, keyed record join, merged counts, window distinct counts, nearby duplicates, first repeat with positions, normalized remainder groups, latest records by ID.

## Worked examples and saved practice

Every example has an exact contract, authored sample input/output, formatted JavaScript, a hint, a choice explanation, time/space costs and a specific common mistake. Reference answers stay behind a reveal control. A narrated four-stage animation explains the contract and reasoning; it is distinct from the calculated live comparison and does not execute the saved code.

Predictions, code/pseudocode, notes, confidence and self-review status use stable `array-<track>-<example>` IDs in the existing per-user studio storage. **Save my attempt** retains a checkpoint with the question and input. Prior attempts remain readable; copy the question and current work as a tutor prompt. Reviewed status and confidence are self-assessments, not automatic correctness scores. Check the account save indicator before leaving.

The final loop example continues to Set; the final Set example continues to Map. The final Map example explicitly offers a return to the loop foundations instead of silently presenting another supposed new example. Search/progress filters and progressive card loading keep the catalog manageable.

## Verification

All sixty trusted reference functions were executed in bounded Node VM contexts and matched their authored expected outputs without mutating their sample inputs. The live comparison matched independent brute-force expectations in 2,178 checks across small arrays, target choices, and all three approaches. Content IDs and twenty-per-track counts were checked. TypeScript validation passed.

No new test files, production build, Playwright run, browser visual inspection or live Supabase check was performed. There is no browser execution or automatic grading of learner-submitted code, and no database migration or progress reset.
