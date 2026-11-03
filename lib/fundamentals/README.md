# Language Fundamentals

The `/fundamentals/` shelf and `/fundamentals/<track>/` routes contain 17 technology tracks. Each has 20 authored concepts, presented through five explicit interview angles: Explain, Apply, Demonstrate, Trace and Diagnose. This is 100 questions per track, not 100 unrelated concepts.

## Structure

- `tracks/`: one file per technology, including setup assumptions and official references.
- `types.ts` and `author.ts`: the content contract and compact authoring helper.
- `catalog.ts`: lightweight route metadata, kept separate from content bodies.
- `index.ts`: ordered catalog, five question projections and Markdown export.
- `common.ts`: cross-technology reasoning and comparison prompts.
- `commute.ts`: maps the same concepts into reading lessons; no duplicate answer bank.
- `progress.ts`: per-concept Studio records and self-assessment counts.
- `tutor.ts`: bounded handoff to the existing Gemini tutor.
- `components/fundamentals/`: study UI and analytics summary.
- `app/fundamentals.css`: scoped, theme-aware responsive styles.

## Persistence and boundaries

One Studio record is created per concept only when the user writes or marks something. Its five answer fields, ratings and shared notes use the existing account sync/backup path. Ratings are self-assessment; they never complete course days or mark code as tested. Commute IDs begin `guide-fundamentals-` to match existing reading validation. Existing lesson and question IDs remain unchanged.

Code examples are illustrations, not executed submissions. Runtime walkthroughs are conceptual sequences, not instrumented traces. The tutor handoff uses the existing 1,600-character pinned-topic limit, reports trimming, and requires the user to send the prepared message. No API keys, schema changes or new automatic AI requests are introduced.

## Checks

Run `npm run typecheck` and `npx tsx --test tests/fundamentals.test.ts tests/frontend-interview.test.ts tests/progress.test.ts tests/learning.test.ts`. Tests check completeness, routes, unique stable IDs, shared Commute content, persistence validation, unchanged legacy IDs and bounded tutor context.

The separate higher-level interview curriculum (100 questions per technology) is the next requested phase; it is not included in these Fundamentals counts.
