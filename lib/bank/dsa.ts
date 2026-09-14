import {pack} from './core';
const ref='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array';
function p(id:string,title:string,lesson:string,example:string,rows:string){pack('DSA',id,title,lesson,['Clarify contract','State invariant','Implement','Test + analyze'],example,'Account for empty input, duplicate values, mutation and auxiliary space. Test your implementation; a familiar pattern is not a proof.',ref,rows)}
p('dsa-arrays','Arrays and invariants','An array gives indexed access. A useful invariant states what the processed prefix already guarantees. Separate reading and writing positions when compacting in place. Sorting may simplify a problem but changes order and costs time.','To compact [0,4,0,7], a write pointer advances only for nonzero values: [4,7,…]. Fill the remaining suffix with zeroes.',`
E Two Sum|Return indices of distinct numbers summing to target. [2,7,11], target 9 → [0,1]; return [] if absent.|Store earlier values and indices; look up target minus current before insertion.
E Duplicate values|Return whether any integer repeats. [3,1,3] → true; [] → false.|A Set records values already encountered.
E Move zeroes|Move zeroes to the end in place while preserving other values. [0,2,0,1] → [2,1,0,0].|Compact nonzero values with a write pointer, then fill the tail.
E Sorted deduplication|Compact a sorted array to unique values; return the valid prefix length. [1,1,2] → 2.|Compare the read value with the last retained value.
E Remove a value|Remove every occurrence of val in place and return the retained count; order may change.|A write pointer copies only allowed values.
E Best single trade|Given daily prices, return maximum profit from one buy before one sell; no profit → 0.|Track minimum prior price and best difference, without buying after selling.
Product except self|Return each position’s product of all other numbers without division. [1,2,3] → [6,3,2].|Combine left-prefix and right-suffix products; test two zeroes.
Rotate array|Rotate right by nonnegative k. [1,2,3,4], k=1 → [4,1,2,3].|Normalize k modulo length; reverse whole array, then the two parts.
Maximum subarray|Return maximum sum of a nonempty contiguous subarray. [-2,1,-3,4,-1,2] → 5.|Either extend the best segment ending before this element or restart here.
Majority element|A nonempty array guarantees a value occurring more than n/2 times; return it.|Pair unequal values off with a candidate and balance counter.
Missing number|Distinct values from 0 through n contain one missing number. [3,0,1] → 2.|Use XOR cancellation or a carefully bounded arithmetic sum.
Find duplicate number|Length n+1 contains integers 1..n and exactly one repeated value; do not mutate, use constant auxiliary space.|Interpret values as next indices and detect the cycle entrance.
First missing positive|Return smallest absent positive integer in O(n) time and O(1) extra space; [3,4,-1,1] → 2.|Place value v at index v-1 when v is in range, avoiding duplicate swaps.
Next permutation|Mutate a sequence to the next lexicographic permutation, wrapping to ascending if last.|Find the rightmost ascent, swap with the next greater suffix value, reverse suffix.
H Trapping rainwater|Nonnegative heights describe unit-width bars; [0,1,0,2] traps 1 unit.|A position holds min(leftMax,rightMax)-height; compare two-pointer boundary maxima.
`);
p('dsa-hash','Hash maps and counting','Hash maps exchange additional memory for avoiding repeated scans. Keys must encode exactly the equivalence relation you need. Average constant-time operations do not make an algorithm constant-space.','For anagrams, the sorted characters in eat and tea form the same key aet; each key stores a group.',`
E Valid anagram|For lowercase a–z strings, return whether their frequencies match; listen/silent → true.|Use 26 counters or a Map and compare lengths first.
Group anagrams|Group lowercase words by anagram equivalence; preserve every occurrence.|Choose a canonical sorted key or an unambiguous frequency signature.
E First unique character|Return the first index whose character appears once; aabbc → 4; none → -1.|Count in one pass and scan original order in a second.
E Unique intersection|Return distinct integers present in both arrays; [1,2,2] and [2,3] → [2].|Use membership and a result Set rather than repeated searches.
Multiset intersection|Return common elements with minimum multiplicity; [2,2,3] and [2,2] → [2,2].|Decrement a frequency only when an output match is consumed.
Longest consecutive run|Return the longest consecutive integer run in an unsorted array in expected O(n).|Begin counting only when value-1 is absent; do not restart from every value.
Isomorphic strings|Return whether one-to-one character replacement transforms s into t.|Maintain both forward and reverse mappings to enforce injectivity.
Word pattern|Match pattern abba to four space-separated words using a bijection.|Each symbol maps to one word and each word to one symbol.
Happy number|Repeatedly replace a positive integer with sum of squared digits; detect reaching 1 or a cycle.|Remember seen states or use slow/fast cycle detection.
Subarray sum equals k|Count contiguous subarrays summing to k; negatives are allowed. [1,1,1], k=2 → 2.|Count prior prefix sums equal to currentPrefix-k; seed zero prefix once.
Balanced binary subarray|Return longest contiguous segment with equal zeroes and ones.|Map zero to -1 and remember the earliest index of each prefix balance.
Repeated DNA windows|Return repeated length-10 substrings of an A/C/G/T string once each.|Count fixed-window signatures; distinguish seen once from already reported.
Nearby duplicate|Return whether equal values occur at distinct indices at distance at most k.|Store the latest index or maintain a size-k sliding Set.
Ransom note|Return if magazine letters can construct note using each occurrence at most once.|Consume character counts and reject a negative remainder.
Four sum count|Count tuples (i,j,k,l) with A[i]+B[j]+C[k]+D[l]=0 for four arrays.|Count pair sums from two arrays and match negated sums from the others.
`);
p('dsa-pointers','Two pointers','Two-pointer methods discard candidates using an ordering argument. Always explain why moving a boundary cannot discard a better answer. Some require sorted input; do not silently sort when original indices matter.','For sorted [1,3,5,8] and target 9, 1+8 is already a match; if too small, only increasing the left value can help.',`
E Alphanumeric palindrome|Ignore nonalphanumeric ASCII characters and case; determine if a string reads identically backward.|Skip ignored characters at both ends, compare normalized characters.
Sorted pair sum|Given sorted integers, return a pair of zero-based indices summing to target or [].|A sum below target eliminates the current left value; above eliminates right.
Three sum|Return unique value triplets summing to zero; [-1,0,1,2,-1,-4] has two triplets.|Sort, fix one value, then move two pointers and skip duplicate values.
Four sum|Return unique quadruplets summing to target; output ordering is irrelevant.|Fix two sorted positions and solve the remaining pair with two pointers.
Closest three sum|Return the sum of three distinct positions closest to target; assume unique best sum.|Sort and shrink the pair search while updating absolute difference.
Container capacity|Choose two heights maximizing minimum height times index distance.|Move the smaller height; retaining it cannot improve capacity at smaller width.
E Sorted squares|Square a sorted integer array and return sorted squares; [-3,-1,2] → [1,4,9].|Largest absolute values are at the ends; fill output backward.
Palindrome after one deletion|Return if a string can become a palindrome after at most one deletion.|At the first mismatch test skipping either endpoint exactly once.
Merge sorted arrays|nums1 has m values and capacity m+n; merge nums2's n sorted values in place.|Write from the back to avoid overwriting unread values.
Partition colors|Sort only values 0,1,2 in place in one pass.|Maintain low, current, and high regions; recheck a value swapped from high.
Remove sorted duplicates twice|Keep at most two copies of each value in a sorted array; return retained length.|Compare the current value to the value two written positions behind.
E Reverse vowels|Reverse only ASCII vowels while all other positions stay fixed.|Find the next vowel from both ends and swap.
E Is subsequence|Return if all characters of s occur in t in order, not necessarily consecutively.|Advance the s pointer only on a match while scanning t once.
Boats to save people|Each boat holds at most two people with combined weight ≤ limit; each individual fits.|Pair the lightest with the heaviest when possible; always place the heaviest.
Backspace comparison|Compare two strings where # erases one prior character; use O(1) auxiliary space.|Scan backward, counting pending erased characters independently.
`);
p('dsa-window','Sliding windows','A window tracks a contiguous region and a summary that supports adding/removing an endpoint. Variable windows need a monotonic validity condition; negative numbers often break positive-sum shrinking arguments.','For positive numbers and target 7, expand until sum ≥7, record length, then shrink while the condition remains true.',`
E Fixed window maximum sum|Return maximum sum of k consecutive integers, with 1≤k≤n.|Subtract the outgoing value and add the incoming value.
Longest unique substring|Return length of longest substring without repeated characters; abcabcbb → 3.|Move left past the latest duplicate within the current window.
Minimum positive sum window|For positive numbers, return shortest subarray with sum≥target; none → 0.|Shrink while sum remains sufficient; positivity makes this safe.
Character replacement|Return longest uppercase substring made uniform with at most k replacements.|Window length minus its largest character frequency bounds needed changes.
Permutation in string|Return whether text contains a permutation of lowercase pattern as a substring.|Compare frequency balance in a fixed window of pattern length.
All anagram positions|Return starting indices of windows that are anagrams of pattern.|Maintain counts and number of satisfied character frequencies.
H Minimum covering window|Return shortest substring of s containing all characters of t with multiplicity.|Track required and satisfied counts; shrink only after every requirement is met.
At most two fruit types|Return longest contiguous segment containing at most two distinct integers.|Maintain a frequency Map and shrink when a third type appears.
Longest ones with flips|For a binary array, flip at most k zeroes and return longest all-one length.|Track zero count and move left until it is within budget.
Exactly k distinct integers|Count subarrays containing exactly k distinct values.|Subtract counts for atMost(k-1) from atMost(k).
Subarray product below k|For positive integers, count contiguous subarrays with product<k.|Handle k≤1 separately; each valid right endpoint contributes right-left+1.
H Window maxima|Return the maximum for every window of size k in O(n) time.|A decreasing deque stores indices; evict expired front indices.
Minimum recolors|Given B/W blocks, return fewest W recolors needed for k consecutive B.|Count W inside every fixed-length window.
Maximum vowels|Return largest vowel count in a substring of length k.|Update a scalar vowel count as endpoints move.
Longest bounded difference|Find longest subarray whose max-min≤limit.|Maintain increasing and decreasing deques, shrinking when their fronts violate the limit.
`);
p('dsa-prefix','Prefix sums and differences','A prefix aggregate turns a repeated range calculation into a subtraction. Difference arrays invert that idea: store boundary changes, then reconstruct values with a running sum. Indices and inclusive endpoints need explicit conventions.','With P[0]=0 and P[i+1]=P[i]+a[i], the inclusive sum l..r is P[r+1]-P[l].',`
E Range sum query|Preprocess integers and answer inclusive sum(l,r) queries.|Use a prefix array with a leading zero.
Two-dimensional region sum|Preprocess a matrix for inclusive rectangle sums.|Apply inclusion-exclusion on a prefix matrix with an extra row and column.
E Pivot index|Return first index with equal left and right sums, excluding itself.|Total minus left minus current is the right sum.
Product range without zeroes|Preprocess nonzero positive numbers for range products; discuss overflow limitations.|A product prefix permits division, but numeric precision must be bounded.
Range increment reconstruction|Start with n zeroes; apply inclusive updates [l,r,delta], return final array.|Add delta at l and subtract at r+1 before prefix accumulation.
Flight booking totals|Bookings give seats over inclusive 1-based flight ranges; return seats per flight.|Convert indices deliberately and apply a difference array.
Car-pooling capacity|Trips give passengers,start,end; passengers leave before pickups at the same location.|Sort position deltas or accumulate a bounded difference array.
Subarrays divisible by k|Count subarrays whose sum is divisible by positive k, including negative integers.|Equal normalized prefix remainders produce divisible differences.
Continuous multiple of k|Return if a length≥2 subarray sums to a multiple of positive k.|Store the earliest index for each prefix remainder.
Maximum sum after range requests|Permute numbers to maximize sum of many inclusive requested ranges.|Compute coverage frequency, then pair largest values with largest frequencies.
Count vowel-boundary words|Answer ranges counting words beginning and ending with a vowel.|Prefix-sum a boolean property rather than raw values.
Plates between candles|For each substring range, count plates strictly between its outermost candles.|Use nearest-candle indices plus a prefix plate count.
Minimum average split|Find first split index minimizing difference of floored prefix and suffix averages; empty suffix average=0.|Use total sum and running prefix with correct segment lengths.
Longest zero-sum segment|Return maximum length of a subarray whose sum is zero.|The earliest index of a repeated prefix maximizes the distance.
H Count range sums|Count subarrays with sum between lower and upper inclusive in O(n log n).|Merge-sort prefix sums while counting valid cross-half differences with two pointers.
`);
p('dsa-search','Binary search','Binary search works on a sorted space or a monotonic predicate, not necessarily an array. Define the interval convention and a loop variant that strictly decreases. Overflow-safe midpoint formulas matter in fixed-width languages.','For first true, keep a half-open [lo,hi) range. A true midpoint moves hi to mid; false moves lo to mid+1.',`
E Exact search|Return target index in sorted unique integers or -1.|Keep inclusive bounds and discard the tested midpoint on a miss.
E Lower bound|Return first index with value≥target, or n.|Treat equality as a reason to search left.
Upper bound|Return first index with value>target, including duplicate values.|Treat equality as a reason to search right.
First and last match|Return first/last target indices in a sorted array or [-1,-1].|Combine lower-bound and upper-bound searches.
Rotated unique search|Find target in a rotated sorted array of distinct values.|At least one half is ordered; test whether target belongs in that half.
Rotated minimum|Return smallest value in a rotated sorted array of distinct integers.|Compare midpoint with the right endpoint to identify the pivot side.
Rotated search with duplicates|Return whether target exists in a rotated array that may contain duplicates.|Equal endpoints can make the ordered half ambiguous; shrink carefully and discuss O(n) worst case.
Peak element|Return an index greater than neighbors, treating outside values as -∞; adjacent values differ.|The slope toward mid+1 identifies a side containing a peak.
E Integer square root|Return floor(sqrt(x)) for a nonnegative integer.|Search the answer and compare using division if multiplication can overflow.
Minimum eating speed|Positive piles and h≥pile count; return minimum integer speed to finish within h hours.|Sum ceil(pile/speed); feasibility is monotonic in speed.
Ship within days|Positive ordered package weights, no reordering; minimize capacity for at most D days.|Greedily count days for a capacity and binary-search total capacity.
Split largest sum|Split positive integers into exactly k nonempty contiguous parts, minimizing largest sum.|For a candidate bound, greedily count required partitions.
H Median of two sorted arrays|Return median of two sorted arrays in O(log(min(m,n))); combined input is nonempty.|Partition the shorter array so both left sides precede both right sides.
Search row-major matrix|Rows and flattened matrix are sorted; return whether target exists.|Binary-search a virtual one-dimensional index mapped to row and column.
Time-based lookup|Per-key timestamps arrive increasing; return value at latest timestamp≤query or empty.|Binary-search the insertion position to the right of the query time.
`);
p('dsa-stack','Stacks and monotonic stacks','A stack models nested or last-in-first-out work. A monotonic stack additionally preserves sorted candidates; removed elements are proved irrelevant or receive their final answer. Store indices when distance or expiration matters.','In temperatures [70,72], 72 resolves the unanswered index of 70, giving a wait of one day.',`
E Bracket matching|Validate proper nesting of (), [], and {}; reject mismatched or unclosed brackets.|Push opening brackets and compare each closing bracket to the top.
Minimum stack|Support push,pop,top,getMin in O(1) each; define empty-operation behavior.|Track the running minimum alongside each pushed value.
Postfix evaluation|Evaluate integer reverse-Polish tokens; division truncates toward zero.|Pop right operand before left operand.
Daily warmer day|For each temperature return days until a strictly warmer value, else 0.|Keep unresolved indices in a decreasing stack.
Next greater circular|Return next greater value for each circular-array position, else -1.|Scan twice while pushing each original index only when needed.
Stock span|For each new price, count consecutive prior days including today with price≤current.|Pop and accumulate compressed spans of smaller/equal prices.
Asteroid collisions|Signed integers move left/right at equal speed; resolve opposing adjacent collisions by magnitude.|Only positive stack-top with a negative incoming value can collide.
Decode repetition|Decode nested k[text] encodings such as 3[a2[c]] → accaccacc.|Store previous string and repeat count when entering a bracket.
Simplify absolute path|Normalize Unix absolute paths with ., .. and redundant slashes.|Ignore dot/empty segments; pop for .. only if a segment exists.
Remove k digits|Delete k digits from a nonnegative decimal string to minimize the number; strip leading zeroes.|Pop larger previous digits while deletion budget remains.
H Largest histogram rectangle|Unit-width nonnegative bars; return maximum rectangle area.|A popped height extends between its previous smaller bar and the current smaller bar.
H Maximum binary rectangle|Return largest all-one rectangle area in a binary matrix.|Treat each row as histogram heights and reuse the histogram solver.
Validate stack sequences|Distinct pushed values and popped ordering; decide if the pop order is possible.|Simulate pushing and greedily pop when the next requested value matches.
Minimum parentheses additions|Return fewest parentheses needed to make a parentheses-only string valid.|Track unmatched opens and unmatched closes separately.
H Basic calculator|Evaluate +,-, parentheses, spaces, and unary signs on valid integer expressions.|Carry the active sign and previous subtotal across nested parentheses.
`);
p('dsa-lists','Linked lists','Linked lists trade random access for cheap link edits when the relevant node is known. Draw references before changing them. Dummy nodes simplify operations that may replace the head. Pointer algorithms must account for cycles.','To reverse one link, save next, point current.next to previous, then advance previous and current.',`
E Reverse list|Reverse a singly linked list in place and return its new head.|Preserve next before overwriting current.next.
E Merge sorted lists|Merge two sorted singly linked lists by relinking nodes.|A dummy head keeps the first insertion uniform.
E Middle node|Return the middle node; for even length return the second middle.|Advance slow by one and fast by two.
Cycle detection|Return whether a list contains a cycle using constant space.|Slow and fast references meet if a cycle exists.
Cycle entrance|Return the node where a cycle begins, else null.|After a meeting, advance one pointer from head and one from meeting equally.
Remove nth from end|Remove the nth node from end; n is valid.|Maintain an n-node gap from a dummy head.
Add reversed numbers|Lists store base-10 digits least significant first; return their sum list.|Add aligned digits and carry until both inputs and carry are exhausted.
Palindrome list|Check if list values form a palindrome with O(1) auxiliary space; restore structure.|Reverse the second half, compare, then reverse it back.
Reorder list|Transform L0,L1,…,Ln to L0,Ln,L1,Ln-1,… in place.|Split, reverse the second half, then weave alternating nodes.
Intersection node|Return the shared node by reference of two acyclic lists, or null.|Switch each pointer to the other head after reaching its own end.
Copy random-pointer list|Deep-copy nodes with next and random pointers, with no original references retained.|Use an old-to-new map, then wire pointers in a second pass.
Reverse subrange|Reverse nodes at 1-based positions left through right in place.|Use a dummy predecessor and repeated head insertion within the range.
H Reverse k-group|Reverse complete groups of k nodes; leave an incomplete tail untouched.|Find the group’s kth node before changing any links.
Sort list|Sort a singly linked list in O(n log n) time.|Split with fast/slow pointers and merge sorted halves.
Remove duplicate runs|From a sorted list remove all values that appear more than once.|Track the predecessor before an entire equal-value run.
`);
p('dsa-trees','Binary tree traversal','Tree recursion needs a clear meaning for one call’s result. Depth-first traversal uses the call stack; breadth-first traversal exposes levels. Work is usually O(n), but memory depends on height or width.','For height, null returns zero and a node returns 1+max(leftHeight,rightHeight). A skewed tree has height n.',`
E Maximum depth|Return node-count depth of a binary tree; null → 0.|Combine child heights with one plus their maximum.
E Invert tree|Swap left and right children recursively throughout a binary tree.|Perform the same transformation on both subtrees.
E Same tree|Return whether two trees have equal shape and values.|Both null succeeds; only one null fails.
Symmetric tree|Return whether a tree mirrors itself around its root.|Compare opposite child directions, not matching directions.
Level order|Return arrays of node values grouped by depth from top to bottom.|Process the current queue size as one complete level.
Zigzag levels|Return levels with alternating left-to-right and right-to-left order.|Collect a level normally and reverse alternate outputs or write by index.
Right-side view|Return the rightmost visible value at each depth.|Take the final node of each BFS level.
Tree diameter|Return maximum edge count along any path in a binary tree.|At each node combine left and right heights and track the best sum.
Balanced tree|Return whether every node’s subtree heights differ by at most one.|Return a failure sentinel alongside height to avoid repeated height scans.
Path sum existence|Return if any root-to-leaf path sums to target.|A matching subtotal counts only at a leaf.
All root-to-leaf sums|Return every root-to-leaf value path summing to target.|Backtrack the path buffer and copy it only for valid leaves.
H Maximum path sum|Return largest sum of a nonempty path with no repeated node; endpoints can be anywhere.|Return one nonnegative branch upward, but evaluate both branches through a node.
Lowest common ancestor|Return LCA for two existing nodes in a general binary tree.|A node receiving matches from both subtrees is the split point.
Build from traversals|Construct a tree from preorder and inorder with unique values.|Preorder gives root; an inorder index map divides the child ranges.
H Serialize tree|Design encode/decode preserving arbitrary binary-tree shape and integer values.|Include null markers or child counts; values alone lose shape.
`);
p('dsa-bst','BSTs and ordered structures','A binary search tree orders every descendant, not only immediate children. Inorder traversal yields sorted values under a strict ordering convention. Balanced trees give logarithmic height; arbitrary BSTs can degrade to chains.','A node in the right subtree of 10 must remain above 10 even when its immediate parent is 15.',`
Validate strict BST|Return whether all values obey strict ancestor bounds; duplicates are invalid.|Propagate lower/upper bounds through recursion.
E Search BST|Return node with target value or null.|Choose one child using the target comparison.
Insert BST|Insert a unique value while preserving BST ordering.|Descend until the corresponding null child is reached.
Delete BST node|Delete a key from a BST and return the possibly changed root.|Handle zero/one child directly; replace a two-child node with its inorder successor.
Kth smallest BST|Return kth smallest value where 1≤k≤node count.|Stop iterative inorder traversal after the kth visit.
BST iterator|Provide hasNext and next in sorted order with O(h) memory.|Maintain a stack of the next left spine.
BST lowest common ancestor|Find LCA of two existing distinct keys.|Descend while both keys lie on the same side.
Sorted array to BST|Construct a height-balanced BST from sorted unique values.|Use the midpoint as root and recurse on balanced ranges.
Range sum BST|Sum node values in inclusive [low,high].|Prune a subtree when ordering proves all its values are outside bounds.
Minimum BST difference|Find minimum absolute difference between any two values in a BST with at least two nodes.|Only adjacent inorder values need comparison.
Recover swapped BST|Exactly two node values were swapped in an otherwise valid BST; restore them.|Inorder inversions identify the two misplaced values.
Trim BST|Remove values outside [low,high] while retaining relative valid structure.|Ordering lets an invalid root be replaced by one relevant subtree.
BST two sum|Return if two distinct BST nodes sum to target.|Use a Set or two directional iterators and avoid using one node twice.
BST preorder verification|Determine whether a unique integer sequence could be a BST preorder.|A monotonic ancestor stack maintains the lowest allowed bound.
H Count smaller after self|For each element count strictly smaller values to its right.|Use coordinate compression with a Fenwick tree or merge-sort counting.
`);
p('dsa-heaps','Heaps and selection','A heap exposes one extreme efficiently without fully sorting all items. For top-k retention, the root should be the least useful retained candidate. State whether duplicates count and whether order matters in the output.','To retain the three largest numbers, a min-heap of size three removes the smallest retained number after a better arrival.',`
Kth largest array|Return kth largest value counting duplicates.|Keep a min-heap of k values or use randomized quickselect.
Kth largest stream|After every insertion return kth largest among all observed values; assume at least k after initialization.|Retain only the largest k values in a min-heap.
Top frequent integers|Return k values with largest frequencies; any order and any tied selection are acceptable.|Count first, then select using a bounded heap or buckets.
Top frequent words|Return k words by descending frequency, breaking ties lexicographically ascending.|Your comparator must encode both frequency and lexical order.
Closest points|Return k points nearest origin by Euclidean distance; any tie order.|Compare squared distances; square roots are unnecessary.
H Merge k sorted lists|Merge k sorted linked lists with total N nodes.|Heap the current head from each nonempty list.
H Running median|Support insertion and median queries over integer stream.|Balance a max-heap lower half and min-heap upper half.
Task cooldown|Schedule unit tasks with cooldown n between equal tasks; minimize elapsed slots.|Use task frequencies and the maximum-frequency frame or heap plus cooldown queue.
Reorganize string|Reorder characters so adjacent characters differ, or return empty if impossible.|Choose frequent characters while temporarily withholding the previously used one.
Last stone weight|Repeatedly smash two heaviest stones; return remaining weight or zero.|A max-heap exposes the next pair.
K smallest pairs|From two sorted arrays, return k index pairs with smallest sums.|Initialize one pair per relevant first-array index and advance second-array positions.
H Smallest covering range|Find minimum integer range containing at least one value from each sorted list.|Maintain current heap minimum and current maximum while advancing the minimum’s list.
Meeting room count|Given half-open intervals, return minimum simultaneous rooms.|Free rooms with end≤next start using a min-heap of end times.
CPU task ordering|Tasks have arrival and processing time; nonpreemptive CPU selects shortest available, ties by original index.|Sort arrivals and use a heap ordered by duration/index while advancing time.
H Maximum project capital|Choose at most k projects with capital requirements and profits to maximize final capital.|Sort by affordability and select highest profit from an available-project max-heap.
`);
p('dsa-backtrack','Backtracking and search spaces','Backtracking constructs a partial answer, explores a choice, then undoes it. Pruning requires a proof that no valid completion remains. Copy completed mutable paths; otherwise later changes corrupt earlier results.','For subsets of [a,b], branch include/exclude for a then b; output size itself is exponential.',`
Subsets|Return every subset of distinct integers, including empty.|Choose each next start index or branch include/exclude.
Subsets with duplicates|Return unique subsets when input may repeat values.|Sort and skip equal choices at the same recursion depth.
Permutations|Return all permutations of distinct integers.|Track used positions and undo each choice after recursion.
Unique permutations|Return unique permutations of values with duplicates.|Sort and avoid choosing an equal unused predecessor out of order.
Combination sum reuse|Positive distinct candidates may be reused; return combinations summing to target.|Keep the current start index when reusing a candidate.
Combination sum once|Each candidate occurrence may be used once; output unique combinations.|Advance start after selection and skip duplicates at the same depth.
Choose k numbers|Return all k-element combinations selected from 1..n.|Prune when too few remaining numbers can fill the path.
Generate parentheses|Return every valid sequence with n pairs.|Add closing parentheses only when closes<opens; opens cannot exceed n.
Phone keypad words|For digits 2..9, return all letter combinations.|Expand one digit at a time with its keypad choices.
Grid word search|Find a word using horizontal/vertical neighbors without revisiting a cell on one path.|Temporarily mark visited cells and restore them on return.
Palindrome partitions|Return all partitions of a string into palindromic substrings.|Only recurse after a palindromic prefix; precompute palindrome checks if useful.
Restore IPv4 addresses|Insert three dots into a digits-only string to form valid IPv4 addresses.|Each segment is 0..255, length≤3, with no leading zero unless exactly zero.
H N queens|Return all placements of n queens on an n×n board without attacks.|Track occupied columns and the two diagonal identifiers.
H Sudoku solver|Fill a valid partially filled 9×9 Sudoku, or report no solution.|Use row/column/box constraints and choose a cell with few candidates.
H Expression target|Insert +,-,* between digits to reach target; preserve digit order and forbid multi-digit leading zeroes.|Track the last multiplicative term so multiplication can revise the running total.
`);
p('dsa-graphs','Graph traversal','A graph model states what nodes and edges mean. Visited marking prevents redundant work and cycles. BFS gives fewest edges in unweighted graphs; DFS provides reachability and component structure.','An undirected graph with edges 0–1 and isolated 2 has two components; a scan must start a traversal from every unvisited node.',`
Number of islands|Count four-neighbor connected components of 1s in a binary grid.|Mark land when enqueuing or entering DFS.
Largest island area|Return maximum four-neighbor connected land-cell count.|Accumulate area per component and compare maxima.
Flood fill|Recolor the connected original-color region containing a start cell.|Return immediately if new color equals original to avoid repeated processing.
Clone graph|Deep-copy a connected graph with node values and neighbor lists.|Create the copy before traversing neighbors; map original references to clones.
Connected components|Count components in an undirected adjacency list, including isolated nodes.|Launch one traversal for every still-unvisited vertex.
Unweighted shortest path|Return node sequence of a shortest source-to-target path, or [].|BFS with a predecessor map reconstructs the path backward.
Rotting oranges|Fresh oranges rot from four-neighbor rotten oranges each minute; return elapsed minutes or -1.|Start a multisource BFS from all initially rotten cells.
Nearest zero distance|For each binary-matrix cell return Manhattan distance to nearest zero; at least one zero exists.|Multisource BFS begins with all zero cells.
Surrounded regions|Flip O regions not connected to the grid border into X.|Mark border-reachable O cells before flipping the rest.
Pacific Atlantic flow|Return cells whose nonincreasing-height water paths can reach both ocean borders.|Reverse the flow: traverse uphill from each ocean and intersect reachable sets.
Word ladder length|Change one character at a time through dictionary words; return shortest sequence length or 0.|BFS the implicit word graph; wildcard buckets reduce neighbor search.
Open the lock|Four wheels wrap 0..9; avoid dead combinations and find minimum moves from 0000 to target.|BFS valid states, handling a dead starting state explicitly.
Bipartite graph|Return if vertices can be colored with two colors so every edge crosses colors.|Color every component and reject an edge joining equal colors.
Evaluate ratios|Given equations a/b=value, answer ratio queries or -1 if disconnected/unknown.|Build weighted reciprocal edges and multiply along a discovered path.
Shortest binary-matrix path|Find shortest path of zeroes from top-left to bottom-right using eight directions.|BFS valid zero cells; start/end must both be open.
`);
p('dsa-advanced-graphs','Graph ordering and connectivity','Directed dependencies need cycle-aware ordering. Weighted paths need algorithms matching weight constraints. Union-find maintains evolving undirected components but does not itself recover arbitrary shortest paths.','Kahn’s algorithm repeatedly removes a zero-indegree node; if fewer than V nodes are removed, a directed cycle remains.',`
Course feasibility|Prerequisite pairs define directed edges; can all courses finish?|Detect a directed cycle or count nodes removed by topological sorting.
Course order|Return one valid course ordering or [] when impossible.|Use indegree counts and a zero-indegree queue.
Alien alphabet|Words are sorted under an unknown alphabet; return a valid character order or report invalid.|First differing adjacent characters create edges; reject a longer word before its prefix.
Eventual safe vertices|Return nodes from which every directed path eventually terminates.|Reverse edges and remove terminal nodes, or memoize DFS safety with cycle detection.
Redundant undirected edge|Edges form a tree plus one extra edge; return the last edge closing a cycle.|Union-find identifies endpoints already in one component.
Account merge|Accounts share email addresses; merge connected accounts while preserving names as supplied.|Union accounts by shared email and group by root.
Network connectivity|Given n computers and cables, return minimum reconnections to connect all or -1.|Need at least n-1 cables; otherwise count components minus one.
Network delay|Positive-weight directed edges; return time for source to reach all nodes or -1.|Use Dijkstra and take the largest finite shortest distance.
Cheapest flight with stops|Find minimum cost with at most k intermediate stops.|Track edge-count layers; ordinary shortest distance without stop state is insufficient.
Minimum effort grid path|Minimize the maximum absolute adjacent height difference along a grid path.|Dijkstra can use max(currentEffort,edgeEffort) as path extension.
Minimum spanning cost|Connect all weighted undirected vertices at minimum total edge cost, or report disconnected.|Kruskal sorts edges and adds only those joining different components.
H Critical connections|Return bridges whose removal disconnects an undirected graph.|DFS discovery and low-link times distinguish a subtree with no back edge.
H Strong components|Partition a directed graph into strongly connected components.|Use Kosaraju’s finishing order and transpose or Tarjan’s low-link stack.
Redundant directed edge|A directed rooted tree has one extra edge; remove one edge to restore it.|Distinguish a node with two parents from a pure directed cycle.
Shortest paths with negatives|Return source distances or report a reachable negative cycle.|Bellman–Ford relaxes edges V-1 times; an extra improvement signals a cycle.
`);
p('dsa-dp1','Dynamic programming foundations','Define the state before the recurrence. A state summarizes everything from the past needed to choose the future. Base cases and evaluation order are part of correctness, not initialization trivia.','For house robbery, best[i]=max(best[i-1],value[i]+best[i-2]); the second choice skips the adjacent house.',`
E Climbing stairs|Count ways to climb n steps using 1 or 2 steps; n=0 has one empty way.|The final jump comes from n-1 or n-2.
Min-cost staircase|Pay cost[i] when leaving a step; start at 0 or 1 and reach beyond the last step.|Compute the cheapest cost to reach each next position.
House robber|Maximize sum of nonadjacent nonnegative array entries.|Compare skipping current with taking current plus best two positions back.
Circular house robber|First and last houses are adjacent; maximize nonadjacent sum.|Solve excluding first and excluding last; handle a single house separately.
Coin minimum|Unlimited positive coins; return fewest coins for amount, or -1.|For each amount minimize one plus a reachable smaller amount.
Coin combinations|Count order-independent combinations for an amount with unlimited distinct positive coins.|Iterate coins outside amounts so permutations are not counted separately.
Ordered sum count|Count ordered sequences of positive candidates summing to target.|Iterate target amounts outside candidate choices.
Equal subset partition|Determine if positive integers can split into equal-sum subsets.|Target is half the total; iterate capacity backward for 0/1 selection.
Target sign count|Assign + or - to each integer; count ways to reach target.|Track counts by reachable sums or reduce to subset sum with valid parity.
Perfect square count|Return minimum number of positive perfect squares summing to n.|Treat squares≤n as reusable coin denominations.
Word break|Return whether a string can be segmented into reusable dictionary words.|dp[end] is true if some valid prefix ends before a matching dictionary word.
Decode digit string|Count mappings 1..26 to letters; zero alone is invalid.|Check valid one-digit and two-digit endings at each position.
Delete and earn|Taking value x earns x per occurrence but forbids x-1 and x+1.|Aggregate points per value, then use a house-robber recurrence.
0/1 knapsack|Given positive weights and values, maximize value within capacity using each item once.|Iterate capacities backward to avoid reusing an item in the same pass.
Minimum ticket cost|Travel days need 1-,7-,30-day passes; minimize total cost.|For each pass skip all travel days covered by its duration.
`);
p('dsa-dp2','Sequence and grid DP','Two-dimensional DP often compares prefixes of two sequences or paths into a grid cell. State size determines memory; rolling rows work only when no later transition needs discarded values.','LCS on prefixes uses 1+diagonal for equal characters; otherwise the better of dropping either final character.',`
Longest increasing subsequence|Return LIS length for strictly increasing values.|Start with O(n²) predecessor DP; optionally maintain smallest tails by length.
Longest common subsequence|Return LCS length of two strings, preserving order but allowing gaps.|Use prefix lengths as a two-dimensional state.
Edit distance|Return minimum insert/delete/replace operations to transform one string into another.|Compare three predecessor states plus match/substitution cost.
Unique grid paths|Count top-left to bottom-right paths using only right and down.|Each open cell receives paths from above and left.
Grid paths with obstacles|Count right/down paths avoiding blocked cells.|Blocked cells contribute zero, including blocked start/end.
Minimum grid path sum|Nonnegative costs, right/down moves; minimize path sum including endpoints.|Each cell adds its cost to the cheaper reachable predecessor.
Triangle minimum path|Choose adjacent positions in consecutive triangle rows; minimize total.|Work bottom-up combining the two allowed children.
Maximum square|Return area of largest all-one square in a binary matrix.|A square ending here is 1+min(top,left,diagonal) for a one cell.
Longest palindromic substring|Return one longest contiguous palindrome.|Expand around centers or use interval DP with valid inner substrings.
Count palindromic substrings|Count every palindromic substring occurrence.|Expand odd and even centers and count each successful expansion.
Longest palindromic subsequence|Return length of a palindrome formed by deleting characters without reordering.|Compare interval endpoints and smaller subintervals.
Distinct subsequences|Count subsequences of s equal to t; empty t has one match.|A matching source character can be used or skipped.
H Interleaving strings|Return if s3 interleaves s1,s2 while preserving order within each.|State records consumed prefix lengths of both source strings.
H Regex matching|Match entire string with lowercase literals, dot, and star repeating the preceding element.|Star permits zero occurrences or consumes one matching character while keeping the pattern position.
H Burst balloons|Burst all balloons for neighbor-product coins; maximize total, with outside boundaries 1.|Choose the final balloon burst in each interval so outside neighbors stay fixed.
`);
p('dsa-greedy','Greedy strategies and intervals','A greedy choice must be supported by an exchange argument or invariant. Choosing locally best without proof is a heuristic. Intervals require explicit endpoint overlap semantics.','For maximum nonoverlapping meetings, an earliest finishing meeting leaves at least as much room as any alternative first choice.',`
Jump reachability|Nonnegative jump lengths; return whether the last array index is reachable.|Track the farthest reachable position and reject a gap beyond it.
Minimum jumps|Last index is reachable; return minimum number of forward jumps.|Process reachable layers, updating the farthest boundary for the next jump.
Gas station circuit|Gas and cost arrays describe a circular route; return a feasible start or -1.|A negative running balance invalidates all starts since the last reset.
Merge closed intervals|Merge overlapping or touching inclusive intervals.|Sort by start and extend the active interval’s end.
Insert closed interval|Insert an interval into sorted disjoint intervals and merge overlaps.|Emit before, merge overlapping middle, then append after.
Remove overlapping intervals|Half-open intervals; remove the fewest to make them nonoverlapping.|Retain the interval with the earliest end when a conflict occurs.
Minimum arrows|One arrow at x bursts all closed balloon intervals containing x; minimize arrows.|Sort by end and shoot there for each not-yet-covered interval.
Partition labels|Split a string into maximum parts so each character appears in only one part.|Extend current part to the farthest last occurrence of every encountered character.
Queue reconstruction|People have [height, count of preceding people at least this tall]; reconstruct a valid queue.|Sort tall-first, equal heights by count, and insert at the count index.
H Candy allocation|Each child gets ≥1 candy; higher rating than a neighbor requires more; minimize total.|Satisfy left and right constraints with two passes.
Assign cookies|Each cookie satisfies at most one child if size≥greed; maximize satisfied children.|Match smallest sufficient cookie to the least greedy remaining child.
Two-city scheduling|Send exactly n of 2n people to each city with individual costs; minimize total.|Sort by the difference between city costs.
Maximum pair chain|Pairs [a,b] require a<b; choose longest chain where prior b<next a.|Select by smallest ending value.
Monotone digits|Return largest integer≤n whose digits are nondecreasing.|Fix descents from right to left and fill the suffix with nines.
H Minimum refueling stops|Start fuel and sorted stations with fuel amounts; minimize stops to reach target.|When fuel runs short, take the largest previously reachable station fuel.
`);
p('dsa-strings','Strings and tries','String algorithms must declare the character model: these exercises use ASCII unless noted. A trie shares prefixes, making prefix queries natural. Repeated string concatenation may add costs hidden by high-level syntax.','A trie containing car and cat shares c→a, then branches into r and t; terminal markers distinguish a word from a prefix.',`
E Reverse words|Reverse word order in a space-separated sentence, trimming and collapsing spaces.|Parse words and reverse their order, not each word’s letters.
Longest common prefix|Return the shared prefix of all strings; empty input → empty.|Compare characters until one string ends or a mismatch appears.
String compression|In place, encode runs as char then count digits if count>1; return written length.|Separate reading runs from writing compressed output.
Multiply decimal strings|Multiply two nonnegative integer strings without BigInt or full numeric conversion.|Accumulate digit products into an m+n array with carry propagation.
Compare versions|Compare dot-separated nonnegative integer revision strings, ignoring leading zeroes.|Compare normalized segment lengths/lexical values to avoid numeric overflow.
Implement trie|Support insert, exact search, and prefix search for lowercase words.|Use child edges and a separate end-of-word marker.
Wildcard word dictionary|Support word insertion and search where dot matches any single letter.|At a wildcard branch over children; literals follow one edge.
Replace word roots|Replace sentence words with the shortest matching root from a dictionary.|Stop trie traversal at the first terminal prefix.
Search suggestions|For each typed prefix return up to three lexicographically smallest matching products.|Sort plus binary search, or store bounded suggestions in a trie.
H Find grid words|Return all dictionary words discoverable by adjacent grid cells without cell reuse on one path.|Combine trie prefix pruning with grid backtracking.
Substring search|Return first index of needle in haystack or -1; empty needle → 0.|KMP’s prefix function avoids rechecking matched characters after a mismatch.
Repeated substring pattern|Return if a nonempty string is repeats of a shorter string.|Use the final prefix-function length and check divisibility by candidate period.
Shortest palindrome by prefixing|Add the fewest characters at the front to create a palindrome.|Find longest palindromic prefix using a prefix function with a safe separator.
H Word break sentences|Return every dictionary-word sentence forming a string.|Memoize suffix solutions while acknowledging exponential output size.
Encode/decode strings|Design reversible serialization for arbitrary strings including separators and empty strings.|Length-prefix each value; delimiter-only formats need escaping.
`);
p('dsa-bits','Bits, arithmetic and numeric models','Bit operations act on a fixed-width representation; JavaScript bitwise operators use signed 32-bit integers. Choose BigInt or another representation when constraints exceed it. Arithmetic algorithms also need an overflow and rounding model.','XOR cancels equal operands: a XOR a = 0. Thus XOR of [4,1,4] leaves 1 when every other value appears twice.',`
E Single number|Every 32-bit integer appears twice except one; return the singleton.|XOR all values using cancellation.
Single number triples|Every 32-bit integer appears three times except one; return it.|Count each bit modulo three or maintain a bit-state automaton.
Two single numbers|Exactly two values appear once and all others twice; return both.|Partition by a set bit in the total XOR, then cancel within each group.
E Count set bits|Return population count of an unsigned 32-bit value.|Repeatedly clear the lowest set bit with n AND (n-1).
E Power of two|Return whether a positive integer is a power of two.|Exactly one bit is set; handle zero and the language’s integer width.
Counting bits|Return set-bit counts for every integer 0..n.|Reuse the count of i shifted right plus its low bit.
Reverse 32 bits|Reverse the bit order of an unsigned 32-bit integer.|Extract one low bit at a time and build the result; normalize unsigned output.
Range bitwise AND|Return AND of every integer in inclusive nonnegative [left,right].|The surviving high bits are the common binary prefix.
Sum without plus|Add two signed 32-bit integers using bit operations with wraparound semantics.|XOR gives sum without carries; shifted AND gives carries.
Fast exponentiation|Compute x^n for integer n, including negative exponent and n=0.|Square the base while halving exponent; handle negative minimum integer safely.
GCD and LCM|Return gcd and lcm of positive integers, discussing overflow.|Euclid reduces gcd(a,b) to gcd(b,a mod b); divide before multiplying for lcm.
Prime count|Count primes strictly below n.|Sieve composites starting at p² for each prime p.
Trailing factorial zeroes|Return number of decimal trailing zeroes in n!.|Count factors of five using floor(n/5)+floor(n/25)+….
Integer palindrome|Check whether a nonnegative decimal integer is palindromic without converting to string.|Reverse only half the digits; numbers ending in zero need special handling.
Divide without multiplication|Divide signed 32-bit integers without *, /, or %, truncating toward zero and clamping overflow.|Subtract exponentially doubled divisor chunks and restore sign.
`);
p('dsa-structures','Data-structure design','A data-structure design starts with a precise operation contract, invariants, and cost targets. Combine structures only when each pays for a required operation. Trace multi-operation sequences including updates and eviction.','An LRU combines a key→node map with a doubly linked recency list: lookup finds the node, list edits move or evict it in constant time.',`
LRU cache|Implement get/put in expected O(1) with positive capacity; updates refresh recency.|Use a hash map plus doubly linked list, including capacity-one tests.
H LFU cache|Evict lowest-frequency key, breaking ties by least recent use; target expected O(1).|Group nodes by frequency with recency lists and track minimum nonempty frequency.
Randomized set|Support insert, remove, and uniform random selection in expected O(1).|Map values to indices and swap the removed element with the last array entry.
Randomized multiset|Allow duplicate values while selecting uniformly among occurrences.|Map each value to a set of array indices and update the swapped occurrence.
Queue using stacks|Implement FIFO enqueue/dequeue using two stacks with amortized O(1).|Transfer input to output only when output is empty.
Stack using queues|Implement LIFO push/pop with queue operations.|Choose whether to rotate on push or on pop, and state the cost tradeoff.
Circular queue|Implement fixed-capacity queue with full/empty detection.|Track head and size, or reserve a slot to distinguish full from empty.
Circular deque|Support insertion/deletion at both ends with fixed capacity.|Use modular head/tail movement and explicit size invariants.
Browser history|Support visit, back(k), forward(k); new visits discard forward entries.|Maintain current index and logical history end.
Snapshot array|Support set(index,value), snap(), and get(index,snapId).|Store per-index sorted change histories and binary-search snapshots.
Mutable range sums|Support point updates and inclusive range sum queries.|A Fenwick tree provides O(log n) updates and prefix sums.
Range minimum with updates|Support point replacement and inclusive range minimum queries.|A segment tree stores the minimum for each interval.
Disjoint-set structure|Implement union and connected for n vertices efficiently.|Combine path compression with rank or size balancing.
H All-ones counter|Increment/decrement key counts and get any min/max count key in expected O(1).|Keep a doubly linked list of count buckets and map each key to its bucket.
H Calendar maximum overlap|After each half-open booking, return the maximum simultaneous bookings.|Use sweep-line deltas for a baseline, then an augmented interval structure for scale.
`);
