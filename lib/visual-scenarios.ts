/** Bounded, deterministic lessons. Expected outputs are authored literals, not generated answers. */
export type ScenarioFrame = {
  title: string;
  detail: string;
  values: number[];
  active: number[];
  variables: Record<string, string | number>;
  result?: unknown;
};
export type VisualScenario = {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  input: { nums: number[]; target?: number; window?: number };
  /** Complete answer contract; safe to show before a prediction. */
  prompt: string;
  expected: unknown;
  explanation: string;
  hints: string[];
  code: string;
  complexity: string;
  frames: ScenarioFrame[];
};
export const visualScenarioVersion = '1';
type Input = VisualScenario['input'];
type Trace = (input: Input) => ScenarioFrame[];
type Case = { title: string; nums: number[]; target?: number; window?: number; expected: unknown; why: string };
type Family = { id: string; topic: string; difficulty: VisualScenario['difficulty']; prompt: string; hints: string[]; code: string; complexity: string; trace: Trace; cases: Case[] };
function frame(values: number[], title: string, detail: string, active: number[] = [], variables: ScenarioFrame['variables'] = {}, result?: unknown): ScenarioFrame {
  return { title, detail, values: [...values], active: [...active], variables: { ...variables }, ...(result !== undefined ? { result } : {}) };
}
function finish(frames: ScenarioFrame[], nums: number[], result: unknown, detail: string) {
  frames.push(frame(nums, 'Return the result', detail, [], {}, result));
  return frames;
}
const mapText = (map: Map<number, number>) => JSON.stringify([...map]);

