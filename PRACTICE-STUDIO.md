# Quest90 practice studio

Open **Practice → Practice studio** after signing in. The studio extends the existing course and commute library. It does not reset course days, deadlines, answers or completion.

## A useful daily routine

1. On the commute, read one short lesson in the Commute library.
2. In **Your coach → Commute to practice**, connect it to an evening problem and set a recall date.
3. Choose **Energy-based plan** for a 10-, 30- or 60-minute session.
4. Try a prediction, query or design before revealing help. Save an attempt.
5. Explain the idea aloud, then keep one correction in the mistake notebook.
6. The next morning, retrieve the explanation without notes. Review the weekly report for recorded activity.

## Available tools

| Group | Tool | What you can do |
| --- | --- | --- |
| Experiment | Bug detective | Find a faulty assumption in supplied code and record a correction. |
| Experiment | Predict before playing | Choose an output, explain why, and submit before seeing the explanation. |
| Experiment | Change one thing | Compare original and altered code under different assumptions. |
| Experiment | Hint ladder | Reveal a clue, approach, pseudocode/repair and explanation progressively. |
| Experiment | Code to picture | Step through authored reference, callback and state traces. |
| Experiment | SQL playground | Execute real SQLite SELECT queries against a fresh sample database. |
| Experiment | React render explorer | Toggle memoization and object identity and observe committed child renders. |
| Experiment | Backend request journey | Follow a supplied request through validation, authentication, authorization and storage. |
| Experiment | Production incident room | Examine logs, choose a recovery action and answer a follow-up challenge. |
| Design | System-design builder | Drag components, connect arrows, fail a node, and trace reachability. |
| Design | Requirement cards | Adapt the same design to scale, outages, retries and tenant isolation. |
| Design | Decision journal | Record options, evidence, costs and conditions for revisiting a decision. |
| Design | One feature, three stacks | Compare illustrative Node, .NET and Python routes; save your implementation. |
| Design | Compare concepts | Compare alternatives such as WHERE/HAVING and inheritance/composition. |
| Speak | Explain at three levels | Adapt a concept for a beginner, teammate and interviewer. |
| Speak | Explain it aloud | Record up to 60 seconds, listen, download or delete the clip. |
| Speak | Project storytelling | Build an evidence-based STAR story and architecture narrative. |
| Speak | Sentence workshop | Use local clarity suggestions and a sentence builder; keep both versions. |
| Speak | Listening practice | Hear a browser-spoken question, summarize it, clarify and answer. |
| Speak | Follow-up tree | Save each response before advancing through a deeper question sequence. |
| Speak | Conversation ladder | Plan manageable conversations with willing listeners and reflect afterwards. |
| Speak | Interruption practice | Practise acknowledging a challenge and adapting an answer. |
| Your coach | Energy-based plan | Choose a realistic session without changing course completion or dates. |
| Your coach | Return after a break | See recent course work and resume one pending task. |
| Your coach | Commute to practice | Connect reading, application and next-day recall. |
| Your coach | Mistake notebook | Keep causes, corrections, retrieval attempts and retry dates. |
| Your coach | Personal glossary | Save definitions, examples, pronunciation notes and your own sentences. |
| Your coach | Evidence portfolio | Collect saved attempts and project evidence; export a private Markdown file. |
| Your coach | Weekly report | View the last seven days of recorded work, hints, reading and course minutes. |
| Your coach | I don't understand | Try a simpler explanation, analogy, example and guiding question. |

The five code-practice views currently share six authored puzzles. Other starter content includes five SQL exercises, four incidents, five comparison cards, five requirement cards, four interview question sequences, three listening prompts and five simplified-concept guides. These tools complement the existing 1,000-question bank and 1,032-entry reading library; they do not claim to execute or independently grade every bank question.

## Saving and ownership

Text drafts autosave through the existing authenticated, revision-checked progress flow. **Save / Submit** adds an immutable snapshot. The status line distinguishes pending changes from confirmation by Supabase. Check that status before leaving.

The optional `Progress.studio` field is stored in the existing per-user JSONB record. Existing backups without that field remain valid; no database migration is needed for the studio. Recovery merges preserve both attempt histories and retain a conflicting earlier draft as a recovery attempt. There is no automatic completion of course days or deletion of old answers.

Studio limits are 2,000 records, 200 snapshots per record, 60 text fields per record, and 40,000 characters per field, within the existing 12 MB progress-document limit. Limits reject additional data instead of trimming history. Archive/restore is available for mistakes, glossary entries and portfolio entries.

Diagrams save as text graph data alongside design attempts. Export the current graph as JSON or SVG; export or restore an older graph from saved diagram versions. Restoring preserves the diagram being replaced as another checkpoint. SVG exports contain the diagram, while notes and decisions remain in the progress backup and review prompt.

Audio is different: it stays in account-scoped IndexedDB on the current browser/device, with at most ten clips of up to 5 MB each. It is **not** uploaded to Supabase, included in a progress JSON backup, transcribed or automatically scored. Stop and wait for the saved message before leaving the recorder; leaving during a recording discards the unfinished clip. Download recordings to retain them outside browser storage.

## What is executed and what is illustrated

- SQL runs locally using sql.js/SQLite in a disposable Web Worker. Each run resets sample data, accepts one result-producing read statement, returns at most 200 rows, and is stopped after eight seconds. This does not access Supabase. SQLite differs from PostgreSQL; use the separate PostgreSQL fixture for PostgreSQL-specific exercises. Matching sample rows is a narrow check, not proof that arbitrary SQL is correct.
- The React explorer uses actual `React.memo`, `useMemo` and component effects. It logs effects after committed child renders and works in standard production React bundles. Development Strict Mode can repeat effects. This is not a CPU benchmark or a log of discarded renders.
- Code traces and request journeys are authored examples. The design builder checks directed graph reachability; it does not simulate real throughput, cache semantics, consistency or resilience.
- Interview, communication and sentence tools are guided practice with self-review. No AI is silently called. Copy a review prompt into ChatGPT when you want external feedback; verify that feedback yourself.
- Recall dates are recorded in the app. No background reminder, automatic public message or external notification is scheduled.
- The weekly report counts saved activity. It does not infer interview readiness or mastery from clicks, minutes or confidence ratings.

## Implementation and validation

UI lives in `components/GrowthStudio.tsx` and `components/studio/`; content in `lib/studio-content.ts`; studio validation/recovery in `lib/studio-state.ts`. The layout uses shared light/dark theme tokens, responsive grids and reduced-motion-aware hover effects.

`npm ci` runs `scripts/prepare-sql.mjs` to copy the installed sql.js runtime, WASM and license into `public/vendor`. If lifecycle scripts are disabled, run `node scripts/prepare-sql.mjs` explicitly. The runtime is served locally; there is no CDN dependency for the SQL engine. No user-entered JavaScript is evaluated by these labs.

Validation for this change: TypeScript check; direct execution of all five SQL examples through the worker handler; read-query guards and output-limit checks; studio validation, immutable-history, backup round-trip and additive-recovery checks. No new test files, production build or Playwright run. Microphone, speech playback, authenticated cloud saves and the deployed UI still require real-browser verification.

References: [sql.js documentation](https://sql.js.org/documentation/), [React memo](https://react.dev/reference/react/memo), [React useEffect](https://react.dev/reference/react/useEffect), [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder).
