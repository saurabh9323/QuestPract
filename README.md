# Quest90

A Next.js and TypeScript interview-training workspace. It includes a 90-day course with a selectable, finalized start date, a 1,000-question practice bank (300 DSA, 400 interview, 200 SQL, 100 system design), theory and visual lessons, revision scheduling, saved answer versions, screenshots, and a manual ChatGPT review handoff.

The **Practice studio** adds 30 tool entries for experiments, system design, speaking and personal coaching. See [PRACTICE-STUDIO.md](PRACTICE-STUDIO.md) for the feature map, persistence details and execution limits. Its guide is also downloadable from the studio. The commute library has 47 visual guides, 600 concise interview/SQL Q&As, 300 DSA reasoning notes and 100 scenario-specific design answers; see [COMMUTE-LIBRARY.md](COMMUTE-LIBRARY.md).

The question bank's system-design path has 17 Easy, 55 Medium and 28 Hard questions, a nine-part answer format, and seven worked designs with diagrams and implementation steps. See [SYSTEM-DESIGN.md](SYSTEM-DESIGN.md).

## Run it

Use Node.js 22 or newer supported by the installed Next.js release.

```sh
npm ci
npm run dev
```

Open the URL printed by Next.js. For the production static export:

```sh
npm run build
npm start
```

`npm start` serves `out/` on localhost:3000. To choose another port: `node scripts/serve.mjs 3001`. The included server is a local preview utility; host `out/` on a production static hosting service for remote access. Static export is intentional: Next.js supplies the UI; the browser connects to Supabase over HTTPS. There is no Next.js server API or server-side Supabase service credential.

## Connect Supabase when ready

1. Create a Supabase project.
2. Run `public/supabase-setup.sql` in its SQL Editor. It creates user-owned `training_state` and `training_images` tables, RLS policies, and a revision-checked progress save RPC.
3. In Authentication → URL Configuration, set the deployed origin as Site URL and allow its root redirect. Add `http://localhost:3000/` for local development if needed. Supabase email configuration must support magic-link delivery.
4. Open Settings & data in the app. Enter the HTTPS project URL and publishable key (or legacy anon key). **Never use a service-role or secret key.** Custom Supabase domains are not supported by this connection form.
5. Send a sign-in link and open it in the same browser/profile. The app loads that user's cloud progress.
6. Use **Import guest progress to account** to explicitly replace cloud progress with the guest data from that browser. Export existing cloud progress first if you need to retain it.

