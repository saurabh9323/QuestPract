# Cartoon classroom and commute references

Open **Learn → Cartoon classroom** (`/cartoons/`) or **Learn → Commute library → Browse all cartoon lessons**. Individual stories have shareable URLs such as `/cartoons/?movie=two-pointers`. Login is still required by the workspace.

There are **43 original stories, 129 scenes, and 43 recall questions** across 16 topic groups. These supplement the existing question bank; they are not 1,000 individually animated problem solutions.

## How to learn

1. Pick a story by topic or search. The catalog has 12 cards per page.
2. Watch Pip, the original robot guide, move through illustrated states. Pause, restart, change speed, or choose a scene directly.
3. Use **Read this scene aloud** for device/browser narration. Captions and a text equivalent are always available.
4. Open **Now explain it like a developer** for the mechanism, code or pseudocode, use case, and limits of the analogy.
5. Answer the recall question. Explain the idea in your own words, including Hinglish if helpful. Save another checkpoint when your explanation improves.
6. Open the story in Commute for the existing reading notes, screenshot attachments, bookmarks, and revision tools.

## Coverage

- SQL/PostgreSQL: WHERE, JOIN, GROUP BY/HAVING, transactions and ACID, indexes.
- System design: Redis caching, load balancing, queues, idempotency, WebSockets, HLD versus LLD.
- DSA: Map/Set, stack, FIFO queue, tree BFS, binary search, fixed sliding window.
- Pattern practice: two pointers, no-repeat substring windows, string frequencies, visited graphs, DFS, backtracking, monotonic stacks, bit operations, counting DP, take/skip DP.
- JavaScript and React: closures, browser event loop, render/commit, context and useMemo.
- OOP: encapsulation, polymorphism, focused responsibilities and dependency contracts.
- Backend: MERN request flow, .NET middleware/DI, Flask and Django.
- Delivery and foundations: Docker, CI/CD, serverless, Linux, CPU/GPU, RAG, clear communication.

Stories are authored illustrations, not a code execution engine. The tree BFS drawing preserves its concrete topology; arrays remain in one ordered row; stacks grow upward. The technical text explains assumptions such as sorted input, monotonic predicates, JavaScript bit width and graph edge weights.

## Video export

Expand **Take the story with you**, then choose **Create captioned video**. The browser records the same canvas renderer in real time and offers a playable preview and download. A supported WebM or MP4 MIME type is selected at runtime. Recording takes roughly 20–30 seconds per three-scene story and requires the tab to remain visible.

**The downloaded video is silent.** Speech synthesis is available in the player; its audio is not captured by the canvas video track. Download the Markdown transcript for the full narrated text, technical details and recall answer. Generated recordings stay in browser memory until downloaded; they are not stored in Supabase. Leaving the player releases its video URL and stops recording tracks. Hidden tabs cancel exports rather than offering an incomplete recording. No camera or microphone permission is requested.

The renderer supports the device's reduced-motion setting and both app themes. On small screens, captions below the canvas provide readable text separately from the scaled diagram.

API references: [Canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream) and [MediaRecorder MIME support detection](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static).

## Screenshot reference shelf

The learner's 15-reference screenshot is represented in `lib/pattern-references.ts`. Fourteen short-link destinations were resolved on **4 October 2026** to LeetCode or Medium articles. One backtracking short link could not be resolved and is shown as unavailable. Resolved means the destination was identified, not that every claim in the community article was independently verified. Medium and other sites may require login/subscription.

Commute presents those references alongside buttons to open related built-in stories. The stories and worked examples are original. No article body, photograph, or social-media endorsement was copied, and no external page is needed to use the built-in lessons.

## Persistence and implementation

`Progress.studio['cartoon-' + lessonId]` uses the existing authenticated progress save and validation pipeline for choice, explanation, checked status, and immutable attempts. Commute reading metadata remains in `Progress.reading` under the same stable lesson ID, with the existing separate image storage. The classroom and Commute therefore share quiz drafts and attempt history. No migration, credential change, progress reset, or auto-completion of course days is performed.

- `lib/cartoon-lessons.ts` and `lib/cartoon-patterns.ts`: authored scenes and recall contracts.
- `lib/cartoon-renderer.ts`: shared illustration renderer for playback and video.
- `components/CartoonPlayer.tsx`: playback, speech, video export and saved recall.
- `components/CartoonClassroom.tsx`: route-aware catalog and pagination.
- `components/PatternReferenceShelf.tsx`: screenshot resource collection in Commute.

## Verification in this change

TypeScript checking and inline content checks verify IDs, active-node indices, quizzes, source-to-story references and route registration. Development HTTP checks cover `/cartoons/` and a cartoon Commute URL. A separate local component preview (in-memory progress, no account writes) was used to inspect light/dark rendering, keyboard scene navigation, recall checkpoint saving and creation/playback of a captioned WebM video. The signed-in cloud save flow was not reverified in that preview. No Playwright, production build or new automated test files were used.
