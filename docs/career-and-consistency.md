# Daily consistency and Career Tracker

Today shows a daily commitment card (opt in; no fixed study hour), a compact Career Tracker summary and the existing Hackathon Radar. The full tracker is at `/career/`, under Progress → Career Tracker. Shareable sections are `/career/?tab=opensource`, `/career/?tab=hackathons` and `/career/?tab=review`. Unknown tab values select contributions. Review answers save as you type into a separate weekly draft, so section changes and return visits reuse the same draft. Check the account sync indicator for remote persistence. Past reviews show readable counts, five per page. Career WIP settings are also available under Settings & data. Existing records are reused without migration or copying.

## Daily commitment

- A 5/10/15-minute self-reported minimum, a concrete next quest, a seven-day view and an explicit rest option. Missed yesterday means a five-minute restart. Logging this commitment never completes a quest or marks a DSA problem solved.
- Dates use Asia/Kolkata. Reminders appear in-app. Optional desktop Notifications API support requires a user gesture and browser permission. It attempts one reminder per account/device/day after ten minutes with Today mounted and the commitment pending; browser sleep can delay it. It does not provide closed-tab push or email. Denied permission and unsupported devices retain the in-app card.
- Settings and daily notes use existing Studio records. Device notification preferences and deduplication use localStorage, not the server. Email would require a separately configured provider and scheduled backend; none is enabled by this feature.

## Career records and limits

Contribution lists support title/notes/link search (`q`), exact status (`status`), stale-only (`stale=1`) and ten-item pagination (`page`). Filters reset the page; invalid or oversized pages clamp to an available page. Sort order is most recently updated, with stable ID tie-breaking. These URL parameters remain local navigation state and do not change saved records.

Optional contribution URLs accept HTTPS without embedded credentials, up to 2,048 characters. Existing items without URLs are valid. A saved link opens only when clicked; the portal does not fetch repository content or verify the contribution. Each card shows its recorded status history, newest first, in India time. Editing another item's status no longer clears an unsaved new-contribution title.

- `career-os-*`: up to 100 open-source contributions; title (200 characters), notes (2,000), status, and up to 200 timestamped status transitions.
- `career-settings`: open-source default 2, hackathon default 1; configurable 0–20. Warnings calculate projected active work, excluding the item being moved. Overrides are explicit UI actions, not automatic bypasses. Terminal transitions release capacity.
- Radar retains its existing identity and API contract. An optional `careerHistory` field records local status changes for weekly review. Its existing records without this field still load. API acknowledgments and notes are not counted as status transitions.
- Staleness is exactly 14 elapsed days without an update for nonterminal open-source items. A deliberate Continue action refreshes the timestamp, while Drop records a terminal transition.

## Weekly snapshots

Select the current week or last completed week (`/career/?tab=review&week=previous`). Weeks run Monday–Sunday in India time. The current week stops at the supplied `now`; the previous week stops just before the following Monday. Expand each metric to see the dated items behind it. Merged contributions also appear in moved contributions; categories should not be summed. DSA counts saved `solvedAt`, quests count `completedAt`, and career counts distinct items with status events in the window. Hackathon progression means a forward status transition. Old career activity with no dated event is not inferred. These measures describe saved activity, not externally verified merges or registrations.

`career-review-*` holds an immutable summary, three responses (up to 2,000 characters each), creation time and schemaVersion 1. Maximum 104 snapshots. There is no edit/delete UI. Studio writes refuse updates to an existing review ID; merging conflicting same-ID snapshots deterministically preserves the earliest saved version without creating draft attempts. Snapshot IDs are random, so separate reviews of the same week are retained.

Progress/export format remains version 1: these are validated additive Studio records, so no root schema migration is required. Unknown career-record schema versions are rejected instead of silently rewritten. Existing progress and Radar records are unchanged. Unit tests cover WIP boundaries, stale boundaries, India week/day boundaries, summaries, export/import and merge behavior with explicit dates.

### Review drafts and the next priority

`career-draft-YYYY-MM-DD` stores one mutable draft per Monday in India time. Schema version 1 requires an exact calendar Monday matching the ID, allows blank/partial responses up to 2,000 characters each, and disallows attempts. Drafts have a separate 104-record cap. Cross-device conflicts use the newest timestamp with deterministic tie resolution, not additional attempts. Draft fields are not included in activity counts and never mark work complete.

Submitting creates a new immutable `career-review-*` snapshot with counts recalculated at submission. The draft is retained for follow-up work; changing it cannot edit an earlier snapshot. The current and previous weeks are editable in the review selector; older drafts remain in backups. No progress version change or migration is needed for these additive records.

Today and the Career Tracker show the priority from the latest valid submitted review, chosen by its immutable creation time. Draft priorities are excluded. The source week is shown so older plans are recognizable; the priority does not reschedule quests automatically.

Tests use explicit dates for India midnight, week/year boundaries, unique evidence counts, draft validation, backup round-trips, deterministic merges and snapshot preservation. Authenticated browser interactions and live Supabase round-trips were not verified for this update.
