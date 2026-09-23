# System-design practice

Open **Practice → Question bank → System design**. All 100 existing questions now have an editorial difficulty: **17 Easy, 55 Medium and 28 Hard**. The labels guide learning, rather than predicting a company's interview grading. The question IDs, titles and prompts remain unchanged, preserving existing answers and bookmarks.

Use the level cards or difficulty filter to choose a stage. High-level architecture, OOP low-level design and functional low-level design are labelled in each question. Suggested session budgets are 25, 40 and 60 minutes; these do not impose a deadline or change the course schedule.

## Consistent answer format

Every system-design question has a nine-part template:

1. Problem and scope.
2. Requirements and assumptions.
3. Scale estimates or low-level invariants.
4. API, method or function contracts.
5. Data model and constraints.
6. Diagram and component responsibilities.
7. Concrete happy path.
8. Failures, recovery and security.
9. Tradeoffs and next iteration.

**Add template to my answer** appends to the current draft; it does not replace existing writing. Use the existing **Submit answer** button to preserve an attempt. Download or copy the question brief and blank template, or include the same structure in a ChatGPT review prompt. Existing account saving, answer history and screenshots continue to work without a migration.

## Designs and diagrams

Seven questions have question-specific worked designs:

| Level | Worked design |
| --- | --- |
| Easy | Comments and moderation |
| Easy | Immutable shopping-cart engine |
| Easy | Library lending with OOP |
| Medium | Read-heavy URL shortener |
| Medium | Multi-channel notifications |
| Hard | Idempotent payment requests |
| Hard | Search over one billion documents |

These include scope, requirements, labelled estimates or invariants, contracts, data models, an interactive forward-flow diagram, a walkthrough, failure handling, tradeoffs and implementation order. Reveal guidance after attempting the problem. The Markdown download includes Mermaid diagram text that can be rendered in a compatible Markdown viewer.

All 100 questions now have an authored concrete scenario and a distinct data model and forward flow. The other 93 use scenario-specific starting designs with an API or method contract and a failure risk, rather than a repeated topic architecture. They remain starting designs to expand with scope, estimates and implementation; the seven longer worked guides retain their additional depth.

The diagrams illustrate a forward path; they do not execute a system, estimate performance automatically or prove correctness. Replies and recovery behavior are described separately. Capacity numbers in worked examples are either taken from the prompt or explicitly identified as assumed inputs.

## Validation and references

Type checking passes. A direct catalog audit verified 100 system-design questions, all three difficulty levels, nine template sections per question, seven valid worked-example IDs and unchanged IDs/titles/prompts. No new test files, production build or browser tests were run for this change.

Architectural review references: [AWS Well-Architected](https://wa.aws.amazon.com/index.en.html), [Azure architecture: build for business needs](https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/build-for-business). The worked designs are authored learning examples, not quoted reference architectures or verified production benchmarks.
