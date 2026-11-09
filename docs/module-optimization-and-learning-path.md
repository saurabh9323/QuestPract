# Module loading and the four-phase reading path

The existing static routes, account provider and saved progress IDs are unchanged. Nineteen major route components now use `next/dynamic`: Dojo, Fundamentals, Repair Lab, Inside a real app, Code playground, Discovery, DSA patterns, SQL expedition, Flow designer, Interview materials, Cartoon lessons, Communication, OOP, Profile, Visual lab, Commute, Practice studio, Personal challenges and Journey calendar. A readable status panel appears while a component loads. Shared data imported by other components can still be included in the initial bundle; these boundaries do not imply every dependency is deferred.

Commute builds normalized search text and an ID map once per catalog. Query matching is memoized separately from progress filtering. Its most-recent-lesson lookup uses a linear scan rather than sorting. The global learning search also caches normalized entries and results across unrelated updates.

Run `npm run build`, then `npm run analyze:static` to report the uncompressed local scripts referenced by the exported home HTML. This is a repeatable build artifact measurement, not a network timing benchmark, compressed transfer size or proof of faster interaction.

## Content and phases

Commute → Learning path contains one worked lesson for each of 17 technology tracks plus DSA and system design. Each has an official reference, a real-life example with its limits, illustrative code, a stated result, an ordered state flow, two interview questions, a recall prompt and a build exercise. The content is authored and available without Gemini. It does not introduce automatic external requests or paid services.

The four phases are Understand → Trace execution → Try it yourself → Explain in interviews. They are navigation links, not locked levels or correctness scores. Existing Commute lessons also receive these links. For lessons without a build exercise, the practice phase opens the existing prediction activity. The generic flow renderer now covers lessons that previously had no specialized visual, using their own authored steps and highlighting the selected state during playback. Specialized diagrams remain in place.

The new IDs use `guide-path-*`, retaining the current reading validation and backup format. Notes, bookmarks, read status and recall ratings reuse the existing account storage. Marking a lesson read does not finish a quest or judge submitted code. Markdown downloads include the new content and its references.

The reader's flows are conceptual illustrations, not execution traces. Framework examples require their described project environment. Follow the cited documentation for version-specific behavior. Real execution remains in the existing appropriate practice tools.

Tests cover technology coverage, complete content fields, unique IDs, backup compatibility, search aliases and illustrated state rendering. Browser interaction, authenticated sync and real-device performance need separate verification.

## Validation for this change

On 2026-11-09, typecheck, all 225 tests and the 245-page static export passed. The local scripts referenced by the exported home HTML decreased from 3,465,655 to 2,083,057 uncompressed bytes (39.9%). Script count changed from 9 to 17; additional chunks can be fetched when a module opens. This comparison does not measure compressed transfer or actual load time.

The self-contained JavaScript Promise.all, DSA lower-bound and Python mutable-default examples were executed with matching outputs. The Node stream example also matched. The Bun handler was tested with Node Request/Response objects, not a Bun server. The sequential PostgreSQL guarded-update example was checked with PGlite, not a concurrent database load. JSX syntax checks passed for React and Next.js; framework behavior and C++/Java/C# execution were not verified locally. Lessons name their environment assumptions, and the system-design outbox is explicitly pseudocode.