const twoSumTrace: Trace = ({ nums, target = 0 }) => {
  const seen = new Map<number, number>();
  const frames = [frame(nums, 'Start with an empty map', 'Store the earliest index for each value only after checking its complement.', [], { target, seen: '[]' })];
  for (let i = 0; i < nums.length; i++) {
    const needed = target - nums[i];
    frames.push(frame(nums, `Check index ${i}`, `${target} − ${nums[i]} = ${needed}. Look for this complement among earlier positions.`, [i], { i, needed, seen: mapText(seen) }));
    if (seen.has(needed)) return finish(frames, nums, [seen.get(needed)!, i], `Earlier index ${seen.get(needed)} and current index ${i} are distinct and reach the target.`);
    if (!seen.has(nums[i])) seen.set(nums[i], i);
    frames.push(frame(nums, 'Remember the earliest index', 'Keep an existing index for duplicate values so ties use the earliest left position.', [i], { seen: mapText(seen) }));
  }
  return finish(frames, nums, [], 'No complement was present at an earlier index. Return an empty array.');
};
const binaryTrace: Trace = ({ nums, target = 0 }) => {
  let lo = 0, hi = nums.length - 1;
  const frames = [frame(nums, 'Search the sorted array', 'Use an inclusive interval and the floor midpoint. An empty interval means absence.', [], { lo, hi, target })];
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    frames.push(frame(nums, `Inspect midpoint ${mid}`, nums[mid] === target ? 'The midpoint matches. Return immediately, even if another duplicate exists.' : nums[mid] < target ? 'Midpoint is smaller: every position through mid can be discarded.' : 'Midpoint is larger: every position from mid onward can be discarded.', [mid], { lo, hi, mid, value: nums[mid] }));
    if (nums[mid] === target) return finish(frames, nums, mid, `The floor-midpoint search found the target at index ${mid}.`);
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return finish(frames, nums, -1, 'The candidate interval is empty. The target is not present.');
};
const lowerTrace: Trace = ({ nums, target = 0 }) => {
  let lo = 0, hi = nums.length;
  const frames = [frame(nums, 'Find the first value ≥ target', 'Keep a half-open candidate interval [lo, hi). The answer may be the length of the array.', [], { lo, hi, target })];
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    frames.push(frame(nums, `Check boundary at ${mid}`, nums[mid] < target ? 'This value is too small, so advance lo past it.' : 'This value qualifies; keep it as a possible answer by moving hi to mid.', [mid], { lo, hi, mid, value: nums[mid] }));
    if (nums[mid] < target) lo = mid + 1; else hi = mid;
  }
  return finish(frames, nums, lo, lo === nums.length ? 'Every value is smaller. Insert at the end.' : `Index ${lo} is the first qualifying position, including the first duplicate if equal.`);
};
const linearTrace: Trace = ({ nums, target = 0 }) => {
  const frames = [frame(nums, 'Scan from left to right', 'No sorted order is required. Stop at the first exact match.', [], { target })];
  for (let i = 0; i < nums.length; i++) {
    frames.push(frame(nums, `Compare index ${i}`, nums[i] === target ? 'The value matches; no later position can be an earlier match.' : `${nums[i]} does not match ${target}. Continue.`, [i], { i, value: nums[i] }));
    if (nums[i] === target) return finish(frames, nums, i, `Return the first matching index, ${i}.`);
  }
  return finish(frames, nums, -1, 'No position matches. Return -1.');
};
const maxTrace: Trace = ({ nums }) => {
  const frames = [frame(nums, 'Choose a nonempty contiguous segment', 'At each index, extend the current segment or start a new one. Equal sums keep the earlier start.', [], {})];
  if (!nums.length) return finish(frames, nums, null, 'An empty array has no nonempty segment. Return null.');
  let sum = nums[0], start = 0, best = { sum, start: 0, end: 0 };
  frames.push(frame(nums, 'Initialize from the first element', 'Using the first element rather than zero handles all-negative arrays.', [0], { sum, start, best: JSON.stringify(best) }));
  for (let i = 1; i < nums.length; i++) {
    const restart = nums[i] > sum + nums[i];
    if (restart) { sum = nums[i]; start = i; } else sum += nums[i];
    if (sum > best.sum) best = { sum, start, end: i };
    frames.push(frame(nums, `Best segment ending at ${i}`, restart ? 'The previous running sum was negative. Restart here.' : 'Extend the previous segment; it is at least as good as restarting.', Array.from({ length: i - start + 1 }, (_, j) => start + j), { sum, start, end: i, best: JSON.stringify(best) }));
  }
  return finish(frames, nums, best, 'Return the best sum with inclusive start/end indices. Equal global sums retain the earliest start, then earliest end.');
};
const prefixTrace: Trace = ({ nums }) => {
  const prefix = [0];
  const frames = [frame(nums, 'Use a zero sentinel', 'prefix[0] = 0; prefix[i + 1] is the sum of the first i + 1 elements.', [], { prefix: '[0]' })];
  nums.forEach((value, i) => {
    prefix.push(prefix[i] + value);
    frames.push(frame(nums, `Append prefix[${i + 1}]`, `${prefix[i]} + ${value} = ${prefix[i + 1]}.`, [i], { prefix: JSON.stringify(prefix) }));
  });
  return finish(frames, nums, prefix, 'A half-open range [left, right) can now be summed as prefix[right] − prefix[left].');
};
const frequencyTrace: Trace = ({ nums }) => {
  const counts = new Map<number, number>();
  const frames = [frame(nums, 'Count in first-seen order', 'Map insertion order fixes the order of [value, count] pairs.', [], { counts: '[]' })];
  nums.forEach((value, i) => {
    const previous = counts.get(value) ?? 0;
    counts.set(value, previous + 1);
    frames.push(frame(nums, `Count value ${value}`, `Previous count ${previous}; new count ${previous + 1}.`, [i], { counts: mapText(counts) }));
  });
  return finish(frames, nums, [...counts], 'Return [value, count] pairs in the order values first appeared, not sorted numeric order.');
};
const uniqueTrace: Trace = ({ nums }) => {
  const seen = new Set<number>(), unique: number[] = [];
  const frames = [frame(nums, 'Keep the first occurrence', 'Track membership in a Set and append a value only once.', [], { seen: '[]', unique: '[]' })];
  nums.forEach((value, i) => {
    const duplicate = seen.has(value);
    if (!duplicate) { seen.add(value); unique.push(value); }
    frames.push(frame(nums, duplicate ? `Skip duplicate ${value}` : `Keep new value ${value}`, duplicate ? 'Membership was already true; preserve the first occurrence.' : 'Add the value to both membership and output.', [i], { seen: JSON.stringify([...seen]), unique: JSON.stringify(unique) }));
  });
  return finish(frames, nums, unique, 'The output keeps original encounter order and contains each numeric value once.');
};
const bubbleTrace: Trace = ({ nums }) => {
  const values = [...nums];
  const frames = [frame(values, 'Sort a copy of the input', 'Swap adjacent values only when the left is strictly greater. Equal values remain in their original relative order.', [], {})];
  for (let end = values.length - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      const left = values[i], right = values[i + 1];
      const exchange = left > right;
      if (exchange) { [values[i], values[i + 1]] = [right, left]; swapped = true; }
      frames.push(frame(values, exchange ? `Swap positions ${i} and ${i + 1}` : `Keep positions ${i} and ${i + 1}`, exchange ? `${left} > ${right}, so exchange the adjacent values.` : `${left} ≤ ${right}, so their order is already correct.`, [i, i + 1], { unsortedEnd: end, swappedThisPass: String(swapped) }));
    }
    if (!swapped) { frames.push(frame(values, 'Stop early', 'A complete pass made no swaps, so the whole remaining range is sorted.')); break; }
  }
  return finish(frames, values, values, 'Return the ascending sorted copy. The original input is unchanged.');
};
const windowTrace: Trace = ({ nums, window: width = 0 }) => {
  const frames = [frame(nums, 'Find the best fixed-width segment', 'Only contiguous windows of exactly k elements qualify. Ties keep the earliest start.', [], { k: width })];
  if (!Number.isInteger(width) || width < 1 || width > nums.length) return finish(frames, nums, null, 'k must be an integer between 1 and the array length. This input has no valid window.');
  let sum = 0;
  for (let i = 0; i < width; i++) sum += nums[i];
  let best = { sum, start: 0, end: width - 1 };
  frames.push(frame(nums, 'Load the first window', 'Add the first k elements once.', Array.from({ length: width }, (_, i) => i), { sum, best: JSON.stringify(best) }));
  for (let right = width; right < nums.length; right++) {
    const leaving = nums[right - width], entering = nums[right];
    sum += entering - leaving;
    const start = right - width + 1;
    if (sum > best.sum) best = { sum, start, end: right };
    frames.push(frame(nums, `Slide to indices ${start}–${right}`, `Remove ${leaving}, add ${entering}; sum becomes ${sum}.`, Array.from({ length: width }, (_, j) => start + j), { leaving, entering, sum, best: JSON.stringify(best) }));
  }
  return finish(frames, nums, best, 'Return the maximum sum with inclusive window indices; only a strictly better sum replaces an earlier window.');
};

