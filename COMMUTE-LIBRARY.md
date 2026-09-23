# Commute library

Open **Learn → Commute library** after signing in.

## Content and scope

The catalog contains **1,047 entries**:

- **47 visual guides**, including 15 new detailed foundations: Map operations/counting, Set, browser task queues, Redis basics/cache-aside/data types, serverless, React fundamentals/reconciliation/context/hooks/effects, WHERE/HAVING and ACID.
- **600 concise interview/SQL Q&As** using the existing stable question IDs. The reader starts with the question-specific reference reasoning rather than repeating the chapter introduction. All 20 core JavaScript questions now include a worked code example, expected output, hint and common trap.
- **300 DSA reasoning notes**, preserving existing problem statements and insights. These are not 300 complete executable solutions.
- **100 design answers** with different scenario-specific contracts, data models, flows and failure risks. Seven have additional detailed worked implementation guides.

This is a content upgrade of the existing bank, not 1,000 newly added questions. The concise reference answers are not all full worked examples or automatically verified solutions.

Technical guides include closures, browser event-loop ordering, React useMemo, render/commit and effects, SQL WHERE/HAVING, ACID, Two Sum, DSA pattern recognition, HLD/LLD and architecture styles, a system-design interview approach, cache-aside, Waterfall, OOP composition with C#, Python generators, and CI/CD.

Speaking exercises include introductions, thinking pauses, sentence structure, clarifying questions, acknowledging uncertainty, STAR stories, disagreement, status updates, respectful small talk, follow-ups, smaller practice tasks when nervous, repairing a sentence, explaining tradeoffs, interview questions, and reflection. They are practice scripts and do not promise a particular confidence outcome.

## Reading workflow

Search titles and explanations; filter by category, format, unread/read, bookmarks or due reviews. A 5-, 10-, or 20-minute queue prioritizes unread lessons within current filters. Durations are estimates, not measured learning time.

The reader adds method-reference tables, revealable Q&A, topic-specific visualizations and code-copy buttons. Its side panel supports English/Hinglish notes and base64 screenshot upload, preview, download and deletion. Question-linked lessons share images with that question; standalone guides have their own image context. Notes remain under their existing reading IDs. Fifteen new guides include authored Hinglish explanations; other entries offer relevant term definitions and an explanation scaffold, not a machine translation.

The reader supports larger text, manual or automatic flow steps, code-line highlighting where available, browser read-aloud with speed selection, copy-as-review-prompt, and Markdown downloads. Walkthroughs illustrate state transitions; they do not execute submitted code. Speech stops when leaving a lesson. Browser/device voice support and offline speech vary.

Use **Download filtered pack** before travelling to read a Markdown copy without the app. The app itself is not an offline PWA: sign-in and cloud loading still need connectivity. Downloaded lesson packs contain public lesson content, not personal notes. The explicitly requested copy-review action includes current notes between learner-data delimiters.

Reading a lesson does not complete a course task or mark a DSA question solved. “Review tomorrow” and “I recalled it” schedule self-assessed recall after 1 or 7 days. Bookmarks, notes, read state, visit timestamps and review dates use `Progress.reading` in the existing per-user training payload. The normal account recovery checkpoints, cloud revision checks and exports include this field. No new SQL schema is required. Recovery merges preserve conflicting notes and reject an oversized merge instead of truncating it.

## Reference checks

Core descriptions were checked against these primary documentation pages; links also appear in the relevant reader entries:

- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)
- [MDN: JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- [React: useMemo](https://react.dev/reference/react/useMemo), [render and commit](https://react.dev/learn/render-and-commit), [useEffect](https://react.dev/reference/react/useEffect)
- [PostgreSQL: querying a table](https://www.postgresql.org/docs/current/tutorial-select.html), [transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Microsoft: C# object-oriented programming](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/)
- [Python: generators](https://docs.python.org/3/tutorial/classes.html#generators)
- [AWS: Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [IBM: Agile versus Waterfall](https://www.ibm.com/think/topics/agile-vs-waterfall)

Existing scenario-note source links are retained; this change does not claim a new independent fact-check of all 1,000 scenarios.

## Validation

TypeScript check and catalog audit: 1,047 unique IDs, 47 visual guides, all 1,000 original question-note IDs retained, 100 distinct design models/flows, and no missing explanation/example/flow/recall fields. No production build or browser tests were run. Speech and live account synchronization have not been exercised in an authenticated browser for this change.
