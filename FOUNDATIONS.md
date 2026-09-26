# Systems, Linux, hardware and PostgreSQL learning

Open **Learn → Visual lab → Systems & Linux**. The five camps share the existing account progress flow for reflection notes and submitted checkpoints. Related-concept buttons open the matching full lesson in **Concept adventures**.

## Architecture zoom

HLD (high-level design) describes components, responsibilities, data flow, capacity and reliability. LLD (low-level design) describes implementation contracts, functions/classes, schemas, states, algorithms and failures. LLD can use OOP or functional modules.

Three examples—seat booking, chat messaging and URL shortening—offer HLD/LLD toggles. A moving packet or tool marker follows narrated stages with play, pause, back, next and restart controls. The diagrams are teaching flows, not traces of Quest90’s production infrastructure.

## Linux command camp

Thirty cards explain navigation, files, text filtering/pipes, identity, processes, resources, sockets, service logs, permissions, basic file operations, Docker and Git. The small command preview supports listed forms and a three-directory fixture; it does not execute a shell, access the network, modify files, inspect your machine or emulate all shell syntax.

`pwd`, `cd` and listings reflect the fixture directory. File examples refer to files in `/home/learner/app`. Mutation examples explicitly preview their meaning without changing the fixture. A session retains at most twenty command outputs; **Save transcript checkpoint** saves it to the user’s learning history. Unsaved fixture state resets when leaving the camp.

## CPU/GPU workload animation

Adjust 1–64 jobs, independence/dependency, and 0–10 GPU setup units. A toy model uses four CPU lanes and sixteen GPU lanes, with one job per lane per unit. Dependent jobs use one lane. Play or single-step to see completed work.

This demonstrates batching and overhead tradeoffs, not actual hardware performance. It deliberately permits small tasks or sequential work to favor the CPU. Lane counts, costs, units and timings are illustrative; no hardware benchmark is run.

## PostgreSQL constraint gates

Edit a row and inspect required values, integer types, primary-key uniqueness, foreign-key membership, unique code and positive quantity. Read the corresponding SQL schema and try inserting into a temporary twenty-row fixture. Repeated IDs, missing learners and invalid quantities are rejected by the teaching checker.

This is a bounded JavaScript model of the shown rules, not a PostgreSQL engine. Blank fields represent SQL NULL in the form and text equality is case-sensitive. It does not emulate concurrency, collation variations or every SQL feature. No queries are sent to Supabase and no production tables change. Temporary rows reset on leaving the camp; save your reflection separately.

## Twenty additional concept lessons

The concept library now has 42 missions. New topics are HLD, LLD, Linux basics, files, pipes, permissions, processes, CPU, GPU, memory/storage, PostgreSQL types, constraints, relations, transactions/ACID, indexes, logical SQL query flow, Docker, CI/CD, RAG and observability. Lessons retain examples, explanations, animated narrated flows, hints, challenge answers, English/Hinglish notes and saved answer versions.

## Dated technology radar

Five cards cover TypeScript, Python/applied AI, PostgreSQL, Docker/delivery and AI-assisted coding with review. Each separates a sourced observation from a suggested practice task and can be saved as a learning interest. Sources were reviewed **September 26, 2026**; the cards explicitly identify the **2025** evidence period and do not present live 2026 hiring rankings. This is a static snapshot with primary-source links, not an automatic news feed.

Evidence: [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/), [Stack Overflow technology survey](https://survey.stackoverflow.co/2025/technology), and [Stack Overflow AI survey](https://survey.stackoverflow.co/2025/ai). GitHub activity and voluntary developer surveys are different measures and do not guarantee job demand or interview outcomes.

Technical references: [Linux kernel documentation](https://docs.kernel.org/), [GNU command manual](https://www.gnu.org/software/coreutils/manual/coreutils.html), [AWS CPU/GPU comparison](https://aws.amazon.com/compare/the-difference-between-gpus-cpus/), and PostgreSQL [types](https://www.postgresql.org/docs/current/datatype.html), [constraints](https://www.postgresql.org/docs/current/ddl-constraints.html), [isolation](https://www.postgresql.org/docs/current/transaction-iso.html) and [indexes](https://www.postgresql.org/docs/current/indexes.html).

## Previous requirements remain available

- **Custom-input simulators:** 21 added DSA tools plus the original three, with methods and edge-case explanations.
- **Concept adventures:** OOP/SOLID, multiple-language examples, JavaScript/React and system concepts plus these new foundations.
- **Practice passport:** internal attempts, external practice, contest ranks, solved questions, blockers and reflections.
- **Behavioral camp:** twenty STAR questions, rehearsal timer, saved answers and communication reflection.
- **Scenario library / Solo tournaments:** the 100 scenarios and timed output-prediction rounds.

No progress reset or database migration was introduced. New records use existing `adventure-*`, `foundation-*` and `foundation-radar-*` IDs; submitted snapshots remain in the established studio history. Saved status follows the existing account/cloud indicator.

Verification: TypeScript validation, content IDs/counts and lesson links, supported command fixtures and unsupported-command handling, selected constraint acceptance/rejection boundaries, and CPU/GPU model cases passed. No new test files, production build, Playwright run, browser inspection or live database verification was performed.
