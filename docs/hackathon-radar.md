# Hackathon Radar

The Today dashboard (/today/ and the home alias) contains a Hackathon Radar card. Quest90 remains a static export: this feature adds no Next.js API routes or server handlers.

## Connect a backend

Leave NEXT_PUBLIC_RADAR_API_URL empty for local demo mode. The client uses lib/radar/mock.json through createMockFetcher, with the same request/response interface as the live adapter. Demo titles and dates are fictional examples; their links open the source platforms, not invented event pages.

Set NEXT_PUBLIC_RADAR_API_URL to the external API base URL before building or deploying. For example, https://radar.example.com/v1 produces:

- GET https://radar.example.com/v1/opportunities
- PATCH https://radar.example.com/v1/opportunities/<encoded-id>/tracking

PATCH sends only {status, notes?} and expects {status, notes?} in return. Responses may include additional fields; the adapter uses only the declared contract. Requests omit browser credentials. If backend authentication is needed, define that integration explicitly rather than putting a secret in a NEXT_PUBLIC variable.

The backend must permit your deployed origin through CORS, including GET, PATCH, OPTIONS and Content-Type. Public environment variables are visible to visitors and are embedded at build time. Rebuild after changing the base URL.

A failed live API request never falls back to fictional data. The current session retains its last successfully loaded feed, shows the failure and offers Retry. The request timeout includes reading the response body. Leaving the card cancels outstanding requests.

## Tracking and deadlines

The card shows the five highest fitScore values, with stable ordering for ties. Fit is supplied by the feed, not inferred by AI. No opportunity data is fetched at build time.

Status buttons record new, interested, registered, building, submitted or skipped. These are self-reported statuses; choosing Registered does not register you externally.

Interested items show six rule-based tasks relative to registrationDeadline:

- T−7 days: register and find a team.
- T−5 days: scope the MVP.
- T−3 days: repo and stack setup.
- Last six hours: demo video, README and submission review.

The supplied contract has a registration deadline, not a submission deadline. The UI explicitly asks learners to confirm the actual project-submission cutoff. Missing dates do not create an invented schedule; elapsed deadlines display as closed. The clock refreshes every minute; pure scheduling functions receive an explicit Date.

Status and notes save to progress before contacting the Radar API. Failed or offline API updates remain pending, with a manual retry/send button. Notes save as you type and are sent when requested or with a status change. Checkboxes remain local to Quest90 progress and are never added to the PATCH payload. A revision guard prevents delayed API responses from replacing newer edits.

## Storage and compatibility

Tracking uses individual radar-* Studio records in the existing progress document. Each contains a feature schemaVersion of 1, full external opportunity ID, feed namespace, status, notes, checklist IDs, pending flag and revision. Mock and live feed records are isolated. Full identities are checked before reads and writes to protect against a conflicting storage key.

The existing Progress version remains 1; no database or backup migration is needed. Settings export/import and existing recovery merge preserve these records, including recovered drafts. Unknown/malformed feature records display an error and are kept intact.

Limits: 100 tracked opportunities, 1,000 characters per note, six checklist IDs, and the existing Studio record/field/progress-size limits. Imported data receives validation before display. The card does not reset course progress.

## Verification

The radar logic tests use fixed explicit dates for ordering, deadlines, timezone offsets and exact checklist boundaries. Adapter tests cover mock/live parity, unsafe links, malformed responses, HTTP/network errors, cancellation and timeouts. Tracking tests cover version-1 backup round trips, merge behavior, validation limits and stale response protection.

Implementation checks (2026-11-06): TypeScript passed, all 169 repository tests passed, and the production build exported 244 static pages. Six previously failing course/planning fixtures were corrected to use explicit course dates and include the existing communication task. Browser layout verification could not complete because the preview browser timed out connecting to the local static server. A real Radar backend and live Supabase round trip have not been exercised for this feature.