const families: Family[] = [
  {
    id: 'two-sum', topic: 'Two Sum · hash map', difficulty: 'Easy',
    prompt: 'Return two distinct zero-based indices [i, j] whose values sum to target, with i < j. Scan j from left to right and return the first valid j; for that j use the earliest matching i. Return [] if no pair exists. Do not sort the input or reuse the same position.',
    hints: ['For the current value, which earlier value would complete the target?', 'Look up target − nums[j] before inserting nums[j].', 'Store only the earliest index of a value; return as soon as its complement is present.'],
    complexity: 'Expected O(n) time with hash-map operations; O(n) extra space.',
    code: `function solve(nums, target) {
  const seen = new Map();
  for (let j = 0; j < nums.length; j++) {
    const needed = target - nums[j];
    if (seen.has(needed)) return [seen.get(needed), j];
    if (!seen.has(nums[j])) seen.set(nums[j], j);
  }
  return [];
}`, trace: twoSumTrace,
    cases: [
      { title: 'Two purchases reach a budget', nums: [2, 7, 11, 15], target: 9, expected: [0, 1], why: 'The second purchase sees the earlier value 2; there is no reason to inspect later prices.' },
      { title: 'Equal values at different positions', nums: [3, 3], target: 6, expected: [0, 1], why: 'Two equal values are allowed because they occupy distinct positions. Lookup happens before insertion.' },
      { title: 'One value cannot be used twice', nums: [3], target: 6, expected: [], why: 'The only value is half the target, but one position cannot form a pair with itself.' },
      { title: 'A refund balances a charge', nums: [-3, 4, 3, 90], target: 0, expected: [0, 2], why: 'Negative values work with exactly the same complement equation: 0 − 3 = -3.' },
      { title: 'Keep index zero in the map', nums: [0, 4, 0], target: 0, expected: [0, 2], why: 'Map.has distinguishes a stored index of zero from absence; truthiness would lose this pair.' },
      { title: 'Several pairs: earliest right endpoint', nums: [1, 4, 2, 3], target: 5, expected: [0, 1], why: 'Although 2 + 3 also works, the first completed pair is 1 + 4 at right endpoint 1.' },
      { title: 'Repeated complement keeps earliest index', nums: [2, 2, 7], target: 9, expected: [0, 2], why: 'The map retains the first 2 at index 0, as required by the tie rule.' },
      { title: 'No affordable pair', nums: [1, 2, 4, 8], target: 20, expected: [], why: 'Every needed complement is absent, so the scan finishes without a pair.' },
      { title: 'Unsorted prices preserve original indices', nums: [8, 1, 6, 4], target: 10, expected: [2, 3], why: 'The value 4 completes the earlier 6. Sorting would change the requested positions.' },
      { title: 'Empty cart', nums: [], target: 12, expected: [], why: 'An empty input has no distinct positions and returns an empty pair without a lookup.' },
    ],
  },
  {
    id: 'binary-search', topic: 'Binary search · exact match', difficulty: 'Easy',
    prompt: 'nums is sorted ascending. Return the zero-based index found by binary search with inclusive bounds lo = 0, hi = n − 1 and mid = floor((lo + hi) / 2). Return immediately on equality; this need not be the first duplicate. On a smaller midpoint set lo = mid + 1; otherwise set hi = mid − 1. Return -1 if absent.',
    hints: ['Sorted order lets you discard half the remaining positions.', 'Use inclusive bounds and always move past a midpoint that does not match.', 'For duplicate values follow the specified midpoint rule rather than assuming the first occurrence.'],
    complexity: 'O(log n) time; O(1) extra space for the algorithm (visual frames are separate).',
    code: `function solve(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`, trace: binaryTrace,
    cases: [
      { title: 'Find the middle inventory ID', nums: [1, 3, 5, 7, 9], target: 5, expected: 2, why: 'The initial floor midpoint is index 2 and already matches.' },
      { title: 'Search all the way left', nums: [2, 4, 6, 8, 10], target: 2, expected: 0, why: 'The first midpoint is too large, so the next interval contains the first item.' },
      { title: 'Search all the way right', nums: [2, 4, 6, 8, 10], target: 10, expected: 4, why: 'Two smaller midpoints move lo to the final index.' },
      { title: 'Missing value between IDs', nums: [1, 3, 5, 7], target: 4, expected: -1, why: 'The search narrows to adjacent boundaries without finding equality.' },
      { title: 'Target below the minimum', nums: [10, 20, 30], target: 1, expected: -1, why: 'Moving hi left eventually makes it smaller than lo.' },
      { title: 'Target above the maximum', nums: [10, 20, 30], target: 99, expected: -1, why: 'Moving lo right eventually produces an empty interval.' },
      { title: 'Single matching record', nums: [42], target: 42, expected: 0, why: 'An inclusive interval of one element is still inspected.' },
      { title: 'No records to search', nums: [], target: 42, expected: -1, why: 'hi starts at -1, so the loop never runs.' },
      { title: 'Duplicate IDs follow midpoint semantics', nums: [1, 2, 2, 2, 3], target: 2, expected: 2, why: 'The initial midpoint matches at index 2; exact-match binary search does not promise the first 2.' },
      { title: 'Negative sorted measurements', nums: [-9, -4, 0, 5], target: -4, expected: 1, why: 'The midpoint formula depends on indices, so negative values do not need special handling.' },
    ],
  },
  {
    id: 'lower-bound', topic: 'Binary search · lower bound', difficulty: 'Medium',
    prompt: 'nums is sorted ascending. Return the first zero-based index i such that nums[i] >= target. Return nums.length if every value is smaller. This is the insertion position before equal values; for an empty array return 0.',
    hints: ['Search for the boundary between values < target and values >= target.', 'Use [lo, hi) with hi initialized to the array length.', 'If nums[mid] qualifies, keep mid by setting hi = mid; do not return immediately.'],
    complexity: 'O(log n) time; O(1) extra algorithm space.',
    code: `function solve(nums, target) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}`, trace: lowerTrace,
    cases: [
      { title: 'Insert a new price between tiers', nums: [10, 20, 40], target: 30, expected: 2, why: '40 is the first qualifying value, so insert before it at index 2.' },
      { title: 'Find the first repeated score', nums: [1, 2, 2, 2, 5], target: 2, expected: 1, why: 'A qualifying midpoint moves hi left until the earliest equal value remains.' },
      { title: 'Insert before every value', nums: [3, 6, 9], target: -1, expected: 0, why: 'Every element qualifies; the leftmost boundary is zero.' },
      { title: 'Append after every value', nums: [3, 6, 9], target: 12, expected: 3, why: 'No value qualifies, so the valid insertion position is the length, 3.' },
      { title: 'The empty insertion position', nums: [], target: 5, expected: 0, why: 'lo and hi both start at zero; the only insertion position is zero.' },
      { title: 'All scores are equal', nums: [7, 7, 7, 7], target: 7, expected: 0, why: 'Equality keeps searching toward the left instead of stopping at a midpoint.' },
      { title: 'Threshold after equal scores', nums: [7, 7, 7], target: 8, expected: 3, why: 'Each value is below the threshold, so the boundary falls after the array.' },
      { title: 'Negative temperature threshold', nums: [-8, -3, -3, 0, 2], target: -3, expected: 1, why: 'The first -3 begins the qualifying suffix.' },
      { title: 'A one-record matching threshold', nums: [4], target: 4, expected: 0, why: 'The single element is at least the target, so index zero qualifies.' },
      { title: 'A gap after repeated values', nums: [0, 0, 3, 3, 8], target: 4, expected: 4, why: 'All zeros and threes are too small; the first qualifying value is 8.' },
    ],
  },
  {
    id: 'linear-search', topic: 'Linear search · first match', difficulty: 'Easy',
    prompt: 'Return the first zero-based index where nums[i] exactly equals target. nums may be unsorted. Scan left to right and return -1 if target is absent, including when the array is empty.',
    hints: ['No ordering guarantee means a later value cannot eliminate earlier candidates.', 'Inspect each position in order and return as soon as it matches.', 'Return -1 only after every position has been checked.'],
    complexity: 'O(n) worst-case time; O(1) extra algorithm space.',
    code: `function solve(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}`, trace: linearTrace,
    cases: [
      { title: 'First item is the requested ticket', nums: [91, 20, 44], target: 91, expected: 0, why: 'The first comparison succeeds, so the algorithm returns immediately.' },
      { title: 'Find an unsorted middle ticket', nums: [91, 20, 44, 8], target: 44, expected: 2, why: 'Two mismatches precede the value 44 at index 2.' },
      { title: 'The final queued job', nums: [4, 8, 2, 9], target: 9, expected: 3, why: 'Every earlier position must be checked before reaching the final match.' },
      { title: 'A ticket that is not present', nums: [4, 8, 2], target: 7, expected: -1, why: 'All comparisons fail; absence is known only after the complete scan.' },
      { title: 'Repeated jobs return the first one', nums: [6, 2, 6, 6], target: 6, expected: 0, why: 'The contract asks for the first occurrence, not the count or final occurrence.' },
      { title: 'Zero is a searchable value', nums: [5, 0, -1], target: 0, expected: 1, why: 'Exact equality finds zero normally; the target need not be truthy.' },
      { title: 'Negative ID in an unsorted list', nums: [5, -2, 3, -7], target: -7, expected: 3, why: 'Numeric equality works for negative values without sorting.' },
      { title: 'An empty queue', nums: [], target: 0, expected: -1, why: 'The loop has no positions to inspect.' },
      { title: 'Single nonmatching record', nums: [12], target: 11, expected: -1, why: 'One failed comparison exhausts the only candidate.' },
      { title: 'Duplicates after an initial mismatch', nums: [9, 4, 4, 4, 1], target: 4, expected: 1, why: 'The first 4 is at index 1; later duplicates never need inspection.' },
    ],
  },
  {
    id: 'max-subarray', topic: 'Kadane · maximum subarray', difficulty: 'Medium',
    prompt: 'Find the nonempty contiguous subarray with maximum sum. Return {"sum": number, "start": zero-based inclusive index, "end": zero-based inclusive index}. If sums tie, choose the earliest start, then the earliest end. Return null for an empty array. A nonempty all-negative array must still choose at least one element.',
    hints: ['Track the best segment that ends exactly at the current position.', 'A negative running sum makes restarting strictly better; on a tie preserve the earlier start.', 'Initialize with the first value, and update the global answer only for a strictly larger sum.'],
    complexity: 'O(n) time; O(1) extra algorithm space.',
    code: `function solve(nums) {
  if (nums.length === 0) return null;
  let sum = nums[0], start = 0;
  let best = { sum, start: 0, end: 0 };
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > sum + nums[i]) { sum = nums[i]; start = i; }
    else sum += nums[i];
    if (sum > best.sum) best = { sum, start, end: i };
  }
  return best;
}`, trace: maxTrace,
    cases: [
      { title: 'Recover after an early loss', nums: [-2, 1, -3, 4, -1, 2, 1, -5], expected: { sum: 6, start: 3, end: 6 }, why: 'The segment [4, -1, 2, 1] totals 6; earlier negative running totals are discarded.' },
      { title: 'All days lose money', nums: [-5, -2, -8], expected: { sum: -2, start: 1, end: 1 }, why: 'A nonempty answer is required, so choose the least negative day instead of an empty segment of zero.' },
      { title: 'Every day is profitable', nums: [2, 3, 1, 4], expected: { sum: 10, start: 0, end: 3 }, why: 'Every positive value extends the best segment, so the whole array is optimal.' },
      { title: 'Equal best periods choose the earliest', nums: [1, -1, 1], expected: { sum: 1, start: 0, end: 0 }, why: 'Several segments total 1. Earliest start is zero, and among those the earliest end is zero.' },
      { title: 'Zero prefix keeps its earlier start', nums: [0, 2, -1], expected: { sum: 2, start: 0, end: 1 }, why: '[0, 2] and [2] have the same sum; the contract prefers start zero.' },
      { title: 'Only one measurement', nums: [8], expected: { sum: 8, start: 0, end: 0 }, why: 'The initial one-element segment is already the complete answer.' },
      { title: 'No measurements', nums: [], expected: null, why: 'There is no nonempty contiguous segment in an empty input.' },
      { title: 'A large loss splits the best run', nums: [5, -10, 6, 7], expected: { sum: 13, start: 2, end: 3 }, why: 'The -10 makes carrying the earlier segment harmful; restarting at 6 gives 13.' },
      { title: 'All zeroes use the earliest short segment', nums: [0, 0, 0], expected: { sum: 0, start: 0, end: 0 }, why: 'Every segment ties, so the earliest start and earliest end select the first zero.' },
      { title: 'A small dip is worth keeping', nums: [4, -1, 3, -2, 2], expected: { sum: 6, start: 0, end: 2 }, why: 'The first three values total 6. Extending through the final two ties but has a later end.' },
    ],
  },
  {
    id: 'prefix-sums', topic: 'Prefix sums · cumulative totals', difficulty: 'Easy',
    prompt: 'Return an array prefix of length nums.length + 1 with prefix[0] = 0 and prefix[i + 1] = prefix[i] + nums[i]. Include the initial zero even for an empty input. Values are integers, and negative values are allowed.',
    hints: ['Start the result with the empty-prefix sum, zero.', 'Append one running total for each input value.', 'The sentinel makes the sum of [left, right) equal prefix[right] − prefix[left].'],
    complexity: 'O(n) time; O(n) output space and O(1) additional working space.',
    code: `function solve(nums) {
  const prefix = [0];
  for (let i = 0; i < nums.length; i++) {
    prefix.push(prefix[i] + nums[i]);
  }
  return prefix;
}`, trace: prefixTrace,
    cases: [
      { title: 'Cumulative daily signups', nums: [2, 4, 1, 3], expected: [0, 2, 6, 7, 10], why: 'Each appended entry includes one additional day of signups.' },
      { title: 'Account deposits and withdrawals', nums: [10, -3, 5, -2], expected: [0, 10, 7, 12, 10], why: 'Withdrawals reduce the cumulative sum; prefix sums need not be increasing.' },
      { title: 'Zero traffic days', nums: [0, 0, 5, 0], expected: [0, 0, 0, 5, 5], why: 'Zero values repeat the previous total without changing the required output length.' },
      { title: 'Only withdrawals', nums: [-1, -2, -3], expected: [0, -1, -3, -6], why: 'Negative totals accumulate normally from the zero sentinel.' },
      { title: 'An empty reporting period', nums: [], expected: [0], why: 'The empty prefix still exists, so the output contains one zero.' },
      { title: 'One transaction', nums: [9], expected: [0, 9], why: 'The output contains the empty-prefix total and the one-transaction total.' },
      { title: 'Changes cancel each other', nums: [3, -3, 3, -3], expected: [0, 3, 0, 3, 0], why: 'Every negative change cancels the immediately preceding positive change.' },
      { title: 'Repeated unit events', nums: [1, 1, 1, 1, 1], expected: [0, 1, 2, 3, 4, 5], why: 'Each unit event increases the total by exactly one.' },
      { title: 'Large bounded counters', nums: [1000, 2000, -500], expected: [0, 1000, 3000, 2500], why: 'The same recurrence applies to larger integer values within the safe numeric range.' },
      { title: 'Recover from a negative balance', nums: [-5, 2, 3, 4], expected: [0, -5, -3, 0, 4], why: 'Cumulative totals first rise to zero and then become positive.' },
    ],
  },
  {
    id: 'frequencies', topic: 'Hash map · frequency counts', difficulty: 'Easy',
    prompt: 'Count each numeric value in nums. Return an array of [value, count] pairs in the order each distinct value first appeared. Do not sort the pairs. Return [] for an empty input.',
    hints: ['Use one map entry per distinct value.', 'The next count is (existing count ?? 0) + 1.', 'Map preserves insertion order when an existing value is updated.'],
    complexity: 'Expected O(n) time; O(u) space for u distinct values, including output.',
    code: `function solve(nums) {
  const counts = new Map();
  for (const value of nums) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts];
}`, trace: frequencyTrace,
    cases: [
      { title: 'Count repeated response codes', nums: [200, 404, 200, 500, 404], expected: [[200, 2], [404, 2], [500, 1]], why: 'The pair order follows first encounters: 200, then 404, then 500.' },
      { title: 'Every request has the same status', nums: [2, 2, 2, 2], expected: [[2, 4]], why: 'Four visits update the same map entry instead of adding four pairs.' },
      { title: 'Every value is new', nums: [8, 3, 6], expected: [[8, 1], [3, 1], [6, 1]], why: 'All counts remain one; the output is not numerically sorted.' },
      { title: 'Zero and negative events', nums: [0, -1, 0, -1, -2], expected: [[0, 2], [-1, 2], [-2, 1]], why: 'Numeric keys can be zero or negative; membership does not depend on truthiness.' },
      { title: 'No events', nums: [], expected: [], why: 'No map entries are created, so the result is empty.' },
      { title: 'One event', nums: [7], expected: [[7, 1]], why: 'The first occurrence changes a missing count to one.' },
      { title: 'Alternating events', nums: [1, 2, 1, 2, 1], expected: [[1, 3], [2, 2]], why: 'Updating counts does not move keys out of their insertion positions.' },
      { title: 'A late event becomes most common', nums: [9, 1, 1, 1, 9, 1], expected: [[9, 2], [1, 4]], why: 'Frequency does not determine pair order; 9 remains first because it appeared first.' },
      { title: 'Several values tie in frequency', nums: [4, 5, 6, 4, 5, 6], expected: [[4, 2], [5, 2], [6, 2]], why: 'All three counts are two, and first-seen order resolves the output ordering.' },
      { title: 'Repeated zero-valued readings', nums: [0, 0, 0], expected: [[0, 3]], why: 'Zero is a real key, not a marker for an absent reading.' },
    ],
  },
  {
    id: 'unique-values', topic: 'Set · stable deduplication', difficulty: 'Easy',
    prompt: 'Return each distinct numeric value from nums exactly once, preserving the order of its first occurrence. Do not sort. Return [] for an empty input; zero and negative values are ordinary numeric values.',
    hints: ['You need membership information, not an occurrence count.', 'Check Set.has(value) before appending a value to the result.', 'A seen value is skipped, so its first position controls output order.'],
    complexity: 'Expected O(n) time; O(u) space for u unique values, including output.',
    code: `function solve(nums) {
  const seen = new Set(), unique = [];
  for (const value of nums) {
    if (!seen.has(value)) { seen.add(value); unique.push(value); }
  }
  return unique;
}`, trace: uniqueTrace,
    cases: [
      { title: 'Deduplicate viewed product IDs', nums: [4, 2, 4, 3, 2], expected: [4, 2, 3], why: 'The first visits were product 4, then 2, then 3; later views are discarded.' },
      { title: 'Repeated visits to one page', nums: [9, 9, 9], expected: [9], why: 'Only the first 9 is appended; subsequent membership checks succeed.' },
      { title: 'Already unique identifiers', nums: [7, 1, 8, 3], expected: [7, 1, 8, 3], why: 'Every membership check is initially false, so input order remains unchanged.' },
      { title: 'Deduplicate zero and negative values', nums: [0, -2, 0, -2, 5], expected: [0, -2, 5], why: 'Set membership works for zero and negative numbers without special cases.' },
      { title: 'An empty activity stream', nums: [], expected: [], why: 'No values are appended.' },
      { title: 'A single activity', nums: [6], expected: [6], why: 'The only value is new and is preserved.' },
      { title: 'Duplicates occur far apart', nums: [1, 2, 3, 4, 1, 2], expected: [1, 2, 3, 4], why: 'The set remembers earlier values even when repeats are not adjacent.' },
      { title: 'Do not sort descending IDs', nums: [5, 4, 3, 5, 2, 4], expected: [5, 4, 3, 2], why: 'Stable deduplication preserves encounter order, not ascending order.' },
      { title: 'Alternating repeated signals', nums: [-1, 1, -1, 1, -1], expected: [-1, 1], why: 'Only the first negative and first positive signal are retained.' },
      { title: 'A new value arrives at the end', nums: [2, 2, 2, 7], expected: [2, 7], why: 'The final 7 has never been seen, so it is appended after 2.' },
    ],
  },
  {
    id: 'bubble-sort', topic: 'Bubble sort · adjacent swaps', difficulty: 'Easy',
    prompt: 'Return an ascending sorted copy of nums. Use adjacent swaps when left > right, leave equal neighbors unchanged, and stop after a full pass with no swaps. Preserve every duplicate and do not mutate the supplied input. Empty input returns [].',
    hints: ['Each left-to-right pass pushes the largest remaining value to the right edge.', 'The final position of each completed pass no longer needs inspection.', 'A pass with no exchanges proves the remaining interval is sorted.'],
    complexity: 'O(n²) worst-case time, O(n) best-case time with early stop; O(n) space for the copied output.',
    code: `function solve(nums) {
  const values = [...nums];
  for (let end = values.length - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      if (values[i] > values[i + 1]) {
        [values[i], values[i + 1]] = [values[i + 1], values[i]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return values;
}`, trace: bubbleTrace,
    cases: [
      { title: 'Sort a short unsorted queue', nums: [4, 1, 3, 2], expected: [1, 2, 3, 4], why: 'Adjacent exchanges move 4 to the right, then repair the smaller remaining range.' },
      { title: 'Already ordered: stop early', nums: [1, 2, 3, 4], expected: [1, 2, 3, 4], why: 'The first complete pass makes no swaps, so later passes are unnecessary.' },
      { title: 'Reverse order needs every pass', nums: [5, 4, 3, 2, 1], expected: [1, 2, 3, 4, 5], why: 'Each smaller value starts behind larger values and must move through adjacent exchanges.' },
      { title: 'Duplicates must not disappear', nums: [3, 1, 3, 1], expected: [1, 1, 3, 3], why: 'Sorting rearranges all four values; it does not deduplicate them.' },
      { title: 'Sort positive and negative balances', nums: [0, -3, 2, -1], expected: [-3, -1, 0, 2], why: 'Numeric comparisons place negative values before zero and positive values.' },
      { title: 'All equal: no swaps needed', nums: [2, 2, 2], expected: [2, 2, 2], why: 'Strict greater-than leaves equal neighbors unchanged and triggers early stop.' },
      { title: 'An empty queue is already sorted', nums: [], expected: [], why: 'No adjacent pair exists, so a copied empty array is returned.' },
      { title: 'One value is already sorted', nums: [11], expected: [11], why: 'The loop has no unsorted pair to compare.' },
      { title: 'One inversion near the end', nums: [1, 2, 4, 3], expected: [1, 2, 3, 4], why: 'One exchange repairs the final pair; the following pass confirms no inversions remain.' },
      { title: 'A small value starts at the far right', nums: [2, 3, 4, 1], expected: [1, 2, 3, 4], why: 'The 1 moves left one position per forward pass, illustrating why several passes can be necessary.' },
    ],
  },
  {
    id: 'fixed-window', topic: 'Sliding window · fixed-width sum', difficulty: 'Medium',
    prompt: 'Let k = input.window. Among all contiguous windows of exactly k elements, return the maximum-sum window as {"sum": number, "start": zero-based inclusive index, "end": zero-based inclusive index}. On a tie choose the earliest start. Return null if k is not an integer in [1, nums.length]. Negative sums are valid.',
    hints: ['Compute the first complete window once.', 'A slide removes one old value and adds one new value.', 'Initialize the best from a real window, not zero, to handle all-negative data.'],
    complexity: 'O(n) time; O(1) extra algorithm space.',
    code: `function solve(nums, k) {
  if (!Number.isInteger(k) || k < 1 || k > nums.length) return null;
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let best = { sum, start: 0, end: k - 1 };
  for (let right = k; right < nums.length; right++) {
    sum += nums[right] - nums[right - k];
    if (sum > best.sum) best = { sum, start: right - k + 1, end: right };
  }
  return best;
}`, trace: windowTrace,
    cases: [
      { title: 'Best three-day sales period', nums: [2, 1, 5, 1, 3, 2], window: 3, expected: { sum: 9, start: 2, end: 4 }, why: 'The sums are 8, 7, 9, and 6; indices 2–4 form the best three-day period.' },
      { title: 'A one-day window', nums: [4, 7, 2, 7], window: 1, expected: { sum: 7, start: 1, end: 1 }, why: 'With width one, each value is a window. The first 7 wins the tie.' },
      { title: 'The whole array is one window', nums: [3, -1, 4], window: 3, expected: { sum: 6, start: 0, end: 2 }, why: 'Only one complete window exists, so there are no slide operations.' },
      { title: 'Every possible window is negative', nums: [-4, -2, -7, -1], window: 2, expected: { sum: -6, start: 0, end: 1 }, why: 'The sums are -6, -9, and -8. A zero initialization would incorrectly beat every valid window.' },
      { title: 'Equal windows retain the earliest', nums: [2, 2, 2, 2], window: 2, expected: { sum: 4, start: 0, end: 1 }, why: 'All sums are four, so the first complete window remains the answer.' },
      { title: 'The last window wins', nums: [1, 1, 2, 8], window: 2, expected: { sum: 10, start: 2, end: 3 }, why: 'Sliding twice reaches the final pair, 2 + 8.' },
      { title: 'Width exceeds available data', nums: [1, 2], window: 3, expected: null, why: 'There is no complete window of length three in a two-element array.' },
      { title: 'Zero is not a valid window width', nums: [1, 2, 3], window: 0, expected: null, why: 'The contract requires a positive integer width; an empty segment is not a valid candidate.' },
      { title: 'No samples for a positive width', nums: [], window: 1, expected: null, why: 'A positive-length window cannot be formed from an empty input.' },
      { title: 'Gains and losses cancel in a window', nums: [5, -5, 4, 3, -2], window: 2, expected: { sum: 7, start: 2, end: 3 }, why: 'The consecutive pair 4 and 3 beats windows that include a negative value.' },
    ],
  },
];

export const visualScenarios: VisualScenario[] = families.flatMap(family => family.cases.map((item, index) => {
  const input: Input = { nums: [...item.nums], ...(item.target !== undefined ? { target: item.target } : {}), ...(item.window !== undefined ? { window: item.window } : {}) };
  const frames = family.trace(input);
  const id = `${family.id}-${String(index + 1).padStart(2, '0')}`;
  // Compare against the independently authored contract examples so a broken trace cannot silently teach a different answer.
  if (JSON.stringify(frames.at(-1)?.result) !== JSON.stringify(item.expected)) throw new Error(`Visual scenario answer mismatch: ${id}`);
  return { id, title: item.title, topic: family.topic, difficulty: family.difficulty, input, prompt: family.prompt, expected: item.expected, explanation: item.why, hints: [...family.hints], code: family.code, complexity: family.complexity, frames };
}));
