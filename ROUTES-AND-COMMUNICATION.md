# Routes, pagination, progress and communication

## Navigation

The workspace now has dedicated section URLs, including `/today/`, `/commute/`, `/questions/`, `/practice/`, `/timeline/`, `/journey/`, `/profile/` and `/settings/`. Every sidebar destination is registered in `lib/workspace-routes.ts`.

Each course day has `/day/1/` through `/day/90/`. Each communication day has `/communication/1/` through `/communication/90/`. Existing `#day-N` bookmarks are upgraded on load. Invalid day routes return 404.

The project still uses Next.js static export. `app/[...path]/page.tsx` enumerates valid paths with `generateStaticParams`; no catch-all rewrite to the home page is needed. The home route remains an alias of Today.

In-app navigation uses the Next-supported native History API so the account training hook stays mounted. Sidebar links have real hrefs for copying/opening in another tab. Back/Forward updates the visible section through a shared location subscription. No auth or persistence bypass is introduced.

Detail and filter state is shareable through query parameters:

- `/commute/?browse=1&category=Array+foundations&page=2`
- `/commute/?lesson=pattern-reading-pair-indices`
- `/questions/?kind=DSA&page=2` (opening a question adds its stable `question` ID)
- `/theory/?module=int-js`
- `/practice/?tool=patterns`
- `/day/10/?tab=speak` (also learn, practice, finish)

Query links retain the catalog's filters and page while opening/closing a lesson. Reading queues remain session-local. Tool sub-exercise selectors not explicitly listed above remain local UI state.

## Pagination and progress

Commute, question bank and theory use 24 items per page. The course timeline uses seven days per page, alongside week/status filters. Controls include Previous, numbered pages and Next. Invalid or out-of-range page requests clamp to a usable page; changing filters resets the page. Communication attempt history uses five entries per page.

Day and week progress combines valid quest checklist steps, assigned DSA questions marked solved, and one speaking rep. This gives 820 requirements over the full course: 630 checklist steps, 100 assigned DSA questions and 90 speaking reps. Week 13 contains six days. Skipped tasks do not count as completed work. These are activity measures, not automatic correctness or hiring-readiness scores.

## Communication coach

The dedicated Communication coach page and each day's Speak & reflect tab share the same records. Balanced mode rotates interview, workplace and everyday practice; learners can also choose a focus explicitly. Eighteen authored scenarios are contextualized by course day and chosen variant.

Sessions offer 5, 10 or 20 minutes, private rehearsal or practice with a willing listener, an opener, answer structure, follow-up and a recovery phrase for getting stuck. Recent self-ratings select Foundation, Practice or Stretch guidance. The latest recorded focus (clarity, structure, listening or nerves) changes the next recovery instruction. This is a deterministic coach, not an AI language evaluator.

Starting saves a fixed plan. Drafts save in the existing Studio data; typing never marks a speaking rep complete. Submit requires an answer, an improvement, confidence and an outcome. It saves an attempt snapshot and updates the existing day's communication log together. Attempted and Done count as one rep per day. Existing notes/history remain accessible. A new session preserves submitted versions. No automatic messages, remote audio uploads, database migration or progress reset is involved.

## Validation

TypeScript passed. Inline checks covered all section routes, invalid days, all 90 day calculations, 13 weeks, balanced speaking coverage, saved-plan parsing, self-rating adaptation and compatibility with progress validation/history. Development HTTP checks returned 200 for Today, filtered Commute and question pages, Day 10 and Communication Day 10; Day 91 returned 404.

No production build, Playwright run or new test file was used. Authenticated browser interaction, live Supabase round trips and production deployment are not verified by these checks.
