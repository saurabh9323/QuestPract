import type {LabModule} from '../playground/types';

export type RepairModule = LabModule & {
  day: number;
  scenario: string;
  tasks: string[];
  optimization: string;
};

// Intentionally incomplete or incorrect starters. Reference solutions are not shipped in the UI.
export const repairModules: RepairModule[] = [
  {
    id:'cart-total', title:'Repair a shopping cart', day:1, topic:'Loops & functions',
    scenario:'The checkout screen looks finished, but the total ignores quantities. You own the calculation module.',
    goal:'Each item is [unitPriceInCents, quantity]. Return the total in cents. Prices and quantities are nonnegative integers. An empty cart costs 0.',
    tasks:['Finish the line-total helper.', 'Handle zero quantity and an empty cart.', 'Explain why cents are preferable to floating-point currency calculations.'],
    optimization:'Visit each line once. Explain the time and extra space cost; there is no need to sort a cart.',
    starterCode:`function lineTotal(price, quantity) {
  // TODO: finish the calculation.
  return price;
}
function solve(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += lineTotal(items[i][0], items[i][1]);
  }
  return total;
}`,
    inputs:[[[125,2],[250,1]]], expectedPattern:'Linear accumulation', renderers:['array','variables'],
    hints:['Trace one item with quantity two.', 'An item contributes its unit price for every unit.', 'Keep the outer accumulator; repair the helper.', 'The line total uses multiplication.'],
    tests:[{name:'Several quantities',args:[[[125,2],[250,1]]],expected:500},{name:'Zero quantity',args:[[[999,0]]],expected:0},{name:'Empty cart',args:[[]],expected:0},{name:'Free item',args:[[[0,4],[5,3]]],expected:15}],
  },
  {
    id:'guest-list', title:'Repair a guest check-in list', day:2, topic:'Set & membership',
    scenario:'Repeated scans create duplicate guest badges. Keep the first occurrence of each numeric guest ID.',
    goal:'Return each ID once, in first-seen order. Do not sort the result.',
    tasks:['Finish the membership guard.', 'Keep the order of first arrival.', 'Compare nested searches with Set membership.'],
    optimization:'Replace repeated scans with membership tracking. Discuss the extra memory and average hash-table lookup assumptions.',
    starterCode:`function solve(ids) {
  const seen = new Set();
  const guests = [];
  for (let i = 0; i < ids.length; i++) {
    // TODO: only admit a guest who has not checked in.
    guests.push(ids[i]);
  }
  return guests;
}`,
    inputs:[[4,2,4,7,2]], expectedPattern:'Set membership', renderers:['array','variables'],
    hints:['Which earlier information tells you whether to add an ID?', 'A Set remembers presence, not frequency.', 'If unseen, append the ID and remember it.', 'Use has before add.'],
    tests:[{name:'Repeated arrivals',args:[[4,2,4,7,2]],expected:[4,2,7]},{name:'All equal',args:[[8,8,8]],expected:[8]},{name:'Empty list',args:[[]],expected:[]},{name:'Preserve order',args:[[9,0,9,-1,0]],expected:[9,0,-1]}],
  },
  {
    id:'first-unique', title:'Find the first unique signal', day:8, topic:'Map & counting',
    scenario:'A telemetry service needs the earliest character that was sent exactly once. The counting loop currently overwrites history.',
    goal:'For a lowercase ASCII string, return the first index whose character occurs exactly once, or -1.',
    tasks:['Repair the frequency update.', 'Finish the second pass without losing input order.', 'Handle no unique character and empty input.'],
    optimization:'Count once, then inspect in original order. Contrast this with counting each character using a full rescan.',
    starterCode:`function solve(text) {
  const counts = new Map();
  for (let i = 0; i < text.length; i++) {
    counts.set(text[i], 1); // BUG: earlier occurrences disappear.
  }
  for (let i = 0; i < text.length; i++) {
    // TODO: return the first index whose count is one.
  }
  return -1;
}`,
    inputs:['aabbcd'], expectedPattern:'Frequency Map', renderers:['variables'],
    hints:['Presence and frequency answer different questions.', 'The previous count must survive each visit.', 'Increase counts, then scan the original string for count one.', 'Use get with a default zero, then set the new count.'],
    tests:[{name:'Unique after repeats',args:['aabbcd'],expected:4},{name:'First is unique',args:['abac'],expected:1},{name:'No unique character',args:['aabb'],expected:-1},{name:'Empty text',args:[''],expected:-1},{name:'Single character',args:['z'],expected:0}],
  },
  {
    id:'sorted-pair', title:'Optimize a delivery pairing service', day:11, topic:'Two pointers',
    scenario:'Pair two packages to exactly fill a capacity. The old nested loops can select the same package twice.',
    goal:'Input weights are sorted ascending and have at most one valid pair of distinct positions. Return its indices or [].',
    tasks:['Fix the distinct-position bug.', 'Replace repeated pair comparisons using sorted order.', 'Explain why each pointer move safely eliminates candidates.'],
    optimization:'After repairing the O(n²) baseline, aim for a linear pointer walk with constant auxiliary space. Test passes alone do not certify this complexity.',
    starterCode:`function solve(weights, capacity) {
  for (let i = 0; i < weights.length; i++) {
    for (let j = i; j < weights.length; j++) {
      if (weights[i] + weights[j] === capacity) return [i, j];
    }
  }
  return [];
}`,
    inputs:[[2,3,7,9],10], expectedPattern:'Two pointers', renderers:['array','variables'],
    hints:['Can a package pair with itself?', 'Sorted order gives information beyond membership.', 'Compare the endpoints. Move the smaller end when the sum is too small.', 'Use left < right and move the right end when the sum is too large.'],
    tests:[{name:'Pair in middle',args:[[2,3,7,9],10],expected:[1,2]},{name:'No self-pair',args:[[4],8],expected:[]},{name:'Duplicate weights',args:[[4,4],8],expected:[0,1]},{name:'No match',args:[[1,3,7],6],expected:[]},{name:'Empty input',args:[[],8],expected:[]}],
  },
  {
    id:'sensor-window', title:'Repair a rolling sensor report', day:15, topic:'Sliding window',
    scenario:'The dashboard reports the busiest consecutive k-minute period. It keeps accumulating old readings, and negative readings break the initial best value.',
    goal:'Return the maximum sum of k adjacent numbers. Return null when k < 1 or k exceeds the input length. k is an integer.',
    tasks:['Remove readings that leave the window.', 'Support all-negative readings.', 'Reject invalid sizes before scanning.'],
    optimization:'Reuse the last sum instead of summing each window again. Write which value leaves and which enters.',
    starterCode:`function solve(readings, k) {
  if (k < 1 || k > readings.length) return null;
  let sum = 0;
  let best = 0;
  for (let right = 0; right < readings.length; right++) {
    sum += readings[right];
    // TODO: remove the value outside the window.
    if (right >= k - 1 && sum > best) best = sum;
  }
  return best;
}`,
    inputs:[[2,1,5,1,3,2],3], expectedPattern:'Fixed sliding window', renderers:['array','variables'],
    hints:['Name exactly which readings the sum should represent.', 'At index right, the departing index is right minus k.', 'Initialize best so negative windows can win.', 'Subtract the departing reading once right >= k.'],
    tests:[{name:'Rolling windows',args:[[2,1,5,1,3,2],3],expected:9},{name:'Negative readings',args:[[-5,-2,-8],2],expected:-7},{name:'Size one',args:[[3,1,2],1],expected:3},{name:'Empty data',args:[[],1],expected:null},{name:'Invalid size',args:[[1,2],0],expected:null}],
  },
  {
    id:'range-report', title:'Complete a range-report engine', day:19, topic:'Prefix sums',
    scenario:'An analyst keeps asking for totals between two days. Build the totals once and reuse them for every range.',
    goal:'Return one sum per inclusive [left,right] query. Queries are valid indices into nums. Empty nums has no queries.',
    tasks:['Complete the prefix array with a leading zero.', 'Answer every inclusive query.', 'Explain the preprocessing cost and each query cost.'],
    optimization:'Avoid rescanning each range: O(n) preprocessing, then O(1) work per query, using O(n) prefix storage plus output.',
    starterCode:`function solve(nums, queries) {
  const prefix = [0];
  for (let i = 0; i < nums.length; i++) {
    // TODO: append the total of the first i + 1 values.
  }
  const totals = [];
  for (let i = 0; i < queries.length; i++) {
    const left = queries[i][0];
    const right = queries[i][1];
    totals.push(0); // TODO: use the prefix totals.
  }
  return totals;
}`,
    inputs:[[2,4,-1,3],[[0,3],[1,2]]], expectedPattern:'Prefix sums', renderers:['array','variables'],
    hints:['What does prefix[0] mean?', 'prefix[i] stores the sum before index i.', 'An inclusive right endpoint needs the prefix at right + 1.', 'Subtract prefix[left] from prefix[right + 1].'],
    tests:[{name:'Several ranges',args:[[2,4,-1,3],[[0,3],[1,2]]],expected:[8,3]},{name:'Single value',args:[[5],[[0,0]]],expected:[5]},{name:'Negative range',args:[[-2,-3,1],[[0,1],[1,2]]],expected:[-5,-2]},{name:'No queries',args:[[],[]],expected:[]}],
  },
];
