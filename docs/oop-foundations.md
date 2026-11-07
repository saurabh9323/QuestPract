# Animated OOP and API foundations

Open `/oop/?mode=basics` from OOP Studio's **Start here · basics** tab. A lesson can be linked with `foundation=<id>`, for example `/oop/?mode=basics&foundation=idempotency`. The existing OOP learn, practice and answer records remain compatible.

## Content and player

`lib/oop-foundations/lessons.ts` holds ten lessons: fields and methods, constructors, `this`, static members, generics, generic constraints, overloads, immutability, dependency injection and idempotency. Each includes a definition, use cases, real-life analogy and its limits, TypeScript example, expected output, authored frames, interview answer, knowledge check and primary sources.

`FoundationPlayer` provides manual stepping, playback, speed control, a scrubber, current-line highlighting and before/after variables. Keyboard controls work when the player region has focus; reduced motion disables autoplay and motion effects. These are authored teaching animations, not a compiler, arbitrary-code execution or a display of real memory addresses. Fixed source examples are compiled and their outputs checked in the content test.

The same lesson content appears in the Commute library under **OOP & API basics**, using the existing reading controls and flow visualization. Common Foundations also links to the beginner path.

## Idempotency experiment

`lib/oop-foundations/idempotency.ts` is a deterministic, serialized model. The interactive lab demonstrates initial creation, replay with the same key and payload, changed-payload conflict, new intent, a lost response after a committed effect, and duplicate creation with protection disabled. Every frame has independent before/after snapshots.

The experiment is session-local and makes no network or payment calls. Its cached response is a policy of this model, not the definition of HTTP idempotency. The UI explains that production implementations need account-scoped keys, durable storage, atomic claims, expiration policy and recovery across external side effects; serialized animation does not prove concurrency safety.

## Persistence

Saved explanations use the existing answer workspace and `p.oop['basics-' + lesson.id]`. Commute records use stable `guide-oop-basics-<id>` IDs. Existing validation limits and version-1 import/export remain in place. Reading a lesson or selecting an in-session quiz answer does not create a completed attempt.

## Validation

On 2026-11-07, typecheck, the production static-export build and all 187 unit tests passed. Coverage includes strict compilation and output of authored snippets, frame references, pure retry transitions, accessible server-rendered controls and progress export/import compatibility. A read-only final code review found no actionable issues.

Local browser preview access was declined by the browser permission gate, so desktop/mobile visual layout, authenticated interactions and a live Supabase round trip were not verified. A repository push does not itself verify a Vercel deployment.
