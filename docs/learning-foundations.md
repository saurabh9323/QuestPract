# Learning workspace — M0 review

The Playground page now includes **Learning workspace · draft data & backups** below the lab. This milestone adds foundations only; the shared Dojo flow editor remains M1. Predict mode is also not present in the existing Playground.

## Shared pieces

- `lib/learning/gemini.ts`: bounded explanation/draft requests through the existing auto-coach queue and Supabase function. No client-side model key or second transport. Context is capped at 3,800 characters, includes at most 11 evidence excerpts, and reports trimming. Playground uses this builder and request adapter.
- `citations.ts` and `AIEvidenceText.tsx`: step, node and item references checked against supplied IDs; only valid references become buttons. Replies render as React text, not HTML. Playground limits links to its current run.
- `types.ts` and `validators.ts`: version 1 flow, module, stroke, card and session-plan schemas. Unknown top-level fields, unsupported versions, unsafe identifiers, duplicate IDs, missing edge endpoints, invalid coordinates, oversized ink and excess session budgets are rejected. Schema validity does not establish correctness. Imported modules are inert drafts and do not execute.
- `persistence.ts`: bounded atomic changes in the existing per-user Studio progress payload. Existing Supabase training_state ownership/RLS and save_training_state revision checks remain in use. No new table or security policy is required. Imports preview before saving. JSON exports contain learning drafts only.
- `analytics.ts` and `LearningCounts.tsx`: artifact counts in existing analytics, including AI drafts and excluded invalid records. No readiness score or mastery inferred from storage.

## Deletion and privacy boundary

Removal clears active learning document content and attempts, leaving a small deletion marker. Merge tests verify that stale devices cannot restore a removed ID. Reimporting a deleted document requires a new ID. Unrelated course, Dojo, Playground and chat records are untouched.

This is **active-workspace removal, not a permanent account-wide purge**. Existing account recovery snapshots and downloaded backups are retained by their existing mechanisms. A complete delete-my-data operation covering historical cloud/local backups remains a privacy follow-up; the UI explicitly states this limitation. No real user drafts were deleted during browser verification.

## Checks and limits

- Typecheck passes. All 20 Playground/foundation tests pass (9 foundation tests, 11 Playground tests).
- Full suite: 32 passed, 7 previously identified unrelated course/planning failures. Those failures were already reproduced on unchanged HEAD during Phase 1.
- Desktop 1440×900 and mobile 390×844 layout inspected; draft creation/validation preview exercised without saving sample data. A dark-theme paragraph contrast issue was fixed and rechecked on mobile.
- The final browser reconnect was denied by the browser security policy; no alternate browser mechanism was attempted. Physical touch/stylus behavior has not been tested; drawing tools are not part of M0.
- Live Gemini replies remain unverified locally because the deployed function rejects localhost:3015 through COACH_ALLOWED_ORIGINS. No server settings were changed.
- New learning persistence uses the existing save pipeline; no separate live multi-account RLS test or destructive recovery purge was performed.

Phase 1 was pushed in commit 7957f0e. M0 changes remain uncommitted/unpushed for review. No M1 editor, scheduler, sketch conversion or AI generation has been enabled.
