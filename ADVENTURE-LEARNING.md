# Adventure learning, practice passport, and behavioral camp

Open **Learn → Visual lab**. The existing 100-scenario library and solo prediction tournaments remain available. This update expands the custom-input tab and adds three companion tabs.

## Custom-input simulators: 21 additions

The original Two Sum, binary search, and request journey remain available. The new expedition selector includes:

- Map frequency counting and Set deduplication, with individual method playgrounds.
- Stack and queue traversal, with push/pop/peek or enqueue/dequeue controls.
- Linked-list reversal, BST insertion/inorder traversal, min-heap insertion, and trie insertion.
- Graph BFS and DFS, plus union-find connectivity.
- XOR pair cancellation, 8-bit XOR/NOR comparison, prefix sums, and recursion call frames.
- Insertion sort, merge sort, fixed-size sliding windows, sorted two pointers, climbing-stairs DP, and subset backtracking.

Every tool includes when to choose it, relevant methods, complexity, a common trap, a code sketch, and computed state frames. Users can change bounded inputs, predict, play/pause, move backward/forward, or scrub to a checkpoint. Nodes and arrows display references; tree/trie/heap views arrange nodes by depth. Emoji markers animate checkpoint changes and respect reduced-motion preferences.

Input contracts are explicit: sorted two-pointer inputs must be ascending, XOR cancellation requires one singleton and pairs, bit comparisons accept two integers from 0 to 255, and exponential backtracking is limited to six inputs. Number bitwise behavior is distinguished from Boolean NOR. Simulator inputs and method playgrounds are temporary scratch work; they do not execute submitted code.

## Concept adventures: 42 missions

Twenty additional foundation lessons cover architecture, Linux, hardware, PostgreSQL, delivery, and AI fundamentals. See [FOUNDATIONS.md](FOUNDATIONS.md) for their interactive workshops and the dated tech radar.

The original missions cover encapsulation, polymorphism, abstraction, composition/inheritance, each SOLID principle, closures, the browser event loop, React state, memoization, Context, idempotency, WebSocket, webpack, Redis, serverless, greedy selection, shortest-path selection, and topological sorting.

Each mission has a narrated flow diagram, example code, a common failure, a challenge, progressive hints, and reference reasoning. JavaScript, React, Node, Python, and C# examples appear where relevant; not every concept has every language. The flow animation is an explanation, not execution of those snippets.

English/Hinglish explanations, notes, immutable answer checkpoints, and a self-reviewed flag use existing account progress storage. Example sources include [React useMemo](https://react.dev/reference/react/useMemo), [React Context](https://react.dev/learn/passing-data-deeply-with-context), [MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), [MDN idempotency](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent), and [webpack concepts](https://webpack.js.org/concepts/). Collection and bitwise terminology was checked against [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set), and [XOR](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_XOR).

## Practice passport

Create a problem entry, write an internal attempt (including incomplete reasoning), and save its checkpoint. The external-practice section then unlocks. Exact matching DSA titles link back to the question bank; existing bank attempts remain there. Two Sum also offers a link to the [LeetCode problem](https://leetcode.com/problems/two-sum/).

Record a platform, URL, date, minutes, outcome, blockers, hints, learning, next action, and retry date. Contest entries additionally record rank, optional participant count, solved questions, and unfinished questions. Rank and outcomes are explicitly self-reported; no platform login, scraping, automatic submission, or leaderboard is included. Unknown ranks may be left blank. Retry dates are journal notes, not notifications.

Submissions preserve snapshots. Earlier checkpoints can be read, copied into a coaching prompt, and exported as JSON. A new entry creates a new stable ID instead of overwriting an earlier journal.

## Behavioral camp

Twenty questions cover ownership, conflict, deadlines, mistakes, ambiguity, feedback, performance, customers, mentoring, prioritization, learning, initiative, quality, failure, communication, teamwork, scope changes, security, motivation, and growth.

Write Situation, Task, Action, Result, and Learning. A two-minute rehearsal timer supports speaking practice; it does not record audio or grade speech. A checklist, confidence field, feedback notes, conversation reflection, and saved rehearsal snapshots support revision. Copy a prompt for manual review in ChatGPT or another tutor. Guidance encourages truthful examples and evidence rather than invented achievements.

## Storage and verification

New saved records live in the existing per-user `Progress.studio` data (`adventure-*`, `behavior-quest-*`, and unique `passport-*` IDs). The established validation, merge, backup, and cloud-save flow applies. No database migration, account change, or progress reset is needed. Check the account save indicator before leaving.

TypeScript validation and bounded content/logic checks cover all 21 default simulator outputs, empty structures, selected invalid-input boundaries, node-reference integrity, and unique lesson IDs. No production build, new test files, Playwright, browser visual inspection, or live Supabase verification was performed for this update. This covers a broad core interview syllabus; it is not every possible data structure or algorithm.
