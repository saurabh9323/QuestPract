# Daily consistency and Career Tracker

Today shows a daily commitment card (opt in; no fixed study hour), a compact Career Tracker summary and the existing Hackathon Radar. The full tracker is at `/career/`, under Progress → Career Tracker. Shareable sections are `/career/?tab=opensource`, `/career/?tab=hackathons` and `/career/?tab=review`. Unknown tab values select contributions. Switching sections keeps unsaved review text mounted; leaving the page does not save a draft automatically. Past reviews show readable counts, five per page. Career WIP settings are also available under Settings & data. Existing records are reused without migration or copying.

## Daily commitment

- A 5/10/15-minute self-reported minimum, a concrete next quest, a seven-day view and an explicit rest option. Missed yesterday means a five-minute restart. Logging this commitment never completes a quest or marks a DSA problem solved.
- Dates use Asia/Kolkata. Reminders appear in-app. Optional desktop Notifications API support requires a user gesture and browser permission. It attempts one reminder per account/device/day after ten minutes with Today mounted and the commitment pending; browser sleep can delay it. It does not provide closed-tab push or email. Denied permission and unsupported devices retain the in-app card.
- Settings and daily notes use existing Studio records. Device notification preferences and deduplication use localStorage, not the server. Email would require a separately configured provider and scheduled backend; none is enabled by this feature.

## Career records and limits

- `career-os-*`: up to 100 open-source contributions; title (200 characters), notes (2,000), status, and up to 200 timestamped status transitions.
- `career-settings`: open-source default 2, hackathon default 1; configurable 0–20. Warnings calculate projected active work, excluding the item being moved. Overrides are explicit UI actions, not automatic bypasses. Terminal transitions release capacity.
- Radar retains its existing identity and API contract. An optional `careerHistory` field records local status changes for weekly review. Its existing records without this field still load. API acknowledgments and notes are not counted as status transitions.
- Staleness is exactly 14 elapsed days without an update for nonterminal open-source items. A deliberate Continue action refreshes the timestamp, while Drop records a terminal transition.

## Weekly snapshots

Monday–Sunday in India time, through the supplied `now`. DSA counts saved `solvedAt`, quests count `completedAt`, and career counts distinct items with status events in the window. Hackathon progression means a forward status transition. Old career activity with no dated event is not inferred. These measures describe saved activity, not externally verified merges or registrations.

`career-review-*` holds an immutable summary, three responses (up to 2,000 characters each), creation time and schemaVersion 1. Maximum 104 snapshots. There is no edit/delete UI. Studio writes refuse updates to an existing review ID; merging conflicting same-ID snapshots deterministically preserves the earliest saved version without creating draft attempts. Snapshot IDs are random, so separate reviews of the same week are retained.

Progress/export format remains version 1: these are validated additive Studio records, so no root schema migration is required. Unknown career-record schema versions are rejected instead of silently rewritten. Existing progress and Radar records are unchanged. Unit tests cover WIP boundaries, stale boundaries, India week/day boundaries, summaries, export/import and merge behavior with explicit dates.
