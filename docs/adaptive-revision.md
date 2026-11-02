# Progress-based Gemini revision

Open `/repair-lab/?mode=personal` or Practice → Repair & Recall → For you.

## Login and completion checks

`LoginRevisionCheck` mounts inside the authenticated, data-ready workspace. It checks when account loading completes, when the current completed-day signature changes, when automatic revision is enabled again, and when the India calendar date changes while the portal is open. It runs on every page, so the user need not open Repair & Recall first.

The account hook's `prepareRevision` reads its latest internal progress reference, verifies the expected account key and loaded/unblocked state, then queues all records in one normal progress commit. It never uses a signed-out/default progress snapshot. Reopened and partial days are excluded; all 90 course days are supported. Completing a day is not treated as proof that the learner mastered its topics.

## Selection and requests

- Up to three questions per set: two assigned DSA topics and one authored course concept (a single completed day can yield only two).
- A recorded wrong decision from the built-in DSA recall questions is prioritized when available; otherwise the most advanced completed day is selected, with earlier completed material rotated by date.
- The same calendar day and same completed-day IDs reuse the saved set, including pending or failed requests. Failures require explicit retry, avoiding an automatic retry loop.
- A changed completion signature may create one additional set that day. The local cap is two sets per India calendar day, independent of the existing server quotas. Manual retries remain subject to those server quotas.
- Stable request identities and bounded input snapshots let the existing per-user server reservation deduplicate identical requests. The existing account revision/conflict mechanism still governs cross-device saves.
- The feature pauses at 300 saved revision questions or the shared storage guard. Existing history is never deleted to make room.

Uses the existing `auto-coach` queue and Supabase Edge Function, source `topic-chat`; no backend code, API key, new function or migration is needed. Only learning metadata is sent: completed day numbers, selected authored topic and contract, selection reason and up to five prior AI question texts. Private profile details, user notes, submitted code and chat history are excluded. The JSON context has a 3,600-character cap and a visible trimming flag.

## Learner UI

Today and Practice show a completed-day count and a link to personal questions. For you includes automatic-generation controls, latest/history views, six-item history pagination, pending/error/retry states and the built-in quiz fallback. Pause stops new sets; already queued requests may finish.

Only a validated Gemini pack matching the original request and lesson ID is displayed as an AI question. Empty questions, blank/repeated choices, malformed output and mismatched responses are rejected. Later exact-text duplicate questions are flagged rather than displayed as fresh content; this is not semantic duplicate detection.

Questions render as React text; no model HTML or code is executed. Explanations appear after a saved choice. Results are phrased as agreement/disagreement with the AI answer key, not verified correctness. Written reasoning, corrections and follow-ups save without automatic grading or course completion changes. Answer records are separate from generation records so retries cannot erase earlier responses.

## Validation and known limits

`tests/adaptive-revision.test.ts` covers empty/paused accounts, all-90-day selection, reopened days, idempotency, daily caps, provider failure retention, private-data exclusion, context limits, response matching, duplicate detection, India midnight, storage caps and the existing Edge Function contract using a mocked provider.

Live signed-in Gemini generation and desktop/mobile browser layout remain unverified; browser access was previously blocked by the browser tool's URL policy. Existing provider configuration, quotas and network availability still apply. This work does not deploy the client or push code.