Alternatively set `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using `.env.example` before building. These are public configuration values. The connection screen avoids a rebuild when you connect later.

Guest and cloud progress are deliberately separate. Guest progress and base64 screenshots use IndexedDB (`quest90-learning`); legacy `quest90.guest.v1` localStorage progress is migrated automatically. Data and stays on that origin/device. Clearing browser data can remove it. Export backups regularly. Cloud progress uses one JSONB document per authenticated user; it includes answers, notes, todos, timestamps, and spaced-review state. Static curriculum remains in the source and downloadable JSON.

## Cloud consistency and security

RLS restricts reads/writes to `auth.uid() = user_id`. The RPC compares an expected revision, writes the new document, and increments revision atomically. A stale revision becomes an explicit conflict instead of a silent overwrite. Export unsaved work, reload cloud state, and reconcile manually. Retries after an ambiguous save may produce a safe conflict rather than guessing whether the write succeeded.

The client debounces saves and retains unsaved text in memory when saving fails. It warns before leaving with a pending local or cloud save. Do not close the tab with an error before exporting the work. This is not a general offline-first synchronization engine.

The SQL setup was executed twice in a local PostgreSQL-compatible PGlite engine, including two-user RLS isolation for progress and images and stale-revision rejection. The practice fixture was also executed twice and its row counts checked. **Live Supabase email/auth integration is not verified until a project is connected.** After setup, test with two users: each user must see only their own progress, direct requests for the other user must return no rows or be denied, and simultaneous saves from two sessions must surface a conflict. Also verify email redirects, sign-out, reconnecting, and guest import.

## Training and review

- Each day contains a short concept explanation, a concrete mission, a seven-step sequence, a DSA problem, three answer fields, hints, and rubrics.
- Start dates are configurable. Planned dates move without changing historical completion or recall dates.
- Completing all seven steps schedules the first review for the next day. Good recall uses increasing 3/7/14/30-day intervals; Again schedules tomorrow and Hard schedules two days later. Unchecking a step reopens the quest and removes its due review.
- XP measures activity (10 per step, 15 per nonblank answer), not verified mastery. Completion is self-reported.
- Answer text and feedback autosave. Save checkpoint preserves all saved snapshots for comparison. New answer preserves the current answer before clearing it. Practice-bank attempts have immutable answer text, individual review feedback, confidence labels, and dates. Select any old attempt for revision or comparison.
- Review with ChatGPT copies the day's questions, rubrics, and actual answers. Nothing is automatically sent to an AI service. Paste the response back into the matching feedback field and test code corrections yourself.
- Continue with ChatGPT prepares a context handoff; downloaded curriculum and Markdown study guides remain usable independently of Codex. ChatGPT availability and usage limits are separate.
- This app is a guided practice curriculum. The SQL playground executes local SQLite queries and compares sample rows; other studio exercises use guided traces, actual React demonstrations or self-review. It is not a general code judge or an exhaustive textbook. Official reference links provide deeper material.

## Daily teacher and question bank

The dashboard groups each day into Learn & investigate, Practice & explain, and Build & reflect (60 minutes each). Earlier unfinished mission groups and personal tasks are shown as backlog. Ahead-of-schedule praise requires contiguous completed quests and no overdue personal tasks. All 90 days remain open. Dates follow the device calendar; change your device timezone to match your study location.

The bank supports category, topic, difficulty, attempt, bookmark, and due-review filters. Hints reveal progressively. Theory modules include examples and common pitfalls. The tutor suggestions prioritize due bank questions, otherwise offering optional practice from each category. These suggestions are deterministic rules, not an AI model. The daily brainstorm selects a reproducible scenario for the local calendar day and keeps prior answered days available.

System design covers 80 high-level scenarios, 10 OOP low-level exercises, and 10 functional/procedural exercises. MERN, TypeScript, Next.js, Python/FastAPI, SQL, AWS, CI/CD, testing, security, and behavioral interviews are covered.

`public/sql-practice.sql` creates a separate disposable PostgreSQL schema with nine tables and sample rows. Use `SET search_path = quest90_practice, public;` before exercises. Some questions explicitly ask for schema extensions. IDs in the fixture are supplied integers. The separate in-browser SQL playground uses SQLite and five starter exercises, not this PostgreSQL database. DSA code is not executed by the studio.

## Flexible schedule and submissions

Use **Manage my schedule** to edit a mission or personal task: choose a due date, active/deferred/skipped status, reason, priority, and estimated minutes. Personal task titles can be edited too. Skipping is recoverable using Active / restore, never counts as completed, and does not award mastery. Each change keeps a dated history. Original schedule restores the date derived from the current start-date setting. Explicit task dates stay fixed if you later change the overall start date.

Set a daily time budget to see workload warnings and a small priority-based suggestion. Move unfinished due tasks to tomorrow when short on time, or shift all unfinished, non-skipped work by 1–90 days for a break. These actions keep answers, completion records, and memory-review dates unchanged. Overdue tasks remain overdue after their new date passes. The dashboard uses adjusted task dates, while the 90-day curriculum order remains intact.

Inside **Daily quest**, use **Submit session** to record completed, partial, or could-not-start work, actual minutes, and a reason/next step. Complete requires every checklist step. Partial and could-not-start require a reason; could-not-start is unavailable when there is existing work. Every submission keeps the answer/feedback/notes snapshot from that moment. Later edits never replace it. Submission is a saved learning record, not an AI assessment. The footer confirms persistence or shows a save error. Practice-bank answers use **Submit answer**.

Planning and submission data are included in progress backups and the existing Supabase JSONB record, so existing users do not need a new SQL migration. Old backups without these optional fields remain compatible.

## Screenshot handling

PNG, JPEG, and WebP images up to 2 MB and 25 megapixels are saved as base64, with up to ten attachments per question or quest in the upload interface. Preview, download, and delete are available. Screenshots are question-level references, separate from answer attempts and progress saves. When connecting Supabase, use Copy guest screenshots to account as well as Import guest progress. Keep a separate media backup. Large image collections use browser/database quota; save errors are shown rather than silently discarding images.

## Backups

Settings exports a versioned JSON backup, the entire curriculum, and a readable Markdown study guide. Imports validate data before replacing the current workspace and ask for confirmation. Progress backups do not include images, Supabase keys, or login tokens. Export screenshots separately. The app limits serialized progress to 12 MB to keep saves bounded; it never silently trims old saved attempts. Dates use local calendar dates for scheduling and ISO timestamps for modification history.

## Development checks

```sh
npm run generate
npm test
npm run typecheck
npm run build
```

Tests cover all 90 quests, exact bank counts and distinct question prompts, guidance completeness, durations, completion/reopening, recall intervals, preservation of old attempts and feedback, malformed imports, overdue/ahead calculations, date boundaries, and prompt assembly. GitHub Actions runs tests and a production build. The generated SVGs are functional flow diagrams with accessible alternatives, not externally hosted decorative images.

The optional WebMCP tools `get_training_progress` and `open_training_day` expose reading and navigation only; they do not mark learning complete. The UI works without WebMCP support.

## Source map

- `app/page.tsx`, `app/globals.css`, `app/workspace.css`: interface and responsive styling.
- `lib/curriculum.ts`: the complete authored curriculum.
- `lib/bank/`: 1,000 original exercises and 60 theory modules.
- `lib/learning.ts`: attempts, scheduling, daily practice and brainstorm selection.
- `components/TrainingLab.tsx`, `components/Screenshots.tsx`, `components/MediaBackup.tsx`: practice, images and media portability.
- `lib/progress.ts`: progress operations, validation, review and continuation prompts.
- `lib/use-training.ts`, `lib/storage.ts`: local persistence and Supabase session/sync lifecycle.
- `public/supabase-setup.sql`: database setup and ownership policies.

To host elsewhere, deploy `out/` and preserve absolute asset paths from the domain root. Sites registration metadata in `.openai/hosting.json` belongs to the original deployment; remove that file before registering a separate Site.

## Start date and the 100-question timeline

Choose the start date from Mission control, the new 90-day timeline, or Settings. Submit with Set start date. The 90-day end date recalculates. An explicit checkbox controls whether custom dates for unfinished tasks also shift by the date difference; existing answers, screenshots, completion timestamps and recall dates remain intact.

The timeline assigns 100 distinct DSA questions from 20 topics: one per day, with a second question on days 9, 18, 27, 36, 45, 54, 63, 72, 81 and 90. These occupy the daily DSA block; the older inline DSA questions are optional variations. Each day also links a companion interview, SQL or system-design question beside its authored course lesson and build. All 90 days can be filtered by week or completion. `public/course-plan.json` exports the complete assignment plan.

Submit an answer, verify it with your own normal/boundary tests and reasoning, then use Mark solved. Submission alone does not advance the 100-question solved count. Reopen keeps attempt history. The coach recommends overdue questions first, then unfinished attempts, then the next question, and calculates remaining pace. A fully complete day requires both its course checklist and assigned DSA solved. All labels are self-reported learning evidence, not automated grading. Deferring a practice mission changes its DSA due date; deferrals beyond the course deadline are explicitly reported. Skipping a mission does not erase the 100-question goal.
