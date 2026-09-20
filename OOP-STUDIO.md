# Quest90 OOP Studio

Open **OOP studio** from the app navigation after signing in.

## What is included

- 17 lessons: objects and identity, encapsulation, abstraction, inheritance, polymorphism, composition, interfaces versus abstract classes, five SOLID principles, and Strategy, Factory, Observer, Adapter and State patterns.
- Each lesson has an explanation, analogy, clickable flow, worked TypeScript example, expected output, implementation mission, progressive hints, proof checklist and interview question.
- An interactive two-wallet simulator demonstrates independent state and validation. Equivalent withdrawal examples are available in TypeScript, Python and C#.
- Three low-level design challenges: checkout/payments, parking allocation and Quest90 learning progress. Each includes a flow, implementation steps, failure cases and design criteria.
- A 90-second speaking timer, a four-part answer structure and an optional conversation exercise with a willing teammate or friend.
- Drafts, append-only submitted answer text, per-attempt reviewer feedback, self-assessed confidence and due reviews. Clear-draft confirmation preserves submitted history.
- Copy buttons for examples, current answers, old answers and a ChatGPT review prompt.
- Account-scoped persistence through the existing training_state JSON payload, backup export/import, mobile layout and night mode.

## Suggested practice

1. Pick the next concept or a due review.
2. Predict the worked example's output, then read the explanation.
3. Complete the build mission before revealing hints.
4. Explain it aloud in 90 seconds, including a concrete example and a tradeoff.
5. Submit your own attempt. Learning/assisted/independent schedules review in 1/3/7 days.
6. Copy the ChatGPT prompt, paste it into your ChatGPT conversation, and paste feedback back onto the relevant attempt.

The simulator is a predefined educational model. It does not execute submitted code, and confidence is self-assessed rather than an automated grade. ChatGPT review uses manual copy/paste and does not connect to a ChatGPT account or API. Code snippets are teaching examples, not production payment infrastructure.

## Storage

The optional `Progress.oop` field maps lesson/challenge IDs to draft, attempts, updatedAt and reviewDue. Each attempt records a unique ID, text, feedback, confidence and createdAt. Existing accounts and older backups do not require this field. The existing authenticated Supabase save RPC stores the full progress payload; no schema migration is needed. The app's normal sync/error indicator reports actual save status.

Input validation limits drafts to 30,000 characters, feedback to 10,000 characters, and histories to 200 attempts per topic. Existing export/recovery features include OOP records. The course start lock and existing day/task completion remain unchanged.
