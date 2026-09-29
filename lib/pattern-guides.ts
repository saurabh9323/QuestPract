import type {Pattern} from './patterns';
export type PatternFrame={line:number;action:string;cells:string[];focus:number[];memory:string;reason:string};
export type PatternGuide={why:string;when:string;avoid:string;baseline:string;realLife:string;invariant:string;methods:{name:string;use:string;example:string}[];questions:string[];example:string;code:string;output:string;frames:PatternFrame[];hinglish:string};
const f=(line:number,action:string,cells:string[],focus:number[],memory:string,reason:string):PatternFrame=>({line,action,cells,focus,memory,reason});
export const patternGuides:Record<Pattern,PatternGuide>={
 Map:{
  why:'A Map connects a key to information you need later: an index, count, last position or cached result. It avoids repeatedly searching the earlier input.',
  when:'Ask “Have I seen this value, and what do I know about it?” Use it for unsorted pair lookup, frequency counts, grouping, or remembering the last index.',
  avoid:'If you only need membership, a Set is simpler. A tiny fixed alphabet may suit a count array. Do not use object keys expecting two different objects with equal fields to be the same key.',
  baseline:'Two Sum can try every pair with nested loops: O(n²) time and O(1) extra space. A Map trades O(n) extra space for expected O(n) time with typical hash-backed lookup.',
  realLife:'A cloakroom ticket is a key; the shelf location is its value. When someone presents ticket 42, you look up its shelf instead of inspecting every coat.',
  invariant:'Before processing index i, the Map contains only earlier values. Checking before storing prevents using the current element twice.',
  methods:[{name:'new Map()',use:'Create the key → value lookup.',example:'const seen = new Map();'},{name:'has(key)',use:'Check existence, even when the stored value is 0.',example:'seen.has(2) // true after storing 2 → 0'},{name:'get(key)',use:'Read the stored index or count; missing keys return undefined.',example:'seen.get(2) // 0'},{name:'set(key, value)',use:'Insert or replace a value. Useful for frequency increments.',example:'counts.set(x, (counts.get(x) ?? 0) + 1);'}],
  questions:['Two Sum with original indices','First non-repeating character','Group anagrams by a normalized key','Count subarrays with target sum (combine with prefix sums)'],
  example:'Two Sum: nums = [2, 7, 11], target = 9. Return indices, not values.',
  code:`function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
  output:'[0, 1]',frames:[f(2,'Prepare the lookup',['2','7','11'],[], '{}','We need an earlier index, so use key → index.'),f(4,'Read 2; need 7',['2','7','11'],[0],'i=0 · need=7','The missing partner is target minus the current value.'),f(6,'7 is absent; remember 2',['2','7','11'],[0],'{2 → 0}','Do not discard index 0; it is a valid answer.'),f(5,'Read 7; find partner 2',['2','7','11'],[0,1],'{2 → 0} · return [0,1]','has(2) is true; get(2) supplies the earlier index.')],hinglish:'Map ek value ke saath extra information rakhta hai. Sirf “hai ya nahi” nahi, “kis index par hai” bhi chahiye.'
 },
 Set:{
  why:'A Set remembers distinct values. It makes repeated membership checks simple without carrying an unnecessary count or index.',
  when:'Use it when the answer depends on existence, uniqueness, visited status, or whether a value belongs to a blocked list.',
  avoid:'Use Map when counts or original indices matter. Object membership uses identity, so store user.id when matching records by ID.',
  baseline:'Comparing each new ID with all previous IDs can take O(n²). A Set uses O(k) memory for k distinct values and typically expected O(n) total time.',
  realLife:'A venue stamps each ticket ID at entry. A second scan checks whether that ID has already entered; it does not need to count every guest’s visits.',
  invariant:'Before each check, seen contains exactly the distinct values from earlier iterations.',
  methods:[{name:'new Set(values)',use:'Build a unique membership collection.',example:'new Set([8, 3, 8]) // {8,3}'},{name:'has(value)',use:'Check before adding to detect a repeat.',example:'seen.has(8)'},{name:'add(value)',use:'Remember a value; adding it twice keeps one entry.',example:'seen.add(8);'},{name:'delete(value) / size',use:'Remove window members or count distinct values.',example:'seen.delete(8); seen.size;'}],
  questions:['Contains Duplicate','Unique tags in insertion order','Intersection of arrays','Longest unique substring (Set plus sliding window)'],
  example:'Do any IDs repeat in [8, 3, 8]? Only true or false is required.',
  code:`function hasDuplicate(ids) {
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) return true;
    seen.add(id);
  }
  return false;
}`,
  output:'true',frames:[f(2,'Open the entry book',['8','3','8'],[],'{}','No visitors have been recorded yet.'),f(5,'First 8 enters',['8','3','8'],[0],'{8}','has(8) was false, so remember it.'),f(5,'3 enters',['8','3','8'],[1],'{8,3}','A different ID adds one member.'),f(4,'Second 8 is caught',['8','3','8'],[2],'{8,3} · return true','Check before add; otherwise every item would look repeated.')],hinglish:'Sirf check karna hai ki value pehle aayi hai? Set lo. Count bhi chahiye toh Map lo.'
 },
 'Two pointers':{
  why:'Two positions can eliminate impossible candidates or coordinate two ordered streams without checking every pair.',
  when:'Use opposite ends for sorted pair sums and symmetric comparisons; use one pointer per input for merging sorted arrays.',
  avoid:'For pair sums, never move an endpoint by value unless ordering justifies eliminating candidates. Sorting first costs O(n log n) and may lose original indices.',
  baseline:'All pairs take O(n²). On already sorted data, each endpoint moves at most n times: O(n) time and O(1) extra space for pair lookup.',
  realLife:'Two people compare the first and last pages of a mirrored booklet, then move inward. Each comparison removes two positions from consideration.',
  invariant:'In sorted pair search, any possible answer still lies between left and right. Every move must prove discarded pairs cannot work.',
  methods:[{name:'left / right indices',use:'Track the remaining candidate interval.',example:'let left = 0, right = nums.length - 1;'},{name:'left++',use:'Increase the smallest candidate when the sum is too small.',example:'if (sum < target) left++;'},{name:'right--',use:'Decrease the largest candidate when the sum is too large.',example:'else right--;'},{name:'while (left < right)',use:'Prevent pairing an element with itself.',example:'while (left < right) { /* compare */ }'}],
  questions:['Two Sum on sorted input','Valid palindrome','Merge sorted arrays','Remove duplicates from sorted array (read/write pointers)'],
  example:'Sorted nums = [1, 3, 4, 7, 9], target = 11. Return a pair of values.',
  code:`function sortedPair(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [nums[left], nums[right]];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
  output:'[4, 7]',frames:[f(4,'Compare the ends',['1','3','4','7','9'],[0,4],'left=0 · right=4 · sum=10','Even the largest partner makes 1 too small.'),f(6,'Discard 1',['1','3','4','7','9'],[1,4],'left=1 · right=4 · sum=12','Advance left to increase the sum.'),f(7,'Discard 9',['1','3','4','7','9'],[1,3],'left=1 · right=3 · sum=10','With 3, the sum was too large; larger left values cannot rescue 9.'),f(5,'Find 4 + 7',['1','3','4','7','9'],[2,3],'left=2 · right=3 · return [4,7]','10 was too small, so advance left once more.')],hinglish:'Pointer tabhi move karo jab bata sako ki chhoda hua candidate answer kyun nahi ho sakta.'
 },
 'Sliding window':{
  why:'Neighboring contiguous ranges share most of their work. A window reuses that work instead of recomputing every range.',
  when:'Look for consecutive values or substrings: fixed-size sums, longest valid interval, or shortest valid interval when shrinking has a justified rule.',
  avoid:'A subsequence can skip positions, so it is not a window. Variable-size sum rules based on positivity can fail with negatives; fixed-size sums still work with negatives.',
  baseline:'Summing every length-k range separately takes O(nk). Add one incoming and remove one outgoing value for O(n) time and O(1) extra space.',
  realLife:'Track the busiest three consecutive hours in a shop. As the window moves forward, remove the oldest hour and include the new hour.',
  invariant:'After updating index right, sum represents at most the last k values. Compare with best only after a full window exists.',
  methods:[{name:'sum += nums[right]',use:'Include the incoming item.',example:'sum += nums[right];'},{name:'sum -= nums[right-k]',use:'Remove the outgoing item after reaching size k.',example:'if (right >= k) sum -= nums[right-k];'},{name:'Math.max',use:'Retain the best complete window.',example:'best = Math.max(best, sum);'},{name:'Set / Map + while',use:'For uniqueness, shrink until the window is valid again.',example:'while (seen.has(char)) seen.delete(text[left++]);'}],
  questions:['Maximum sum of k consecutive numbers','Longest substring without repeated characters','Minimum-size positive-sum subarray','Permutation in a string using window counts'],
  example:'nums = [2, 1, 5, 1, 3, 2], k = 3. Find the largest consecutive sum.',
  code:`function maxWindow(nums, k) {
  if (!Number.isInteger(k) || k < 1 || k > nums.length) return null;
  let sum = 0, best = -Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    if (right >= k) sum -= nums[right-k];
    if (right >= k-1) best = Math.max(best, sum);
  }
  return best;
}`,
  output:'9',frames:[f(7,'First complete window',['2','1','5','1','3','2'],[0,1,2],'sum=8 · best=8','Warm-up additions formed a size-3 window.'),f(6,'Remove 2; include 1',['2','1','5','1','3','2'],[1,2,3],'sum=7 · best=8','The other two values are reused.'),f(7,'Remove 1; include 3',['2','1','5','1','3','2'],[2,3,4],'sum=9 · best=9','This window becomes the best.'),f(9,'Remove 5; include 2',['2','1','5','1','3','2'],[3,4,5],'sum=6 · return best=9','Return the best, not the final window sum.')],hinglish:'Lagatar items chahiye aur overlap ho raha hai? Purana item hatao, naya add karo; sab dobara calculate mat karo.'
 },
 Stack:{
  why:'A stack keeps unfinished work in reverse order. The newest unresolved item is the first one that must be handled.',
  when:'Use it for nested brackets, undo, parsing, explicit DFS, or a monotonic stack of candidates awaiting an answer.',
  avoid:'Use a queue for first-in-first-out work. Matching counts alone cannot prove nesting; a monotonic stack needs an explicit ordering rule.',
  baseline:'Repeatedly removing innermost bracket pairs can repeatedly scan/copy the input. A stack validates one character at a time in O(n) time and O(n) space.',
  realLife:'A stack of trays exposes the last tray placed on top. Closing a nested box works the same way: close the inner box before the outer one.',
  invariant:'The stack holds exactly the unmatched opening brackets, oldest at the bottom and newest at the top.',
  methods:[{name:'push(value)',use:'Put new unresolved work on top.',example:'stack.push("(");'},{name:'pop()',use:'Remove the latest item; empty returns undefined.',example:'const opening = stack.pop();'},{name:'stack.at(-1)',use:'Inspect the top without removing it.',example:'stack.at(-1) // latest opening'},{name:'stack.length',use:'Check whether unresolved work remains.',example:'return stack.length === 0;'}],
  questions:['Valid parentheses','Undo/redo with two stacks','Daily temperatures (monotonic stack)','Evaluate reverse Polish notation'],
  example:'Validate "([])"; input contains only (), [] and {} characters.',
  code:`function validBrackets(text) {
  const stack = [], pairs = {')':'(', ']':'[', '}':'{'};
  for (const ch of text) {
    if ('([{'.includes(ch)) stack.push(ch);
    else if (!(ch in pairs) || stack.pop() !== pairs[ch]) return false;
  }
  return stack.length === 0;
}`,
  output:'true',frames:[f(4,'Open outer bracket',['('], [0],'stack: bottom ( top','Remember the opening bracket.'),f(4,'Open inner bracket',['(','['],[1],'stack: bottom ( [ top','The inner bracket must close first.'),f(5,'Close ] and pop [',['('],[0],'stack: (','The expected opener matches the top.'),f(7,'Close ) and finish',[],[],'stack: empty · true','No opening brackets remain. Compare ([)] as a failure case.')],hinglish:'Sabse last jo pending kaam aaya, wahi pehle resolve hoga: LIFO.'
 },
 'Breadth-first search':{
  why:'BFS explores distance layers. In an unweighted graph, the first time you discover a node gives the fewest edges from the start.',
  when:'Use it for minimum hops, nearest reachable grid cells with equal move cost, or tree level order.',
  avoid:'Unequal edge costs need another strategy, such as Dijkstra for nonnegative weights. For reachability alone, DFS can also work.',
  baseline:'Enumerating every path can explode in size and revisit cycles. BFS processes each reachable vertex and edge once: O(V+E) time and O(V) space.',
  realLife:'Ask your direct friends first, then their friends, to find the fewest introductions to someone. Finish one friendship-distance layer before moving further.',
  invariant:'The queue is ordered by nondecreasing distance. Mark visited when enqueuing so the same node cannot be scheduled repeatedly.',
  methods:[{name:'queue.push([node, distance])',use:'Append a newly discovered node.',example:'queue.push([next, distance + 1]);'},{name:'queue[head++]',use:'Read FIFO order without repeatedly shifting a JS array.',example:'const [node, distance] = queue[head++];'},{name:'visited.has / add',use:'Prevent cycles and duplicate scheduling.',example:'visited.add(next);'},{name:'graph[node] ?? []',use:'Read neighbors, including nodes with no outgoing edges.',example:'for (const next of graph[node] ?? []) { /* visit */ }'}],
  questions:['Shortest path in an unweighted graph','Binary tree level order','Nearest exit in a maze','Rotting oranges (multi-source BFS)'],
  example:'A → B,C; B → D; C → E; E → D. Minimum edges from A to D?',
  code:`function fewestHops(graph, start, goal) {
  const queue = [[start, 0]], seen = new Set([start]);
  let head = 0;
  while (head < queue.length) {
    const [node, distance] = queue[head++];
    if (node === goal) return distance;
    for (const next of graph[node] ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([next, distance + 1]);
      }
    }
  }
  return -1;
}`,
  output:'2',frames:[f(2,'Start at A',['A:0'],[0],'visited={A} · pending queue shown','Distance starts at zero.'),f(10,'Expand A',['B:1','C:1'],[0,1],'visited={A,B,C}','Both neighbors are one edge away.'),f(10,'Expand B',['C:1','D:2'],[1],'visited={A,B,C,D}','D is queued behind every distance-1 node.'),f(10,'Expand C',['D:2','E:2'],[1],'visited={A,B,C,D,E}','C adds E, also at distance 2.'),f(6,'Dequeue D',['D:2','E:2'],[0],'return 2','No shorter path can appear after this distance layer.')],hinglish:'Pehle ek step door wale nodes, phir do step door wale. Equal cost ho tab shortest path milta hai.'
 },
 'Binary search':{
  why:'An ordered comparison can discard half the candidates in one step, making large search spaces manageable.',
  when:'Use it on a sorted random-access array or a monotonic yes/no condition, such as the first failing version with no later recovery.',
  avoid:'Do not apply it to unsorted values or a predicate that flips back and forth. Linked-list middle access is not constant time.',
  baseline:'Linear scan checks up to n values. Binary search uses O(log n) comparisons and O(1) extra space; sorting an unsorted input first has its own cost.',
  realLife:'Guess a number from 1 to 100. A reliable “higher” or “lower” answer lets you eliminate half the remaining range.',
  invariant:'If the target exists, it remains inside inclusive [lo, hi]. Every miss removes mid so the range strictly shrinks.',
  methods:[{name:'Math.floor((hi-lo)/2)',use:'Compute the offset to the middle candidate.',example:'const mid = lo + Math.floor((hi-lo)/2);'},{name:'lo = mid + 1',use:'Discard the lower half when mid is too small.',example:'if (nums[mid] < target) lo = mid + 1;'},{name:'hi = mid - 1',use:'Discard the upper half when mid is too large.',example:'else hi = mid - 1;'},{name:'while (lo <= hi)',use:'Include the last single candidate in an inclusive interval.',example:'while (lo <= hi) { /* compare */ }'}],
  questions:['Binary Search','Search Insert Position (lower bound)','First Bad Version','Minimum feasible capacity with a monotonic predicate'],
  example:'nums = [1, 3, 5, 7, 9], target = 7. Return its index.',
  code:`function binarySearch(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi-lo)/2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
  output:'3',frames:[f(2,'Keep all candidates',['1','3','5','7','9'],[0,1,2,3,4],'lo=0 · hi=4','Sorted order permits elimination.'),f(4,'Inspect the midpoint',['1','3','5','7','9'],[2],'mid=2 · value=5','5 is smaller than 7.'),f(6,'Discard indices 0–2',['1','3','5','7','9'],[3,4],'lo=3 · hi=4','All values at or before mid are too small.'),f(5,'Inspect index 3',['1','3','5','7','9'],[3],'mid=3 · return 3','Always return the index the contract asks for.')],hinglish:'Har comparison mein aadha search area hata sakte ho? Sorted order ya monotonic condition prove karo.'
 },
 'Prefix sums':{
  why:'A cumulative total lets overlapping range queries reuse previous work. Subtract two totals to isolate the middle range.',
  when:'Use it for many static range sums, left/right balance, or target-sum subarrays combined with a frequency Map.',
  avoid:'For one range, a direct scan may be simpler. Frequent updates can make rebuilding expensive; consider a Fenwick tree or segment tree.',
  baseline:'q range queries can take O(qn) by scanning. Prefix sums take O(n) preprocessing, O(1) per query and O(n) extra space.',
  realLife:'A meter records total water consumed. Usage between two readings equals the later reading minus the earlier reading.',
  invariant:'prefix[i] is the sum of elements before index i. Therefore sum of [left, right) is prefix[right] - prefix[left].',
  methods:[{name:'Array(n+1).fill(0)',use:'Reserve a leading zero so ranges starting at zero work naturally.',example:'const prefix = Array(nums.length + 1).fill(0);'},{name:'prefix[i+1] = prefix[i] + nums[i]',use:'Extend the cumulative total by one input value.',example:'prefix[2] = prefix[1] + nums[1];'},{name:'prefix[right] - prefix[left]',use:'Answer a half-open range query.',example:'prefix[3] - prefix[1] // 5 - 2 = 3'},{name:'Map of prefix frequencies',use:'Count target-sum subarrays, including negatives.',example:'count += frequency.get(sum - target) ?? 0;'}],
  questions:['Range Sum Query — Immutable','Find Pivot Index','Subarray Sum Equals K','2D rectangle sums with a summed-area table'],
  example:'nums = [2, -1, 4]. Sum indices [1, 3): include -1 and 4, exclude index 3.',
  code:`function rangeSum(nums, left, right) {
  const prefix = Array(nums.length + 1).fill(0);
  for (let i = 0; i < nums.length; i++) {
    prefix[i+1] = prefix[i] + nums[i];
  }
  return prefix[right] - prefix[left];
}`,
  output:'3',frames:[f(2,'Include an empty prefix',['0','0','0','0'],[0],'prefix slots 0..3','Zero elements sum to zero.'),f(4,'Consume 2',['0','2','0','0'],[1],'prefix[1]=0+2','Slot 1 includes input index 0.'),f(4,'Consume -1',['0','2','1','0'],[2],'prefix[2]=2-1','Negative values are allowed.'),f(4,'Consume 4',['0','2','1','5'],[3],'prefix[3]=1+4','All cumulative totals are now ready.'),f(6,'Subtract the earlier prefix',['0','2','1','5'],[1,3],'5 - 2 = 3','For many queries, build this prefix array once and reuse it.')],hinglish:'Shuru se total save karo. Beech ka sum chahiye toh do prefix totals ka difference lo.'
 }
};
