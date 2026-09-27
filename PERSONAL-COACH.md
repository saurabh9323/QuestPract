# Personal preparation coach

## Start with Today

The dashboard presents one assigned DSA question, one pattern concept, and the day's communication mission. The 30-minute option allocates 15/10/5 minutes; the 60-minute option allocates 30/20/10. A preference is saved for the current date. These are suggested timeboxes, not automatic completions or deadline changes. Milestone days still retain their second DSA problem in the daily quest.

Today also shows due mistake retries and commute recalls, with direct links to explanation practice, weekly checkpoints and the story bank.

## Pattern detective in Practice and Commute

There are 24 distinct constraint-driven scenarios across Map, Set, two pointers, sliding window, stack, breadth-first search, binary search and prefix sums. A learner selects a best-fit pattern and writes a justification before revealing the guide. A saved checkpoint records the question, input, choice, reason, reference and hint usage. Matching the reference label is not a correctness grade for the explanation or code.

Each scenario includes a concrete input/output, a clue, invariant/reasoning, a trap, complexity assumptions, an illustrated state sequence and a changed-constraint follow-up. Pattern combinations are explicit: sliding windows can use a Set, and prefix sums can use a Map. Animations have manual controls and respect reduced-motion CSS. There is no execution of learner code.

The 24 Commute lessons reuse the same catalog and pattern-attempt IDs, so answers follow the learner between reading and practice. Commute bookmarks, notes, read-aloud and reading status continue to use reading records. Reference reading is intentionally available separately from blind practice. Markdown exports preserve text and flow, but are not interactive animations.

## Mistake notebook

Existing mistake records remain usable. Record the cause, incorrect assumption, correction, source and a fresh retry. Schedule tomorrow, 3, 7 or 14 days, or explicitly resolve an independently explained correction. Due unresolved mistakes appear on Today. Archiving is reversible. Pattern mistakes can be added once without replacing existing user notes.

## Explain my solution

Choose a DSA question and defend the baseline, improvement, trace, complexity and edge cases. View your latest submitted answer, save versions, or copy a coaching prompt. The existing voice recorder provides recording/playback where browser permissions support it; recordings remain device-local and are not silently uploaded or transcribed.

## Commute to evening practice

Every reading lesson has Save for evening practice. The action creates a stable bridge record and tomorrow's recall reminder. The coach links to a related coding question where a mapping exists, otherwise uses the lesson's own build/recall exercise. Related questions retain their own contracts. Evening attempts and morning recalls are separate saved checkpoints; completing a reading loop does not mark a DSA problem solved.

## Weekly checkpoint

Thirteen week-specific sets contain a coding prompt, system-design prompt and behavioral question. Starting a round persists its start time and draft; the 30-minute timer derives elapsed time from that timestamp. Expiry does not erase an incomplete answer. Submission preserves all three responses, prompts, elapsed time, reflection and optional self-ratings in an immutable attempt. Compare with the previous same-week attempt or the preceding week's latest attempt. Different questions and self-ratings are not calibrated interview-readiness scores.

## Personal story bank

Store separate real-work or clearly marked practice stories, tag them by interview theme, and save STAR versions. The previous project-story record is still accessible. Archive/restore stories or export a coaching prompt without inventing achievements or metrics.

## Saving and data

All new text records use the existing authenticated Studio storage, validation, Supabase synchronization, backups and recovery history. No database migration or reset is needed. Cloud load status uses the server record's updated_at; a successful write shows its acknowledgement time. Pending/error status replaces the success message. Retry remains available on errors and Back up now is available in the account status strip.

Implementation checks do not prove a live Supabase save, production deployment, browser appearance, or microphone support. No new production build or Playwright suite is required for this update.
