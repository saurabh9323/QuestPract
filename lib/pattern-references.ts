// Destinations resolved from the learner's screenshot on 2026-10-04.
// These are community resources, not official interview guarantees or copied course material.
export type PatternReference={title:string;shortUrl:string;url?:string;story:string;note:string};
const r=(title:string,code:string,url:string|undefined,story:string,note:string):PatternReference=>({title,shortUrl:`https://lnkd.in/${code}`,url,story,note});
export const patternReferences:PatternReference[]=[
 r('Sliding window cheatsheet','dv2-NP5b','https://leetcode.com/problems/frequency-of-the-most-frequent-element/solutions/1175088/C++-Maximum-Sliding-Window-Cheatsheet-Template/','sliding-window','Compare fixed-size windows with windows governed by a validity rule.'),
 r('Binary search template','deDpHndC','https://leetcode.com/discuss/study-guide/786126/Python-Powerful-Ultimate-Binary-Search-Template.-Solved-many-problems','binary-search','Identify sorted order or a monotonic predicate before eliminating half.'),
 r('Two-pointers problems','dGRdAMg9','https://leetcode.com/discuss/study-guide/1688903/Solved-all-two-pointers-problems-in-100-days','two-pointers','Explain why moving one endpoint safely discards candidates.'),
 r('Dynamic programming patterns','dXg5PJ_9','https://leetcode.com/discuss/study-guide/458695/Dynamic-Programming-Patterns','dp-ways','Define a state and transition; distinguish counting from optimization.'),
 r('Substring template','dHsB8yRP','https://leetcode.com/problems/minimum-window-substring/solutions/26808/Here-is-a-10-line-template-that-can-solve-most-%27substring%27-problems/','substring-window','No-repeat and minimum-cover windows maintain different invariants.'),
 r('String question patterns','d_mazjKr','https://leetcode.com/discuss/study-guide/2001789/Collections-of-Important-String-questions-Pattern','string-counts','Decide whether you need membership, frequency, order or a contiguous range.'),
 r('Graphs for beginners','dcQxHDwX','https://leetcode.com/discuss/study-guide/655708/Graph-For-Beginners-Problems-or-Pattern-or-Sample-Solutions','graph-visited','Name vertices, edges, direction and weights before choosing a traversal.'),
 r('DFS and BFS tree traversal','dh-i2vnY','https://leetcode.com/discuss/study-guide/937307/Iterative-or-Recursive-or-DFS-and-BFS-Tree-Traversal-or-In-Pre-Post-and-LevelOrder-or-Views','trees-bfs','Compare recursive depth-first order with a FIFO level-order frontier.'),
 r('Backtracking pattern','dzKGrpjU',undefined,'backtracking','The short link in the screenshot could not be resolved. The original lesson here is still available.'),
 r('Backtracking examples in Java','dp9T65VN','https://leetcode.com/problems/permutations/solutions/18239/A-general-approach-to-backtracking-questions-in-Java-(Subsets-Permutations-Combination-Sum-Palindrome-Partioning)/','backtracking','Choose, explore, undo; copy a completed candidate before saving it.'),
 r('Monotonic stack guide','dQyT-QXs','https://leetcode.com/discuss/study-guide/2347639/A-comprehensive-guide-and-template-for-monotonic-stack-based-problems','monotonic-stack','Keep unresolved candidates and choose strictness from the contract.'),
 r('Bit manipulation patterns','dtGJkEin','https://leetcode.com/discuss/interview-question/3695233/all-types-of-patterns-for-bits-manipulations-and-how-to-use-it','bitwise','Check bit width and input guarantees before applying XOR shortcuts.'),
 r('BFS and DFS — part 1','du95kqCw','https://medium.com/leetcode-patterns/leetcode-pattern-1-bfs-dfs-25-of-the-problems-part-1-519450a84353','graph-visited','Extra reading from Medium; access may require a subscription.'),
 r('BFS and DFS — part 2','ddyeSDRb','https://medium.com/leetcode-patterns/leetcode-pattern-2-dfs-bfs-25-of-the-problems-part-2-a5b269597f52','dfs','Extra reading from Medium; use the built-in story without opening it.'),
 r('More dynamic programming patterns','dH-za55c','https://leetcode.com/discuss/study-guide/1437879/Dynamic-Programming-Patterns','dp-choices','Start with take/skip decisions, then practice recognizing the required state.'),
];
