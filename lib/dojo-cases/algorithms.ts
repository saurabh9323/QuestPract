import type {DojoChallenge} from './types';

export const algorithmCases: DojoChallenge[] = [
  {
    "id": "growth-review",
    "track": "Algorithms",
    "level": "Easy",
    "title": "Choose a duplicate detector",
    "brief": "Compare nested-loop duplicate detection with a Set-based scan. Explain what improves and what extra memory is needed.",
    "input": "[4, 7, 4]; also consider a large array with no duplicates.",
    "output": "true for the sample; worst-case growth and auxiliary memory for both approaches.",
    "concept": "Count operations as input grows. Short-circuiting changes best cases but does not erase worst-case behavior.",
    "components": [
      "Input array",
      "Nested comparisons",
      "Seen set",
      "Boolean result"
    ],
    "flow": [
      "Input array → Nested comparisons: test each distinct pair",
      "Input array → Seen set: check membership before insert",
      "Nested comparisons → Boolean result: duplicate or exhausted pairs",
      "Seen set → Boolean result: previously seen or exhausted array"
    ],
    "checks": [
      "Distinct positions are compared.",
      "Empty and one-element inputs return false.",
      "Nested approach has O(n²) worst-case comparisons.",
      "Set scan has expected O(n) time and O(n) extra space under usual hash-table assumptions."
    ],
    "hint": "Use the no-duplicate case when counting worst-case work.",
    "solution": "For pairs, compare j > i; there are n(n−1)/2 pairs when no repeat exists. For the Set, check has(value) before add(value) and stop on a repeat. Mention equality semantics and the collection’s implementation assumptions.",
    "failure": "Do not claim the language specification guarantees constant-time hashing in every implementation.",
    "tradeoff": "The Set scan exchanges O(n) auxiliary memory for expected linear time. Pairwise comparison uses constant extra space but becomes expensive on long inputs without duplicates."
  },
  {
    id: 'bounded-window', track: 'Algorithms', level: 'Medium', title: 'Find the shortest spending window',
    brief: 'Find the shortest contiguous run of positive daily costs whose total reaches a target. Explain why advancing the left boundary is safe and why the same rule fails when negative values are allowed.',
    input: 'Costs [2, 3, 1, 2, 4, 3] and target 7. Also test an empty array, a target above the total and a single cost equal to the target.',
    output: 'Minimum length 2 from [4, 3]; return 0 when no qualifying window exists. State O(n) time and O(1) auxiliary space for positive inputs.',
    concept: 'With positive values, expanding a window can only increase its sum and shrinking can only decrease it. Each pointer moves forward at most n times, which gives linear total work despite the nested while loop.',
    components: ['Cost array', 'Right boundary', 'Running sum', 'Left boundary', 'Best length'],
    flow: ['Cost array → Right boundary: add the next positive cost', 'Right boundary → Running sum: expand the current contiguous window', 'Running sum → Best length: record length while sum is at least 7', 'Running sum → Left boundary: subtract the leftmost cost and advance while feasible', 'Best length → Cost array: return minimum found or 0 after scanning'],
    checks: ['Only contiguous windows are considered.', 'The shrink loop records a candidate before removing its left value.', 'No-solution and empty inputs return 0; target must be positive.', 'The proof counts pointer advances and explicitly depends on positive costs.'],
    hint: 'At a fixed right boundary, keep removing leftmost values until the window stops meeting the target; the last feasible one is the shortest ending there.',
    solution: 'Track left = 0, sum = 0 and best = infinity. For each right index, add costs[right]. While sum >= target, minimize best with right - left + 1, then subtract costs[left] and increment left. Return 0 if no candidate was recorded. Every element enters and leaves once. Reject unsupported negative inputs or choose a different algorithm with a new invariant.',
    failure: 'For [1, -1, 5] with target 5, the positive-only shrink rule records length 3 and stops at sum 4, missing the valid length-1 window [5].',
    tradeoff: 'The moving window needs only constant extra space and linear time under positivity. A prefix-sum method with a monotonic deque supports negative values but requires O(n) space and a more involved invariant.'
  },
  {
    id: 'dependency-order', track: 'Algorithms', level: 'Medium', title: 'Schedule builds or expose a cycle',
    brief: 'Order build targets so prerequisites finish before dependents. Detect when a dependency cycle makes a complete order impossible, including in a component unrelated to the first target.',
    input: 'Targets A, B, C, D; prerequisite edges A→C, B→C, C→D. A second run adds D→B. Include every declared target, even if it has no edges.',
    output: 'One valid first order is A, B, C, D. The second run reports a cycle instead of returning its partial order as a successful schedule.',
    concept: 'A directed acyclic graph has a topological ordering. Kahn’s algorithm repeatedly removes zero-indegree vertices; fewer than V removed vertices means at least one directed cycle remains.',
    components: ['Targets and edges', 'Indegree table', 'Ready queue', 'Ordered result'],
    flow: ['Targets and edges → Indegree table: initialize every target and count incoming prerequisites', 'Indegree table → Ready queue: enqueue all zero-indegree targets', 'Ready queue → Ordered result: consume one ready target', 'Ordered result → Indegree table: decrement each dependent after its prerequisite is consumed', 'Indegree table → Ready queue: enqueue dependents exactly when their count becomes zero'],
    checks: ['Edge direction is defined as prerequisite to dependent.', 'Disconnected and isolated targets appear in a successful order.', 'A result is successful only when its length equals the declared target count.', 'Duplicate edges are either deduplicated or counted and decremented consistently.'],
    hint: 'A queue becoming empty proves completion only if you also know that every target was removed.',
    solution: 'Build adjacency lists and indegrees for all targets. Seed a queue with each zero-indegree target, then consume by a head index, append to the order and decrement outgoing neighbors. Enqueue a neighbor when its count reaches zero. If the final order has fewer than V targets, report a cycle. The basic algorithm costs O(V + E) time and space; use a priority queue only when a deterministic smallest-first order is required.',
    failure: 'The graph contains isolated A plus the cycle B→C→B. Returning [A] as a successful full schedule hides the blocked component; residual vertices also need not all be members of the cycle.',
    tradeoff: 'A simple queue finds any valid order in linear time. A priority queue makes tie-breaking stable by target name but adds logarithmic queue work; a concrete cycle witness requires an additional traversal.'
  },
  {
    id: 'weighted-route', track: 'Algorithms', level: 'Hard', title: 'Find a route when hops have different costs',
    brief: 'Find the cheapest route through a directed delivery network with nonnegative edge costs. Explain when a destination may safely be finalized and why breadth-first search is insufficient.',
    input: 'Edges A→B cost 8, A→C cost 2, C→B cost 1, B→D cost 2, C→D cost 9. Source A, destination D; an isolated E is unreachable.',
    output: 'Distance 5 and route A→C→B→D. E returns unreachable with no fabricated path. State the heap-based time and space bounds.',
    concept: 'Dijkstra’s algorithm finalizes the smallest tentative distance because nonnegative edges cannot improve it through a later, more expensive frontier. Discovering a destination is not the same as finalizing it.',
    components: ['Adjacency lists', 'Distance map', 'Minimum heap', 'Predecessor map', 'Route result'],
    flow: ['Adjacency lists → Distance map: initialize source 0 and other distances infinity', 'Distance map → Minimum heap: seed the source and push each strict improvement', 'Minimum heap → Adjacency lists: expand the next non-stale cheapest vertex', 'Adjacency lists → Predecessor map: record the parent when relaxation improves a distance', 'Predecessor map → Route result: reconstruct only after the destination is finalized'],
    checks: ['All edge costs are validated as finite and nonnegative.', 'A popped entry whose distance exceeds the recorded best is skipped.', 'The destination stops the search only when popped with its current minimum distance.', 'Unreachable vertices and equal-cost alternatives have explicit output behavior.'],
    hint: 'The first A→B candidate costs 8, but relaxing through C later improves it to 3. Keep the old heap entry harmless rather than assuming it disappeared.',
    solution: 'Store adjacency lists, distances and predecessor links. Repeatedly pop the minimum heap entry, skip stale entries and relax outgoing edges with strictly smaller candidate distances. Finalize D when its current best entry is popped, then walk predecessors back to A. With lazy duplicate heap entries, time is O((V + E) log(V + E)) and auxiliary storage O(V + E). Reject negative costs; they invalidate the finalization proof.',
    failure: 'Stopping when D is first discovered returns the route A→C→D with cost 11, before the cheaper path through B is explored. A negative edge would also invalidate the nonnegative-cost proof.',
    tradeoff: 'A heap exploits sparse graphs and unequal costs but adds bookkeeping and can hold stale entries. For equal-cost edges, a FIFO breadth-first search is simpler and runs in O(V + E); negative weights require a suitable alternative.'
  }
];
