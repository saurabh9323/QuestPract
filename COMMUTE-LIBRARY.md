# Commute library

Open **Learn → Commute library** after signing in.

## Content and scope

The initial catalog contains **1,032 entries**:

- **32 visual guides**: 17 technical guides plus 15 communication exercises. These are newly authored explanations with examples, step-by-step traces, interview phrasing, common mistakes and recall prompts.
- **1,000 scenario notes**: the existing authored question bank is connected to its 60 theory modules. Each note combines a scenario-specific reasoning clue with the module's explanation, related example, pitfalls and self-check. These are concise study notes, not 1,000 newly authored textbooks or fully solved coding exercises. Related examples are explicitly labelled and may illustrate the topic rather than solve the selected question.

Technical guides include closures, browser event-loop ordering, React useMemo, render/commit and effects, SQL WHERE/HAVING, ACID, Two Sum, DSA pattern recognition, HLD/LLD and architecture styles, a system-design interview approach, cache-aside, Waterfall, OOP composition with C#, Python generators, and CI/CD.

Speaking exercises include introductions, thinking pauses, sentence structure, clarifying questions, acknowledging uncertainty, STAR stories, disagreement, status updates, respectful small talk, follow-ups, smaller practice tasks when nervous, repairing a sentence, explaining tradeoffs, interview questions, and reflection. They are practice scripts and do not promise a particular confidence outcome.

## Reading workflow

Search titles and explanations; filter by category, format, unread/read, bookmarks or due reviews. A 5-, 10-, or 20-minute queue prioritizes unread lessons within current filters. Durations are estimates, not measured learning time.

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

TypeScript check and catalog audit: 1,032 unique IDs, 32 guides, 1,000 notes, and no missing explanation/example/flow/recall fields. No production build or browser tests were run. Speech and live account synchronization have not been exercised in an authenticated browser for this change.
